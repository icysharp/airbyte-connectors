// import axios from 'axios';
import {AirbyteConfig, AirbyteLog, AirbyteLogger} from 'faros-airbyte-cdk';
import {ClientError, GraphQLClient} from 'graphql-request';
import {Dictionary} from 'ts-essentials';
import {VError} from 'verror';

const getGraphApiUrl = (orgId: string): string =>
  `https://partners.shopify.com/${orgId}/api/2022-01/graphql.json`;

export interface ShopifyConfig {
  readonly accessToken: string;
  readonly organizationId: string;
}

export class Shopify {
  private static shopify: Shopify = null;

  constructor(
    private readonly graphClient: GraphQLClient,
    private readonly organizationId: string,
    private readonly accessToken: string,
    private readonly logger: AirbyteLogger
  ) {}

  static instance(config: AirbyteConfig, logger: AirbyteLogger): Shopify {
    if (Shopify.shopify) return Shopify.shopify;

    const shopifyConfig: ShopifyConfig = Shopify.getShopifyConfig(config);
    Shopify.validateConfig(shopifyConfig, logger);

    const graphClient = new GraphQLClient(
      `${getGraphApiUrl(shopifyConfig.organizationId)}`,
      {
        headers: {'X-Shopify-Access-Token': shopifyConfig.accessToken},
      }
    );
    Shopify.shopify = new Shopify(
      graphClient,
      shopifyConfig.organizationId,
      shopifyConfig.accessToken,
      logger
    );
    return Shopify.shopify;
  }

  static getShopifyConfig(config: AirbyteConfig): ShopifyConfig {
    const organizationId = config['OrganizationID'];
    const accessToken = config['ShopifyAccessToken'];

    const shopifyConfig: ShopifyConfig = {
      organizationId,
      accessToken,
    };
    return shopifyConfig;
  }

  private static validateConfig(
    shopifyConfig: ShopifyConfig,
    logger: AirbyteLogger
  ): void {
    let message: string = null;
    if (!shopifyConfig.organizationId) {
      message =
        'Please provide a valid Organization ID for the Shopify Partner API';
      logger.warn(`${message} | ${shopifyConfig.organizationId}`);
      throw new VError(message);
    }
    if (!shopifyConfig.accessToken) {
      message =
        'Please provide a valid API Token for the Shopify Partner API (X-Shopify-Access-Token)';
      logger.warn(`${message} | ${shopifyConfig.accessToken}`);
      throw new VError(message);
    }
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
      this.logger.info(
        `GraphQL endpoint : ${getGraphApiUrl(this.organizationId)}`
      );
      this.logger.debug(`Access Token : ${this.accessToken}`);
      const clientError = err as ClientError;
      const errorMessage = `Please verify your Shopify Partner API Source configuration! \n Error: ${clientError.message} `;
      throw new VError(errorMessage);
    }
  }

  async *fetchTransactions(): AsyncGenerator<any, void, unknown> {
    try {
      const data = await this.graphClient.request(`{
        transactions {
          edges {
              cursor,
              node {
                id
                createdAt
                __typename
              },
            },
          }
        }`);
      for (const txn of data.transactions.edges) {
        yield this.newTransaction(txn);
      }
    } catch (err: any) {
      const clientError = err as ClientError;
      const errorMessage = `Please verify your Shopify Partner API Source configuration! \n Error: ${clientError.message} `;
      throw new VError(errorMessage);
    }
  }

  private newTransaction(edge: Dictionary<any>): Dictionary<any> {
    return {
      id: edge.node.id,
      createdAt: edge.node.createdAt,
      __typename: edge.node.__typename,
    };
  }

  async *fetchAppSubscriptionSaleTxns(): AsyncGenerator<any, void, unknown> {
    try {
      const data = await this.graphClient.request(`
      {
        transactions(types: [APP_SUBSCRIPTION_SALE]) {
          edges {
            node {
              id
              createdAt
              ... on AppSubscriptionSale {
                billingInterval 
                chargeId
                createdAt
                grossAmount {
                  amount
                  currencyCode
                }
                netAmount {
                  amount
                  currencyCode
                }
                shopifyFee {
                  amount
                  currencyCode
                }
                shop {
                  id
                  name
                  avatarUrl
                  myshopifyDomain
                }
              }
            }
          }
        }
      }
        `);
      for (const txn of data.transactions.edges) {
        this.logger.debug(JSON.stringify(txn, null, 4));
        yield this.newAppSubscriptionSaleEvents(txn);
      }
    } catch (err: any) {
      const clientError = err as ClientError;
      const errorMessage = `Please verify your Shopify Partner API Source configuration! \n Error: ${clientError.message} `;
      throw new VError(errorMessage);
    }
  }

  private newAppSubscriptionSaleEvents({
    node,
  }: Dictionary<any>): Dictionary<any> {
    return {
      id: node.id,
      createdAt: node.createdAt,
      billingInterval: node.billingInterval,
      chargeId: node.chargeId,
      grossAmount: node.grossAmount,
      netAmount: node.netAmount,
      shopifyFee: node.shopifyFee,
      shop: node.shop,
    };
  }
}
