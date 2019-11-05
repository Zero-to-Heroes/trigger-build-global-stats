/* eslint-disable @typescript-eslint/no-use-before-define */
import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import fetch, { RequestInfo } from 'node-fetch';
// import { fetch } from 'node-fetch';
import { Rds } from './db/rds';
import { GlobalStat } from './model/global-stat';
import { GlobalStats } from './model/global-stats';
import { ReviewMessage } from './review-message';
import { TotalDamageDealtToEnemyHeroBuilder } from './stat-builders/total-damage-dealt-to-enemy-hero-builder';
import { TotalEnemyMinionsDeathBuilder } from './stat-builders/total-enemy-minions-killed';
import { TotalManaSpentBuilder } from './stat-builders/total-mana-spent-builder';
import { StatBuilder } from './stat-builders/_stat-builder';

export class StatsBuilder {
	private static readonly statBuilders: readonly StatBuilder[] = StatsBuilder.initializeBuilders();

	public async buildStats(messages: readonly ReviewMessage[]): Promise<readonly GlobalStats[]> {
		return await Promise.all(messages.map(msg => this.buildStat(msg)));
	}

	private async buildStat(message: ReviewMessage): Promise<GlobalStats> {
		console.log('processing message', message);
		if (message.gameMode == 'arena-draft') {
			console.log('arena draft, not processing');
			return null;
		}
		const uploaderToken = message.uploaderToken;
		if (!uploaderToken) {
			console.log('empty uploaderToken, returning');
			return null;
		}
		console.log('building stat for', message.reviewId, message.replayKey);
		const replayString = await this.loadReplayString(message.replayKey);
		if (!replayString || replayString.length === 0) {
			console.log('empty replay, returning');
			return null;
		}
		console.log('loaded replay string', replayString.length);
		try {
			const replay: Replay = parseHsReplayString(replayString);
			const stats: readonly GlobalStat[] = (await Promise.all(
				StatsBuilder.statBuilders.map(builder => builder.extractStat(message, replay)),
			))
				.reduce((a, b) => a.concat(b), [])
				.filter(stat => stat.value > 0);
			const statsFromGame = Object.assign(new GlobalStats(), {
				stats: stats,
			} as GlobalStats);
			console.log('built stats', statsFromGame);
			const userId = uploaderToken.split('overwolf-')[1];
			const statsFromDb: GlobalStats = await this.loadExistingStats(userId);
			console.log('stats from db', statsFromDb);
			const mergedStats: GlobalStats = this.buildChangedStats(statsFromDb, statsFromGame);
			console.log('saving result', mergedStats);
			await this.saveStats(userId, mergedStats);
			return mergedStats;
		} catch (e) {
			console.warn('Could not build replay for', message.reviewId, e);
			return null;
		}
	}

	private async loadExistingStats(userId: string): Promise<GlobalStats> {
		const rds = await Rds.getInstance();
		const results = await rds.runQuery<any[]>(`
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

	private async saveStats(userId: string, stats: GlobalStats): Promise<void> {
		const rds = await Rds.getInstance();
		// Update existing stats
		const existingStats = stats.stats.filter(stat => stat.id);
		console.log('existing stats', existingStats);
		if (existingStats.length > 0) {
			await Promise.all(
				existingStats.map(stat =>
					rds.runQuery<void>(`
						UPDATE global_stats
						SET value = '${stat.value}'
						WHERE id = '${stat.id}'`),
				),
			);
		}
		// Create new stats
		const newStats = stats.stats.filter(stat => !stat.id);
		console.log('newStats stats', newStats);
		if (newStats.length > 0) {
			const values = newStats.map(
				stat => `('${userId}', '${stat.statKey}', '${stat.statContext}', '${stat.value}')`,
			);
			const valuesString = values.join(',');
			await rds.runQuery<void>(`
				INSERT INTO global_stats (
					userId, 
					statKey,
					statContext,
					value
				)
				VALUES ${valuesString}`);
		}
	}

	public buildChangedStats(statsFromDb: GlobalStats, statsFromGame: GlobalStats): GlobalStats {
		const uniqueKeys = [
			...new Set([
				...statsFromDb.stats.map(stat => stat.statKey + '|' + stat.statContext),
				...statsFromGame.stats.map(stat => stat.statKey + '|' + stat.statContext),
			]),
		];
		const newStats = uniqueKeys
			.map(key => {
				console.log('handling key', key);
				const statKey = key.split('|')[0];
				const context = key.split('|')[1];
				const statFromGame: GlobalStat = statsFromGame.stats.find(
					stat => stat.statKey === statKey && stat.statContext === context,
				);
				// Don't update unchanged stats
				if (!statFromGame) {
					return null;
				}

				const statFromDb: GlobalStat = statsFromDb.stats.find(
					stat => stat.statKey === statKey && stat.statContext === context,
				);
				const mergedValue = (statFromDb ? statFromDb.value : 0) + statFromGame.value;
				return Object.assign(new GlobalStat(), {
					id: (statFromDb || statFromGame).id,
					statKey: statKey,
					value: mergedValue,
					statContext: context,
				} as GlobalStat);
			})
			.filter(stat => stat);
		return Object.assign(new GlobalStats(), {
			stats: newStats,
		} as GlobalStats);
	}

	private async loadReplayString(replayKey: string): Promise<string> {
		const data = await http(`https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/${replayKey}`);
		return data;
	}

	private static initializeBuilders(): readonly StatBuilder[] {
		return [
			new TotalDamageDealtToEnemyHeroBuilder(),
			new TotalManaSpentBuilder(),
			new TotalEnemyMinionsDeathBuilder(),
		];
	}
}

const http = async (request: RequestInfo): Promise<any> => {
	return new Promise(resolve => {
		fetch(request)
			.then(response => {
				// console.log('received response', response);
				return response.text();
			})
			.then(body => {
				resolve(body);
			});
	});
};
