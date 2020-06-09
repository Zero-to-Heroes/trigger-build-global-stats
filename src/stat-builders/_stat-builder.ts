import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GlobalStat } from '../model/global-stat';
import { ReviewMessage } from '../review-message';

export interface StatBuilder {
	extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]>;
}
