import { extractTotalDamageDealtToEnemyHero, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { buildContexts } from '../context-builder';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalDamageDealtToEnemyHeroBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const damageToOpponentHero: number = extractTotalDamageDealtToEnemyHero(replay);
		console.log('total damage to enemyu hero', damageToOpponentHero);
		const contexts = buildContexts(replay);
		console.log('contexts', contexts);
		return contexts.map(
			context =>
				({
					statKey: 'total-damage-to-enemy-hero',
					value: damageToOpponentHero,
					statContext: context,
				} as GlobalStat),
		);
	}
}
