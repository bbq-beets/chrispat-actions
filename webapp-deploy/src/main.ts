import { TaskParameters } from "./taskparameters";
import { DeploymentFactory } from "./deploymentProvider/DeploymentFactory";
import * as core from '@actions/core';

async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    var taskParams = new TaskParameters();
    await taskParams.getResourceDetails();
    var deploymentFactory: DeploymentFactory = new DeploymentFactory(taskParams);
    var deploymentProvider = await deploymentFactory.GetDeploymentProvider();

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
          await deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess);
      }
      
      core.debug(isDeploymentSuccess ? "Deployment Succeeded" : "Deployment failed");

  }
}

main();