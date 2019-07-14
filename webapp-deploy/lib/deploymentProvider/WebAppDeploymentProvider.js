"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const KuduServiceUtility_1 = require("../common/RestUtilities/KuduServiceUtility");
const azure_app_service_1 = require("../common/ArmRest/azure-app-service");
const AzureAppServiceUtility_1 = require("../common/RestUtilities/AzureAppServiceUtility");
const tl = require("azure-pipelines-task-lib/task");
const AnnotationUtility_1 = require("../common/RestUtilities/AnnotationUtility");
class WebAppDeploymentProvider {
    constructor(taskParams) {
        this.taskParams = taskParams;
    }
    PreDeploymentStep() {
        return __awaiter(this, void 0, void 0, function* () {
            this.appService = new azure_app_service_1.AzureAppService(this.taskParams.endpoint, this.taskParams.resourceGroupName, this.taskParams.appName);
            this.appServiceUtility = new AzureAppServiceUtility_1.AzureAppServiceUtility(this.appService);
            this.kuduService = yield this.appServiceUtility.getKuduService();
            this.kuduServiceUtility = new KuduServiceUtility_1.KuduServiceUtility(this.kuduService);
        });
    }
    DeployWebAppStep() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    UpdateDeploymentStatus(isDeploymentSuccess, updateStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.kuduServiceUtility) {
                yield AnnotationUtility_1.addAnnotation(this.taskParams.endpoint, this.appService, isDeploymentSuccess);
                if (updateStatus) {
                    this.activeDeploymentID = yield this.kuduServiceUtility.updateDeploymentStatus(isDeploymentSuccess, null, { 'type': 'Deployment', slotName: this.appService.getSlot() });
                    tl.debug('Active DeploymentId :' + this.activeDeploymentID);
                }
            }
            let appServiceApplicationUrl = yield this.appServiceUtility.getApplicationURL();
            console.log(tl.loc('AppServiceApplicationURL', appServiceApplicationUrl));
            tl.setVariable('AppServiceApplicationUrl', appServiceApplicationUrl);
        });
    }
}
exports.WebAppDeploymentProvider = WebAppDeploymentProvider;
