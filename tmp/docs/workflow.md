# Configure Dreamlifter Workflows

This document is a reference for the Dreamlifter 1.x workflow configuration.  

## Structure

* reserved keys
  * variables
  * stages
  * stage
  * workspace
  * checkout
  * import
  * container
  * restore-cache
  * save-cache
  * workflow
  * workflows
  * [resources](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#resources)
* [name](#workflow-name)
* [version](#version)
* [on](#on) (required)
* [jobs](#jobs)
  * < ID >
    * name: a display name. If not present, defaults to `ID`
    * [runs-on](#runs-on) - string value is either server or the name of the vmimage.  full object specifies pool and other properties
    * [container](#container)
    * [services](#services)

    * [needs](#needs) - dependencies to other Jobs

    * [if](#if) - conditional execution
    * [timeout-minutes](#timeout-minutes) - defaults to 360
    * [strategy](#strategy)

      * matrix
      * parallel
      * max-parallel

    * actions []
      * [checkout](#checkout)
      * [run](#run)
      * [action](#action)



## version

The ```version``` of the workflow language.  Enables us to warn of deprecation of features and potentially make breaking changes. Optional - files without version are version 1.

## on

Identifies the name of the events that trigger this workflow along with any conditions that need to be evaluated. Takes one of a single event string, list of event string, or event configuration map.

This is a required field for non-library (`.lib.yml`) workflow files.

##### Examples:

```yaml
# Trigger on push
on: push
# Trigger the workflow on push or pull request for all branches
on: ["push", "pull-request"]
```

```yaml
on:
  push:
    branches:        # array of glob patterns matching against refs/heads. Optional; defaults to all
    - master        # triggers on pushes that contain changes in master
    - releases/*    # triggers on pushes that contain changes in on refs matching refs/heads/releases/*.
    tags:            # arrach of glob patterns matchings against refs/tags.  Optional; defaults to none
    paths:           # file paths to consider in the event. Optional; defaults to all
  pull-request:
    branches:       # array of glob patterns matching against refs/heads.  Evaluates against the target branch of the PR.
    paths:          # file paths to consider in the event.  Optional; defaults to all
  schedule: 
  - cron:        # [POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html) cron syntax

```

### Filtering

Path and ref globbing works as per [`.gitignore`](https://git-scm.com/docs/gitignore) files.

```yaml
branches:
  - master
  - !refs/pulls/*
paths:
  - *.xml
  - test/*
  - !docs/*
```

When patterns are present, the build runs if any positive pattern matches, and none of the negative patterns match (which can be over-ridden by subsequent positive patterns).


### Cron

We support standard [POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html) cron syntax.

## jobs

Defines a set of named Jobs. Jobs run in parallel. They can define dependencies on other Jobs via `needs`; they will not start until their dependencies have completed.

Each Job runs on exactly one runner in the specified ```pool``` and has the following properties:

### if

Jobs and actions can have an `if` block attached to them. This conditionalizes their execution at runtime based on any of the available context information.  The `if` block is an expression defined in the [azure pipelines expression language](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/conditions?view=azure-devops&tabs=yaml).

```yaml
- run: echo hello 
  if: and(succeeded(), eq(variables['GITHUB_REF'], 'refs/heads/master') )
```
### timeout-minutes

The maximum number of minutes to let a workflow run before the system automatically cancels it.  

### runs-on

```runs-on``` specifies which runner pool to use for a Job. In the case the pool has more than one type of runner, it has properties to select the desired runner type. When `runs-on` is not specified, it defaults to the VM image name `ubuntu-latest`, which means the latest available version of Ubuntu in the hosted pool.

```yaml
# in the shortform the user simply specifies the name of the vm image they want
runs-on: ubuntu-16.04
```

```yaml
# the long form supports running on a private pool
runs-on:
  # name of the pool to run this Job in
  name: string  
  # set of constraints to apply when selecting the runner from the pool. By default all runners get the tags os, runner-name and machine-name.  The user can specify others via a configuration file.
  tags:  # map of key value pairs to match against to select the runner. 
    os: Linux
    runner-name: myRunner
    machine-name: builder1
```
### needs

```yaml
jobs:
  job1:
  job2:
    needs: job1
  job3:
    needs: [job1, job2]
```
Identifies jobs that need to complete successfully before this job is run.  It can be a string or array of strings. If a job fails all jobs that need it will also fail unless they specify a condition to indicate otherwise.

### strategy

```matrix``` and ```parallel``` are mutually-exclusive strategies for duplicating a Job.

### matrix

Matrixing generates copies of a Job with different variables.  This is useful for testing against different configurations or platform versions.  The matrix will be built based on the cross product of all of the values of the arrays provided along with any additions or subtractions based on the values in include and exclude. You can also fully specify the exact combinations you want using the include list.

```yaml
strategy:
  fail-fast: true
  matrix:
    node: [0.10, 0.12, 4, 6, 8, 10]
    os: [macos-10.13, vs2017-win2016, Ubuntu 16.04]
    include:
    - os: vs2017-win2016 # includes the additional variable of npm with a value of 2 for the matrix leg matching the os and version
      node: 0.10
      npm: 2
    exclude:
    - os: macos-10.13 # excludes node .10 on macos
      node: 0.10

```
### parallel

This specifies how many duplicates of the Jobs should run.  This is useful for slicing up a large test matrix.

#### fail-fast

Defaults to ```true```. If any Job generated by the matrix fails all in progress Jobs will be cancelled.  Works the same for both parallel and matrix strategies.

#### max-parallel

Regardless of which strategy is chosen and how many Jobs are generated, this value specifies the maximum number of Jobs that will be started and thus the maximum number of runners that will be used.

```yaml
strategy:
  max-parallel: 2
  matrix:
    PYTHON_VERSION: ['3.5', '3.6', '2.7]
```
### The `actions:` block

The `actions` block defines a linear sequence of operations that make up a Job.  Each action is run in its own process on a runner and has access to the workspace on disk.  Because actions are run in their own process any environment variable changes are not preserved between actions.  The system provides a number of built-in actions for performing basic operations like running a script and changing the repo checkout options results.  Actions can also provided as reusable [units of work](../units-of-work.md) by other members of the GitHub community and implemented as either a Docker container or a node script.

All actions share the following common properties:

```yaml
name:               # the display name of the action in the log view.  This is the default property
id:                 # the reference name of the action.  Needed to support namespacing outputs
if:	                # condition to evalute before running the action
working-directory:	# working directory for the action defauls to the Job workspace
continue-on-error:	# 'true' if failures in this action should not fail the Job
timeout-minutes:    # the number of minutes to run this action before forceable killing it
```

#### run

Script is used for running command line programs using the operating system shell.  When run in the short form the command to run is both the display name of the action as well as the script to execute.  Scripts are run using non-login shells by default.

Just like any other action each ```script``` represents a new process and shell.  However, you can provide multi-line content and each line will be run in the same shell:

The default shell on Linux and macOS is  ```/bin/bash -eo pipefail``` if ```/bin/bash``` is present.   Otherwise it is ```/bin/sh -eo pipefail```.   On Windows the shell will be ```c:\windows\system32\cmd.exe /c /d /s```.  The shell can be overridden by the user using the ```shell``` property as documented above.

```yaml
- run: npm install # npm install becomes the display name of the action
```

```yaml
- name: Install Dependencies
  run: npm install      
  shell:        # override the default shell options
  outputs:      # same as other output stanzas
```

#### action

An Action references a reusable unit that has been built and shared by a member of the community to provide some useful unit of work. Actions can also be a reference to another workflow file enabling the user to compose workflows from other workflows  Actions can be referenced by simply supplying the repo where they are defined and the inputs they require. An action can be implemented as either a ```Dockerfile``` or a node script.  Actions implemented as a ```Dockerfile``` are only supported on Linux where as an action implemented as a node script can be run on any of the supported operating systems.

Note: GitHub Actions are a reusable unit of code, `actions` define the list of tasks to be run by a Job.

```yaml
- name: < display name for action >
  uses: {user}/{repo}@ref # https://developer.github.com/actions/managing-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action
  with:
      <map of inputs>
  id: < identifier - for referencing in outputs etc >
  if: < see #if > - when importing a set of actions, this is and()'d with their if conditions (or if conditions are added)
  # only valid when referring to a docker image
  env: 
  entrypoint:
  args[]:
    
```

#### checkout	

```checkout``` lets you to control how and when the checkout occurs. By default it will check out the repo containing the workflow to a folder of the same name in the Job workspace.

 ```yaml	
- checkout: boolean | <repo name string>
  path:  # the relative path in the workspace to put the repo. Defaults to a directory in the root of the workspace with the same name as the repo	
  clean: boolean  # whether to fetch clean each time	
  fetch-depth: number  # the depth of commits to ask Git to fetch	
  lfs: boolean  # whether to download Git-LFS files	
  submodules: true | recursive  # set to 'true' for a single level of submodules or 'recursive' to get submodules of submodules	
 ```

You can also totally disable the checkout by having `checkout: false` anywhere in the list

```yaml
- checkout: false
```

Or use `checkout: true` to control when the checkout should occur:

```yaml
- ...
- checkout: true
- ...
```

It is implemented as a separate action type, rather than a `uses: actions/checkout` etc, as unlike other actions types the  absence of any `checkout` items affects the behaviour of a workflow: if there is no `checkout: ` item in the list the default checkout will occur. 

Note: `checkout: false` with an `if` condition will always disable the default checkout. The runtime conditional will have no effect.

### container

Default container to use when running actions in this Job.  If not defined all actions will run eitehr on the runner host or inside the container specified by the action.  If you have actions that are mixed between script and container all container actions will be run as sibling containers with the same volume mounts and on the same network.

For reference: https://docs.microsoft.com/en-us/azure/devops/pipelines/process/container-phases?view=azure-devops&tabs=yaml

### services

A collection of additional containers to configure when the Job is run. These are useful for spinning up databases or cache services like redis.  The runner will automatically create a network and manage the lifecycle of the service containers as part of the Job lifecycle. 

For reference: https://docs.microsoft.com/en-us/azure/devops/pipelines/process/service-containers?view=azure-devops&tabs=yaml

```yaml
services:
  nginx:
    image: nginx
    ports:
    - 8080:80
    env:
      NGINX_PORT: 80
  redis:
    image: redis
    ports:
    - 6379/tcp # we will find a random open port on the host to bind the redis default port to and will put that in the context under workflow.services.redis.ports.6379 so the user can reference it

actions:
- run: redis-cli -p {{ workflow.services.redis.ports.6379}}
```

## Workflow `name`

Workflows have an optional name field, which is used to identify them in the UI. Without a name field, the file-name is used, stripping the extension and title-casing it using `_` and `-` as word boundaries.

e.g

Name: `Weronika the workflow`
```yaml
# wf.yml
name: "Weronika the workflow"
```

Name: `I💓actions`
```yaml
# I💓actions.yml
on: push
```

Name: `Ci build`
```yaml
# ci-build.yml
on: push
```
