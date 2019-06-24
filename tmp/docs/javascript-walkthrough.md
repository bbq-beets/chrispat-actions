# Creating a JavaScript action

In this walkthrough, we'll create a simple JavaScript action.
Along the way, we'll demonstrate most of the interesting things actions can do.
For instance, we'll take an input, offer an output, and report success or failure.
Our action will print "Hello, <name>" and report the time.
For demo purposes, if <name> is set to "Octocat", then the action will fail the workflow.

## Get the tools you need

You will need:
- Node 10.x
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

```yaml
{
  "name": "hello-world-action",
  "version": "1.0.0",
  "description": "",
  "main": "lib/hello-world.js",
  "scripts": {
    "build": "tsc", # <-- add this line
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
tsc -t es6 --rootDir ./src --outDir ./lib --init
```

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
...
```

This code won't compile yet, as we also need the Actions Toolkit `core` package.

## Add @actions/core and compile the action

**ALPHA**: the below instructions won't work yet, as we haven't made the Toolkit public.
Instead, you'll need to `npm pack` the `core` and `exit` packages, commit them, and `npm install <the tarballs>`.
You can grab the tarballs from https://github.com/actions/setup-node (toolkit directory).
Put them in a `toolkit` directory in your repo, then run: `npm install file:toolkit/actions-exit-<version>.tgz` followed by `npm install file:toolkit/actions-core-<version>.tgz`.
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

_TODO_: Push to GitHub, use in a workflow
