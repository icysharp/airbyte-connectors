import {
  AirbyteLogger,
  AirbyteStreamBase,
  StreamKey,
  SyncMode,
} from 'faros-airbyte-cdk';
import {Dictionary} from 'ts-essentials';

import {AzureGit, AzureGitConfig} from '../azuregit';

export class PullRequests extends AirbyteStreamBase {
  constructor(
    private readonly config: AzureGitConfig,
    protected readonly logger: AirbyteLogger
  ) {
    super(logger);
  }

  getJsonSchema(): Dictionary<any, string> {
    return require('../../resources/schemas/pullrequests.json');
  }
  get primaryKey(): StreamKey {
    return 'pullRequestId';
  }
  get cursorField(): string | string[] {
    return 'creationDate';
  }

  async *readRecords(
    syncMode: SyncMode,
    cursorField?: string[],
    streamSlice?: Dictionary<any>
  ): AsyncGenerator<Dictionary<any, string>, any, unknown> {
    const azureGit = await AzureGit.instance(this.config, this.logger);
    yield* azureGit.getPullRequests();
  }
}
