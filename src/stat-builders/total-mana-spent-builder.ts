import { extractTotalManaSpent, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { buildContexts } from '../utils/context-builder';
import { StatBuilder } from './_stat-builder';

export class TotalManaSpentBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const totalManaSpent = extractTotalManaSpent(replay);
		// console.log('total mana spent', totalManaSpent);
		const contexts = buildContexts(replay);
		// console.log('contexts', contexts);
		return contexts.map(
			context =>
				({
					statKey: 'total-mana-spent',
					value: totalManaSpent.player,
					statContext: context,
				} as GlobalStat),
		);
	}
}
