import {
  AirbyteLogger,
  AirbyteLogLevel,
  AirbyteSpec,
  SyncMode,
} from 'faros-airbyte-cdk';
import fs from 'fs';
import {VError} from 'verror';

import * as sut from '../src/index';
import {Shopify} from '../src/shopify/shopify';

const config = {
  'X-Shopify-Access-Token': 'prtapi_e21c28b1c9d2249775948efa6e4e3ee7',
  OrganizationID: '2437681',
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
  //   Shopify.instance(config);
  // });

  test('spec', async () => {
    const source = new sut.ShopifyPartnerAPISource(logger);
    await expect(source.spec()).resolves.toStrictEqual(
      new AirbyteSpec(readResourceFile('spec.json'))
    );
  });

  test('check connection', async () => {
    // Buildkite.instance = jest.fn().mockImplementation(() => {
    //   return new Buildkite(
    //     null,
    //     {
    //       get: jest.fn().mockResolvedValue({}),
    //     } as unknown as AxiosInstance,
    //     new Date('2010-03-27T14:03:51-0800')
    //   );
    // });

    const source = new sut.ShopifyPartnerAPISource(logger);
    console.log('test ->  source', source);

    await expect(source.checkConnection(config)).resolves.toStrictEqual([
      true,
      undefined,
    ]);
  });
});
