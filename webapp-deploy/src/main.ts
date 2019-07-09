import { TaskParameters } from "./utilities/taskparameters";
import { DeploymentFactory } from "./deploymentProvider/DeploymentFactory";
import tl = require('vsts-task-lib/task');

async function main() {
  var taskParams = new TaskParameters();
  var deploymentFactory: DeploymentFactory = new DeploymentFactory(taskParams);
  var deploymentProvider = await deploymentFactory.GetDeploymentProvider();

  console.log(taskParams.kind);

  tl.debug("Predeployment Step Started");
  //await deploymentProvider.PreDeploymentStep();

  tl.debug("Deployment Step Started");
  //await deploymentProvider.DeployWebAppStep();
}

main();