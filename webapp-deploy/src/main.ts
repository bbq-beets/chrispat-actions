import { TaskParameters } from "./taskparameters";
import { DeploymentFactory, DEPLOYMENT_PROVIDER_TYPES } from "./deploymentProvider/DeploymentFactory";
import * as core from '@actions/core';

async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    var taskParams = TaskParameters.getTaskParams();
    let type = DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;
    if(!!taskParams.endpoint) {
      await taskParams.getResourceDetails();
      type = taskParams.kind.indexOf('linux') < 0 ? DEPLOYMENT_PROVIDER_TYPES.WINDOWS : DEPLOYMENT_PROVIDER_TYPES.LINUX;
    }
    var deploymentProvider = DeploymentFactory.GetDeploymentProvider(type);

    console.log("Predeployment Step Started");
    await deploymentProvider.PreDeploymentStep();

    console.log("Deployment Step Started");
    await deploymentProvider.DeployWebAppStep();
  }
  catch(error) {
    core.debug("Deployment Failed with Error: " + error);
    isDeploymentSuccess = false;
    core.setFailed(error);
  }
  finally {
      if(deploymentProvider != null) {
          await deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess, true);
      }
      
      core.debug(isDeploymentSuccess ? "Deployment Succeeded" : "Deployment failed");

  }
}

main();