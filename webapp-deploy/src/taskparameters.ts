import * as core from '@actions/core';
import { AzureResourceFilterUtility } from "./common/RestUtilities/AzureResourceFilterUtility";
import { IAuthorizationHandler } from "./common/ArmRest/IAuthorizationHandler";
import { Package, exist } from './common/Utilities/packageUtility';
import { getHandler } from './common/AuthorizationHandlerFactory';

export class TaskParameters {
    private static taskparams: TaskParameters;
    private _appName?: string;
    private _package: Package;
    private _resourceGroupName?: string;
    private _kind?: string;
    private _endpoint: IAuthorizationHandler;
    private _publishProfilePath: string;

    private constructor() {
        this._publishProfilePath = core.getInput('publish-profile-path');
        this._package = new Package(core.getInput('package', { required: true }));
        if(!exist(this._publishProfilePath)) {
            this._endpoint = getHandler();
            this._appName = core.getInput('app-name', {required: true});
        }
    }

    public static getTaskParams() {
        if(!this.taskparams) {
            this.taskparams = new TaskParameters();
        }
        return this.taskparams;
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

    public get publishProfilePath() {
        return this._publishProfilePath;
    }

    public async getResourceDetails() {
        let appDetails = await AzureResourceFilterUtility.getAppDetails(this.endpoint, this.appName);
        this._resourceGroupName = appDetails["resourceGroupName"];
        this._kind = appDetails["kind"];
    }
}