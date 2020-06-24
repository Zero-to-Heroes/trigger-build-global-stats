/* eslint-disable @typescript-eslint/no-use-before-define */
import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import fetch, { RequestInfo } from 'node-fetch';
import db from './db/rds';
import { S3 } from './db/s3';
// import { fetch } from 'node-fetch';
// import { Rds } from './db/rds';
import { GlobalStat } from './model/global-stat';
import { GlobalStats } from './model/global-stats';
import { ReviewMessage } from './review-message';
import { TotalTavernLockAllBuilder } from './stat-builders/battlegrounds/total-tavern-lock-all-builder';
import { TotalTavernRerollBuilder } from './stat-builders/battlegrounds/total-tavern-reroll-builder';
import { TotalTavernUpgradeBuilder } from './stat-builders/battlegrounds/total-tavern-upgrade-builder';
import { BestBattlegroundsRankBuilder } from './stat-builders/best-rank-builder';
import { TotalDamageDealtToEnemyHeroBuilder } from './stat-builders/total-damage-dealt-to-enemy-hero-builder';
import { TotalDurationBuilder } from './stat-builders/total-duration-builder';
import { TotalEnemyHeroesKilled } from './stat-builders/total-enemy-heroes-killed';
import { TotalEnemyMinionsDeathBuilder } from './stat-builders/total-enemy-minions-death';
import { TotalManaSpentBuilder } from './stat-builders/total-mana-spent-builder';
import { TotalMinionsPlayedByTribe } from './stat-builders/total-minions-played-by-tribe-builder';
import { TotalNumberOfMatchesBuilder } from './stat-builders/total-number-of-matches-builder';
import { StatBuilder } from './stat-builders/_stat-builder';

const s3 = new S3();

export class StatsBuilder {
	private static readonly statBuilders: readonly StatBuilder[] = StatsBuilder.initializeBuilders();

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
			// console.log('parsing replay');
			const replay: Replay = parseHsReplayString(replayString);
			// console.log('parsed replay');
			const stats: readonly GlobalStat[] = (
				await Promise.all(StatsBuilder.statBuilders.map(builder => builder.extractStat(message, replay)))
			)
				.reduce((a, b) => a.concat(b), [])
				.filter(stat => stat.value > 0);
			// console.log('build stats from game');
			const statsFromGame = Object.assign(new GlobalStats(), {
				stats: stats,
			} as GlobalStats);
			// console.log('built stats from game');
			const userId = uploaderToken.split('overwolf-')[1];
			const mysql = await db.getConnection();
			// console.log('acquired mysql connection');
			const statsFromDb: GlobalStats = await this.loadExistingStats(mysql, userId);
			// console.log('loaded stats from db');
			const mergedStats: GlobalStats = this.buildChangedStats(statsFromDb, statsFromGame);
			// console.log('saving result');
			await this.saveStats(mysql, userId, mergedStats);
			// console.log('result saved');
			await mysql.end();
			return mergedStats;
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

	public buildChangedStats(statsFromDb: GlobalStats, statsFromGame: GlobalStats): GlobalStats {
		const uniqueKeys = [
			...new Set([
				...statsFromDb.stats.map(stat => stat.statKey + '|' + stat.statContext),
				...statsFromGame.stats.map(stat => stat.statKey + '|' + stat.statContext),
			]),
		];
		const newStats = uniqueKeys
			.map(key => {
				// console.log('handling key', key);
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
				const valueFromDb = statFromDb ? statFromDb.value : 0;
				const mergedValue = statKey.startsWith('best')
					? Math.max(valueFromDb, statFromGame.value)
					: valueFromDb + statFromGame.value;
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
		const data = replayKey.endsWith('.zip')
			? await s3.readZippedContent('xml.firestoneapp.com', replayKey)
			: await s3.readContentAsString('xml.firestoneapp.com', replayKey);
		// const data = await http(`http://xml.firestoneapp.com/${replayKey}`);
		return data;
	}

	private static initializeBuilders(): readonly StatBuilder[] {
		return [
			new TotalDamageDealtToEnemyHeroBuilder(),
			new TotalManaSpentBuilder(),
			new TotalEnemyMinionsDeathBuilder(),
			new TotalNumberOfMatchesBuilder(),
			new TotalDurationBuilder(),
			new BestBattlegroundsRankBuilder(),
			new TotalTavernUpgradeBuilder(),
			new TotalTavernLockAllBuilder(),
			new TotalTavernRerollBuilder(),
			new TotalEnemyHeroesKilled(),
			new TotalMinionsPlayedByTribe(),
		];
	}
}

const http = async (request: RequestInfo): Promise<any> => {
	return new Promise(resolve => {
		fetch(request)
			.then(response => {
				// console.log('received response, reading text body');
				return response.text();
			})
			.then(body => {
				// console.log('sending back body', body && body.length);
				resolve(body);
			});
	});
};
