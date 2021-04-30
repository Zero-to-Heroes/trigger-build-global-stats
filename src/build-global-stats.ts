import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from './review-message';
import { StatsBuilder } from './stats-builder';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event): Promise<any> => {
	const messages: readonly ReviewMessage[] = event.Records.map(record => record.Sns.Message).map(msg =>
		JSON.parse(msg),
	);
	const stats: readonly GlobalStats[] = await new StatsBuilder().buildStats(messages);
	return { statusCode: 200, body: JSON.stringify(stats) };
};
