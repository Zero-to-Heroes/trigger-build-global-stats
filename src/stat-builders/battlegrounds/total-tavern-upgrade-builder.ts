import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag } from '@firestone-hs/reference-data';
import { GlobalStat } from '../../model/global-stat';
import { ReviewMessage } from '../../review-message';
import { buildContext } from '../../utils/context-builder';
import { StatBuilder } from '../_stat-builder';

export class TotalTavernUpgradeBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const context = buildContext(replay);
		if (context !== 'battlegrounds') {
			return [];
		}
		const tavernUpgradeChanges = replay.replay
			.findall(`.//TagChange[@tag='${GameTag.PLAYER_TECH_LEVEL}']`)
			.filter(tag => parseInt(tag.get('value')) !== 0);
		const mainPlayerEntityId = parseInt(
			replay.replay.find(`.//Player[@playerID='${replay.mainPlayerId}']`).get('id'),
		);
		const playerUpgradeChanges = [...tavernUpgradeChanges].filter(
			tagChange => parseInt(tagChange.get('entity')) === mainPlayerEntityId,
		).length;
		return [
			{
				statKey: 'total-tavern-upgrades',
				value: playerUpgradeChanges,
				statContext: context,
			} as GlobalStat,
		];
	}
}
