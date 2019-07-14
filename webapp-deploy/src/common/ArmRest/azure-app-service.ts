import webClient = require('../webClient');
import { AzureEndpoint } from './AzureEndpoint';

import {
    ServiceClient,
    ToError
} from './AzureServiceClient';

interface AzureAppServiceConfigurationDetails {
    id: string;
    name: string;
    type: string;
    kind?: string;
    location: string;
    tags: string;
    properties?: {[key: string]: any};
}

export class AzureAppService {
    private _resourceGroup: string;
    private _name: string;
    private _slot: string;
    private _slotUrl: string;
    public _client: ServiceClient;
    private _appServiceConfigurationDetails: AzureAppServiceConfigurationDetails;
    private _appServicePublishingProfile: any;
    private _appServiceApplicationSetings: AzureAppServiceConfigurationDetails;

    constructor(endpoint: AzureEndpoint, resourceGroup: string, name: string, slot?: string, appKind?: string) {
        this._client = new ServiceClient(endpoint, 30);
        this._resourceGroup = resourceGroup;
        this._name = name;
        this._slot = (slot && slot.toLowerCase() == "production") ? null : slot;        
        this._slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
    }

    public async get(force?: boolean): Promise<AzureAppServiceConfigurationDetails> {
        if(force || !this._appServiceConfigurationDetails) {
            this._appServiceConfigurationDetails = await this._get();
        }
        
        return this._appServiceConfigurationDetails;
    }

    public async getPublishingProfileWithSecrets(force?: boolean): Promise<any>{
        if(force || !this._appServicePublishingProfile) {
            this._appServicePublishingProfile = await this._getPublishingProfileWithSecrets();
        }

        return this._appServicePublishingProfile;
    }

    public async getPublishingCredentials(): Promise<any> {
        try {            
            var httpRequest: webClient.WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/publishingcredentials/list`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToGetAppServicePublishingCredentials' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    public async getApplicationSettings(force?: boolean): Promise<AzureAppServiceConfigurationDetails> {
        if(force || !this._appServiceApplicationSetings) {
            this._appServiceApplicationSetings = await this._getApplicationSettings();
        }

        return this._appServiceApplicationSetings;
    }

    public async updateApplicationSettings(applicationSettings): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'PUT',
                body: JSON.stringify(applicationSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToUpdateAppServiceApplicationSettings' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    public async patchApplicationSettings(addProperties: any, deleteProperties?: any): Promise<boolean> {
        var applicationSettings = await this.getApplicationSettings();
        var isNewValueUpdated: boolean = false;
        for(var key in addProperties) {
            if(applicationSettings.properties[key] != addProperties[key]) {
                console.log(`Value of ${key} has been changed to ${addProperties[key]}`);
                isNewValueUpdated = true;
            }

            applicationSettings.properties[key] = addProperties[key];
        }
        for(var key in deleteProperties) {
            if(key in applicationSettings.properties) {
                delete applicationSettings.properties[key];
                console.log(`Removing app setting : ${key}`);
                isNewValueUpdated = true;
            }
        }

        if(isNewValueUpdated) {
            await this.updateApplicationSettings(applicationSettings);
        }

        return isNewValueUpdated;
    }
    
    public async syncFunctionTriggers(): Promise<any> {
        try {
            let i = 0;
            let retryCount = 5;
            let retryIntervalInSeconds = 2;
            let timeToWait: number = retryIntervalInSeconds;
            var httpRequest: webClient.WebRequest = {
                method: 'POST',                
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/syncfunctiontriggers`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            while(true) {
                var response = await this._client.beginRequest(httpRequest);
                if(response.statusCode == 200) {
                    return response.body;
                }
                else if(response.statusCode == 400) {
                    if (++i < retryCount) {
                        await webClient.sleepFor(timeToWait);
                        timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                        continue;
                    }
                    else {
                        throw ToError(response);
                    }
                }
                else {
                    throw ToError(response);
                }
            }
        }
        catch(error) {
            throw Error('FailedToSyncTriggers' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    public async getConfiguration(): Promise<AzureAppServiceConfigurationDetails> {
        try {            
            var httpRequest: webClient.WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToGetAppServiceConfiguration' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    public async updateConfiguration(applicationSettings): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'PUT',
                body: JSON.stringify(applicationSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            };
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToUpdateAppServiceConfiguration' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    public async patchConfiguration(properties: any): Promise<any> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'PATCH',
                body: JSON.stringify(properties),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToPatchAppServiceConfiguration' + this._getFormattedName() + this._client.getFormattedError(error));
        }

    }

    public async getMetadata(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'POST',                
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata/list`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToGetAppServiceMetadata'+ this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    public async updateMetadata(applicationSettings): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'PUT',
                body: JSON.stringify(applicationSettings),           
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToUpdateAppServiceMetadata' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }
    
    public async patchMetadata(properties): Promise<void> {
        var applicationSettings = await this.getMetadata();
        for(var key in properties) {
            applicationSettings.properties[key] = properties[key];
        }

        await this.updateMetadata(applicationSettings);
    }
    
    public getSlot(): string {
        return this._slot ? this._slot : "production";
    }
    
    private async _getPublishingProfileWithSecrets(): Promise<any> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'POST',                
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/publishxml`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            var publishingProfile = response.body;
            return publishingProfile;
        }
        catch(error) {
            throw Error('FailedToGetAppServicePublishingProfile' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    private async _getApplicationSettings(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'POST',                
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings/list`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error('FailedToGetAppServiceApplicationSettings' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    private async _get(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: webClient.WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            var appDetails = response.body;
            return appDetails as AzureAppServiceConfigurationDetails;
        }
        catch(error) {
            throw Error('FailedToGetAppServiceDetails' + this._getFormattedName() + this._client.getFormattedError(error));
        }
    }

    private _getFormattedName(): string {
        return this._slot ? `${this._name}-${this._slot}` : this._name;
    }

    public getName(): string {
        return this._name;
    }
 }