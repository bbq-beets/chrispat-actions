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
const util = require("util");
const webClient = require("../webClient");
const core = __importStar(require("@actions/core"));
class KuduServiceClient {
    constructor(scmUri, accessToken) {
        this._accesssToken = accessToken;
        this._scmUri = scmUri;
    }
    beginRequest(request, reqOptions, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            request.headers = request.headers || {};
            request.headers["Authorization"] = "Basic " + this._accesssToken;
            request.headers['Content-Type'] = contentType || 'application/json; charset=utf-8';
            if (!!this._cookie) {
                core.debug(`setting affinity cookie ${JSON.stringify(this._cookie)}`);
                request.headers['Cookie'] = this._cookie;
            }
            let retryCount = reqOptions && util.isNumber(reqOptions.retryCount) ? reqOptions.retryCount : 5;
            while (retryCount >= 0) {
                try {
                    let httpResponse = yield webClient.sendRequest(request, reqOptions);
                    if (httpResponse.headers['set-cookie'] && !this._cookie) {
                        this._cookie = httpResponse.headers['set-cookie'];
                        core.debug(`loaded affinity cookie ${JSON.stringify(this._cookie)}`);
                    }
                    return httpResponse;
                }
                catch (exception) {
                    let exceptionString = exception.toString();
                    if (exceptionString.indexOf("Hostname/IP doesn't match certificates's altnames") != -1
                        || exceptionString.indexOf("unable to verify the first certificate") != -1
                        || exceptionString.indexOf("unable to get local issuer certificate") != -1) {
                        core.warning('ASE_SSLIssueRecommendation');
                    }
                    if (retryCount > 0 && exceptionString.indexOf('Request timeout') != -1 && (!reqOptions || reqOptions.retryRequestTimedout)) {
                        core.debug('encountered request timedout issue in Kudu. Retrying again');
                        retryCount -= 1;
                        continue;
                    }
                    throw new Error(exceptionString);
                }
            }
        });
    }
    getRequestUri(uriFormat, queryParameters) {
        uriFormat = uriFormat[0] == "/" ? uriFormat : "/" + uriFormat;
        if (queryParameters && queryParameters.length > 0) {
            uriFormat = uriFormat + '?' + queryParameters.join('&');
        }
        return this._scmUri + uriFormat;
    }
    getScmUri() {
        return this._scmUri;
    }
}
exports.KuduServiceClient = KuduServiceClient;