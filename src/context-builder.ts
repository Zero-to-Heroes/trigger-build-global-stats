import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { GameFormat, GameType, ScenarioId } from '@firestone-hs/reference-data';
import { StatContext } from './model/context.type';

export const buildContext = (replay: Replay): StatContext => {
	switch (replay.gameType) {
		case GameType.GT_ARENA:
			return 'arena';
		case GameType.GT_FSG_BRAWL:
		case GameType.GT_FSG_BRAWL_1P_VS_AI:
		case GameType.GT_FSG_BRAWL_2P_COOP:
		case GameType.GT_FSG_BRAWL_VS_FRIEND:
		case GameType.GT_TAVERNBRAWL:
		case GameType.GT_TB_1P_VS_AI:
		case GameType.GT_TB_2P_COOP:
			return 'tavern-brawl';
		case GameType.GT_BATTLEGROUNDS:
			return 'battlegrounds';
		case GameType.GT_VS_AI:
			switch (replay.scenarioId) {
				case ScenarioId.PRACTICE:
				case ScenarioId.PRACTICE_2:
					return 'practice';
				case ScenarioId.DALARAN_HEIST_CHAPTER_1:
				case ScenarioId.DALARAN_HEIST_CHAPTER_2:
				case ScenarioId.DALARAN_HEIST_CHAPTER_3:
				case ScenarioId.DALARAN_HEIST_CHAPTER_4:
				case ScenarioId.DALARAN_HEIST_CHAPTER_5:
					return 'dalaran-heist';
				case ScenarioId.DALARAN_HEIST_CHAPTER_1_HEROIC:
				case ScenarioId.DALARAN_HEIST_CHAPTER_2_HEROIC:
				case ScenarioId.DALARAN_HEIST_CHAPTER_3_HEROIC:
				case ScenarioId.DALARAN_HEIST_CHAPTER_4_HEROIC:
				case ScenarioId.DALARAN_HEIST_CHAPTER_5_HEROIC:
					return 'dalaran-heist-heroic';
				case ScenarioId.DUNGEON_RUN:
					return 'dungeon-run';
				case ScenarioId.MONSTER_HUNT:
				case ScenarioId.MONSTER_HUNT_FINAL:
					return 'monster-hunt';
				case ScenarioId.RUMBLE_RUN:
					return 'rumble-run';
				case ScenarioId.TOMBS_OF_TERROR_BOB:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_1:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_2:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_3:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_4:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_5:
					return 'tombs-of-terror';
				case ScenarioId.TOMBS_OF_TERROR_BOB_HEROIC:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_1_HEROIC:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_2_HEROIC:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_3_HEROIC:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_4_HEROIC:
				case ScenarioId.TOMBS_OF_TERROR_CHAPTER_5_HEROIC:
					return 'tombs-of-terror-heroic';
				default:
					console.log('returning default AI mode', replay.scenarioId);
					return 'adventure';
			}
		case GameType.GT_RANKED:
			switch (replay.gameFormat) {
				case GameFormat.FT_STANDARD:
					return 'standard-ranked';
				case GameFormat.FT_WILD:
				default:
					return 'wild-ranked';
			}
		case GameType.GT_CASUAL:
			switch (replay.gameFormat) {
				case GameFormat.FT_STANDARD:
					return 'standard-casual';
				case GameFormat.FT_WILD:
				default:
					return 'wild-casual';
			}
		case GameType.GT_VS_FRIEND:
			switch (replay.gameFormat) {
				case GameFormat.FT_STANDARD:
					return 'standard-friendly';
				case GameFormat.FT_WILD:
				default:
					return 'wild-friendly';
			}
	}
	return 'unknown';
};

export const buildContexts = (replay: Replay): readonly StatContext[] => {
	return ['global', buildContext(replay)];
};
