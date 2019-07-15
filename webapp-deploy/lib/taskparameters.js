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
const core = __importStar(require("@actions/core"));
const AzureResourceFilterUtility_1 = require("./common/RestUtilities/AzureResourceFilterUtility");
const AzureEndpoint_1 = require("./common/ArmRest/AzureEndpoint");
const PackageUtility_1 = require("./common/Utilities/PackageUtility");
class TaskParameters {
    constructor() {
        this._appName = core.getInput('app-name', { required: true });
        this._package = new PackageUtility_1.Package(core.getInput('package', { required: true }));
        this._endpoint = AzureEndpoint_1.AzureEndpoint.getEndpoint();
    }
    get appName() {
        return this._appName;
    }
    get package() {
        return this._package;
    }
    get resourceGroupName() {
        return this._resourceGroupName;
    }
    get kind() {
        return this._kind;
    }
    get endpoint() {
        return this._endpoint;
    }
    getResourceDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            let appDetails = yield AzureResourceFilterUtility_1.AzureResourceFilterUtility.getAppDetails(this.endpoint, this.appName);
            this._resourceGroupName = appDetails["resourceGroupName"];
            this._kind = appDetails["kind"];
        });
    }
}
exports.TaskParameters = TaskParameters;