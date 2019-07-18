import { AzureEndpoint } from "./ArmRest/AzureEndpoint";
import { IAuthorizationHandler } from "./ArmRest/IAuthorizationHandler";
import { AzCliAuthHandler } from "./ArmRest/AzCliAuthHandler";
import { execSync, IExecSyncResult, IExecSyncOptions } from "./Utilities/utilityHelperFunctions";
import * as core from '@actions/core';
import * as Constants from './constants';

export function getHandler(): IAuthorizationHandler {
    let resultOfExec: IExecSyncResult = execSync("az", "account show --query \"id\"", { silent: true } as IExecSyncOptions);
    if(resultOfExec.code == Constants.TOOL_EXEC_CODE.SUCCESS) {
        return AzCliAuthHandler.getEndpoint(resultOfExec.stdout);
    }
    // else if(!!core.getInput("publish-profile-path")) {
    //     return PublishProfileAuthHandler.get();
    // }
    else {
        return AzureEndpoint.getEndpoint();
    }
}