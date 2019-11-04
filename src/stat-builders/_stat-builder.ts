import { GlobalStat } from '../model/global-stat';
import { Replay } from '../replay';
import { ReviewMessage } from '../review-message';

export interface StatBuilder {
	extractStat(message: ReviewMessage, replay: Replay): Promise<readonly GlobalStat[]>;
}
