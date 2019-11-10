import { SecretsManager } from 'aws-sdk';
import { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import { createPool, Pool, PoolConnection } from 'mysql';

const secretsManager = new SecretsManager({ region: 'us-west-2' });

export class Rds {
	private static instance: Rds;

	private pool: Pool;

	public static async getInstance(): Promise<Rds> {
		if (!Rds.instance) {
			Rds.instance = new Rds();
			await Rds.instance.init();
		}
		return Rds.instance;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	private async init() {
		this.pool = await this.buildPool();
	}

	private async getSecret(secretRequest: GetSecretValueRequest) {
		return new Promise<SecretInfo>(resolve => {
			secretsManager.getSecretValue(secretRequest, (err, data: GetSecretValueResponse) => {
				const secretInfo: SecretInfo = JSON.parse(data.SecretString);
				resolve(secretInfo);
			});
		});
	}

	private async buildPool(): Promise<Pool> {
		const secretRequest: GetSecretValueRequest = {
			SecretId: 'rds-connection',
		};
		const secretResponse: SecretInfo = await this.getSecret(secretRequest);
		return createPool({
			connectionLimit: 20,
			host: secretResponse.host,
			user: secretResponse.username,
			password: secretResponse.password,
			port: secretResponse.port,
			charset: 'utf8',
			database: 'replay_summary',
			timeout: 20000,
			acquireTimeout: 20000,
		});
	}

	public async runQuery<T>(query: string): Promise<T> {
		console.log('running query', query);
		return new Promise<T>(async (resolve, reject) => {
			try {
				// console.log('getting connection', query);
				this.pool.getConnection((err, connection) => {
					// console.log('got connection', err, connection);
					if (err) {
						console.log('issue getting connection', err);
						connection.release();
						reject();
						return;
					}
					// console.log('connection created');
					connection.query(query, (error, results, fields) => {
						connection.release();
						if (error) {
							console.log('issue running query', error, query);
							reject();
						} else {
							// console.log('qiery resiu', results);
							resolve(results as T);
						}
					});
				});
			} catch (e) {
				console.error('Could not connect to DB', e);
				reject();
			}
		});
	}

	public async runQueries(queries: string[]): Promise<void> {
		console.log('running queries', queries);
		return new Promise<void>(async (resolve, reject) => {
			try {
				// console.log('getting connection', query);
				this.pool.getConnection(async (err, connection) => {
					// console.log('got connection', err, connection);
					if (err) {
						console.log('issue getting connection', err);
						connection.release();
						reject();
						return;
					}
					for (const query of queries) {
						await this.runQueryAsync(connection, query);
					}
					connection.release();
					resolve();
				});
			} catch (e) {
				console.error('Could not connect to DB', e);
				reject();
			}
		});
	}

	private async runQueryAsync(connection: PoolConnection, query: string) {
		return new Promise<void>((resolve, reject) => {
			connection.query(query, (error, results, fields) => {
				if (error) {
					console.log('issue running query', error, query);
					connection.release();
					reject();
				} else {
					// console.log('qiery resiu', results);
					resolve();
				}
			});
		});
	}
}

interface SecretInfo {
	readonly username: string;
	readonly password: string;
	readonly host: string;
	readonly port: number;
	readonly dbClusterIdentifier: string;
}
