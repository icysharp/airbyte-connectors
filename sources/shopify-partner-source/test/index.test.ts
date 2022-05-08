import {
  AirbyteLogger,
  AirbyteLogLevel,
  AirbyteSpec,
  SyncMode,
} from 'faros-airbyte-cdk';
import fs from 'fs-extra';
import {VError} from 'verror';

import * as sut from '../src/index';

const config = {
  'X-Shopify-Access-Token': '',
};

function readResourceFile(fileName: string): any {
  return JSON.parse(fs.readFileSync(`resources/${fileName}`, 'utf8'));
}

// function readTestResourceFile(fileName: string): any {
//   return JSON.parse(fs.readFileSync(`test_files/${fileName}`, 'utf8'));
// }

describe('index', () => {
  const logger = new AirbyteLogger(
    // Shush messages in tests, unless in debug
    process.env.LOG_LEVEL === 'debug'
      ? AirbyteLogLevel.DEBUG
      : AirbyteLogLevel.FATAL
  );

  // beforeEach(() => {
  //   Gitlab.instance = gitlabInstance;
  // });

  test('spec', async () => {
    const source = new sut.ShopifyPartnerAPISource(logger);
    await expect(source.spec()).resolves.toStrictEqual(
      new AirbyteSpec(readResourceFile('spec.json'))
    );
  });
});
