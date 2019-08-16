# Actions metadata

Actions are described by an `action.yml` file in their root directory.
It contains metadata about the action.
It's identical for container and JavaScript actions except in the `runs` keyword.

## Schema

This is a human-readable schema for action metadata.
Eventually, a full JSON schema will be available for machine-readability.
For the parts that are more complex, a longer description follows the schema.

```yaml
# Container action
name: string            # display name of action
description: string     # longer description of action
inputs: { string: input-mapping }       # map of input IDs to input info
outputs: { string: output-mapping }     # map of output IDs to output info
branding:
  icon: string          # vector art to display in the GitHub Marketplace
  color: string         # optional, decorates the entry in the GitHub Marketplace
runs:
  using: enum(docker, node)     # execution engine
  # for `using: docker`
  image: string                 # Dockerfile or docker://image:label
  args: [ string ]              # optional, maps inputs to Docker args
  entrypoint: string            # optional, ...
  env: { string: string }       # optional, map of environment variables to contents
  # for `using: node`
  main: string                  # filename of entrypoint

# input-mapping
# `inputs` is a mapping from IDs to these keywords:
description: string     # brief description of the input
required: bool          # whether the input is required; defaults to false
default: string         # default value for the input if none is specified

# output-mapping
# `outputs` is a mapping from IDs to these keywords:
description: string     # brief description of the output
```

## Input mapping

`inputs` expects a mapping (key-value pairs) from input IDs to details about the input.
For example, consider this snippet:

```yaml
inputs:
  numOctocats:
    description: 'Number of Octocats'
    required: false
    default: '1'
  octocatEyeColor:
    description: 'Eye color of the Octocats'
    required: true
```

It says there are two inputs, `numOctocats` and `octocatEyeColor`.
`numOctocats` is not required and will default to 1.
`octocatEyeColor` is required and sets no default, so the consuming workflow must use a `with` statement to provide a value.

In the future, we will add data types.
For now, all inputs are treated as strings.

## Output mapping

Much like input mapping, output mapping expects key-value pairs from output IDs to details about the output.
For now, the only detail is a `description`:

```yaml
outputs:
  filesProcessed:
    description: 'Indicates which files were processed by this action'
```

but in the future, outputs will have data types as well.

## Docker `args`

The Docker `args` maps inputs in sequence format.
It can also include hardcoded strings.
These are passed to the container's entrypoint at container startup.

```yaml
name: 'My Docker action'
inputs:
  greeting:
    description: 'A greeting word'
    default: 'Hello'
runs:
  using: 'docker'
  args: ['${{ inputs.greeting }}', 'foo', 'bar']

# if the length gets unwieldy, YAML sequences can be unrolled:
runs:
  using: 'docker'
  args: ['${{ inputs.greeting }}', 'foo', 'bar']
  - '${{ inputs.greeting }}'
  - 'foo'
  - 'bar'
```

## Inputs and outputs

Actions must declare their inputs and outputs.
If an undeclared input or output is accessed, the runner will raise an error.
