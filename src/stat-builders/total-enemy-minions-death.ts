import { extractTotalMinionDeaths, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { buildContexts } from '../context-builder';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalEnemyMinionsDeathBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const minionDeath = extractTotalMinionDeaths(replay);
		console.log('minion deaths', minionDeath);
		const contexts = buildContexts(replay);
		console.log('contexts', contexts);
		return contexts.map(
			context =>
				({
					statKey: 'total-enemy-minions-death',
					value: minionDeath.opponent,
					statContext: context,
				} as GlobalStat),
		);
	}
}
