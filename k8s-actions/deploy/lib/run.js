"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const toolCache = require("@actions/tool-cache");
const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");
const os = require("os");
let kubectlPath = toolCache.find('kubectl', toolCache.findAllVersions('kubectl')[0]);
if (!kubectlPath) {
    core.setFailed('Kubectl is not installed');
}
kubectlPath = path.join(kubectlPath, `kubectl${getExecutableExtension()}`);
function getExecutableExtension() {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }
    return '';
}
function deploy(manifests, namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        for (var i = 0; i < manifests.length; i++) {
            let manifest = manifests[i];
            yield exec.exec(kubectlPath, ['apply', '-f', manifest, '--namespace', namespace]);
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let manifestsInput = core.getInput('manifests');
        if (!manifestsInput) {
            core.setFailed('No manifests supplied to deploy');
        }
        let namespace = core.getInput('namespace');
        if (!namespace) {
            namespace = 'default';
        }
        let manifests = manifestsInput.split('\n');
        yield deploy(manifests, namespace);
    });
}
run().catch(core.setFailed);
