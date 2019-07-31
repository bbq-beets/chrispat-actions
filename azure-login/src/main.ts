import * as core from '@actions/core';
import { execSync, IExecSyncResult } from './utility';

async function main() {
    try{
      throwIfError(execSync("az", "--version"));
      let creds = core.getInput('creds', { required: true });
      let credsObject;
      try {
          credsObject = JSON.parse(creds);
      } catch (ex) {
          throw new Error('Credentials object is not a valid JSON');
      }
      let subscriptionId = core.getInput('subscription-id');

      let servicePrincipalId = credsObject["appId"];
      let servicePrincipalKey = credsObject["password"];
      let tenantId = credsObject["tenant"];
      if (!servicePrincipalId || !servicePrincipalKey || !tenantId) {
          throw new Error("Not all values are present in the creds object. Ensure appId, password and tenant are supplied");
      }

      throwIfError(execSync("az", "login --service-principal -u \"" + servicePrincipalId + "\" -p \"" + servicePrincipalKey + "\" --tenant \"" + tenantId + "\""));

      if(!!subscriptionId) {
        throwIfError(execSync("az", "account set --subscription \"" + subscriptionId + "\""));
      }
    } catch (error) {
      core.debug("Login failed.");
      core.setFailed(error);
    }
  }

function throwIfError(resultOfToolExecution: IExecSyncResult, errormsg?: string) {
    if (resultOfToolExecution.code != 0) {
        core.error("Error Code: [" + resultOfToolExecution.code + "]");
        if (errormsg) {
          core.error("Error: " + errormsg);
        }
        throw resultOfToolExecution;
    }
  }


main();