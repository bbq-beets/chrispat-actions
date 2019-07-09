"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const Q = require("q");
const webClient = require("./webClient");
const querystring = require("querystring");
class AzureEndpoint {
    constructor() {
        this._subscriptionID = `${process.env.AZURE_SUBSCRIPTION_ID}`;
        this.servicePrincipalClientID = `${process.env.AZURE_SERVICE_CLIENT_ID}`;
        this.servicePrincipalKey = `${process.env.AZURE_SERVICE_APP_KEY}`;
        this.tenantID = `${process.env.AZURE_TENANT_ID}`;
        this._baseUrl = "https://management.azure.com/";
        this.environmentAuthorityUrl = "https://login.windows.net/";
        this.activeDirectoryResourceId = "https://management.core.windows.net/";
    }
    static getEndpoint() {
        if (!this.endpoint) {
            this.endpoint = new AzureEndpoint();
        }
        return this.endpoint;
    }
    get subscriptionID() {
        return this._subscriptionID;
    }
    get baseUrl() {
        return this._baseUrl;
    }
    getToken(force) {
        if (!this.token_deferred || force) {
            this.token_deferred = this._getSPNAuthorizationToken();
        }
        return this.token_deferred;
    }
    _getSPNAuthorizationToken() {
        var deferred = Q.defer();
        let webRequest = {
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
        let webRequestOptions = {
            retriableStatusCodes: [400, 408, 409, 500, 502, 503, 504]
        };
        webClient.sendRequest(webRequest, webRequestOptions).then((response) => {
            if (response.statusCode == 200) {
                deferred.resolve(response.body.access_token);
            }
            else if ([400, 401, 403].indexOf(response.statusCode) != -1) {
                deferred.reject(tl.loc('ExpiredServicePrincipal'));
            }
            else {
                deferred.reject(tl.loc('CouldNotFetchAccessTokenforAzureStatusCode', response.statusCode, response.statusMessage));
            }
        }, (error) => {
            deferred.reject(error);
        });
        return deferred.promise;
    }
}
exports.AzureEndpoint = AzureEndpoint;
