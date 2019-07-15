"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const webClient = require("../webClient");
const querystring = require("querystring");
const core = __importStar(require("@actions/core"));
class AzureEndpoint {
    constructor() {
        this._subscriptionID = core.getInput('azure-subscription', { required: true });
        this.servicePrincipalClientID = core.getInput('azure-service-app-id', { required: true });
        this.servicePrincipalKey = core.getInput('azure-service-app-key', { required: true });
        this.tenantID = core.getInput('azure-service-tenant-id', { required: true });
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
                deferred.reject('ExpiredServicePrincipal');
            }
            else {
                deferred.reject('CouldNotFetchAccessTokenforAzureStatusCode');
            }
        }, (error) => {
            deferred.reject(error);
        });
        return deferred.promise;
    }
}
exports.AzureEndpoint = AzureEndpoint;
