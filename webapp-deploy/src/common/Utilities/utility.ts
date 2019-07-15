import path = require('path');
import { PackageType, exist } from './packageUtility';
import zipUtility = require('./ziputility');
import * as core from '@actions/core';
import * as os from "os";
import * as fs from "fs";
var shell = require('shelljs');
var minimatch = require('minimatch');

export function findfiles(filepath){

    console.log("Finding files matching input: " + filepath);

    var filesList : string [];
    if (filepath.indexOf('*') == -1 && filepath.indexOf('?') == -1) {

        // No pattern found, check literal path to a single file
        if(exist(filepath)) {
            filesList = [filepath];
        }
        else {
            console.log('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    } else {
        var firstWildcardIndex = function(str) {
            var idx = str.indexOf('*');

            var idxOfWildcard = str.indexOf('?');
            if (idxOfWildcard > -1) {
                return (idx > -1) ?
                    Math.min(idx, idxOfWildcard) : idxOfWildcard;
            }

            return idx;
        }

        // Find app files matching the specified pattern
        console.log('Matching glob pattern: ' + filepath);

        // First find the most complete path without any matching patterns
        var idx = firstWildcardIndex(filepath);
        console.log('Index of first wildcard: ' + idx);
        var slicedPath = filepath.slice(0, idx);
        var findPathRoot = path.dirname(slicedPath);
        if(slicedPath.endsWith("\\") || slicedPath.endsWith("/")){
            findPathRoot = slicedPath;
        }

        console.log('find root dir: ' + findPathRoot);

        // Now we get a list of all files under this root
        var allFiles = find(findPathRoot);

        // Now matching the pattern against all files
        filesList = match(allFiles, filepath, '', {matchBase: true, nocase: !!os.type().match(/^Win/) });

        // Fail if no matching files were found
        if (!filesList || filesList.length == 0) {
            console.log('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    }
    return filesList;
}

export function generateTemporaryFolderOrZipPath(folderPath: string, isFolder: boolean) {
    var randomString = Math.random().toString().split('.')[1];
    var tempPath = path.join(folderPath, 'temp_web_package_' + randomString +  (isFolder ? "" : ".zip"));
    if(exist(tempPath)) {
        return generateTemporaryFolderOrZipPath(folderPath, isFolder);
    }
    return tempPath;
}

export function copyDirectory(sourceDirectory: string, destDirectory: string) {
    if(!exist(destDirectory)) {
        mkdirP(destDirectory);
    }
    var listSrcDirectory = find(sourceDirectory);
    for(var srcDirPath of listSrcDirectory) {
        var relativePath = srcDirPath.substring(sourceDirectory.length);
        var destinationPath = path.join(destDirectory, relativePath);
        if(fs.statSync(srcDirPath).isDirectory()) {
            mkdirP(destinationPath);
        }
        else {
            if(!exist(path.dirname(destinationPath))) {
                mkdirP(path.dirname(destinationPath));
            }
            console.log('copy file from: ' + srcDirPath + ' to: ' + destinationPath);
            cp(srcDirPath, destinationPath, '-f', false);
        }
    }
}

export async function generateTemporaryFolderForDeployment(isFolderBasedDeployment: boolean, webDeployPkg: string, packageType: PackageType) {  
    var folderName = `${process.env.TEMPDIRECTORY}`;
    var folderPath = generateTemporaryFolderOrZipPath(folderName, true);
    if(isFolderBasedDeployment || packageType === PackageType.jar) {
        console.log('Copying Web Packge: ' + webDeployPkg + ' to temporary location: ' + folderPath);
        copyDirectory(webDeployPkg, folderPath);
        if(packageType === PackageType.jar && this.getFileNameFromPath(webDeployPkg, ".jar") != "app") {
            let src = path.join(folderPath, getFileNameFromPath(webDeployPkg));
            let dest = path.join(folderPath, "app.jar")
            console.log("Renaming " + src + " to " + dest);
            fs.renameSync(src, dest);
        }
        
        console.log('Copied Web Package: ' + webDeployPkg + ' to temporary location: ' + folderPath + ' successfully.');
    }
    else {
        await zipUtility.unzip(webDeployPkg, folderPath);
    }
    return folderPath;
}

export async function archiveFolderForDeployment(isFolderBasedDeployment: boolean, folderPath: string) {
    var webDeployPkg;

    if(isFolderBasedDeployment) {
        webDeployPkg = folderPath;
    }
    else {
        var tempWebPackageZip = generateTemporaryFolderOrZipPath(`${process.env.DefaultWorkingDirectory}`, false);
        webDeployPkg = await zipUtility.archiveFolder(folderPath, "", tempWebPackageZip);
    }

    return {
        "webDeployPkg": webDeployPkg,
        "tempPackagePath": webDeployPkg
    };
}

export function getFileNameFromPath(filePath: string, extension?: string): string {
    var isWindows = os.type().match(/^Win/);
    var fileName;
    if(isWindows) {
        fileName = path.win32.basename(filePath, extension);
    }
    else {
        fileName = path.posix.basename(filePath, extension);
    }

    return fileName;
}

export function getTempDirectory(): string {
    return `${process.env.TEMPDIRECTORY}` || os.tmpdir();
}

export function cp(source, dest, options, continueOnError) {
    if (options) {
        shell.cp(options, source, dest);
    }
    else {
        shell.cp(source, dest);
    }
    _checkShell('cp', continueOnError);
}

function _checkShell(cmd, continueOnError) {
    var se = shell.error();
    if (se) {
        core.debug(cmd + ' failed');
        var errMsg = 'LIB_OperationFailed' + cmd + se;
        core.debug(errMsg);
        if (!continueOnError) {
            throw new Error(errMsg);
        }
    }
}

function mkdirP(p) {
    if (!p) {
        throw new Error('LIB_ParameterIsRequired');
    }
    // build a stack of directories to create
    var stack = [];
    var testDir = p;
    while (true) {
        // validate the loop is not out of control
        if (stack.length >= (process.env['TASKLIB_TEST_MKDIRP_FAILSAFE'] || 1000)) {
            // let the framework throw
            core.debug('loop is out of control');
            fs.mkdirSync(p);
            return;
        }
        core.debug("testing directory '" + testDir + "'");
        var stats_1 = void 0;
        try {
            stats_1 = fs.statSync(testDir);
        }
        catch (err) {
            throw err;
        }
        if (!stats_1.isDirectory()) {
            throw new Error('LIB_MkdirFailedFileExists' + p + testDir); // Unable to create directory '{p}'. Conflicting file exists: '{testDir}'
        }
        // testDir exists
        break;
    }
    // create each directory
    while (stack.length) {
        var dir = stack.pop();
        core.debug("mkdir '" + dir + "'");
        try {
            fs.mkdirSync(dir);
        }
        catch (err) {
            throw new Error('LIB_MkdirFailed' + p + err.message); // Unable to create directory '{p}'. {err.message}
        }
    }
}

function find(findPath) {
    if (!findPath) {
        core.debug('no path specified');
        return [];
    }
    // normalize the path, otherwise the first result is inconsistently formatted from the rest of the results
    // because path.join() performs normalization.
    findPath = path.normalize(findPath);
    // debug trace the parameters
    core.debug("findPath: '" + findPath + "'");
    // return empty if not exists
    try {
        fs.lstatSync(findPath);
    }
    catch (err) {
        if (err.code == 'ENOENT') {
            core.debug('0 results');
            return [];
        }
        throw err;
    }
    try {
        var result = [];
        // push the first item
        var stack = [new _FindItem(findPath, 1)];
        var traversalChain = []; // used to detect cycles
        var _loop_1 = function() {
            // pop the next item and push to the result array
            var item = stack.pop();
            result.push(item.path);
            // stat the item.  the stat info is used further below to determine whether to traverse deeper
            //
            // stat returns info about the target of a symlink (or symlink chain),
            // lstat returns info about a symlink itself
            var stats_2 = void 0;
            // use lstat (not following symlinks)
            stats_2 = fs.lstatSync(item.path);
            // note, isDirectory() returns false for the lstat of a symlink
            if (stats_2.isDirectory()) {
                core.debug("  " + item.path + " (directory)");
                // push the child items in reverse onto the stack
                var childLevel_1 = item.level + 1;
                var childItems = fs.readdirSync(item.path)
                    .map(function (childName) { return new _FindItem(path.join(item.path, childName), childLevel_1); });
                stack.push.apply(stack, childItems.reverse());
            }
            else {
                core.debug("  " + item.path + " (file)");
            }
        };
        while (stack.length) {
            _loop_1();
        }
        core.debug(result.length + " results");
        return result;
    }
    catch (err) {
        throw new Error('LIB_OperationFailed' + 'find' + err.message);
    }
}

var _FindItem = (function () {
    function _FindItem(path, level) {
        this.path = path;
        this.level = level;
    }
    return _FindItem;
}());

function _getDefaultMatchOptions() {
    return {
        debug: false,
        nobrace: true,
        noglobstar: false,
        dot: true,
        noext: false,
        nocase: process.platform == 'win32',
        nonull: false,
        matchBase: false,
        nocomment: false,
        nonegate: false,
        flipNegate: false
    };
}

function _debugMatchOptions(options) {
    core.debug("matchOptions.debug: '" + options.debug + "'");
    core.debug("matchOptions.nobrace: '" + options.nobrace + "'");
    core.debug("matchOptions.noglobstar: '" + options.noglobstar + "'");
    core.debug("matchOptions.dot: '" + options.dot + "'");
    core.debug("matchOptions.noext: '" + options.noext + "'");
    core.debug("matchOptions.nocase: '" + options.nocase + "'");
    core.debug("matchOptions.nonull: '" + options.nonull + "'");
    core.debug("matchOptions.matchBase: '" + options.matchBase + "'");
    core.debug("matchOptions.nocomment: '" + options.nocomment + "'");
    core.debug("matchOptions.nonegate: '" + options.nonegate + "'");
    core.debug("matchOptions.flipNegate: '" + options.flipNegate + "'");
}

function match(list, patterns, patternRoot, options) {
    // trace parameters
    core.debug("patternRoot: '" + patternRoot + "'");
    options = options || _getDefaultMatchOptions(); // default match options
    _debugMatchOptions(options);
    // convert pattern to an array
    if (typeof patterns == 'string') {
        patterns = [patterns];
    }
    // hashtable to keep track of matches
    var map = {};
    var originalOptions = options;
    for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
        var pattern = patterns_1[_i];
        core.debug("pattern: '" + pattern + "'");
        // trim and skip empty
        pattern = (pattern || '').trim();
        if (!pattern) {
            core.debug('skipping empty pattern');
            continue;
        }
        // clone match options
        var options_1 = _cloneMatchOptions(originalOptions);
        // skip comments
        if (!options_1.nocomment && _startsWith(pattern, '#')) {
            core.debug('skipping comment');
            continue;
        }
        // set nocomment - brace expansion could result in a leading '#'
        options_1.nocomment = true;
        // determine whether pattern is include or exclude
        var negateCount = 0;
        if (!options_1.nonegate) {
            while (pattern.charAt(negateCount) == '!') {
                negateCount++;
            }
            pattern = pattern.substring(negateCount); // trim leading '!'
            if (negateCount) {
                core.debug("trimmed leading '!'. pattern: '" + pattern + "'");
            }
        }
        var isIncludePattern = negateCount == 0 ||
            (negateCount % 2 == 0 && !options_1.flipNegate) ||
            (negateCount % 2 == 1 && options_1.flipNegate);
        // set nonegate - brace expansion could result in a leading '!'
        options_1.nonegate = true;
        options_1.flipNegate = false;
        // expand braces - required to accurately root patterns
        var expanded = void 0;
        var preExpanded = pattern;
        if (options_1.nobrace) {
            expanded = [pattern];
        }
        else {
            // convert slashes on Windows before calling braceExpand(). unfortunately this means braces cannot
            // be escaped on Windows, this limitation is consistent with current limitations of minimatch (3.0.3).
            core.debug('expanding braces');
            var convertedPattern = process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern;
            expanded = minimatch.braceExpand(convertedPattern);
        }
        // set nobrace
        options_1.nobrace = true;
        for (var _a = 0, expanded_1 = expanded; _a < expanded_1.length; _a++) {
            var pattern_1 = expanded_1[_a];
            if (expanded.length != 1 || pattern_1 != preExpanded) {
                core.debug("pattern: '" + pattern_1 + "'");
            }
            // trim and skip empty
            pattern_1 = (pattern_1 || '').trim();
            if (!pattern_1) {
                core.debug('skipping empty pattern');
                continue;
            }
            // root the pattern when all of the following conditions are true:
            if (patternRoot &&
                !_isRooted(pattern_1) &&
                // AND matchBase:false or not basename only
                (!options_1.matchBase || (process.platform == 'win32' ? pattern_1.replace(/\\/g, '/') : pattern_1).indexOf('/') >= 0)) {
                pattern_1 = _ensureRooted(patternRoot, pattern_1);
                core.debug("rooted pattern: '" + pattern_1 + "'");
            }
            if (isIncludePattern) {
                // apply the pattern
                core.debug('applying include pattern against original list');
                var matchResults = minimatch.match(list, pattern_1, options_1);
                core.debug(matchResults.length + ' matches');
                // union the results
                for (var _b = 0, matchResults_1 = matchResults; _b < matchResults_1.length; _b++) {
                    var matchResult = matchResults_1[_b];
                    map[matchResult] = true;
                }
            }
            else {
                // apply the pattern
                core.debug('applying exclude pattern against original list');
                var matchResults = minimatch.match(list, pattern_1, options_1);
                core.debug(matchResults.length + ' matches');
                // substract the results
                for (var _c = 0, matchResults_2 = matchResults; _c < matchResults_2.length; _c++) {
                    var matchResult = matchResults_2[_c];
                    delete map[matchResult];
                }
            }
        }
    }
    // return a filtered version of the original list (preserves order and prevents duplication)
    var result = list.filter(function (item) { return map.hasOwnProperty(item); });
    core.debug(result.length + ' final results');
    return result;
}

function _cloneMatchOptions(matchOptions) {
    return {
        debug: matchOptions.debug,
        nobrace: matchOptions.nobrace,
        noglobstar: matchOptions.noglobstar,
        dot: matchOptions.dot,
        noext: matchOptions.noext,
        nocase: matchOptions.nocase,
        nonull: matchOptions.nonull,
        matchBase: matchOptions.matchBase,
        nocomment: matchOptions.nocomment,
        nonegate: matchOptions.nonegate,
        flipNegate: matchOptions.flipNegate
    };
}

function _startsWith(str, start) {
    return str.slice(0, start.length) == start;
}

function _isRooted(p) {
    p = _normalizeSeparators(p);
    if (!p) {
        throw new Error('isRooted() parameter "p" cannot be empty');
    }
    if (process.platform == 'win32') {
        return _startsWith(p, '\\') ||
            /^[A-Z]:/i.test(p); // e.g. C: or C:\hello
    }
    return _startsWith(p, '/'); // e.g. /hello
}

function _ensureRooted(root, p) {
    if (!root) {
        throw new Error('ensureRooted() parameter "root" cannot be empty');
    }
    if (!p) {
        throw new Error('ensureRooted() parameter "p" cannot be empty');
    }
    if (_isRooted(p)) {
        return p;
    }
    if (process.platform == 'win32' && root.match(/^[A-Z]:$/i)) {
        return root + p;
    }
    // ensure root ends with a separator
    if (_endsWith(root, '/') || (process.platform == 'win32' && _endsWith(root, '\\'))) {
    }
    else {
        root += path.sep; // append separator
    }
    return root + p;
}
function _normalizeSeparators(p) {
    p = p || '';
    if (process.platform == 'win32') {
        // convert slashes on Windows
        p = p.replace(/\//g, '\\');
        // remove redundant slashes
        var isUnc = /^\\\\+[^\\]/.test(p); // e.g. \\hello
        return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\'); // preserve leading // for UNC
    }
    // remove redundant slashes
    return p.replace(/\/\/+/g, '/');
}

function _endsWith(str, end) {
    return str.slice(-end.length) == end;
}