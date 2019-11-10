import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { buildContext } from '../context-builder';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class BestBattlegroundsRankBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const context = buildContext(replay);
		if (context !== 'battlegrounds') {
			return [];
		}
		const rankStr = message.playerRank;
		if (!rankStr || rankStr.length === 0 || rankStr === 'undefined') {
			return [];
		}
		return [
			{
				statKey: 'best-rank',
				value: parseInt(rankStr),
				statContext: context,
			} as GlobalStat,
		];
	}
}
