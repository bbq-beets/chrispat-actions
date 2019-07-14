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
const AzureServiceClient_1 = require("./AzureServiceClient");
class AzureAppService {
    constructor(endpoint, resourceGroup, name, slot, appKind) {
        this._client = new AzureServiceClient_1.ServiceClient(endpoint, 30);
        this._resourceGroup = resourceGroup;
        this._name = name;
        this._slot = (slot && slot.toLowerCase() == "production") ? null : slot;
        this._slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
    }
    get(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServiceConfigurationDetails) {
                this._appServiceConfigurationDetails = yield this._get();
            }
            return this._appServiceConfigurationDetails;
        });
    }
    getPublishingProfileWithSecrets(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServicePublishingProfile) {
                this._appServicePublishingProfile = yield this._getPublishingProfileWithSecrets();
            }
            return this._appServicePublishingProfile;
        });
    }
    getPublishingCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/publishingcredentials/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToGetAppServicePublishingCredentials' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    getApplicationSettings(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !this._appServiceApplicationSetings) {
                this._appServiceApplicationSetings = yield this._getApplicationSettings();
            }
            return this._appServiceApplicationSetings;
        });
    }
    updateApplicationSettings(applicationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(applicationSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToUpdateAppServiceApplicationSettings' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    patchApplicationSettings(addProperties, deleteProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            var applicationSettings = yield this.getApplicationSettings();
            var isNewValueUpdated = false;
            for (var key in addProperties) {
                if (applicationSettings.properties[key] != addProperties[key]) {
                    console.log(`Value of ${key} has been changed to ${addProperties[key]}`);
                    isNewValueUpdated = true;
                }
                applicationSettings.properties[key] = addProperties[key];
            }
            for (var key in deleteProperties) {
                if (key in applicationSettings.properties) {
                    delete applicationSettings.properties[key];
                    console.log(`Removing app setting : ${key}`);
                    isNewValueUpdated = true;
                }
            }
            if (isNewValueUpdated) {
                yield this.updateApplicationSettings(applicationSettings);
            }
            return isNewValueUpdated;
        });
    }
    syncFunctionTriggers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let i = 0;
                let retryCount = 5;
                let retryIntervalInSeconds = 2;
                let timeToWait = retryIntervalInSeconds;
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/syncfunctiontriggers`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                while (true) {
                    var response = yield this._client.beginRequest(httpRequest);
                    if (response.statusCode == 200) {
                        return response.body;
                    }
                    else if (response.statusCode == 400) {
                        if (++i < retryCount) {
                            yield webClient.sleepFor(timeToWait);
                            timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                            continue;
                        }
                        else {
                            throw AzureServiceClient_1.ToError(response);
                        }
                    }
                    else {
                        throw AzureServiceClient_1.ToError(response);
                    }
                }
            }
            catch (error) {
                throw Error('FailedToSyncTriggers' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    getConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToGetAppServiceConfiguration' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    updateConfiguration(applicationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(applicationSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToUpdateAppServiceConfiguration' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    patchConfiguration(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PATCH',
                    body: JSON.stringify(properties),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToPatchAppServiceConfiguration' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    getMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToGetAppServiceMetadata' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    updateMetadata(applicationSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'PUT',
                    body: JSON.stringify(applicationSettings),
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToUpdateAppServiceMetadata' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    patchMetadata(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            var applicationSettings = yield this.getMetadata();
            for (var key in properties) {
                applicationSettings.properties[key] = properties[key];
            }
            yield this.updateMetadata(applicationSettings);
        });
    }
    getSlot() {
        return this._slot ? this._slot : "production";
    }
    _getPublishingProfileWithSecrets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/publishxml`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                var publishingProfile = response.body;
                return publishingProfile;
            }
            catch (error) {
                throw Error('FailedToGetAppServicePublishingProfile' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    _getApplicationSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'POST',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings/list`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                return response.body;
            }
            catch (error) {
                throw Error('FailedToGetAppServiceApplicationSettings' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    _get() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}`, {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
                };
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode != 200) {
                    throw AzureServiceClient_1.ToError(response);
                }
                var appDetails = response.body;
                return appDetails;
            }
            catch (error) {
                throw Error('FailedToGetAppServiceDetails' + this._getFormattedName() + this._client.getFormattedError(error));
            }
        });
    }
    _getFormattedName() {
        return this._slot ? `${this._name}-${this._slot}` : this._name;
    }
    getName() {
        return this._name;
    }
}
exports.AzureAppService = AzureAppService;
