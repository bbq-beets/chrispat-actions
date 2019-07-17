import { WebAppDeploymentProvider } from './WebAppDeploymentProvider';
import { PackageType } from '../common/Utilities/packageUtility';
import * as utility from '../common/Utilities/utility.js';
import * as zipUtility from '../common/Utilities/ziputility.js';
import * as core from '@actions/core';

export class LinuxWebAppDeploymentProvider extends WebAppDeploymentProvider {
    private zipDeploymentID: string;

    public async DeployWebAppStep() {
        let packageType = this.taskParams.package.getPackageType();
        let deploymentMethodtelemetry = packageType === PackageType.war ? '{"deploymentMethod":"War Deploy"}' : '{"deploymentMethod":"Zip Deploy"}';
        console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
        
        core.debug('Performing Linux web app deployment');
        
        await this.kuduServiceUtility.warmpUp();
        
        switch(packageType){
            case PackageType.folder:
                let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.TEMPDIRECTORY}`, false);
                let archivedWebPackage = await zipUtility.archiveFolder(this.taskParams.package.getPath(), "", tempPackagePath) as string;
                core.debug("Compressed folder into zip " +  archivedWebPackage);
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingZipDeploy(archivedWebPackage);
            break;

            case PackageType.zip:
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingZipDeploy(this.taskParams.package.getPath());
            break;

            case PackageType.jar:
                core.debug("Initiated deployment via kudu service for webapp jar package : "+ this.taskParams.package.getPath());
                let folderPath = await utility.generateTemporaryFolderForDeployment(false, this.taskParams.package.getPath(), PackageType.jar);
                let output = await utility.archiveFolderForDeployment(false, folderPath);
                let webPackage = output.webDeployPkg;
                core.debug("Initiated deployment via kudu service for webapp jar package : "+ webPackage);
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingZipDeploy(webPackage);
            break;

            case PackageType.war:
                core.debug("Initiated deployment via kudu service for webapp war package : "+ this.taskParams.package.getPath());
                let warName = utility.getFileNameFromPath(this.taskParams.package.getPath(), ".war");
                this.zipDeploymentID = await this.kuduServiceUtility.deployUsingWarDeploy(this.taskParams.package.getPath(), 
                { slotName: this.appService.getSlot() }, warName);
            break;

            default:
                throw new Error('Invalid App Service package or folder path provided: ' + this.taskParams.package.getPath());
        }
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean) {
        if(this.kuduServiceUtility) {
            if(this.zipDeploymentID && this.activeDeploymentID && isDeploymentSuccess) {
                await this.kuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.activeDeploymentID);
            }
            
            await super.UpdateDeploymentStatus(isDeploymentSuccess, true);
        }
    }
}