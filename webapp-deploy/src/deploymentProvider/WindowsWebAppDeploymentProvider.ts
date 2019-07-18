import { IWebAppDeploymentProvider } from "./IWebAppDeploymentProvider";
import { PackageType } from "../common/Utilities/packageUtility";
import { parse } from "../common/Utilities/parameterParserUtility";
import { FileTransformUtility} from "../common/Utilities/fileTransformationUtility";
import * as utility from '../common/Utilities/utility.js';
import * as zipUtility from '../common/Utilities/ziputility.js';
import * as core from '@actions/core';
import { IWebAppDeploymentHelper } from "./IWebAppDeploymentHelper";
import { TaskParameters } from "../taskparameters";

const removeRunFromZipAppSetting: string = '-WEBSITE_RUN_FROM_PACKAGE 0';
const runFromZipAppSetting: string = '-WEBSITE_RUN_FROM_PACKAGE 1';
const appType: string = "-appType java_springboot";
const jarPath: string = " -JAR_PATH ";

export class WindowsWebAppDeploymentProvider implements IWebAppDeploymentProvider {
    private zipDeploymentID: string;
    private updateStatus: boolean;
    private deploymentHelper: IWebAppDeploymentHelper;

    constructor(deplHelper: IWebAppDeploymentHelper){
        this.deploymentHelper = deplHelper;
    }
    
    PreDeploymentStep() {
        this.deploymentHelper.PreDeploymentStep();
    }

    public async DeployWebAppStep() {
        let webPackage = TaskParameters.getTaskParams().package.getPath();
        var _isMSBuildPackage = await TaskParameters.getTaskParams().package.isMSBuildPackage();           
        if(_isMSBuildPackage) {
            throw new Error('MsBuildPackageNotSupported' + webPackage);
        } 
        let packageType = TaskParameters.getTaskParams().package.getPackageType();
        let deploymentMethodtelemetry: string;
        
        switch(packageType){
            case PackageType.war:
                core.debug("Initiated deployment via kudu service for webapp war package : "+ webPackage);        
                deploymentMethodtelemetry = '{"deploymentMethod":"War Deploy"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                await this.deploymentHelper.KuduServiceUtility.warmpUp();
                var warName = utility.getFileNameFromPath(webPackage, ".war");
                this.zipDeploymentID = await this.deploymentHelper.KuduServiceUtility.deployUsingWarDeploy(webPackage, 
                    { slotName: this.deploymentHelper.AzureAppService.getSlot() }, warName);
                this.updateStatus = true;
                break;

            case PackageType.jar:
                core.debug("Initiated deployment via kudu service for webapp jar package : "+ webPackage);    
                deploymentMethodtelemetry = '{"deploymentMethod":"Zip Deploy"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                var updateApplicationSetting = parse(removeRunFromZipAppSetting)
                var isNewValueUpdated: boolean = await this.deploymentHelper.AzureAppServiceUtility.updateAndMonitorAppSettings(updateApplicationSetting);
                if(!isNewValueUpdated) {
                    await this.deploymentHelper.KuduServiceUtility.warmpUp();
                }

                var jarFile = utility.getFileNameFromPath(webPackage);
                webPackage = await FileTransformUtility.applyTransformations(webPackage, appType + jarPath + jarFile, TaskParameters.getTaskParams().package.getPackageType());

                this.zipDeploymentID = await this.deploymentHelper.KuduServiceUtility.deployUsingZipDeploy(webPackage);
                this.updateStatus = true;
                break;

            case PackageType.folder:
                let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMPDIRECTORY}`, false);
                webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;
                core.debug("Compressed folder into zip " +  webPackage);
                
            case PackageType.zip:
                core.debug("Initiated deployment via kudu service for webapp package : "+ webPackage);    
                deploymentMethodtelemetry = '{"deploymentMethod":"Run from Package"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                var addCustomApplicationSetting = parse(runFromZipAppSetting);
                var isNewValueUpdated: boolean = await this.deploymentHelper.AzureAppServiceUtility.updateAndMonitorAppSettings(addCustomApplicationSetting);
                if(!isNewValueUpdated) {
                    await this.deploymentHelper.KuduServiceUtility.warmpUp();
                }
                await this.deploymentHelper.KuduServiceUtility.deployUsingRunFromZip(webPackage, 
                    { slotName: this.deploymentHelper.AzureAppService.getSlot() });
                this.updateStatus = false;
                break;

            default:
                throw new Error('Invalid App Service package or folder path provided: ' + webPackage);
        }
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean) {
        if(this.deploymentHelper.KuduServiceUtility && this.zipDeploymentID && this.deploymentHelper.ActiveDeploymentID && isDeploymentSuccess) {
            await this.deploymentHelper.KuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.deploymentHelper.ActiveDeploymentID);
        }
        await this.deploymentHelper.UpdateDeploymentStatus(isDeploymentSuccess, this.updateStatus);
    }
}