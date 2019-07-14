import { Kudu } from '../KuduRest/azure-app-kudu-service';
import path = require('path');
import { KUDU_DEPLOYMENT_CONSTANTS } from '../constants';
import webClient = require('../webClient');
import fs = require('fs');
var deployUtility = require('../webdeployment-common/utility.js');
var zipUtility = require('../webdeployment-common/ziputility.js');
const physicalRootPath: string = '/site/wwwroot';
const deploymentFolder: string = 'site/deployments';
const manifestFileName: string = 'manifest';
const VSTS_ZIP_DEPLOY: string = 'VSTS_ZIP_DEPLOY';
const VSTS_DEPLOY: string = 'VSTS';

export class KuduServiceUtility {
    private _webAppKuduService: Kudu;
    private _deploymentID: string;

    constructor(kuduService: Kudu) {
        this._webAppKuduService = kuduService;
    }

    public async updateDeploymentStatus(taskResult: boolean, DeploymentID: string, customMessage: any): Promise<string> {
        try {
            let requestBody = this._getUpdateHistoryRequest(taskResult, DeploymentID, customMessage);
            return await this._webAppKuduService.updateDeployment(requestBody);
        }
        catch(error) {
            console.log(error);
        }
    }

    public getDeploymentID(): string {
        if(this._deploymentID) {
            return this._deploymentID;
        }

        var deploymentID: string = `${process.env.GITHUB_SHA}` + Date.now().toString();
        return deploymentID;
    }

    public async deployUsingZipDeploy(packagePath: string): Promise<string> {
        try {
            console.log('PackageDeploymentInitiated');

            let queryParameters: Array<string> = [
                'isAsync=true',
                'deployer=' + VSTS_ZIP_DEPLOY
            ];

            let deploymentDetails = await this._webAppKuduService.zipDeploy(packagePath, queryParameters);
            await this._processDeploymentResponse(deploymentDetails);

            console.log('PackageDeploymentSuccess');
            return deploymentDetails.id;
        }
        catch(error) {
            console.log('PackageDeploymentFailed');
            throw Error(error);
        }
    }

    public async deployUsingRunFromZip(packagePath: string, customMessage?: any) : Promise<void> {
        try {
            console.log('PackageDeploymentInitiated');

            let queryParameters: Array<string> = [
                'deployer=' +   VSTS_DEPLOY
            ];

            var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            await this._webAppKuduService.zipDeploy(packagePath, queryParameters);
            console.log('PackageDeploymentSuccess');
        }
        catch(error) {
            console.log('PackageDeploymentFailed');
            throw Error(error);
        }
    }

    public async deployUsingWarDeploy(packagePath: string, customMessage?: any, targetFolderName?: any): Promise<string> {
        try {
            console.log('WarPackageDeploymentInitiated');

            let queryParameters: Array<string> = [
                'isAsync=true'
            ];
            
            if(targetFolderName) {
                queryParameters.push('name=' + encodeURIComponent(targetFolderName));
            }

            var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            let deploymentDetails = await this._webAppKuduService.warDeploy(packagePath, queryParameters);
            await this._processDeploymentResponse(deploymentDetails);
            console.log('PackageDeploymentSuccess');

            return deploymentDetails.id;
        }
        catch(error) {
            console.log('PackageDeploymentFailed');
            throw Error(error);
        }
    }

    public async postZipDeployOperation(oldDeploymentID: string, activeDeploymentID: string): Promise<void> {
        try {
            console.log(`ZIP DEPLOY - Performing post zip-deploy operation: ${oldDeploymentID} => ${activeDeploymentID}`);
            let manifestFileContent = await this._webAppKuduService.getFileContent(`${deploymentFolder}/${oldDeploymentID}`, manifestFileName);
            if(!!manifestFileContent) {
                let tempManifestFile: string = path.join(`${process.env.TEMPDIRECTORY}`, manifestFileName);
                fs.writeFileSync(tempManifestFile, manifestFileContent);
                await this._webAppKuduService.uploadFile(`${deploymentFolder}/${activeDeploymentID}`, manifestFileName, tempManifestFile);
            }
            console.log('ZIP DEPLOY - Performed post-zipdeploy operation.');
        }
        catch(error) {
            console.log(`Failed to execute post zip-deploy operation: ${JSON.stringify(error)}.`);
        }
    }

    public async warmpUp(): Promise<void> {
        try {
            console.log('warming up Kudu Service');
            await this._webAppKuduService.getAppSettings();
            console.log('warmed up Kudu Service');
        }
        catch(error) {
            console.log('Failed to warm-up Kudu: ' + error.toString());
        }
    }

    private async _processDeploymentResponse(deploymentDetails: any): Promise<void> {
        try {
            var kuduDeploymentDetails = await this._webAppKuduService.getDeploymentDetails(deploymentDetails.id);
            console.log(`logs from kudu deploy: ${kuduDeploymentDetails.log_url}`);

            if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                await this._printZipDeployLogs(kuduDeploymentDetails.log_url);
            }
            else {
                console.log('DeployLogsURL', kuduDeploymentDetails.log_url);
            }
        }
        catch(error) {
            console.log(`Unable to fetch logs for kudu Deploy: ${JSON.stringify(error)}`);
        }

        if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
            throw 'PackageDeploymentUsingZipDeployFailed';
        }
    }

    private async _printZipDeployLogs(log_url: string): Promise<void> {
        if(!log_url) {
            return;
        }

        var deploymentLogs = await this._webAppKuduService.getDeploymentLogs(log_url);
        for(var deploymentLog of deploymentLogs) {
            console.log(`${deploymentLog.message}`);
            if(deploymentLog.details_url) {
                await this._printZipDeployLogs(deploymentLog.details_url);
            }
        }
    }

    private async _printPostDeploymentLogs(physicalPath: string) : Promise<void> {
        var stdoutLog = await this._webAppKuduService.getFileContent(physicalPath, 'stdout.txt');
        var stderrLog = await this._webAppKuduService.getFileContent(physicalPath, 'stderr.txt');
        var scriptReturnCode = await this._webAppKuduService.getFileContent(physicalPath, 'script_result.txt');

        if(scriptReturnCode == null) {
            throw new Error('File not found in Kudu Service. ' + 'script_result.txt');
        }

        if(stdoutLog) {
            console.log('stdoutFromScript');
            console.log(stdoutLog);
        }
        if(stderrLog) {
            console.log('stderrFromScript');
            if(scriptReturnCode != '0') {
                console.log(stderrLog);
                throw Error('ScriptExecutionOnKuduFailed' + scriptReturnCode + stderrLog);
            }
            else {
                console.log(stderrLog);
            }
        }
    }

    private _getUpdateHistoryRequest(isDeploymentSuccess: boolean, deploymentID?: string, customMessage?: any): any {    
        var message = {
            type : "deployment",
            sha : `${process.env.GITHUB_SHA}`,
            repoName : `${process.env.GITHUB_REPOSITORY}`
        };

        if(!!customMessage) {
            // Append Custom Messages to original message
            for(var attribute in customMessage) {
                message[attribute] = customMessage[attribute];
            }
            
        }
        var deploymentLogType: string = message['type'];
        var active: boolean = false;
        if(deploymentLogType.toLowerCase() === "deployment" && isDeploymentSuccess) {
            active = true;
        }

        return {
            id: deploymentID,
            active : active,
            status : isDeploymentSuccess ? KUDU_DEPLOYMENT_CONSTANTS.SUCCESS : KUDU_DEPLOYMENT_CONSTANTS.FAILED,
            message : JSON.stringify(message),
            author : `${process.env.GITHUB_ACTOR}`,
            deployer : 'GitHub'
        };
    }
}
