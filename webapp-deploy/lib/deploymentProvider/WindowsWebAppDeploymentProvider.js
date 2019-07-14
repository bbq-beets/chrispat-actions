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
const parameterParserUtility_1 = require("../common/Utilities/parameterParserUtility");
var fs = require('fs');
var webCommonUtility = require('azurermdeploycommon/webdeployment-common/utility.js');
var deployUtility = require('azurermdeploycommon/webdeployment-common/utility.js');
var zipUtility = require('azurermdeploycommon/webdeployment-common/ziputility.js');
const removeRunFromZipAppSetting = '-WEBSITE_RUN_FROM_PACKAGE 0';
const runFromZipAppSetting = '-WEBSITE_RUN_FROM_PACKAGE 1';
class WindowsWebAppDeploymentProvider extends WebAppDeploymentProvider_1.WebAppDeploymentProvider {
    DeployWebAppStep() {
        return __awaiter(this, void 0, void 0, function* () {
            let webPackage = this.taskParams.package.getPath();
            var _isMSBuildPackage = yield this.taskParams.package.isMSBuildPackage();
            if (_isMSBuildPackage) {
                throw new Error('MsBuildPackageNotSupported' + webPackage);
            }
            let packageType = this.taskParams.package.getPackageType();
            let deploymentMethodtelemetry;
            switch (packageType) {
                case packageUtility_1.PackageType.war:
                    console.log("Initiated deployment via kudu service for webapp war package : " + webPackage);
                    deploymentMethodtelemetry = '{"deploymentMethod":"War Deploy"}';
                    console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                    yield this.kuduServiceUtility.warmpUp();
                    var warName = webCommonUtility.getFileNameFromPath(webPackage, ".war");
                    this.zipDeploymentID = yield this.kuduServiceUtility.deployUsingWarDeploy(webPackage, { slotName: this.appService.getSlot() }, warName);
                    this.updateStatus = true;
                    break;
                case packageUtility_1.PackageType.jar:
                    console.log("Initiated deployment via kudu service for webapp jar package : " + webPackage);
                    deploymentMethodtelemetry = '{"deploymentMethod":"Zip Deploy"}';
                    console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                    var updateApplicationSetting = parameterParserUtility_1.parse(removeRunFromZipAppSetting);
                    var isNewValueUpdated = yield this.appServiceUtility.updateAndMonitorAppSettings(updateApplicationSetting);
                    if (!isNewValueUpdated) {
                        yield this.kuduServiceUtility.warmpUp();
                    }
                    this.zipDeploymentID = yield this.kuduServiceUtility.deployUsingZipDeploy(webPackage);
                    this.updateStatus = true;
                    break;
                case packageUtility_1.PackageType.folder:
                    let tempPackagePath = deployUtility.generateTemporaryFolderOrZipPath(`${process.env.TEMPDIRECTORY}`, false);
                    webPackage = yield zipUtility.archiveFolder(webPackage, "", tempPackagePath);
                    console.log("Compressed folder into zip " + webPackage);
                case packageUtility_1.PackageType.zip:
                    console.log("Initiated deployment via kudu service for webapp package : " + webPackage);
                    deploymentMethodtelemetry = '{"deploymentMethod":"Run from Package"}';
                    console.log("##vso[telemetry.publish area=TaskDeploymentMethod;feature=AzureWebAppDeployment]" + deploymentMethodtelemetry);
                    var addCustomApplicationSetting = parameterParserUtility_1.parse(runFromZipAppSetting);
                    var isNewValueUpdated = yield this.appServiceUtility.updateAndMonitorAppSettings(addCustomApplicationSetting);
                    if (!isNewValueUpdated) {
                        yield this.kuduServiceUtility.warmpUp();
                    }
                    yield this.kuduServiceUtility.deployUsingRunFromZip(webPackage, { slotName: this.appService.getSlot() });
                    this.updateStatus = false;
                    break;
                default:
                    throw new Error('Invalidwebapppackageorfolderpathprovided' + webPackage);
            }
        });
    }
    UpdateDeploymentStatus(isDeploymentSuccess) {
        const _super = Object.create(null, {
            UpdateDeploymentStatus: { get: () => super.UpdateDeploymentStatus }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.kuduServiceUtility && this.zipDeploymentID && this.activeDeploymentID && isDeploymentSuccess) {
                yield this.kuduServiceUtility.postZipDeployOperation(this.zipDeploymentID, this.activeDeploymentID);
            }
            yield _super.UpdateDeploymentStatus.call(this, isDeploymentSuccess, this.updateStatus);
        });
    }
}
exports.WindowsWebAppDeploymentProvider = WindowsWebAppDeploymentProvider;
