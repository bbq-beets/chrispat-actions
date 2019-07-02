import tl = require("vsts-task-lib/task");
import * as core from '@actions/core';
import { IExecSyncResult } from 'vsts-task-lib/toolrunner';

export class deploy {
  
  public static async run() {
    try{
      this.throwIfError(tl.execSync("az", "--version"));
      let appName: string = tl.getInput('appName', true);
      let resourceGroup = tl.execSync("az", "resource list -n \"" + appName + "\" --resource-type \"Microsoft.Web/Sites\"");
      this.throwIfError(resourceGroup);
      console.log(JSON.parse(resourceGroup.stdout)[0].resourceGroup);
      //let resourceGroupName = tl.getInput('resourceGroupname', false);
      //if (!resourceGroupName) {

      //}
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

deploy.run();