import { TaskParameters } from "../taskparameters";
import { IWebAppDeploymentProvider } from "./IWebAppDeploymentProvider";
import { LinuxWebAppDeploymentProvider } from "./LinuxWebAppDeploymentProvider";
import { WindowsWebAppDeploymentProvider } from "./WindowsWebAppDeploymentProvider";

export class DeploymentFactory {

    private _taskParams: TaskParameters;

    constructor(taskParams: TaskParameters) {
        this._taskParams = taskParams;
    }

    public async GetDeploymentProvider(): Promise<IWebAppDeploymentProvider> {
        if(this._taskParams.kind.indexOf("linux") == -1) {
            console.log("Deployment started for windows app service");
            return new WindowsWebAppDeploymentProvider(this._taskParams);
        } else {
            console.log("Deployment started for linux app service");
            return new LinuxWebAppDeploymentProvider(this._taskParams);
        }
    }
}