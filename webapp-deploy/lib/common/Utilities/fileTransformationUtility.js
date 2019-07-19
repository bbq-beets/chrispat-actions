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
const parameterParserUtility_1 = require("./parameterParserUtility");
const packageUtility_1 = require("./packageUtility");
const fs = require("fs");
const path = require("path");
const util = require("util");
var deployUtility = require('./utility');
class FileTransformUtility {
    static applyTransformations(webPackage, parameters, packageType) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug("WebConfigParameters is " + parameters);
            if (parameters) {
                var folderPath = yield deployUtility.generateTemporaryFolderForDeployment(false, webPackage, packageType);
                if (parameters) {
                    core.debug('parsing web.config parameters');
                    var webConfigParameters = parameterParserUtility_1.parse(parameters);
                    addWebConfigFile(folderPath, webConfigParameters, this.rootDirectoryPath);
                }
                var output = yield deployUtility.archiveFolderForDeployment(false, folderPath);
                webPackage = output.webDeployPkg;
            }
            else {
                core.debug('File Tranformation not enabled');
            }
            return webPackage;
        });
    }
}
FileTransformUtility.rootDirectoryPath = "D:\\home\\site\\wwwroot";
exports.FileTransformUtility = FileTransformUtility;
function addWebConfigFile(folderPath, webConfigParameters, rootDirectoryPath) {
    //Generate the web.config file if it does not already exist.
    var webConfigPath = path.join(folderPath, "web.config");
    if (!packageUtility_1.exist(webConfigPath)) {
        try {
            // Create web.config
            var appType = webConfigParameters['appType'].value;
            core.debug('Generating Web.config file for App type: ' + appType);
            delete webConfigParameters['appType'];
            var selectedAppTypeParams = addMissingParametersValue(appType, webConfigParameters);
            if (appType == 'java_springboot') {
                if (util.isNullOrUndefined(webConfigParameters['JAR_PATH'])
                    || util.isNullOrUndefined(webConfigParameters['JAR_PATH'].value)
                    || webConfigParameters['JAR_PATH'].value.length <= 0) {
                    throw Error('Java jar path is not present');
                }
                selectedAppTypeParams['JAR_PATH'] = rootDirectoryPath + "\\" + webConfigParameters['JAR_PATH'].value;
            }
            generateWebConfigFile(webConfigPath, appType, selectedAppTypeParams);
            console.log("Successfully generated web.config file");
        }
        catch (error) {
            throw new Error("Failed to generate web.config. " + error);
        }
    }
    else {
        console.log("web.config file already exists. Not generating.");
    }
}
function addMissingParametersValue(appType, webConfigParameters) {
    var paramDefaultValue = {
        'java_springboot': {
            'JAVA_PATH': '%JAVA_HOME%\\bin\\java.exe',
            'JAR_PATH': '',
            'ADDITIONAL_DEPLOYMENT_OPTIONS': ''
        }
    };
    var selectedAppTypeParams = paramDefaultValue[appType];
    var resultAppTypeParams = {};
    for (var paramAtttribute in selectedAppTypeParams) {
        if (webConfigParameters[paramAtttribute]) {
            core.debug("param Attribute'" + paramAtttribute + "' values provided as: " + webConfigParameters[paramAtttribute].value);
            resultAppTypeParams[paramAtttribute] = webConfigParameters[paramAtttribute].value;
        }
        else {
            core.debug("param Attribute '" + paramAtttribute + "' is not provided. Overriding the value with '" + selectedAppTypeParams[paramAtttribute] + "'");
            resultAppTypeParams[paramAtttribute] = selectedAppTypeParams[paramAtttribute];
        }
    }
    return resultAppTypeParams;
}
function generateWebConfigFile(webConfigTargetPath, appType, substitutionParameters) {
    // Get the template path for the given appType
    var webConfigTemplatePath = path.join(__dirname, './WebConfigTemplates', appType.toLowerCase());
    var webConfigContent = fs.readFileSync(webConfigTemplatePath, 'utf8');
    webConfigContent = replaceMultiple(webConfigContent, substitutionParameters);
    fs.writeFileSync(webConfigTargetPath, webConfigContent, { encoding: "utf8" });
}
function replaceMultiple(text, substitutions) {
    for (var key in substitutions) {
        core.debug('Replacing: ' + '{' + key + '} with: ' + substitutions[key]);
        text = text.replace(new RegExp('{' + key + '}', 'g'), substitutions[key]);
    }
    return text;
}
