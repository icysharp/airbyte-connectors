import {
  AirbyteLogger,
  AirbyteStreamBase,
  StreamKey,
  SyncMode,
} from 'faros-airbyte-cdk';
import {Dictionary} from 'ts-essentials';

import {Shopify} from '../shopify/shopify';

export class AppSubscriptionSaleEvents extends AirbyteStreamBase {
  constructor(
    private readonly shopify: Shopify,
    protected readonly logger: AirbyteLogger
  ) {
    super(logger);
  }

  getJsonSchema(): Dictionary<any, string> {
    const jsonSchema = require('../../resources/schemas/appsubscriptions.json');
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

    yield* this.shopify.fetchAppSubscriptionSaleEvents();
  }

  getUpdatedState(
    currentStreamState: Dictionary<any>,
    latestRecord: Dictionary<any>
  ): Dictionary<any> {
    return {
      cutoff: Math.max(
        currentStreamState.cutoff ?? 0,
        latestRecord.createdAt ?? 0
      ),
    };
  }
}
