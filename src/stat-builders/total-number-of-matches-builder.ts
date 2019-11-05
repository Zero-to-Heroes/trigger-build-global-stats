import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { buildContexts } from '../context-builder';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalNumberOfMatchesBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const contexts = buildContexts(replay);
		console.log('contexts', contexts);
		return contexts.map(
			context =>
				({
					statKey: 'total-number-of-matches',
					value: 1,
					statContext: context,
				} as GlobalStat),
		);
	}
}
