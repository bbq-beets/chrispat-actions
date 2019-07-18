import Q = require('q');
import webClient = require("../webClient");
import querystring = require('querystring');
import { IAuthorizationHandler } from "./IAuthorizationHandler";

export class AzureEndpoint implements IAuthorizationHandler {
    private static endpoint: AzureEndpoint;
    private _subscriptionID: string;
    private servicePrincipalClientID: string;
    private servicePrincipalKey: string;
    private tenantID: string;
    private _baseUrl: string;
    private environmentAuthorityUrl: string;
    private activeDirectoryResourceId: string;
    private token_deferred?: Q.Promise<string>;

    private constructor() {
        this._subscriptionID = 'c94bda7a-0577-4374-9c53-0e46a9fb0f70';//`${process.env.AZURE_SUBSCRIPTION_ID}`;
        this.servicePrincipalClientID = '586a5f0f-3720-42b2-82ef-d4479d53a0a5';//`${process.env.AZURE_SERVICE_CLIENT_ID}`;
        this.servicePrincipalKey = '/gk+ZqLp7E2PDrzuTvRg0Zju67ExLgAZ0wJisZaV6OM=';//`${process.env.AZURE_SERVICE_APP_KEY}`;
        this.tenantID = '72f988bf-86f1-41af-91ab-2d7cd011db47';//`${process.env.AZURE_TENANT_ID}`;
        this._baseUrl = "https://management.azure.com/";
        this.environmentAuthorityUrl = "https://login.windows.net/";
        this.activeDirectoryResourceId = "https://management.core.windows.net/";
    }

    public static getEndpoint(): AzureEndpoint {
        if(!this.endpoint) {
            this.endpoint = new AzureEndpoint();
        }
        return this.endpoint;
    }

    public get subscriptionID(): string {
        return this._subscriptionID;
    }

    public get baseUrl(): string {
        return this._baseUrl;
    }

    public getToken(force?: boolean): Q.Promise<string> {
        if (!this.token_deferred || force) {
            this.token_deferred = this._getSPNAuthorizationToken();
        }

        return this.token_deferred;
    }

    private _getSPNAuthorizationToken(): Q.Promise<string> {        
        var deferred = Q.defer<string>();
        let webRequest: webClient.WebRequest = {
            method: "POST",
            uri: this.environmentAuthorityUrl + this.tenantID + "/oauth2/token/",
            body: querystring.stringify({
                resource: this.activeDirectoryResourceId,
                client_id: this.servicePrincipalClientID,
                grant_type: "client_credentials",
                client_secret: this.servicePrincipalKey
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
            }
        };

        let webRequestOptions: webClient.WebRequestOptions = {
            retriableStatusCodes: [400, 408, 409, 500, 502, 503, 504]
        };

        webClient.sendRequest(webRequest, webRequestOptions).then(
            (response: webClient.WebResponse) => {
                if (response.statusCode == 200) {
                    deferred.resolve(response.body.access_token);
                }
                else if([400, 401, 403].indexOf(response.statusCode) != -1) {
                    deferred.reject('ExpiredServicePrincipal');
                }
                else {
                    deferred.reject('CouldNotFetchAccessTokenforAzureStatusCode');
                }
            },
            (error) => {
                deferred.reject(error)
            }
        );

        return deferred.promise;
    }
}