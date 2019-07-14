"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const KuduServiceClient_1 = require("./KuduServiceClient");
const webClient = require("../webClient");
const constants_1 = require("../constants");
const PackageUtility_1 = require("../Utilities/PackageUtility");
class Kudu {
    constructor(scmUri, username, password) {
        var base64EncodedCredential = (new Buffer(username + ':' + password).toString('base64'));
        this._client = new KuduServiceClient_1.KuduServiceClient(scmUri, base64EncodedCredential);
    }
    updateDeployment(requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                uri: this._client.getRequestUri(`/api/deployments/${requestBody.id}`)
            };
            try {
                let webRequestOptions = { retriableErrorCodes: [], retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: true };
                var response = yield this._client.beginRequest(httpRequest, webRequestOptions);
                console.log(`updateDeployment. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    console.log("Successfullyupdateddeploymenthistory" + response.body.url);
                    return response.body.id;
                }
                throw response;
            }
            catch (error) {
                throw Error('Failedtoupdatedeploymenthistory' + this._getFormattedError(error));
            }
        });
    }
    getAppSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/settings`)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`getAppSettings. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error('FailedToFetchKuduAppSettings' + this._getFormattedError(error));
            }
        });
    }
    runCommand(physicalPath, command) {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
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
                let webRequestOptions = { retriableErrorCodes: null, retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: false };
                var response = yield this._client.beginRequest(httpRequest, webRequestOptions);
                console.log(`runCommand. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error(error.toString());
            }
        });
    }
    extractZIP(webPackage, physicalPath) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            var httpRequest = {
                method: 'PUT',
                uri: this._client.getRequestUri(`/api/zip/${physicalPath}/`),
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'If-Match': '*'
                },
                body: fs.createReadStream(webPackage)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`extractZIP. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error('Failedtodeploywebapppackageusingkuduservice' + this._getFormattedError(error));
            }
        });
    }
    zipDeploy(webPackage, queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/zipdeploy`, queryParameters),
                body: fs.createReadStream(webPackage)
            };
            try {
                let response = yield this._client.beginRequest(httpRequest, null, 'application/octet-stream');
                console.log(`ZIP Deploy response: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    console.log('Deployment passed');
                    return null;
                }
                else if (response.statusCode == 202) {
                    let pollableURL = response.headers.location;
                    if (!!pollableURL) {
                        console.log(`Polling for ZIP Deploy URL: ${pollableURL}`);
                        return yield this._getDeploymentDetailsFromPollURL(pollableURL);
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
            catch (error) {
                throw new Error('PackageDeploymentFailed' + this._getFormattedError(error));
            }
        });
    }
    warDeploy(webPackage, queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/wardeploy`, queryParameters),
                body: fs.createReadStream(webPackage)
            };
            try {
                let response = yield this._client.beginRequest(httpRequest, null, 'multipart/form-data');
                console.log(`War Deploy response: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    console.log('Deployment passed');
                    return null;
                }
                else if (response.statusCode == 202) {
                    let pollableURL = response.headers.location;
                    if (!!pollableURL) {
                        console.log(`Polling for War Deploy URL: ${pollableURL}`);
                        return yield this._getDeploymentDetailsFromPollURL(pollableURL);
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
            catch (error) {
                throw new Error('PackageDeploymentFailed' + this._getFormattedError(error));
            }
        });
    }
    getDeploymentDetails(deploymentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`/api/deployments/${deploymentID}`)
                };
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`getDeploymentDetails. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error('FailedToGetDeploymentLogs' + this._getFormattedError(error));
            }
        });
    }
    getDeploymentLogs(log_url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: log_url
                };
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`getDeploymentLogs. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error('FailedToGetDeploymentLogs' + this._getFormattedError(error));
            }
        });
    }
    getFileContent(physicalPath, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            var httpRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
                headers: {
                    'If-Match': '*'
                }
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`getFileContent. Status code: ${response.statusCode} - ${response.statusMessage}`);
                if ([200, 201, 204].indexOf(response.statusCode) != -1) {
                    return response.body;
                }
                else if (response.statusCode === 404) {
                    return null;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error('FailedToGetFileContent' + physicalPath + fileName + this._getFormattedError(error));
            }
        });
    }
    uploadFile(physicalPath, fileName, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            if (!PackageUtility_1.exist(filePath)) {
                throw new Error('FilePathInvalid' + filePath);
            }
            var httpRequest = {
                method: 'PUT',
                uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
                headers: {
                    'If-Match': '*'
                },
                body: fs.createReadStream(filePath)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`uploadFile. Data: ${JSON.stringify(response)}`);
                if ([200, 201, 204].indexOf(response.statusCode) != -1) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error('FailedToUploadFile' + physicalPath + fileName + this._getFormattedError(error));
            }
        });
    }
    deleteFile(physicalPath, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            var httpRequest = {
                method: 'DELETE',
                uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
                headers: {
                    'If-Match': '*'
                }
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                console.log(`deleteFile. Data: ${JSON.stringify(response)}`);
                if ([200, 201, 204, 404].indexOf(response.statusCode) != -1) {
                    return;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error('FailedToDeleteFile' + physicalPath + fileName + this._getFormattedError(error));
            }
        });
    }
    _getDeploymentDetailsFromPollURL(pollURL) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'GET',
                uri: pollURL,
                headers: {}
            };
            while (true) {
                let response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode == 200 || response.statusCode == 202) {
                    var result = response.body;
                    console.log(`POLL URL RESULT: ${JSON.stringify(response)}`);
                    if (result.status == constants_1.KUDU_DEPLOYMENT_CONSTANTS.SUCCESS || result.status == constants_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                        return result;
                    }
                    else {
                        console.log(`Deployment status: ${result.status} '${result.status_text}'. retry after 5 seconds`);
                        yield webClient.sleepFor(5);
                        continue;
                    }
                }
                else {
                    throw response;
                }
            }
        });
    }
    _getFormattedError(error) {
        if (error && error.statusCode) {
            return `${error.statusMessage} (CODE: ${error.statusCode})`;
        }
        else if (error && error.message) {
            if (error.statusCode) {
                error.message = `${typeof error.message.valueOf() == 'string' ? error.message : error.message.Code + " - " + error.message.Message} (CODE: ${error.statusCode})`;
            }
            return error.message;
        }
        return error;
    }
}
exports.Kudu = Kudu;
