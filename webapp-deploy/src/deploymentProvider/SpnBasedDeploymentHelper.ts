import { IWebAppDeploymentHelper } from './IWebAppDeploymentHelper';
import { TaskParameters } from '../taskparameters';
import { KuduServiceUtility } from '../common/RestUtilities/KuduServiceUtility';
import { AzureAppService } from '../common/ArmRest/azure-app-service';
import { Kudu } from '../common/KuduRest/azure-app-kudu-service';
import { AzureAppServiceUtility } from '../common/RestUtilities/AzureAppServiceUtility';
import { addAnnotation } from '../common/RestUtilities/AnnotationUtility';
import * as core from '@actions/core';

export class SpnBasedDeploymentHelper implements IWebAppDeploymentHelper {
    private taskParams:TaskParameters;
    private appService: AzureAppService;
    private kuduService: Kudu;
    private appServiceUtility: AzureAppServiceUtility;
    private kuduServiceUtility: KuduServiceUtility;
    private activeDeploymentID;

    constructor() {
        this.taskParams = TaskParameters.getTaskParams();
    }

    public get AzureAppServiceUtility() {
         return this.appServiceUtility;
    }
    public get AzureAppService() {
        return this.appService;
    }

    public get KuduServiceUtility(): KuduServiceUtility {
        return this.kuduServiceUtility;
    }

    public get TaskParams(): TaskParameters {
        return this.taskParams;
    }

    public get ActiveDeploymentID() {
         return this.activeDeploymentID;
    }

    public async PreDeploymentStep() {
        this.appService = new AzureAppService(this.taskParams.endpoint, this.taskParams.resourceGroupName, this.taskParams.appName);
        this.appServiceUtility = new AzureAppServiceUtility(this.appService);
        
        this.kuduService = await this.appServiceUtility.getKuduService();
        this.kuduServiceUtility = new KuduServiceUtility(this.kuduService);
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean) {
        if(this.kuduServiceUtility) {
            await addAnnotation(this.taskParams.endpoint, this.appService, isDeploymentSuccess);
            if(!!updateStatus && updateStatus == true) {
                this.activeDeploymentID = await this.kuduServiceUtility.updateDeploymentStatus(isDeploymentSuccess, null, {'type': 'Deployment', slotName: this.appService.getSlot()});
                core.debug('Active DeploymentId :'+ this.activeDeploymentID);
            }
        }
        
        let appServiceApplicationUrl: string = await this.appServiceUtility.getApplicationURL();
        console.log('App Service Application URL: ' + appServiceApplicationUrl);
        core.exportVariable('AppServiceApplicationUrl', appServiceApplicationUrl);
    }
}