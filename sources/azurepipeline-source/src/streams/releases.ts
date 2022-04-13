import {
  AirbyteLogger,
  AirbyteStreamBase,
  StreamKey,
  SyncMode,
} from 'faros-airbyte-cdk';
import {Dictionary} from 'ts-essentials';

import {AzurePipeline, AzurePipelineConfig} from '../azurepipeline';
import {Release} from '../models';

interface ReleaseState {
  lastCreatedOn: string;
}

export class Releases extends AirbyteStreamBase {
  constructor(
    private readonly config: AzurePipelineConfig,
    protected readonly logger: AirbyteLogger
  ) {
    super(logger);
  }

  getJsonSchema(): Dictionary<any, string> {
    return require('../../resources/schemas/releases.json');
  }
  get primaryKey(): StreamKey {
    return 'id';
  }
  get cursorField(): string | string[] {
    return 'createdOn';
  }
  async *readRecords(
    syncMode: SyncMode,
    cursorField?: string[],
    streamSlice?: Dictionary<any>,
    streamState?: ReleaseState
  ): AsyncGenerator<Release> {
    const lastCreatedOn =
      syncMode === SyncMode.INCREMENTAL
        ? streamState?.lastCreatedOn
        : undefined;
    const azurePipeline = AzurePipeline.instance(this.config);
    yield* azurePipeline.getReleases(lastCreatedOn);
  }
  getUpdatedState(
    currentStreamState: ReleaseState,
    latestRecord: Release
  ): ReleaseState {
    const lastCreatedOn: Date = new Date(latestRecord.createdOn);
    return {
      lastCreatedOn:
        lastCreatedOn >= new Date(currentStreamState?.lastCreatedOn || 0)
          ? latestRecord.createdOn
          : currentStreamState.lastCreatedOn,
    };
  }
}
