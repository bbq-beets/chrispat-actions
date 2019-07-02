import tl = require("vsts-task-lib/task");
import * as core from '@actions/core';
import { IExecSyncResult } from 'vsts-task-lib/toolrunner';

export class login {
  
  public static async run() {
    try{
      this.throwIfError(tl.execSync("az", "--version"));
      let servicePrincipalId: string = tl.getInput('azureServicePrincipalId', true);
      let servicePrincipalKey: string = tl.getInput('azureServicePrincipalKey', true);
      let tenantId: string = tl.getInput('azureServiceTenantId', true);
      let subscription: string = tl.getInput('azureSubscription', true);
      this.throwIfError(tl.execSync("az", "login --service-principal -u \"" + servicePrincipalId + "\" -p \"" + servicePrincipalKey + "\" --tenant \"" + tenantId + "\""));
      this.throwIfError(tl.execSync("az", "account set --subscription \"" + subscription + "\""));
    } catch (error) {
      core.setFailed(error.message);
    }
  }

  private static throwIfError(resultOfToolExecution: IExecSyncResult, errormsg?: string): void {
    if (resultOfToolExecution.code != 0) {
        tl.error("Error Code: [" + resultOfToolExecution.code + "]");
        if (errormsg) {
            tl.error("Error: " + errormsg);
        }
        throw resultOfToolExecution;
    }
  }
}

login.run();