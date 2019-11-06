import { extractTotalDamageDealtToEnemyHero, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { buildContexts } from '../context-builder';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalDamageDealtToEnemyHeroBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]> {
		// const opponentEntityId: number = parseInt(
		// 	replay.replay
		// 		.find('.Game')
		// 		.findall('.Player')
		// 		.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
		// 		.get('id'),
		// );
		// const startingOpponentHeroEntityId: number = parseInt(
		// 	replay.replay
		// 		.find('.Game')
		// 		.findall('.Player')
		// 		.find(player => parseInt(player.get('playerID')) !== replay.mainPlayerId)
		// 		.find(`.Tag[@tag='${GameTag.HERO_ENTITY}']`)
		// 		.get('value'),
		// );
		// const otherOpponentHeroEntityIds: number[] = replay.replay
		// 	.findall(`.//TagChange[@tag='${GameTag.HERO_ENTITY}'][@entity='${opponentEntityId}']`)
		// 	.map(tag => parseInt(tag.get('value')));
		// const opponentHeroEntityIds = [startingOpponentHeroEntityId, ...otherOpponentHeroEntityIds];
		// console.log('opp hero entity ids', opponentHeroEntityIds, replay.mainPlayerId);
		// const damageTags = replay.replay.findall(`.//MetaData[@meta='1']`);
		// const damageToOpponentHero: number = damageTags
		// 	.map(tag => {
		// 		const infos = tag
		// 			.findall(`.Info`)
		// 			.filter(info => otherOpponentHeroEntityIds.indexOf(parseInt(info.get('entity'))) !== -1);

		// 		if (!infos || infos.length === 0) {
		// 			return 0;
		// 		}
		// 		return parseInt(tag.get('data'));
		// 	})
		// 	.reduce((a, b) => a + b, 0);
		// return damageToOpponentHero;
		const heroDamage = extractTotalDamageDealtToEnemyHero(replay);
		console.log('heroDamage', heroDamage);
		const damageToOpponentHero: number = heroDamage.opponent;
		console.log('total damage to enemy hero', damageToOpponentHero);
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
