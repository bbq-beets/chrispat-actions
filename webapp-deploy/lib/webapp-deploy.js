"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const core = __importStar(require("@actions/core"));
class deploy {
    static run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.throwIfError(tl.execSync("az", "--version"));
                let appName = tl.getInput('appName', true);
                let resourceGroupOutput = tl.execSync("az", "resource list -n \"" + appName + "\" --resource-type \"Microsoft.Web/Sites\"");
                this.throwIfError(resourceGroupOutput);
                console.log((JSON.parse(resourceGroupOutput.stdout))[0].resourceGroup);
                //let resourceGroupName = tl.getInput('resourceGroupname', false);
                //if (!resourceGroupName) {
                //}
            }
            catch (error) {
                core.setFailed(error.message);
            }
        });
    }
    static throwIfError(resultOfToolExecution, errormsg) {
        if (resultOfToolExecution.code != 0) {
            tl.error("Error Code: [" + resultOfToolExecution.code + "]");
            if (errormsg) {
                tl.error("Error: " + errormsg);
            }
            throw resultOfToolExecution;
        }
    }
}
exports.deploy = deploy;
deploy.run();
