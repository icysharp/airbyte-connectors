import {Command} from 'commander';
import {
  AirbyteConfig,
  AirbyteLogger,
  AirbyteSourceBase,
  AirbyteSourceRunner,
  AirbyteSpec,
  AirbyteStreamBase,
} from 'faros-airbyte-cdk';
import VError from 'verror';

/** The main entry point. */
export function mainCommand(): Command {
  const logger = new AirbyteLogger();
  const source = new ShopifyPartnerAPISource(logger);
  return new AirbyteSourceRunner(logger, source).mainCommand();
}

/** Shopify Partner API source implementation. */
export class ShopifyPartnerAPISource extends AirbyteSourceBase {
  async spec(): Promise<AirbyteSpec> {
    return new AirbyteSpec(require('../resources/spec.json'));
  }

  async checkConnection(config: AirbyteConfig): Promise<[boolean, VError]> {
    if (config.XShopifyAccessToken) {
      return [true, undefined];
    }
    return [
      false,
      new VError(
        'Please provide a valid API Token for the Shopify Partner API (X-Shopify-Access-Token)'
      ),
    ];
  }

  streams(config: AirbyteConfig): AirbyteStreamBase[] {
    // return [new Builds(this.logger)];
    return;
  }
}
