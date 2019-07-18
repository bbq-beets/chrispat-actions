"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const AzureEndpoint_1 = require("./ArmRest/AzureEndpoint");
const AzCliAuthHandler_1 = require("./ArmRest/AzCliAuthHandler");
const utilityHelperFunctions_1 = require("./Utilities/utilityHelperFunctions");
const Constants = __importStar(require("./constants"));
function getHandler() {
    let resultOfExec = utilityHelperFunctions_1.execSync("az", "account show --query \"id\"");
    if (resultOfExec.code == Constants.TOOL_EXEC_CODE.SUCCESS) {
        return AzCliAuthHandler_1.AzCliAuthHandler.getEndpoint(resultOfExec.stdout);
    }
    // else if(!!core.getInput("publish-profile-path")) {
    //     return PublishProfileAuthHandler.get();
    // }
    else {
        return AzureEndpoint_1.AzureEndpoint.getEndpoint();
    }
}
exports.getHandler = getHandler;
