import { IWebAppDeploymentProvider } from './IWebAppDeploymentProvider';
import { PackageType } from '../common/Utilities/packageUtility';
import * as utility from '../common/Utilities/utility.js';
import * as zipUtility from '../common/Utilities/ziputility.js';
import * as core from '@actions/core';
import { IWebAppDeploymentHelper } from './IWebAppDeploymentHelper';
import { TaskParameters } from '../taskparameters';

export class LinuxWebAppDeploymentProvider implements IWebAppDeploymentProvider {
    private zipDeploymentID: string;
    private deploymentHelper: IWebAppDeploymentHelper;

    constructor(deplHelper: IWebAppDeploymentHelper){
        this.deploymentHelper = deplHelper;
    }

    public PreDeploymentStep() {
        this.deploymentHelper.PreDeploymentStep();
    }

    public async DeployWebAppStep() {
        let packageType = TaskParameters.getTaskParams().package.getPackageType();
        let deploymentMethodtelemetry = packageType === PackageType.war ? '{"deploymentMethod":"War Deploy"}' : '{"deploymentMethod":"Zip Deploy"}';
        console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
        
        core.debug('Performing Linux web app deployment');
        
        let packagePath = TaskParameters.getTaskParams().package.getPath();
        await this.deploymentHelper.KuduServiceUtility.warmpUp();
        
        switch(packageType){
            case PackageType.folder:
                let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMPDIRECTORY}`, false);
                let archivedWebPackage = await zipUtility.archiveFolder(packagePath, "", tempPackagePath) as string;
                core.debug("Compressed folder into zip " +  archivedWebPackage);
                this.zipDeploymentID = await this.deploymentHelper.KuduServiceUtility.deployUsingZipDeploy(archivedWebPackage);
            break;

            case PackageType.zip:
                this.zipDeploymentID = await this.deploymentHelper.KuduServiceUtility.deployUsingZipDeploy(packagePath);
            break;

            case PackageType.jar:
                core.debug("Initiated deployment via kudu service for webapp jar package : "+ packagePath);
                let folderPath = await utility.generateTemporaryFolderForDeployment(false, packagePath, PackageType.jar);
                let output = await utility.archiveFolderForDeployment(false, folderPath);
                let webPackage = output.webDeployPkg;
                core.debug("Initiated deployment via kudu service for webapp jar package : "+ webPackage);
                this.zipDeploymentID = await this.deploymentHelper.KuduServiceUtility.deployUsingZipDeploy(webPackage);
            break;

            case PackageType.war:
                core.debug("Initiated deployment via kudu service for webapp war package : "+ packagePath);
                let warName = utility.getFileNameFromPath(packagePath, ".war");
                // Todo: pass slotName: this.appService.getSlot()  in customMessage
                this.zipDeploymentID = await this.deploymentHelper.KuduServiceUtility.deployUsingWarDeploy(packagePath, 
                { }, warName);
            break;

            default:
                throw new Error('Invalid App Service package or folder path provided: ' + packagePath);
        }
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean) {
        if(this.deploymentHelper.KuduServiceUtility) {
            if(this.zipDeploymentID && this.deploymentHelper.ActiveDeploymentID && isDeploymentSuccess) {
                await this.deploymentHelper.KuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.deploymentHelper.ActiveDeploymentID);
            }
            
            await this.deploymentHelper.UpdateDeploymentStatus(isDeploymentSuccess, true);
        }
    }
}