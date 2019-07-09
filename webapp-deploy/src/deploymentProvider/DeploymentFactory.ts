import { TaskParameters } from '../utilities/taskparameters';
// import { BuiltInLinuxWebAppDeploymentProvider } from './BuiltInLinuxWebAppDeploymentProvider';
// import { IWebAppDeploymentProvider } from './IWebAppDeploymentProvider';
// import { WindowsWebAppZipDeployProvider } from './WindowsWebAppZipDeployProvider';
// import { WindowsWebAppRunFromZipProvider } from './WindowsWebAppRunFromZipProvider';
// import { PackageType } from 'azurermdeploycommon/webdeployment-common/packageUtility';
// import { WindowsWebAppWarDeployProvider } from './WindowsWebAppWarDeployProvider';

export class DeploymentFactory {

    private _taskParams: TaskParameters;

    constructor(taskParams: TaskParameters) {
        this._taskParams = taskParams;
    }

    public GetDeploymentProvider() {
        console.log("In deploymet Factory");
        // if(this._taskParams.isLinuxApp) {
        //     tl.debug("Deployment started for linux app service");
        //     return new BuiltInLinuxWebAppDeploymentProvider(this._taskParams);
        // } else {
        //     tl.debug("Deployment started for windows app service");
        //     return await this._getWindowsDeploymentProvider()
        // }
    }

    //private async _getWindowsDeploymentProvider(): Promise<IWebAppDeploymentProvider> {
        // tl.debug("Package type of deployment is: "+ this._taskParams.Package.getPackageType());
        // switch(this._taskParams.Package.getPackageType()){
        //     case PackageType.war:
        //         return new WindowsWebAppWarDeployProvider(this._taskParams);
        //     case PackageType.jar:
        //         return new WindowsWebAppZipDeployProvider(this._taskParams);
        //     default:
        //         var _isMSBuildPackage = await this._taskParams.Package.isMSBuildPackage();           
        //         if(_isMSBuildPackage) {
        //             throw new Error(tl.loc('MsBuildPackageNotSupported', this._taskParams.Package.getPath()));
        //         } else { 
        //             return new WindowsWebAppRunFromZipProvider(this._taskParams);
        //         }
        // }
    //}
}
