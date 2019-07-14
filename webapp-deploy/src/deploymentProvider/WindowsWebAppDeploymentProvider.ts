import { WebAppDeploymentProvider } from "./WebAppDeploymentProvider";
import { PackageType } from "../common/Utilities/packageUtility";
import { parse } from "../common/Utilities/parameterParserUtility";
var fs = require('fs');

var webCommonUtility = require('azurermdeploycommon/webdeployment-common/utility.js');
var deployUtility = require('azurermdeploycommon/webdeployment-common/utility.js');
var zipUtility = require('azurermdeploycommon/webdeployment-common/ziputility.js');

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
                console.log("Initiated deployment via kudu service for webapp war package : "+ webPackage);        
                deploymentMethodtelemetry = '{"deploymentMethod":"War Deploy"}';
                console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                await this.kuduServiceUtility.warmpUp();
                var warName = webCommonUtility.getFileNameFromPath(webPackage, ".war");
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingWarDeploy(webPackage, 
                    { slotName: this.appService.getSlot() }, warName);
                this.updateStatus = true;
                break;

            case PackageType.jar:
                console.log("Initiated deployment via kudu service for webapp jar package : "+ webPackage);    
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
                let tempPackagePath = deployUtility.generateTemporaryFolderOrZipPath(`${process.env.TEMPDIRECTORY}`, false);
                webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath);
                console.log("Compressed folder into zip " +  webPackage);
                
            case PackageType.zip:
                console.log("Initiated deployment via kudu service for webapp package : "+ webPackage);    
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
                throw new Error('Invalidwebapppackageorfolderpathprovided' + webPackage);
        }
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean) {
        if(this.kuduServiceUtility && this.zipDeploymentID && this.activeDeploymentID && isDeploymentSuccess) {
            await this.kuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.activeDeploymentID);
        }
        await super.UpdateDeploymentStatus(isDeploymentSuccess, this.updateStatus);
    }
}