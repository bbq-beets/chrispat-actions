import { TaskParameters } from "../taskparameters";
import { KuduServiceUtility } from "../common/RestUtilities/KuduServiceUtility";
import { AzureAppServiceUtility } from "../common/RestUtilities/AzureAppServiceUtility";
import { AzureAppService } from "../common/ArmRest/azure-app-service";

export interface IWebAppDeploymentHelper {
    KuduServiceUtility: KuduServiceUtility;
    ActiveDeploymentID: string;
    PreDeploymentStep();
    UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean);
    AzureAppServiceUtility?: AzureAppServiceUtility;
    AzureAppService?: AzureAppService;
}