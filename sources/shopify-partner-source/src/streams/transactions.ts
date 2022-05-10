import {AirbyteStreamBase, StreamKey, SyncMode} from 'faros-airbyte-cdk';
import {Dictionary} from 'ts-essentials';

export class Transactions extends AirbyteStreamBase {
  getJsonSchema(): Dictionary<any, string> {
    const jsonSchema = require('../../resources/schemas/transactions.json');
    this.logger.debug(
      `getJsonSchema ->  ${JSON.stringify(jsonSchema, null, 2)}`
    );
    return jsonSchema;
  }
  get primaryKey(): StreamKey {
    return ['id'];
  }
  get cursorField(): string | string[] {
    return 'createdAt';
  }

  async *readRecords(
    syncMode: SyncMode,
    cursorField?: string[],
    streamSlice?: Dictionary<any, string>,
    streamState?: Dictionary<any, string>
  ): AsyncGenerator<Dictionary<any, string>, any, unknown> {
    const lastCutoff: number = streamState?.cutoff ?? 0;
    if (lastCutoff > Date.now()) {
      this.logger.info(
        `Last cutoff ${lastCutoff} is greater than current time`
      );
      return;
    }
    const numTxns = 5;
    for (let i = 1; i <= numTxns; i++) {
      yield this.newTransaction(i, lastCutoff);
    }
  }

  getUpdatedState(
    currentStreamState: Dictionary<any>,
    latestRecord: Dictionary<any>
  ): Dictionary<any> {
    return {
      cutoff: Math.max(
        currentStreamState.cutoff ?? 0,
        latestRecord.updated_at ?? 0
      ),
    };
  }

  private newTransaction(uid: number, cutoff: number): Dictionary<any> {
    return {
      id: `gid://partners${uid.toString()}`,
      createdAt: `2022-01-${uid}`,
      __typename: 'Txn',
    };
  }
}
