import { GameTag } from '@firestone-hs/reference-data';
import { GlobalStat } from '../model/global-stat';
import { Replay } from '../replay';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalDamageDealtToEnemyHeroBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		const opponentHeroEntityId: number = parseInt(
			replay.replay
				.find('.Game')
				.findall('.Player')
				.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
				.find(`.Tag[@tag='${GameTag.HERO_ENTITY}']`)
				.get('value'),
		);
		const damageTags = replay.replay.findall(`.//MetaData[@meta='1']`);
		const damageToOpponentHero: number = damageTags
			.map(tag => {
				const infos = tag.findall(`.Info[@entity='${opponentHeroEntityId}']`);
				if (!infos || infos.length === 0) {
					return 0;
				}
				return parseInt(tag.get('data'));
			})
			.reduce((a, b) => a + b, 0);
		console.log('total damage to enemyu hero', damageToOpponentHero);
		const contexts = Replay.buildContexts(replay);
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
