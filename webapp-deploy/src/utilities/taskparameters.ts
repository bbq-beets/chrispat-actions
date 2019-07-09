import * as core from '@actions/core';
import { AzureResourceFilterUtility } from "../common/AzureResourceFilterUtility";
import { AzureEndpoint } from "../common/AzureEndpoint";

export class TaskParameters {
    private _appName: string;
    private _package: string;
    private _resourceGroupName?: string;
    private _kind?: string;
    private endpoint: AzureEndpoint;

    constructor() {
        this._appName = core.getInput('appname', { required: true });
        this._package = core.getInput('package', { required: true });
        this.endpoint = AzureEndpoint.getEndpoint();
    }

    public get appName() {
        return this._appName;
    }

    public get package() {
        return this._package;
    }

    public get resourceGroupName() {
        if(!this._resourceGroupName) {
            this._getResourceDetails();
        }
        return this._resourceGroupName;
    }

    public get kind() {
        if(!this._kind) {
            this._getResourceDetails();
        }
        return this._kind;
    }

    private async _getResourceDetails() {
        let appDetails = await AzureResourceFilterUtility.getAppDetails(this.endpoint, this.appName);
        this._resourceGroupName = appDetails["resourceGroupName"];
        this._kind = appDetails["kind"];
    }
}