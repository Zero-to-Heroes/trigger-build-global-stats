/* eslint-disable @typescript-eslint/no-use-before-define */
import { extractAllMinionsPlayed, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardType, GameTag, Race } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { buildContexts } from '../utils/context-builder';
import { groupBy } from '../utils/util-functions';
import { StatBuilder } from './_stat-builder';

export class TotalMinionsPlayedByTribe implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const playerMinionEntities = extractAllMinionsPlayed(replay).player;
		const tribeExtractor = (minion: Element): Race =>
			parseInt(minion.find(`.Tag[@tag='${GameTag.CARDRACE}']`)?.get('value') ?? '0');
		const groupByTribe = groupBy(tribeExtractor);
		const playerMinionsGroupedByTribe = groupByTribe(playerMinionEntities);
		const numberOfPlayerMinionsByTribe = Object.keys(playerMinionsGroupedByTribe)
			.map(tribe => parseInt(tribe))
			.filter(tribe => tribe > 0)
			.map(tribe => ({
				tribe: Race[tribe].toLowerCase(),
				numberOfMinions: playerMinionsGroupedByTribe[tribe].length,
			}));
		// console.log('number of minions by tribe', numberOfPlayerMinionsByTribe);
		const contexts = buildContexts(replay);
		return numberOfPlayerMinionsByTribe
			.map(metric =>
				contexts.map(
					context =>
						({
							statKey: `total-minions-played-by-tribe-${metric.tribe}`,
							value: metric.numberOfMinions,
							statContext: context,
						} as GlobalStat),
				),
			)
			.reduce((a, b) => a.concat(b), []);
	}
}

export const extractAllMinions = (replay: Replay): readonly Element[] => {
	const allMinionShowEntities = replay.replay
		.findall('.//ShowEntity')
		// Get only the entities that are of MINION type
		.filter(show => show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`));
	const allMinionFullEntities = replay.replay
		// Only the ones that have been revealed
		.findall('.//FullEntity[@cardID]')
		// Get only the entities that are of MINION type
		.filter(show => show.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.MINION}']`));

	const allMinionEntities = [...allMinionShowEntities, ...allMinionFullEntities];
	return allMinionEntities;
};
