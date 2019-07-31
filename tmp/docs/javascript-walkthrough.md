# Creating a JavaScript action

In this walkthrough, we'll create a simple JavaScript action.
Along the way, we'll demonstrate most of the interesting things actions can do.
For instance, we'll take an input, offer an output, and report success or failure.
Our action will print "Hello, <name>" and report the time.
For demo purposes, if <name> is set to "Octocat", then the action will fail the workflow.

_Note:_ we recommend starting from the [Node12 action template repo](https://github.com/actions/node12-template) for actions you intend to make public.
This walkthrough does everything "from scratch" so you can see what's going on.
The template comes preconfigured with a lot of nice tools ready for you.

## Get the tools you need

You will need:
- Node 12.x
- npm 6.x or higher

## Initialize the action directory

```bash
mkdir hello-world-action
cd hello-world-action
git init && git commit --allow-empty -m "initial commit"
npm init    # defaults are fine, or change these as you wish
npm install @types/node --save-dev
npm install typescript --save-dev
```

You may also want to [add a `.gitignore`](https://github.com/github/gitignore/blob/master/Node.gitignore) at this time.

## Create metadata file

Create a new file `action.yml` in the `hello-world-action` directory you created above.
It should contain:

```yaml
# action.yml
name: 'Hello World'
description: 'Greet someone and record the time'
inputs: 
  who-to-greet: # id of input
    description: 'Who to greet'
    required: true
    default: 'World'
outputs:
  time: # id of output
    description: 'The time we did the greeting'
branding:
  color: 'green' # optional, decorates the entry in the GitHub Marketplace
runs:
  using: 'node'
  main: 'lib/hello-world.js'
```

This file sets up an input `who-to-greet` and an output `time`.
It also tells the action runner how to start running this JavaScript action.

## Setup the TypeScript compiler

Open `package.json` and find the `scripts` section.
Add a new key `build` with value `tsc`:

```json
// package.json
{
  "name": "hello-world-action",
  "version": "1.0.0",
  "description": "",
  "main": "lib/hello-world.js",
  "scripts": {
    "build": "tsc", // <-- add this line
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^12.0.10",
    "typescript": "^3.5.2"
  }
}
```

Next, in your terminal, run:

```bash
./node_modules/tsc/bin/tsc -t es6 --rootDir ./src --outDir ./lib --init
```

(If you have `tsc` installed globally, you can use your global `tsc` install instead.)
This will set up the TypeScript compiler to read sources from `/src`, write outputs to `/lib`, and target ES6.
It will write down this configuration in `tsconfig.json` so that these options will be used every time.

Now would be a good time to commit your work:

```bash
git add .
git commit -m "Scaffolded JavaScript action"
```

## Write the action code

Create a new directory `src` with a file called `hello-world.ts`.
Its contents should be:

```typescript
// src/hello-world.ts
import * as core from '@actions/core';

async function run() {
  try {
    const nameToGreet = core.getInput('who-to-greet');
    if (nameToGreet == 'Octocat') {
        // the Octocat doesn't want to be greeted here!
        throw new Error("No Octocat greetings, please.");
    } else {
        console.log(`Hello ${nameToGreet}!`);
        const time = (new Date()).toTimeString();
        core.setOutput("time", time);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

This code won't compile yet, as we also need the Actions Toolkit `core` package.

## Add @actions/core and compile the action

**ALPHA**: the below instructions won't work yet, as we haven't made the Toolkit public.
Instead, you'll need to `npm pack` the `core` package, commit it, and `npm install <the tarball>`.
You can grab the tarball from https://github.com/actions/node12-template (toolkit directory).
Put it in a `toolkit` directory in your repo, then run: `npm install file:toolkit/actions-exit-<version>.tgz` followed by `npm install file:toolkit/actions-core-<version>.tgz`.
Make sure you commit these files; many .gitignores will not check in TGZs by default.

At your terminal:

```bash
npm install @actions/core
npm run-script build
```

If everything goes well, you'll have a new `lib/` directory containing `hello-world.js`.

## Commit and push your action to GitHub

Actions must stand on their own, so you'll need to include your `node_modules` when you commit the output.
First, we'll remove developer dependencies (no need to include the TypeScript compiler in your action!). 
Then we'll commit everything that's left - the TypeScript source, resulting JavaScript, and runtime dependencies.

```bash
npm prune --production
git add -f node_modules/*
git add .
git commit -m "My first action is ready"
```

Now you're ready to push the action to GitHub.
Assuming your action will live in a repo called `octocat/hello-action`, your next steps are:

```bash
git remote add origin ssh://git@github.com/octocat/hello-action.git
git push --all origin
```

## Use your action in a workflow

Now let's use this action in a workflow for another repo.
For this walkthrough, we'll pretend the repo is called `octocat/my-first-workflow`.
In that repo, create a `.github` folder, and inside it, create a `workflows` folder.
Inside the `workflows` folder, create a new file called `workflow.yml` with these contents:

```yaml
# .github/workflows/workflow.yml
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    actions:
    - uses: octocat/hello-action
      with:
        who-to-greet: 'Mundo'
      id: hello
    - run: echo "The time was ${{ actions.hello.outputs.time }}"
```

GitHub Actions will pick up your workflow file and run it.
In the logs, you will see "Hello Mundo" as the output from your new action.
Also, the `run` step after it will echo the value set in the new action.

Congratulations, you've written your first action!
Next, you should look at the [Actions Toolkit](actions-toolkit.md) to learn more about how actions interact with workflows.
