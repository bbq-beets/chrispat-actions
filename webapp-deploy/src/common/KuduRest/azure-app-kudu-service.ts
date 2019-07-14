import fs = require('fs');
import { KuduServiceClient } from './KuduServiceClient';
import webClient = require('../webClient');
import { KUDU_DEPLOYMENT_CONSTANTS } from '../constants';
import { exist } from '../Utilities/PackageUtility';

export class Kudu {
    private _client: KuduServiceClient;

    constructor(scmUri: string, username: string, password: string) {
        var base64EncodedCredential = (new Buffer(username + ':' + password).toString('base64'));
        this._client = new KuduServiceClient(scmUri, base64EncodedCredential);
    }

    public async updateDeployment(requestBody: any): Promise<string> {
        var httpRequest: webClient.WebRequest = {
            method: 'PUT',
            body: JSON.stringify(requestBody),
            uri: this._client.getRequestUri(`/api/deployments/${requestBody.id}`)
        };

        try {
            let webRequestOptions: webClient.WebRequestOptions = {retriableErrorCodes: [], retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: true};
            var response = await this._client.beginRequest(httpRequest, webRequestOptions);
            console.log(`updateDeployment. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                console.log("Successfullyupdateddeploymenthistory" + response.body.url);
                return response.body.id;
            }

            throw response;
        }
        catch(error) {
            throw Error('Failedtoupdatedeploymenthistory' + this._getFormattedError(error));
        }
    }

    public async getAppSettings(): Promise<Map<string, string>> {
        var httpRequest: webClient.WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri(`/api/settings`)
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            console.log(`getAppSettings. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return response.body;
            }

            throw response;
        }
        catch(error) {
            throw Error('FailedToFetchKuduAppSettings' + this._getFormattedError(error));
        }
    }

    public async runCommand(physicalPath: string, command: string): Promise<void> {
        var httpRequest: webClient.WebRequest = {
            method: 'POST',
            uri: this._client.getRequestUri(`/api/command`),
            headers: {
                'Content-Type': 'multipart/form-data',
                'If-Match': '*'
            },
            body: JSON.stringify({
                'command': command,
                'dir': physicalPath
            })
        };

        try {
            console.log('Executing Script on Kudu. Command: ' + command);
            let webRequestOptions: webClient.WebRequestOptions = {retriableErrorCodes: null, retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: false};
            var response = await this._client.beginRequest(httpRequest, webRequestOptions);
            console.log(`runCommand. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return ;
            }
            else {
                throw response;
            }
        }
        catch(error) {
            throw Error(error.toString());
        }
    }

    public async extractZIP(webPackage: string, physicalPath: string): Promise<void> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1): physicalPath;
        var httpRequest: webClient.WebRequest = {
            method: 'PUT',
            uri: this._client.getRequestUri(`/api/zip/${physicalPath}/`),
            headers: {
                'Content-Type': 'multipart/form-data',
                'If-Match': '*'
            },
            body: fs.createReadStream(webPackage)
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            console.log(`extractZIP. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return ;
            }
            else {
                throw response;
            }
        }
        catch(error) {
            throw Error('Failedtodeploywebapppackageusingkuduservice' + this._getFormattedError(error));
        }
    }

    public async zipDeploy(webPackage: string, queryParameters?: Array<string>): Promise<any> {
        let httpRequest: webClient.WebRequest = {
            method: 'POST',
            uri: this._client.getRequestUri(`/api/zipdeploy`, queryParameters),
            body: fs.createReadStream(webPackage)
        };

        try {
            let response = await this._client.beginRequest(httpRequest, null, 'application/octet-stream');
            console.log(`ZIP Deploy response: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                console.log('Deployment passed');
                return null;
            }
            else if(response.statusCode == 202) {
                let pollableURL: string = response.headers.location;
                if(!!pollableURL) {
                    console.log(`Polling for ZIP Deploy URL: ${pollableURL}`);
                    return await this._getDeploymentDetailsFromPollURL(pollableURL);
                }
                else {
                    console.log('zip deploy returned 202 without pollable URL.');
                    return null;
                }
            }
            else {
                throw response;
            }
        }
        catch(error) {
            throw new Error('PackageDeploymentFailed' + this._getFormattedError(error));
        }
    }

    public async warDeploy(webPackage: string, queryParameters?: Array<string>): Promise<any> {
        let httpRequest: webClient.WebRequest = {
            method: 'POST',
            uri: this._client.getRequestUri(`/api/wardeploy`, queryParameters),
            body: fs.createReadStream(webPackage)
        };

        try {
            let response = await this._client.beginRequest(httpRequest, null, 'multipart/form-data');
            console.log(`War Deploy response: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                console.log('Deployment passed');
                return null;
            }
            else if(response.statusCode == 202) {
                let pollableURL: string = response.headers.location;
                if(!!pollableURL) {
                    console.log(`Polling for War Deploy URL: ${pollableURL}`);
                    return await this._getDeploymentDetailsFromPollURL(pollableURL);
                }
                else {
                    console.log('war deploy returned 202 without pollable URL.');
                    return null;
                }
            }
            else {
                throw response;
            }
        }
        catch(error) {
            throw new Error('PackageDeploymentFailed' + this._getFormattedError(error));
        }
    }


    public async getDeploymentDetails(deploymentID: string): Promise<any> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/deployments/${deploymentID}`)
            };
            var response = await this._client.beginRequest(httpRequest);
            console.log(`getDeploymentDetails. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return response.body;
            }

            throw response;
        }
        catch(error) {
            throw Error('FailedToGetDeploymentLogs' + this._getFormattedError(error));
        }
    }

    public async getDeploymentLogs(log_url: string): Promise<any> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'GET',
                uri: log_url
            };
            var response = await this._client.beginRequest(httpRequest);
            console.log(`getDeploymentLogs. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return response.body;
            }

            throw response;
        }
        catch(error) {
            throw Error('FailedToGetDeploymentLogs' + this._getFormattedError(error))
        }
    }    

    public async getFileContent(physicalPath: string, fileName: string): Promise<string> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1): physicalPath;
        var httpRequest: webClient.WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
            headers: {
                'If-Match': '*'
            }
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            console.log(`getFileContent. Status code: ${response.statusCode} - ${response.statusMessage}`);
            if([200, 201, 204].indexOf(response.statusCode) != -1) {
                return response.body;
            }
            else if(response.statusCode === 404) {
                return null;
            }
            else {
                throw response;
            }
        }
        catch(error) {
            throw Error('FailedToGetFileContent' + physicalPath + fileName + this._getFormattedError(error));
        }
    }

    public async uploadFile(physicalPath: string, fileName: string, filePath: string): Promise<void> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1): physicalPath;
        if(!exist(filePath)) {
            throw new Error('FilePathInvalid' + filePath);
        }

        var httpRequest: webClient.WebRequest = {
            method: 'PUT',
            uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
            headers: {
                'If-Match': '*'
            },
            body: fs.createReadStream(filePath)
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            console.log(`uploadFile. Data: ${JSON.stringify(response)}`);
            if([200, 201, 204].indexOf(response.statusCode) != -1) {
                return response.body;
            }
            
            throw response;
        }
        catch(error) {
            throw Error('FailedToUploadFile' + physicalPath + fileName + this._getFormattedError(error));
        }
    }

    public async deleteFile(physicalPath: string, fileName: string): Promise<void> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1): physicalPath;
        var httpRequest: webClient.WebRequest = {
            method: 'DELETE',
            uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
            headers: {
                'If-Match': '*'
            }
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            console.log(`deleteFile. Data: ${JSON.stringify(response)}`);
            if([200, 201, 204, 404].indexOf(response.statusCode) != -1) {
                return ;
            }
            else {
                throw response;
            }
        }
        catch(error) {
            throw Error('FailedToDeleteFile' + physicalPath + fileName + this._getFormattedError(error));
        }
    }

    private async _getDeploymentDetailsFromPollURL(pollURL: string):Promise<any> {
        let httpRequest: webClient.WebRequest = {
            method: 'GET',
            uri: pollURL,
            headers: {}
        };

        while(true) {
            let response = await this._client.beginRequest(httpRequest);
            if(response.statusCode == 200 || response.statusCode == 202) {
                var result = response.body;
                console.log(`POLL URL RESULT: ${JSON.stringify(response)}`);
                if(result.status == KUDU_DEPLOYMENT_CONSTANTS.SUCCESS || result.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                    return result;
                }
                else {
                    console.log(`Deployment status: ${result.status} '${result.status_text}'. retry after 5 seconds`);
                    await webClient.sleepFor(5);
                    continue;
                }
            }
            else {
                throw response;
            }
        }
    }

    private _getFormattedError(error: any) {
        if(error && error.statusCode) {
            return `${error.statusMessage} (CODE: ${error.statusCode})`;
        }
        else if(error && error.message) {
            if(error.statusCode) {
                error.message = `${typeof error.message.valueOf() == 'string' ? error.message : error.message.Code + " - " + error.message.Message } (CODE: ${error.statusCode})`
            }

            return error.message;
        }

        return error;
    }
}