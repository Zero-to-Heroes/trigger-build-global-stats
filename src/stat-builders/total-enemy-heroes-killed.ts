import { extractNumberOfKilledEnemyHeroes, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { buildContexts } from '../context-builder';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalEnemyHeroesKilled implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const numberOfKilledEnemeyHeroes = extractNumberOfKilledEnemyHeroes(replay);
		console.log('numberOfKilledEnemeyHeroes', numberOfKilledEnemeyHeroes);

		const contexts = buildContexts(replay);
		return contexts.map(
			context =>
				({
					statKey: 'total-enemy-heroes-killed',
					value: numberOfKilledEnemeyHeroes,
					statContext: context,
				} as GlobalStat),
		);
	}
}
