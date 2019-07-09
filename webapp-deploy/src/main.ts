import { TaskParameters } from "./utilities/taskparameters";
import { DeploymentFactory } from "./deploymentProvider/DeploymentFactory";
import * as core from '@actions/core';

async function main() {
  var taskParams = new TaskParameters();
  var deploymentFactory: DeploymentFactory = new DeploymentFactory(taskParams);
  var deploymentProvider = await deploymentFactory.GetDeploymentProvider();

  console.log(taskParams.kind);

  console.log("Predeployment Step Started");
  //await deploymentProvider.PreDeploymentStep();

  console.log("Deployment Step Started");
  //await deploymentProvider.DeployWebAppStep();
}

try {
  main();
} catch (ex) {
  core.setFailed(ex);
}