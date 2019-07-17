import { WebAppDeploymentProvider } from "./WebAppDeploymentProvider";
import { PackageType } from "../common/Utilities/packageUtility";
import { parse } from "../common/Utilities/parameterParserUtility";
import * as utility from '../common/Utilities/utility.js';
import * as zipUtility from '../common/Utilities/ziputility.js';
import * as core from '@actions/core';

const removeRunFromZipAppSetting: string = '-WEBSITE_RUN_FROM_PACKAGE 0';
const runFromZipAppSetting: string = '-WEBSITE_RUN_FROM_PACKAGE 1';

export class WindowsWebAppDeploymentProvider extends WebAppDeploymentProvider {
    private zipDeploymentID: string;
    private updateStatus: boolean;

    public async DeployWebAppStep() {
        let webPackage = this.taskParams.package.getPath();
        var _isMSBuildPackage = await this.taskParams.package.isMSBuildPackage();           
        if(_isMSBuildPackage) {
            throw new Error('MsBuildPackageNotSupported' + webPackage);
        } 
        let packageType = this.taskParams.package.getPackageType();
        let deploymentMethodtelemetry: string;
        
        switch(packageType){
            case PackageType.war:
                core.debug("Initiated deployment via kudu service for webapp war package : "+ webPackage);        
                deploymentMethodtelemetry = '{"deploymentMethod":"War Deploy"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                await this.kuduServiceUtility.warmpUp();
                var warName = utility.getFileNameFromPath(webPackage, ".war");
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingWarDeploy(webPackage, 
                    { slotName: this.appService.getSlot() }, warName);
                this.updateStatus = true;
                break;

            case PackageType.jar:
                core.debug("Initiated deployment via kudu service for webapp jar package : "+ webPackage);    
                deploymentMethodtelemetry = '{"deploymentMethod":"Zip Deploy"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                var updateApplicationSetting = parse(removeRunFromZipAppSetting)
                var isNewValueUpdated: boolean = await this.appServiceUtility.updateAndMonitorAppSettings(updateApplicationSetting);
                if(!isNewValueUpdated) {
                    await this.kuduServiceUtility.warmpUp();
                }
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingZipDeploy(webPackage);
                this.updateStatus = true;
                break;

            case PackageType.folder:
                let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.TEMPDIRECTORY}`, false);
                webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;
                core.debug("Compressed folder into zip " +  webPackage);
                
            case PackageType.zip:
                core.debug("Initiated deployment via kudu service for webapp package : "+ webPackage);    
                deploymentMethodtelemetry = '{"deploymentMethod":"Run from Package"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                var addCustomApplicationSetting = parse(runFromZipAppSetting);
                var isNewValueUpdated: boolean = await this.appServiceUtility.updateAndMonitorAppSettings(addCustomApplicationSetting);
                if(!isNewValueUpdated) {
                    await this.kuduServiceUtility.warmpUp();
                }
                await this.kuduServiceUtility.deployUsingRunFromZip(webPackage, 
                    { slotName: this.appService.getSlot() });
                this.updateStatus = false;
                break;

            default:
                throw new Error('Invalid App Service package or folder path provided: ' + webPackage);
        }
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean) {
        if(this.kuduServiceUtility && this.zipDeploymentID && this.activeDeploymentID && isDeploymentSuccess) {
            await this.kuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.activeDeploymentID);
        }
        await super.UpdateDeploymentStatus(isDeploymentSuccess, this.updateStatus);
    }
}