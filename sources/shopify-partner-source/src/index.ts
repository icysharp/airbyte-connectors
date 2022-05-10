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

import {Shopify, ShopifyConfig} from './shopify/shopify';
import {Builds, Transactions} from './streams';

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
    const organizationId = config['OrganizationID'];
    const accessToken = config['ShopifyAccessToken'];

    const shopifyConfig: ShopifyConfig = {
      organizationId,
      accessToken,
    };

    try {
      const shopify = Shopify.instance(shopifyConfig, this.logger);
      await shopify.checkConnection();
      return [true, undefined];
    } catch (e: any) {
      return [false, e];
    }
  }

  streams(config: AirbyteConfig): AirbyteStreamBase[] {
    return [new Builds(this.logger), new Transactions(this.logger)];
  }
}
