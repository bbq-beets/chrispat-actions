import { TaskParameters } from "../taskparameters";
import { IWebAppDeploymentProvider } from "./IWebAppDeploymentProvider";
import { LinuxWebAppDeploymentProvider } from "./LinuxWebAppDeploymentProvider";
import { WindowsWebAppDeploymentProvider } from "./WindowsWebAppDeploymentProvider";
import { DeploymentHelperFactory, DeploymentHelperConstants } from "./DeploymentHelperFactory";

export class DeploymentFactory {

    public static GetDeploymentProvider(): IWebAppDeploymentProvider {
        let type: DeploymentHelperConstants = TaskParameters.getTaskParams().endpoint ? DeploymentHelperConstants.SPN : DeploymentHelperConstants.PublishProfile;
        let deploymentHelper = DeploymentHelperFactory.getHelper(type);
        if(TaskParameters.getTaskParams().kind.indexOf("linux") == -1) {
            console.log("Deployment started for windows app service");
            return new WindowsWebAppDeploymentProvider(deploymentHelper);
        } else {
            console.log("Deployment started for linux app service");
            return new LinuxWebAppDeploymentProvider(deploymentHelper);
        }
    }
}