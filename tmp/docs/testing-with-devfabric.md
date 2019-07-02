# Testing with DevFabric

You don't need a GitHub dev instance to test actions.
Instead, you can set up DevFabric and install a private runner.

## Set up DevFabric
 
1. Turn on `DistributedTaskFeatures.YamlWorkflowSchema` Feature Flag
2. Build and deploy local devfabric instance
3. Create an org/project
 
## Get the runner

### If you have access to https://github.com/actions/runner
1. `git clone https://github.com/actions/runner`
2. `cd runner\src`
3. `dev.cmd l`
4. `cd ..\_layout`

### If you don't have access
1. Unzip the platform-specific binary from [here](../runner)
2. `cd` into the directory where you unzipped it

## Setup the runner
1. `config.cmd`
  - Follow prompts to set up with devfabric environment. You’ll need to create a PAT as part of this step.
  - Where it asks for a "GitHub URL", give it the URL to your DevFabric instance.
2. To test an action from a private repo (e.g. setup-node), you must set an environment variable: `set _GITHUB_ACTION_TOKEN={token with read access to the repo}`
3. `run.cmd`
 
## Configure your workflow
 
1. Create a GitHub repo with a file `.github/myworkflow.yml` (see Dreamlifter repo for info on how to configure this)
2. From DevFabric, go to Pipelines, create new pipeline, and follow the prompts. You should pull your repo from GitHub
