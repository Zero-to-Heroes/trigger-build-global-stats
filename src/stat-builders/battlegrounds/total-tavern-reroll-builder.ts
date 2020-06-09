import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BlockType } from '@firestone-hs/reference-data';
import { GlobalStat } from '../../model/global-stat';
import { ReviewMessage } from '../../review-message';
import { buildContext } from '../../utils/context-builder';
import { StatBuilder } from '../_stat-builder';

export class TotalTavernRerollBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const context = buildContext(replay);
		if (context !== 'battlegrounds') {
			return [];
		}
		const rerollButtonCardIds = ['TB_BaconShop_1p_Reroll_Button', 'TB_BaconShop_8p_Reroll_Button'];
		// console.log('rerollButtonCardIds', rerollButtonCardIds);
		const rerollButtonEntityIds = rerollButtonCardIds
			.map(cardId =>
				replay.replay.findall(`.//FullEntity[@cardID='${cardId}']`).map(entity => parseInt(entity.get('id'))),
			)
			.reduce((a, b) => a.concat(b), []);
		// console.log('rerollButtonEntityIds', rerollButtonEntityIds);
		const rerollBlocks = rerollButtonEntityIds
			.map(rerollButtonEntityId =>
				replay.replay
					.findall(`.//Block[@entity='${rerollButtonEntityId}'][@type='${BlockType.POWER}']`)
					.filter(block => block.findall('.FullEntity').length > 0),
			)
			.reduce((a, b) => a.concat(b), []).length;
		console.log('rerollBlocks', rerollBlocks);
		return [
			{
				statKey: 'total-tavern-reroll',
				value: rerollBlocks,
				statContext: context,
			} as GlobalStat,
		];
	}
}
