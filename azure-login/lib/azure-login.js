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
const fs = require("fs-extra");
class login {
    static run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.throwIfError(tl.execSync("az", "--version"));
                let servicePrincipalId = tl.getInput('azureServicePrincipalId', true);
                let servicePrincipalKey = tl.getInput('azureServicePrincipalKey', true);
                let tenantId = tl.getInput('azureServiceTenantId', true);
                let subscription = tl.getInput('azureSubscription', true);
                this.throwIfError(tl.execSync("az", "login --service-principal -u \"" + servicePrincipalId + "\" -p \"" + servicePrincipalKey + "\" --tenant \"" + tenantId + "\""));
                this.throwIfError(tl.execSync("az", "account set --subscription \"" + subscription + "\""));
                fs.copy(`${process.env.HOME}/.azure`, "/home/github/.azure", function (err) {
                    if (err) {
                        console.log('An error occured while copying the folder.');
                        return console.error(err);
                    }
                    console.log('Copy completed!');
                });
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
exports.login = login;
login.run();
