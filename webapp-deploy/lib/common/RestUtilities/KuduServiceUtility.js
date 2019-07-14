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
const path = require("path");
const constants_1 = require("../constants");
const fs = require("fs");
var deployUtility = require('../webdeployment-common/utility.js');
var zipUtility = require('../webdeployment-common/ziputility.js');
const physicalRootPath = '/site/wwwroot';
const deploymentFolder = 'site/deployments';
const manifestFileName = 'manifest';
const VSTS_ZIP_DEPLOY = 'VSTS_ZIP_DEPLOY';
const VSTS_DEPLOY = 'VSTS';
class KuduServiceUtility {
    constructor(kuduService) {
        this._webAppKuduService = kuduService;
    }
    updateDeploymentStatus(taskResult, DeploymentID, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let requestBody = this._getUpdateHistoryRequest(taskResult, DeploymentID, customMessage);
                return yield this._webAppKuduService.updateDeployment(requestBody);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    getDeploymentID() {
        if (this._deploymentID) {
            return this._deploymentID;
        }
        var deploymentID = `${process.env.GITHUB_SHA}` + Date.now().toString();
        return deploymentID;
    }
    deployUsingZipDeploy(packagePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('PackageDeploymentInitiated');
                let queryParameters = [
                    'isAsync=true',
                    'deployer=' + VSTS_ZIP_DEPLOY
                ];
                let deploymentDetails = yield this._webAppKuduService.zipDeploy(packagePath, queryParameters);
                yield this._processDeploymentResponse(deploymentDetails);
                console.log('PackageDeploymentSuccess');
                return deploymentDetails.id;
            }
            catch (error) {
                console.log('PackageDeploymentFailed');
                throw Error(error);
            }
        });
    }
    deployUsingRunFromZip(packagePath, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('PackageDeploymentInitiated');
                let queryParameters = [
                    'deployer=' + VSTS_DEPLOY
                ];
                var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
                queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
                yield this._webAppKuduService.zipDeploy(packagePath, queryParameters);
                console.log('PackageDeploymentSuccess');
            }
            catch (error) {
                console.log('PackageDeploymentFailed');
                throw Error(error);
            }
        });
    }
    deployUsingWarDeploy(packagePath, customMessage, targetFolderName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('WarPackageDeploymentInitiated');
                let queryParameters = [
                    'isAsync=true'
                ];
                if (targetFolderName) {
                    queryParameters.push('name=' + encodeURIComponent(targetFolderName));
                }
                var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
                queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
                let deploymentDetails = yield this._webAppKuduService.warDeploy(packagePath, queryParameters);
                yield this._processDeploymentResponse(deploymentDetails);
                console.log('PackageDeploymentSuccess');
                return deploymentDetails.id;
            }
            catch (error) {
                console.log('PackageDeploymentFailed');
                throw Error(error);
            }
        });
    }
    postZipDeployOperation(oldDeploymentID, activeDeploymentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`ZIP DEPLOY - Performing post zip-deploy operation: ${oldDeploymentID} => ${activeDeploymentID}`);
                let manifestFileContent = yield this._webAppKuduService.getFileContent(`${deploymentFolder}/${oldDeploymentID}`, manifestFileName);
                if (!!manifestFileContent) {
                    let tempManifestFile = path.join(`${process.env.TEMPDIRECTORY}`, manifestFileName);
                    fs.writeFileSync(tempManifestFile, manifestFileContent);
                    yield this._webAppKuduService.uploadFile(`${deploymentFolder}/${activeDeploymentID}`, manifestFileName, tempManifestFile);
                }
                console.log('ZIP DEPLOY - Performed post-zipdeploy operation.');
            }
            catch (error) {
                console.log(`Failed to execute post zip-deploy operation: ${JSON.stringify(error)}.`);
            }
        });
    }
    warmpUp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('warming up Kudu Service');
                yield this._webAppKuduService.getAppSettings();
                console.log('warmed up Kudu Service');
            }
            catch (error) {
                console.log('Failed to warm-up Kudu: ' + error.toString());
            }
        });
    }
    _processDeploymentResponse(deploymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var kuduDeploymentDetails = yield this._webAppKuduService.getDeploymentDetails(deploymentDetails.id);
                console.log(`logs from kudu deploy: ${kuduDeploymentDetails.log_url}`);
                if (deploymentDetails.status == constants_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                    yield this._printZipDeployLogs(kuduDeploymentDetails.log_url);
                }
                else {
                    console.log('DeployLogsURL', kuduDeploymentDetails.log_url);
                }
            }
            catch (error) {
                console.log(`Unable to fetch logs for kudu Deploy: ${JSON.stringify(error)}`);
            }
            if (deploymentDetails.status == constants_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                throw 'PackageDeploymentUsingZipDeployFailed';
            }
        });
    }
    _printZipDeployLogs(log_url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!log_url) {
                return;
            }
            var deploymentLogs = yield this._webAppKuduService.getDeploymentLogs(log_url);
            for (var deploymentLog of deploymentLogs) {
                console.log(`${deploymentLog.message}`);
                if (deploymentLog.details_url) {
                    yield this._printZipDeployLogs(deploymentLog.details_url);
                }
            }
        });
    }
    _printPostDeploymentLogs(physicalPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var stdoutLog = yield this._webAppKuduService.getFileContent(physicalPath, 'stdout.txt');
            var stderrLog = yield this._webAppKuduService.getFileContent(physicalPath, 'stderr.txt');
            var scriptReturnCode = yield this._webAppKuduService.getFileContent(physicalPath, 'script_result.txt');
            if (scriptReturnCode == null) {
                throw new Error('File not found in Kudu Service. ' + 'script_result.txt');
            }
            if (stdoutLog) {
                console.log('stdoutFromScript');
                console.log(stdoutLog);
            }
            if (stderrLog) {
                console.log('stderrFromScript');
                if (scriptReturnCode != '0') {
                    console.log(stderrLog);
                    throw Error('ScriptExecutionOnKuduFailed' + scriptReturnCode + stderrLog);
                }
                else {
                    console.log(stderrLog);
                }
            }
        });
    }
    _getUpdateHistoryRequest(isDeploymentSuccess, deploymentID, customMessage) {
        var message = {
            type: "deployment",
            sha: `${process.env.GITHUB_SHA}`,
            repoName: `${process.env.GITHUB_REPOSITORY}`
        };
        if (!!customMessage) {
            // Append Custom Messages to original message
            for (var attribute in customMessage) {
                message[attribute] = customMessage[attribute];
            }
        }
        var deploymentLogType = message['type'];
        var active = false;
        if (deploymentLogType.toLowerCase() === "deployment" && isDeploymentSuccess) {
            active = true;
        }
        return {
            id: deploymentID,
            active: active,
            status: isDeploymentSuccess ? constants_1.KUDU_DEPLOYMENT_CONSTANTS.SUCCESS : constants_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED,
            message: JSON.stringify(message),
            author: `${process.env.GITHUB_ACTOR}`,
            deployer: 'GitHub'
        };
    }
}
exports.KuduServiceUtility = KuduServiceUtility;
