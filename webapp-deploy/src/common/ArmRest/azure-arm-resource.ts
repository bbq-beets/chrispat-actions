import { ToError, ServiceClient } from './AzureServiceClient';
import { AzureEndpoint } from './AzureEndpoint';
import webClient = require('../webClient');
import Q = require('q');

export class Resources {
    private _client: ServiceClient;

    constructor(endpoint: AzureEndpoint) {
        this._client = new ServiceClient(endpoint, 30);
    }

    public async getResources(resourceType: string, resourceName: string) {
        var httpRequest: webClient.WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri('//subscriptions/{subscriptionId}/resources', {},
            [`$filter=resourceType EQ \'${encodeURIComponent(resourceType)}\' AND name EQ \'${encodeURIComponent(resourceName)}\'`], '2016-07-01')
        };

        var result: any[] = [];
        try {
            var response = await this._client.beginRequest(httpRequest);
            if (response.statusCode != 200) {
                throw ToError(response);
            }

            result = result.concat(response.body.value);
            if (response.body.nextLink) {
                var nextResult = await this._client.accumulateResultFromPagedResult(response.body.nextLink);
                if (nextResult.error) {
                    throw Error(nextResult.error);
                }
                result = result.concat(nextResult.result);
            }

            return result;
        }
        catch (error) {
            throw Error('FailedToGetResourceID' + this._client.getFormattedError(error));
        }
    }
}