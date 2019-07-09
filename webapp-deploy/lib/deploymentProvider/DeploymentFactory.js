"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { BuiltInLinuxWebAppDeploymentProvider } from './BuiltInLinuxWebAppDeploymentProvider';
// import { IWebAppDeploymentProvider } from './IWebAppDeploymentProvider';
// import { WindowsWebAppZipDeployProvider } from './WindowsWebAppZipDeployProvider';
// import { WindowsWebAppRunFromZipProvider } from './WindowsWebAppRunFromZipProvider';
// import { PackageType } from 'azurermdeploycommon/webdeployment-common/packageUtility';
// import { WindowsWebAppWarDeployProvider } from './WindowsWebAppWarDeployProvider';
class DeploymentFactory {
    constructor(taskParams) {
        this._taskParams = taskParams;
    }
    GetDeploymentProvider() {
        console.log("In deploymet Factory");
        // if(this._taskParams.isLinuxApp) {
        //     tl.debug("Deployment started for linux app service");
        //     return new BuiltInLinuxWebAppDeploymentProvider(this._taskParams);
        // } else {
        //     tl.debug("Deployment started for windows app service");
        //     return await this._getWindowsDeploymentProvider()
        // }
    }
}
exports.DeploymentFactory = DeploymentFactory;
