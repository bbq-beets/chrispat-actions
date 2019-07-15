import * as toolCache from '@actions/tool-cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as os from 'os';

let kubectlPath = toolCache.find('kubectl', toolCache.findAllVersions('kubectl')[0]);
if (!kubectlPath) {
    core.setFailed('Kubectl is not installed');
}
kubectlPath = path.join(kubectlPath, `kubectl${getExecutableExtension()}`);

function getExecutableExtension(): string {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }
    return '';
}

async function deploy(manifests: string[], namespace: string) {
    for (var i = 0; i < manifests.length; i++) {
        let manifest = manifests[i];
        await exec.exec(kubectlPath, ['apply', '-f', manifest, '--namespace', namespace]);
    }
}

async function run() {
    let manifestsInput = core.getInput('manifests');
    if (!manifestsInput) {
        core.setFailed('No manifests supplied to deploy');
    }
    let namespace = core.getInput('namespace');
    if (!namespace) {
        namespace = 'default';
    }

    let manifests = manifestsInput.split('\n');
    await deploy(manifests, namespace);
}

run().catch(core.setFailed);