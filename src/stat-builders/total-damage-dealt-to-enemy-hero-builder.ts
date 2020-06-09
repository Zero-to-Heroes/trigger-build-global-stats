import { extractTotalDamageDealtToEnemyHero, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { buildContexts } from '../utils/context-builder';
import { StatBuilder } from './_stat-builder';

export class TotalDamageDealtToEnemyHeroBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const heroDamage = extractTotalDamageDealtToEnemyHero(replay);
		// console.log('heroDamage', heroDamage);
		const damageToOpponentHero: number = heroDamage.opponent;
		// console.log('total damage to enemy hero', damageToOpponentHero);
		const contexts = buildContexts(replay);
		// console.log('contexts', contexts);
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
