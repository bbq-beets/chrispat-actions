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
const webClient = require("../webClient");
var parseString = require('xml2js').parseString;
const Q = require("q");
const azure_app_kudu_service_1 = require("../KuduRest/azure-app-kudu-service");
class AzureAppServiceUtility {
    constructor(appService) {
        this._appService = appService;
    }
    getWebDeployPublishingProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            var publishingProfile = yield this._appService.getPublishingProfileWithSecrets();
            var defer = Q.defer();
            parseString(publishingProfile, (error, result) => {
                if (!!error) {
                    defer.reject(error);
                }
                var publishProfile = result && result.publishData && result.publishData.publishProfile ? result.publishData.publishProfile : null;
                if (publishProfile) {
                    for (var index in publishProfile) {
                        if (publishProfile[index].$ && publishProfile[index].$.publishMethod === "MSDeploy") {
                            defer.resolve(result.publishData.publishProfile[index].$);
                        }
                    }
                }
                defer.reject('ErrorNoSuchDeployingMethodExists');
            });
            return defer.promise;
        });
    }
    getApplicationURL(virtualApplication) {
        return __awaiter(this, void 0, void 0, function* () {
            let webDeployProfile = yield this.getWebDeployPublishingProfile();
            return (yield webDeployProfile.destinationAppUrl) + (virtualApplication ? "/" + virtualApplication : "");
        });
    }
    pingApplication() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var applicationUrl = yield this.getApplicationURL();
                if (!applicationUrl) {
                    console.log("Application Url not found.");
                    return;
                }
                yield AzureAppServiceUtility.pingApplication(applicationUrl);
            }
            catch (error) {
                console.log("Unable to ping App Service. Error: ${error}");
            }
        });
    }
    static pingApplication(applicationUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!applicationUrl) {
                console.log('Application Url empty.');
                return;
            }
            try {
                var webRequest = {
                    method: 'GET',
                    uri: applicationUrl
                };
                let webRequestOptions = { retriableErrorCodes: [], retriableStatusCodes: [], retryCount: 1, retryIntervalInSeconds: 5, retryRequestTimedout: true };
                var response = yield webClient.sendRequest(webRequest, webRequestOptions);
                console.log(`App Service status Code: '${response.statusCode}'. Status Message: '${response.statusMessage}'`);
            }
            catch (error) {
                console.log(`Unable to ping App Service. Error: ${error}`);
            }
        });
    }
    getKuduService() {
        return __awaiter(this, void 0, void 0, function* () {
            var publishingCredentials = yield this._appService.getPublishingCredentials();
            if (publishingCredentials.properties["scmUri"]) {
                return new azure_app_kudu_service_1.Kudu(publishingCredentials.properties["scmUri"], publishingCredentials.properties["publishingUserName"], publishingCredentials.properties["publishingPassword"]);
            }
            throw Error('KuduSCMDetailsAreEmpty');
        });
    }
    updateConfigurationSettings(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            for (var property in properties) {
                if (!!properties[property] && properties[property].value !== undefined) {
                    properties[property] = properties[property].value;
                }
            }
            console.log('UpdatingAppServiceConfigurationSettings' + JSON.stringify(properties));
            yield this._appService.patchConfiguration({ 'properties': properties });
            console.log('UpdatedAppServiceConfigurationSettings');
        });
    }
    updateAndMonitorAppSettings(addProperties, deleteProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            for (var property in addProperties) {
                if (!!addProperties[property] && addProperties[property].value !== undefined) {
                    addProperties[property] = addProperties[property].value;
                }
            }
            console.log('UpdatingAppServiceApplicationSettings', JSON.stringify(addProperties), JSON.stringify(deleteProperties));
            var isNewValueUpdated = yield this._appService.patchApplicationSettings(addProperties, deleteProperties);
            if (!isNewValueUpdated) {
                console.log('UpdatedAppServiceApplicationSettings');
                return isNewValueUpdated;
            }
            var kuduService = yield this.getKuduService();
            var noOftimesToIterate = 12;
            console.log('retrieving values from Kudu service to check if new values are updated');
            while (noOftimesToIterate > 0) {
                var kuduServiceAppSettings = yield kuduService.getAppSettings();
                var propertiesChanged = true;
                for (var property in addProperties) {
                    if (kuduServiceAppSettings[property] != addProperties[property]) {
                        console.log('New properties are not updated in Kudu service :(');
                        propertiesChanged = false;
                        break;
                    }
                }
                for (var property in deleteProperties) {
                    if (kuduServiceAppSettings[property]) {
                        console.log('Deleted properties are not reflected in Kudu service :(');
                        propertiesChanged = false;
                        break;
                    }
                }
                if (propertiesChanged) {
                    console.log('New properties are updated in Kudu service.');
                    console.log('UpdatedAppServiceApplicationSettings');
                    return isNewValueUpdated;
                }
                noOftimesToIterate -= 1;
                yield webClient.sleepFor(5);
            }
            console.log('Timing out from app settings check');
            return isNewValueUpdated;
        });
    }
}
exports.AzureAppServiceUtility = AzureAppServiceUtility;
