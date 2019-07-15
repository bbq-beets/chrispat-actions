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
const LinuxWebAppDeploymentProvider_1 = require("./LinuxWebAppDeploymentProvider");
const WindowsWebAppDeploymentProvider_1 = require("./WindowsWebAppDeploymentProvider");
class DeploymentFactory {
    constructor(taskParams) {
        this._taskParams = taskParams;
    }
    GetDeploymentProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._taskParams.kind.indexOf("linux") == -1) {
                console.log("Deployment started for windows app service");
                return new WindowsWebAppDeploymentProvider_1.WindowsWebAppDeploymentProvider(this._taskParams);
            }
            else {
                console.log("Deployment started for linux app service");
                return new LinuxWebAppDeploymentProvider_1.LinuxWebAppDeploymentProvider(this._taskParams);
            }
        });
    }
}
exports.DeploymentFactory = DeploymentFactory;
