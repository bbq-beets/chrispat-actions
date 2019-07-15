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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const nameToGreet = core.getInput('who-to-greet');
            console.log(`${ process.env.HOME }`);
            //console.log(`${ process.env.AZURE_SERVICE_APP_ID }`);
            //console.log(`${ process.env.secrets.AZURE_SERVICE_APP_ID }`);
            //console.log(`${ env.AZURE_SERVICE_APP_ID }`);
            //console.log(`app name is : ${ AZURE_SERVICE_APP_ID }`);
            console.log(core.getInput('AZURE_SERVICE_APP_ID'));
            //console.log(`${ env.secrets.AZURE_SERVICE_APP_ID }`);
            if (nameToGreet == 'Octocat') {
                // the Octocat doesn't want to be greeted here!
                throw new Error("No Octocat greetings, please.");
            }
            else {
                console.log(`Hello ${nameToGreet}!`);
                const time = (new Date()).toTimeString();
                // **ALPHA** we will have a core wrapper around this
                console.log(`##[set-output name=time]${time}`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
