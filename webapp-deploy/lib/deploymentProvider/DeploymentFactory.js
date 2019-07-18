"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const taskparameters_1 = require("../taskparameters");
const LinuxWebAppDeploymentProvider_1 = require("./LinuxWebAppDeploymentProvider");
const WindowsWebAppDeploymentProvider_1 = require("./WindowsWebAppDeploymentProvider");
const DeploymentHelperFactory_1 = require("./DeploymentHelperFactory");
class DeploymentFactory {
    static GetDeploymentProvider() {
        let type = taskparameters_1.TaskParameters.getTaskParams().endpoint ? DeploymentHelperFactory_1.DeploymentHelperConstants.SPN : DeploymentHelperFactory_1.DeploymentHelperConstants.PublishProfile;
        let deploymentHelper = DeploymentHelperFactory_1.DeploymentHelperFactory.getHelper(type);
        if (taskparameters_1.TaskParameters.getTaskParams().kind.indexOf("linux") == -1) {
            console.log("Deployment started for windows app service");
            return new WindowsWebAppDeploymentProvider_1.WindowsWebAppDeploymentProvider(deploymentHelper);
        }
        else {
            console.log("Deployment started for linux app service");
            return new LinuxWebAppDeploymentProvider_1.LinuxWebAppDeploymentProvider(deploymentHelper);
        }
    }
}
exports.DeploymentFactory = DeploymentFactory;
