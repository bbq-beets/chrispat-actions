import { TaskParameters } from "./taskparameters";
import { DeploymentFactory } from "./deploymentProvider/DeploymentFactory";
import * as core from '@actions/core';

async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    var taskParams = TaskParameters.getTaskParams();
    await taskParams.getResourceDetails();
    var deploymentProvider = DeploymentFactory.GetDeploymentProvider();

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