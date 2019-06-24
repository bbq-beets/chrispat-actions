# The Actions model

Workflows are powered by actions, and there are three types: container actions, JavaScript actions, and shell actions.
The first two share a common metadata format, discovery mechanism, and execution model.
Container actions run inside a Docker container, while JavaScript actions run directly on the host.
Container and JavaScript actions will be found on the GitHub graph and available in the GitHub Marketplace.

Shell actions are ad-hoc scripts authored directly in the workflow (or checked into the repo).
They can make use of many of the features mentioned here (such as the environment variables and logging commands), but they have no metadata and are not easily reusable between repos.

## Action types

### Container actions

Container actions:
- Package the environment with the work to be done
- Snapshot versions, dependencies, tools, and configuration for the work to be done
- Run on Linux only

### JavaScript actions

JavaScript actions:
- Separate the work from the environment
- Configure the host environment for scripts
  - path
  - authentication
  - proxy
  - problem matchers
- Make simple scripts reusable / distributable
- Can be run on different operating systems and different versions of Linux

### Shell actions

Shell actions:
- Are easiest to get started with: anything you'd type in the terminal, you can type directly in a workflow
- Are not easily reusable across workflows
- Are not portable across operating systems

## Execution

When GitHub Actions dispatches a job, a runner picks it up.
The job contains links to all the actions required by that job.
The runner downloads each action, reads its metadata, and executes its entrypoint.

For a container action, the container is spun up with `docker run`, injecting appropriate environment variables and volume mounts.
When the container finishes, the action is complete.
Its exit code indicates success or failure.

_Note: Container actions must be run by the default Docker user (root).
Ensure your Dockerfile does not set the USER instruction.
Otherwise you will not be able to access the workspace._

For a JavaScript action, the runner starts a new process with the right environment variables and working directory.
This new process is a Node LTS executable running the entrypoint JavaScript (as defined in the [metadata](#metadata)).
When Node completes, the action is complete.
The exit code indicates success or failure.

### Runtime environment

#### Environment variables

These environment variables are available by default to all three kinds of actions (script, container, and shell).

| Environment variable |	Description | Container example | JavaScript example |
|----------------------|--------------|-------------------|--------------------|
| `HOME` |	The path to the GitHub home directory used to store user data.* | /github/home | /home/octocat
| `GITHUB_ACTION` |	The name of the action. | Hello world | Hello world
| `GITHUB_ACTOR` |	The name of the person or app that initiated the workflow. | octocat | octocat
| `GITHUB_REPOSITORY` |	The owner and repository name. | octocat/Hello-World | octocat/Hello-World
| `GITHUB_EVENT_NAME` |	The webhook name of the event that triggered the workflow. | push | push
| `GITHUB_EVENT_PATH` |	The path to a file that contains the payload of the event that triggered the workflow. | /github/workflow/event.json | /runner/work/1/workflow/event.json
| `GITHUB_WORKSPACE` |	The GitHub workspace path. | /github/workspace | /runner/work/1/workspace
| `GITHUB_SHA` |	The commit SHA that triggered the workflow. | ffac537e6cbbf934b08745a378932722df287a53 | ffac537e6cbbf934b08745a378932722df287a53
| `GITHUB_REF` |	The branch or tag ref that triggered the workflow. | refs/heads/feature-branch-1 | refs/heads/feature-branch-1

Additionally, there is a secret called `github_token` available to workflows.
It is not available as an environment variable by default.
If an action needs this token, by convention, it should be mapped in as `GITHUB_TOKEN`.

Note: For JavaScript actions running in host jobs, `HOME` is the host homedir.
For JavaScript actions running in container jobs, the home directory is mapped in at `/github/home`.
It persists throughout the job.

#### Filesystem

For container actions, the `/github` directory is reserved.
For JavaScript actions, a workflow-specific directory will be created and used.
Action developers must always indirect through the supplied environment variables, as the precise directories are subject to change.

### Exit codes

You can use exit codes to provide a container action's status.
GitHub uses the exit code to set the action's check run status, which can be `success`, `neutral`, or `failure`:

| Exit code | Status | Description |
|-----------|--------|-------------|
| 0 | success | The action completed successfully and other actions that depend on it can begin.
| 78 | neutral | The configuration error exit status (`EX_CONFIG`) indicates that the action terminated but did not fail. This may not prevent future actions from starting. (`if` and `continue-on-error` offer the ability to continue after otherwise-failing states.)
| All other codes | failure | Any other exit code indicates the action failed. When an action fails, all concurrent actions are cancelled and future actions are skipped. The check run and check suite both get a failure status.

Note for JavaScript action authors: due to Node's design, writes to `stdout` may be dropped when `process.exit` is called.
We strongly recommend setting exit codes using `process.exitCode` and letting the Node runtime exit naturally.
The [Actions Toolkit](actions-toolkit.md) provides a consistent mechanism for setting exit codes across both container and JavaScript actions.

### Logging commands

Actions can communicate back to the runner, requesting services on their behalf.
The [Actions Toolkit](actions-toolkit.md) provides JavaScript wrappers, but under the covers, there is a simple `stdout`-based protocol.
Services are requested by echoing `##[commandname param1=data;param2=data;...]value` to `stdout`.
Command and param names are not case sensitive.

The following commands are available:
- `##[set-env name={name}]{value}` - create or update an environment variable for all subsequent actions.
Does _not_ set it in the current action (because the runner can't touch the existing environment on most platforms).
Respects the author's casing and punctuation.
- `##[set-output name={name}]{value}` - provide an output value as specified in the metadata.
You must declare all outputs; this will error if the named output was not mentioned in the metadata.
- `##[set-secret name={name}]{value}` - like `set-output`, but registers with the secrets group rather than the standard outputs group.
Like outputs, must be declared in the metadata.
Also, this marks the value as a secret to be scrubbed from log outputs.
- `##[add-path]{path}` - prepends a directory to the system PATH in all subsequent actions.
Does _not_ set it in the current action.
- `##[warning file={name};line={line};col={col}]{message}` - add a warning to the issues collection. Optionally takes a filename, line number, and column number.
- `##[error file={name};line={line};col={col}]{message}` - add an error to the issues collection. Optionally takes a filename, line number, and column number.

## Metadata

Actions are expected to have an `action.yml` file in their root directory.
It contains metadata about the action.
It's identical for container and JavaScript actions except in the `runs` keyword.

```yaml
# Container action
name: 'Hello World'
description: 'Greet the world and record the time'
inputs: 
  greeting: # id of input
    description: 'The greeting we choose - will print "{greeting}, World!" on stdout'
    required: true
    default: 'Hello'
    # in the future we may add 'type', for now assume string
outputs:
  time: # id of output
    description: 'The time we did the greeting'
branding:
  icon: 'hello.svg' # vector art to display in the GitHub Marketplace
  color: 'green' # optional, decorates the entry in the GitHub Marketplace
runs:
  using: 'docker'
  image: 'Dockerfile'
  # could also have been `image: 'docker://debian:stretch-slim'`
  args: ['${{ inputs.greeting }}'] # technically optional if nothing is user-configurable
  # optional other keys:
  # entrypoint: string
  # env: { string: string }
```

The Docker `args` maps inputs in array format.
It can also include hardcoded strings.
These are passed to the container's entrypoint at container startup.

```yaml
# array format
args: ['${{ inputs.greeting }}', 'foo', 'bar']

# and because it's just YAML, this works:
args:
- '${{ inputs.greeting }}'
- 'foo'
- 'bar'
```

```yaml
# JavaScript action
name: 'Hello World'
description: 'Greet the world and record the time'
inputs: 
  greeting: # id of input
    description: 'The greeting we choose - will print "{greeting}, World!" on stdout'
    required: true
    default: 'Hello'
    # in the future we may add 'type', for now assume string
outputs:
  time: # id of output
    description: 'The time we did the greeting'
branding:
  icon: 'hello.svg' # vector art to display in the GitHub Marketplace
  color: 'green' # optional, decorates the entry in the GitHub Marketplace
runs:
  using: 'node'
  main: 'main.js'
```

Actions must declare their inputs and outputs.
If an undeclared input or output is accessed, the runner will raise an error.

## Example container action

[A full walkthrough of creating a container action](container-walkthrough.md) is available.

You can create container actions in a repository you own by adding a `action.yml`.
All container actions require an `action.yml`.
An action may also include a Dockerfile as the entry point and any other files that contain the action's code.
For example, a container action called `container-action` might have this directory structure:

```
|-- hello-world (repository)
|   |__  Dockerfile
|   │__  README.md
|   │__  action.yml
|
```

## Example JavaScript action

[A full walkthrough of creating a JavaScript action](javascript-walkthrough.md) is available.

You can create JavaScript actions in a repository you own by adding a `action.yml`.
All JavaScript actions require an `action.yml`.
An action must also include a JavaScript file as the entry point, and may contain any other files that contain the action's code.
For example, a JavaScript action called `js-action` might have this directory structure:

```
|-- hello-world (repository)
|   │__  README.md
|   |__  main.js
|   │__  action.yml
|
```

## Using an action

Finally, we're ready to see how a workflow author will consume your actions.
The syntax for using an action with both inputs and outputs looks like this:

```yaml
version: 1.0
on:
  push:
    branches:
    - master

jobs:
  build:
    actions:
    - name: 'Hello World!'
      uses: actions/helloworld@master
      with:
        greeting: 'Hello'
      id: hello-world
    - run: echo "The action ran at ${{ actions.hello-world.outputs.time }}"
```

The action will be downloaded and the entrypoint will be executed.
If it's a container action, the entrypoint is a Docker container built from the specified file.
If it's a JavaScript action, the entrypoint is a JavaScript file executed by Node LTS.

## Multiple actions per repo

Worth noting: a repo can contain multiple actions, separated into directories.
For instance:

```
|-- multi-actions (repository)
|   |__  action-one
|        │__  README.md
|        |__  main.js
|        │__  action.yml
|   |__  action-two
|        │__  README.md
|        |__  main.js
|        │__  action.yml
|
```

would be referenced like this:

```yaml
jobs:
  build:
    actions:
    - name: 'Action 1'
      uses: actions/multi-actions/action-one@master
    - name: 'Action 2'
      uses: actions/multi-actions/action-two@master

```
