import * as core from '@actions/core';
import { AzureResourceFilterUtility } from "./common/RestUtilities/AzureResourceFilterUtility";
import { AzureEndpoint } from "./common/ArmRest/AzureEndpoint";
import { Package } from './common/Utilities/packageUtility';

export class TaskParameters {
    private _appName: string;
    private _package: Package;
    private _resourceGroupName?: string;
    private _kind?: string;
    private _endpoint: AzureEndpoint;

    constructor() {
        this._appName = core.getInput('app-name', { required: true });
        this._package = new Package(core.getInput('package', { required: true }));
        this._endpoint = AzureEndpoint.getEndpoint();
    }

    public get appName() {
        return this._appName;
    }

    public get package() {
        return this._package;
    }

    public get resourceGroupName() {
        return this._resourceGroupName;
    }

    public get kind() {
        return this._kind;
    }

    public get endpoint() {
        return this._endpoint;
    }

    public async getResourceDetails() {
        let appDetails = await AzureResourceFilterUtility.getAppDetails(this.endpoint, this.appName);
        this._resourceGroupName = appDetails["resourceGroupName"];
        this._kind = appDetails["kind"];
    }
}