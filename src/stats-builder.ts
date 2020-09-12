/* eslint-disable @typescript-eslint/no-use-before-define */
import { GlobalStat } from '@firestone-hs/build-global-stats/dist/model/global-stat';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { buildChangedStats, extractStatsForGame } from '@firestone-hs/build-global-stats/dist/stats-builder';
import db from './db/rds';
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
		// console.log('processing message', message);
		if (message.gameMode == 'arena-draft') {
			// console.log('arena draft, not processing');
			return null;
		}
		const uploaderToken = message.uploaderToken;
		if (!uploaderToken) {
			// console.log('empty uploaderToken, returning');
			return null;
		}
		// console.log('building stat for', message.reviewId, message.replayKey);
		const replayString = await this.loadReplayString(message.replayKey);
		if (!replayString || replayString.length === 0) {
			// console.log('empty replay, returning');
			return null;
		}
		// console.log('loaded replay string', replayString.length);
		try {
			const userId = uploaderToken.split('overwolf-')[1];
			const mysql = await db.getConnection();
			const statsFromDb: GlobalStats = await this.loadExistingStats(mysql, userId);
			const statsFromGame = await extractStatsForGame(message, replayString);
			const changedStats: GlobalStats = buildChangedStats(statsFromDb, statsFromGame);
			// console.log('saving result');
			await this.saveStats(mysql, userId, changedStats);
			// console.log('result saved');
			await mysql.end();
			return changedStats;
		} catch (e) {
			console.warn('Could not build replay for', message.reviewId, e);
			return null;
		}
	}

	private async loadExistingStats(mysql, userId: string): Promise<GlobalStats> {
		// const rds = await Rds.getInstance();
		const results = await mysql.query(`
			SELECT * FROM global_stats
			WHERE userId='${userId}'`);
		// console.log('results from db', results);
		const globalStats: readonly GlobalStat[] = results.map(result =>
			Object.assign(new GlobalStat(), { ...result } as GlobalStat),
		);
		return Object.assign(new GlobalStats(), {
			stats: globalStats,
		} as GlobalStats);
	}

	private async saveStats(mysql, userId: string, stats: GlobalStats): Promise<void> {
		// const rds = await getSqlConnection();
		// Update existing stats
		const existingStats = stats.stats.filter(stat => stat.id);
		// console.log('existing stats', existingStats);
		const queries =
			existingStats.length > 0
				? existingStats.map(
						stat => `
							UPDATE global_stats
							SET value = '${stat.value}'
							WHERE id = '${stat.id}'`,
				  )
				: [];
		// Create new stats
		const newStats = stats.stats.filter(stat => !stat.id);
		// console.log('newStats stats', newStats);
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

		await Promise.all(queries.map(query => mysql.query(query)));
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
