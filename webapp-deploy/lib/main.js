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
const taskparameters_1 = require("./utilities/taskparameters");
const DeploymentFactory_1 = require("./deploymentProvider/DeploymentFactory");
const core = __importStar(require("@actions/core"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var taskParams = new taskparameters_1.TaskParameters();
        var deploymentFactory = new DeploymentFactory_1.DeploymentFactory(taskParams);
        var deploymentProvider = yield deploymentFactory.GetDeploymentProvider();
        let kind = yield taskParams.getKind();
        console.log(kind);
        console.log("Predeployment Step Started");
        //await deploymentProvider.PreDeploymentStep();
        console.log("Deployment Step Started");
        //await deploymentProvider.DeployWebAppStep();
    });
}
try {
    main();
}
catch (ex) {
    core.setFailed(ex);
}
