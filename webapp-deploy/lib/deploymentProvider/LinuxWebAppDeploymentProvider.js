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
const WebAppDeploymentProvider_1 = require("./WebAppDeploymentProvider");
const packageUtility_1 = require("../common/Utilities/packageUtility");
var webCommonUtility = require('azurermdeploycommon/webdeployment-common/utility.js');
var deployUtility = require('azurermdeploycommon/webdeployment-common/utility.js');
var zipUtility = require('azurermdeploycommon/webdeployment-common/ziputility.js');
class LinuxWebAppDeploymentProvider extends WebAppDeploymentProvider_1.WebAppDeploymentProvider {
    DeployWebAppStep() {
        return __awaiter(this, void 0, void 0, function* () {
            let packageType = this.taskParams.package.getPackageType();
            let deploymentMethodtelemetry = packageType === packageUtility_1.PackageType.war ? '{"deploymentMethod":"War Deploy"}' : '{"deploymentMethod":"Zip Deploy"}';
            console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
            console.log('Performing Linux web app deployment');
            yield this.kuduServiceUtility.warmpUp();
            switch (packageType) {
                case packageUtility_1.PackageType.folder:
                    let tempPackagePath = deployUtility.generateTemporaryFolderOrZipPath(`${process.env.TEMPDIRECTORY}`, false);
                    let archivedWebPackage = yield zipUtility.archiveFolder(this.taskParams.package.getPath(), "", tempPackagePath);
                    console.log("Compressed folder into zip " + archivedWebPackage);
                    this.zipDeploymentID = yield this.kuduServiceUtility.deployUsingZipDeploy(archivedWebPackage);
                    break;
                case packageUtility_1.PackageType.zip:
                    this.zipDeploymentID = yield this.kuduServiceUtility.deployUsingZipDeploy(this.taskParams.package.getPath());
                    break;
                case packageUtility_1.PackageType.jar:
                    console.log("Initiated deployment via kudu service for webapp jar package : " + this.taskParams.package.getPath());
                    let folderPath = yield webCommonUtility.generateTemporaryFolderForDeployment(false, this.taskParams.package.getPath(), packageUtility_1.PackageType.jar);
                    let output = yield webCommonUtility.archiveFolderForDeployment(false, folderPath);
                    let webPackage = output.webDeployPkg;
                    console.log("Initiated deployment via kudu service for webapp jar package : " + webPackage);
                    this.zipDeploymentID = yield this.kuduServiceUtility.deployUsingZipDeploy(webPackage);
                    break;
                case packageUtility_1.PackageType.war:
                    console.log("Initiated deployment via kudu service for webapp war package : " + this.taskParams.package.getPath());
                    let warName = webCommonUtility.getFileNameFromPath(this.taskParams.package.getPath(), ".war");
                    this.zipDeploymentID = yield this.kuduServiceUtility.deployUsingWarDeploy(this.taskParams.package.getPath(), { slotName: this.appService.getSlot() }, warName);
                    break;
                default:
                    throw new Error('Invalidwebapppackageorfolderpathprovided' + this.taskParams.package.getPath());
            }
        });
    }
    UpdateDeploymentStatus(isDeploymentSuccess) {
        const _super = Object.create(null, {
            UpdateDeploymentStatus: { get: () => super.UpdateDeploymentStatus }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.kuduServiceUtility) {
                if (this.zipDeploymentID && this.activeDeploymentID && isDeploymentSuccess) {
                    yield this.kuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.activeDeploymentID);
                }
                yield _super.UpdateDeploymentStatus.call(this, isDeploymentSuccess, true);
            }
        });
    }
}
exports.LinuxWebAppDeploymentProvider = LinuxWebAppDeploymentProvider;
