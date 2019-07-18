import { PublishProfileBasedDeploymentHelper } from "./PublishProfileBasedDeploymentHelper";
import { TaskParameters } from "../taskparameters";
import { SpnBasedDeploymentHelper } from "./SpnBasedDeploymentHelper";
import { IWebAppDeploymentHelper } from "./IWebAppDeploymentHelper";

export class DeploymentHelperFactory {
    public static getHelper(type: DeploymentHelperConstants): IWebAppDeploymentHelper {
        switch (type)
        {
            case DeploymentHelperConstants.SPN :
            {
                return new SpnBasedDeploymentHelper()
            }

            case DeploymentHelperConstants.PublishProfile :
            {
                return new PublishProfileBasedDeploymentHelper()
            }

            default :
            {
                throw new Error("invalid type");
            }

        }
    }
}

export enum DeploymentHelperConstants
{
    SPN,
    PublishProfile
}