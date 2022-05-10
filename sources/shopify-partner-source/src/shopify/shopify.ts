// import axios from 'axios';
import {AirbyteLogger, wrapApiError} from 'faros-airbyte-cdk';
import {GraphQLClient} from 'graphql-request';
import {VError} from 'verror';

const GRAPHQL_API_URL = (orgId: string): string =>
  `https://partners.shopify.com/${orgId}/api/2022-01/graphql.json`;

export interface ShopifyConfig {
  readonly accessToken: string;
  readonly organizationId: string;
}

export class Shopify {
  private static shopify: Shopify = null;

  constructor(
    private readonly graphClient: GraphQLClient,
    private organizationId: string,
    private accessToken: string
  ) {}

  static instance(config: ShopifyConfig, logger: AirbyteLogger): Shopify {
    if (Shopify.shopify) return Shopify.shopify;

    let message: string = null;
    if (!config.organizationId) {
      message =
        'Please provide a valid Organization ID for the Shopify Partner API';
      logger.warn(`${message} | ${config.organizationId}`);
      throw new VError(message);
    }
    if (!config.accessToken) {
      message =
        'Please provide a valid API Token for the Shopify Partner API (X-Shopify-Access-Token)';
      logger.warn(`${message} | ${config.accessToken}`);
      throw new VError(message);
    }

    const graphClient = new GraphQLClient(
      `${GRAPHQL_API_URL(config.organizationId)}`,
      {
        headers: {'X-Shopify-Access-Token': config.accessToken},
      }
    );
    Shopify.shopify = new Shopify(
      graphClient,
      config.organizationId,
      config.organizationId
    );
    return Shopify.shopify;
  }

  async checkConnection(): Promise<void> {
    try {
      await this.graphClient.request(`{
        transactions(first: 1) {
          edges {
              cursor,
              node {
                id            
              }, 
            },
          }
        }`);
    } catch (err: any) {
      let errorMessage = 'Please verify your token is correct. Error: ';
      if (err.error_code || err.error_info) {
        errorMessage += `${err.error_code}: ${err.error_info}`;
        throw new VError(errorMessage);
      }
    }
  }
}
