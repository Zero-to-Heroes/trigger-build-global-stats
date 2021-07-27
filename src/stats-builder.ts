/* eslint-disable @typescript-eslint/no-use-before-define */
import { GlobalStat } from '@firestone-hs/build-global-stats/dist/model/global-stat';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { buildChangedStats, extractStatsForGame } from '@firestone-hs/build-global-stats/dist/stats-builder';
import { getConnection } from './db/rds';
import { S3 } from './db/s3';
// import { fetch } from 'node-fetch';
// import { Rds } from './db/rds';
import { ReviewMessage } from './review-message';

const s3 = new S3();

export class StatsBuilder {
	public async buildStats(messages: readonly ReviewMessage[]): Promise<readonly GlobalStats[]> {
		return await Promise.all(messages.map(msg => this.buildStat(msg)));
	}

	private async buildStat(message: ReviewMessage): Promise<GlobalStats> {
		if (message.gameMode == 'arena-draft') {
			return null;
		}
		const uploaderToken = message.uploaderToken;
		if (!uploaderToken) {
			console.debug('no uploader token');
			return null;
		}
		const replayString = await this.loadReplayString(message.replayKey);
		if (!replayString || replayString.length === 0) {
			return null;
		}
		const userId = uploaderToken.split('overwolf-')[1];
		const mysql = await getConnection();
		const statsFromDb: GlobalStats = await this.loadExistingStats(mysql, userId);
		const statsFromGame = await extractStatsForGame(message, replayString);
		const changedStats: GlobalStats = buildChangedStats(statsFromDb, statsFromGame);
		await this.saveStats(mysql, userId, changedStats);
		await mysql.end();
		return changedStats;
	}

	private async loadExistingStats(mysql, userId: string): Promise<GlobalStats> {
		const results = await mysql.query(`
			SELECT * FROM global_stats
			WHERE userId = '${userId}'`);
		const globalStats: readonly GlobalStat[] = results.map(result =>
			Object.assign(new GlobalStat(), { ...result } as GlobalStat),
		);
		return Object.assign(new GlobalStats(), {
			stats: globalStats,
		} as GlobalStats);
	}

	private async saveStats(mysql, userId: string, stats: GlobalStats): Promise<void> {
		// Update existing stats
		const existingStats = stats.stats.filter(stat => stat.id);
		const queries = [];
		if (existingStats.length > 0) {
			const values = existingStats.map(stat => `(${stat.id}, ${stat.value})`).join(',\n');
			queries.push(`
			  	INSERT INTO global_stats (id, value)
			  	VALUES ${values}
			  	ON DUPLICATE KEY UPDATE value = VALUES(value)
		  	`);
		}
		// Create new stats
		const newStats = stats.stats.filter(stat => !stat.id);
		if (newStats.length > 0) {
			const values = newStats.map(
				stat => `('${userId}', '${stat.statKey}', '${stat.statContext}', '${stat.value}')`,
			);
			const valuesString = values.join(',');
			queries.push(`
				INSERT INTO global_stats (
					userId, 
					statKey,
					statContext,
					value
				)
				VALUES ${valuesString}`);
		}

		await Promise.all(
			queries
				.filter(query => query)
				.map(query => {
					return mysql.query(query);
				}),
		);
	}

	private async loadReplayString(replayKey: string): Promise<string> {
		if (!replayKey) {
			return null;
		}
		const data = replayKey.endsWith('.zip')
			? await s3.readZippedContent('xml.firestoneapp.com', replayKey)
			: await s3.readContentAsString('xml.firestoneapp.com', replayKey);
		// const data = await http(`http://xml.firestoneapp.com/${replayKey}`);
		return data;
	}
}
