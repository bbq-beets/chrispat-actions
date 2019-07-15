import * as core from '@actions/core';
import { issueCommand } from '@actions/core/lib/command';
import * as path from 'path';
import * as fs from 'fs';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getKubeconfig(): string {
    const kubeconfig = core.getInput('kubeconfig');
    if (kubeconfig) {
        return kubeconfig;
    }
    const clusterUrl = core.getInput('clusterUrl', { required: true });
    let certificate = core.getInput('certificate');
    let token = Buffer.from(core.getInput('token'), 'base64').toString();
    if (!certificate) certificate = '';
    const kubeconfigObject = {
        "apiVersion": "v1",
        "kind": "Config",
        "clusters": [
            {
                "cluster": {
                    "certificate-authority-data": certificate,
                    "server": clusterUrl
                }
            }
        ],
        "users": [
            {
                "user": {
                    "token": token
                }
            }
        ]
    };

    return JSON.stringify(kubeconfigObject);
}

function run() {
    let kubeconfig = getKubeconfig();
    const runnerTempDirectory = process.env['RUNNER_TEMPDIRECTORY']; // Using process.env until the core libs are updated
    const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${getRandomInt(100)}`);
    core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
    fs.writeFileSync(kubeconfigPath, kubeconfig);
    issueCommand('set-env', { name: 'KUBECONFIG' }, kubeconfigPath);
    console.log('KUBECONFIG environment variable is set');
}

run();