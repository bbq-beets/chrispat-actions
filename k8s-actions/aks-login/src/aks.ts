import * as core from '@actions/core';
import { WebRequest, WebRequestOptions, WebResponse, sendRequest } from "./client";
import * as querystring from 'querystring';
import { issueCommand } from '@actions/core/lib/command';
import * as path from 'path';
import * as fs from 'fs';

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getAzureAccessToken(): Promise<string> {
    let servicePrincipalId = core.getInput('servicePrincipalId', { required: true });
    let servicePrincipalKey = core.getInput('servicePrincipalKey', { required: true });
    let tenantId = core.getInput('tenantId', { required: true });
    return new Promise<string>((resolve, reject) => {
        let webRequest = new WebRequest();
        webRequest.method = "POST";
        webRequest.uri = `https://login.microsoftonline.com/${tenantId}/oauth2/token/`;
        webRequest.body = querystring.stringify({
            resource: 'https://management.azure.com',
            client_id: servicePrincipalId,
            grant_type: "client_credentials",
            client_secret: servicePrincipalKey
        });
        webRequest.headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        };

        let webRequestOptions: WebRequestOptions = {
            retriableErrorCodes: null,
            retriableStatusCodes: [400, 408, 409, 500, 502, 503, 504],
            retryCount: null,
            retryIntervalInSeconds: null
        };

        sendRequest(webRequest, webRequestOptions).then(
            (response: WebResponse) => {
                if (response.statusCode == 200) {
                    resolve(response.body.access_token);
                }
                else if ([400, 401, 403].indexOf(response.statusCode) != -1) {
                    reject('ExpiredServicePrincipal');
                }
                else {
                    reject('CouldNotFetchAccessTokenforAzureStatusCode');
                }
            },
            (error) => {
                reject(error)
            }
        );
    });
}

function getAKSKubeconfig(azureSessionToken): Promise<string> {
    let subscriptionId = core.getInput('subscriptionId', { required: true });
    let resourceGroupName = core.getInput('resourceGroupName', { required: true });
    let clusterName = core.getInput('clusterName', { required: true });
    return new Promise<string>((resolve, reject) => {
        var webRequest = new WebRequest();
        webRequest.method = 'GET';
        webRequest.uri = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ContainerService/managedClusters/${clusterName}/accessProfiles/clusterAdmin?api-version=2017-08-31`;
        webRequest.headers = {
            'Authorization': 'Bearer ' + azureSessionToken,
            'Content-Type': 'application/json; charset=utf-8'
        }
        sendRequest(webRequest).then((response: WebResponse) => {
            let accessProfile = response.body;
            var kubeconfig = Buffer.from(accessProfile.properties.kubeConfig, 'base64');
            resolve(kubeconfig.toString());
        }).catch(reject);
    });
}

async function run() {
    let azureSessionToken = await getAzureAccessToken();
    let kubeconfig = await getAKSKubeconfig(azureSessionToken);
    if (!kubeconfig) {
        core.setFailed('Kubeconfig not received');
    }
    const runnerTempDirectory = process.env['RUNNER_TEMPDIRECTORY']; // Using process.env until the core libs are updated
    const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${getRandomInt(100)}`);
    core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
    fs.writeFileSync(kubeconfigPath, kubeconfig);
    issueCommand('set-env', { name: 'KUBECONFIG' }, kubeconfigPath);
    console.log('KUBECONFIG environment variable is set');
}

run().catch(core.setFailed);