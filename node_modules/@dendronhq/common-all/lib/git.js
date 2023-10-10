"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVaultFromRepo = exports.getDependencyPathWithRemote = exports.remoteUrlToDependencyPath = exports.getRepoNameFromURL = exports.getOwnerAndRepoFromURL = exports.getGithubAccessTokenUrl = exports.git2Github = exports.getGithubEditUrl = exports.githubUrl = exports.canShowGitLink = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const vault_1 = require("./vault");
const formatString = (opts) => {
    const { txt, note } = opts;
    lodash_1.default.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const noteHierarchy = note.fname.replace(/\./g, "/");
    return lodash_1.default.template(txt)({ noteHierarchy });
};
/**
 *  NOTICE: Lots of the Git code is obtained from https://github.com/KnisterPeter/vscode-github, licened under MIT
 */
/**
 * Utilities for working with git urls
 */
function canShowGitLink(opts) {
    const { config, note } = opts;
    if (lodash_1.default.isBoolean((note.custom || {})[constants_1.RESERVED_KEYS.GIT_NO_LINK]) &&
        note.custom[constants_1.RESERVED_KEYS.GIT_NO_LINK]) {
        return false;
    }
    const githubConfig = utils_1.ConfigUtils.getGithubConfig(config);
    return githubConfig
        ? lodash_1.default.every([
            githubConfig.enableEditLink,
            githubConfig.editLinkText,
            githubConfig.editRepository,
            githubConfig.editBranch,
            githubConfig.editViewMode,
        ])
        : false;
}
exports.canShowGitLink = canShowGitLink;
function githubUrl(opts) {
    const url = getGithubEditUrl(opts);
    return url;
}
exports.githubUrl = githubUrl;
function getGithubEditUrl(opts) {
    const { note, config, wsRoot } = opts;
    const vault = note.vault;
    const vaults = utils_1.ConfigUtils.getVaults(config);
    const mvault = wsRoot
        ? vault_1.VaultUtils.matchVault({ wsRoot, vault, vaults })
        : vault_1.VaultUtils.matchVaultV2({ vault, vaults });
    const vaultUrl = lodash_1.default.get(mvault, "remote.url", false);
    const githubConfig = utils_1.ConfigUtils.getGithubConfig(config);
    const gitRepoUrl = githubConfig === null || githubConfig === void 0 ? void 0 : githubConfig.editRepository;
    // if we have a vault, we don't need to include the vault name as an offset
    if (mvault && vaultUrl) {
        return lodash_1.default.join([
            git2Github(vaultUrl),
            githubConfig === null || githubConfig === void 0 ? void 0 : githubConfig.editViewMode,
            githubConfig === null || githubConfig === void 0 ? void 0 : githubConfig.editBranch,
            note.fname + ".md",
        ], "/");
    }
    let gitNotePath = lodash_1.default.join([vault_1.VaultUtils.getRelPath(vault), note.fname + ".md"], "/");
    if (lodash_1.default.has(note === null || note === void 0 ? void 0 : note.custom, constants_1.RESERVED_KEYS.GIT_NOTE_PATH)) {
        gitNotePath = formatString({
            txt: note.custom[constants_1.RESERVED_KEYS.GIT_NOTE_PATH],
            note,
        });
    }
    // this assumes we have a workspace url
    return lodash_1.default.join([
        gitRepoUrl,
        githubConfig === null || githubConfig === void 0 ? void 0 : githubConfig.editViewMode,
        githubConfig === null || githubConfig === void 0 ? void 0 : githubConfig.editBranch,
        gitNotePath,
    ], "/");
}
exports.getGithubEditUrl = getGithubEditUrl;
function git2Github(gitUrl) {
    // 'git@github.com:kevinslin/dendron-vault.git'
    // @ts-ignore
    const [_, userAndRepo] = gitUrl.split(":");
    const [user, repo] = userAndRepo.split("/");
    return `https://github.com/${user}/${path_1.default.basename(repo, ".git")}`;
}
exports.git2Github = git2Github;
/**
 * Convert a github repo orul to access token format
 */
function getGithubAccessTokenUrl(opts) {
    const { remotePath, accessToken } = opts;
    let repoPath;
    if (remotePath.startsWith("https://")) {
        repoPath = remotePath.split("/").slice(-2).join("/");
    }
    else {
        repoPath = opts.remotePath.split(":").slice(-1)[0];
    }
    return `https://${accessToken}:x-oauth-basic@github.com/${repoPath}`;
}
exports.getGithubAccessTokenUrl = getGithubAccessTokenUrl;
function getOwnerAndRepoFromURL(url) {
    const [owner, repo] = url.split("/").slice(-2);
    return { owner, repo };
}
exports.getOwnerAndRepoFromURL = getOwnerAndRepoFromURL;
function getRepoNameFromURL(url) {
    return path_1.default.basename(url, ".git");
}
exports.getRepoNameFromURL = getRepoNameFromURL;
/** Find the dependency path for a vault given the remote url. You can use
 * this even if the vault has no remote.
 *
 * This is the relative path within the dependencies folder, like
 * `github.com/dendronhq/dendron-site`. For more details see the
 * [[Self Contained Vaults RFC|dendron://dendron.docs/rfc.42-self-contained-vaults]]
 */
function remoteUrlToDependencyPath({ vaultName, url, }) {
    var _a, _b, _c, _d;
    // If no remote URL exists, then it's a local vault. We keep these in a
    // local-only folder.
    if (url === undefined)
        return constants_1.FOLDERS.LOCAL_DEPENDENCY;
    // Check if it matches any web URLs like
    // https://github.com/dendronhq/dendron-site.git This may also look like
    // http://example.com:8000/dendronhq/dendron-site.git, we skip the port
    const webMatch = 
    // starts with http:// or https://
    // followed by the domain, which will continue until we hit /
    // if we see a port definition like :8000, we skip it for simplicity
    // then we have the path of the URL, like dendronhq/dendron-site
    // finally, if there's a `.git` we'll discard that for a cleaner name
    /^(https?:\/\/)(?<domain>[^/:]+)(:[0-9]+)?\/(?<path>.+?)(\.git)?$/.exec(url);
    if (((_a = webMatch === null || webMatch === void 0 ? void 0 : webMatch.groups) === null || _a === void 0 ? void 0 : _a.domain) && ((_b = webMatch === null || webMatch === void 0 ? void 0 : webMatch.groups) === null || _b === void 0 ? void 0 : _b.path)) {
        // matched a HTTP/S git remote
        return path_1.default.join(webMatch.groups.domain, 
        // Normalize for Windows so forward slashes are converted to backward ones
        path_1.default.normalize(webMatch.groups.path));
    }
    // Check if it matches any SSH URLs like
    // git@github.com:dendronhq/dendron-site.git This may also look like
    // git@example.com:220/dendronhq/dendron-site.git, we skip the port and the
    const sshMatch = 
    // SSH urls start with a user, like git@ or gitlab@, which we skip
    // followed by the domain, which will continue until we hit :
    // if we see a port definition like :8000, we skip it for simplicity
    // then we have the path of the URL, like dendronhq/dendron-site
    // this path may optionally begin with a /, which we'll skip
    // finally, if there's a `.git` we'll discard that for a cleaner name
    /^([^@]+@)(?<domain>[^:/]+):([0-9]+\/)?\/?(?<path>.+?)(\.git)?$/.exec(url);
    if (((_c = sshMatch === null || sshMatch === void 0 ? void 0 : sshMatch.groups) === null || _c === void 0 ? void 0 : _c.domain) && ((_d = sshMatch === null || sshMatch === void 0 ? void 0 : sshMatch.groups) === null || _d === void 0 ? void 0 : _d.path)) {
        // matched a HTTP/S git remote
        return path_1.default.join(sshMatch.groups.domain, 
        // Normalize for Windows so forward slashes are converted to backward ones
        path_1.default.normalize(sshMatch.groups.path));
    }
    // If none of these worked, try to make a fallback path. This may be because
    // the remote points to a local directory, or because it's something we
    // didn't expect.
    const fallback = lodash_1.default.findLast(url.split(/[/\\]/), (part) => part.length > 0);
    if (fallback)
        return fallback;
    // Fallback for the fallback: if all else fails, just use the vault name
    return vaultName;
}
exports.remoteUrlToDependencyPath = remoteUrlToDependencyPath;
/** If this vault had this remote, what path should it be stored under?
 *
 * If the remote is null, then you'll get the path should be if the vault was a local vault.
 */
function getDependencyPathWithRemote({ vault, remote, }) {
    var _a, _b;
    const vaultName = (_b = (_a = vault.name) !== null && _a !== void 0 ? _a : 
    // if the vault has no name, compute one based on the path
    lodash_1.default.findLast(vault.fsPath.split(/[/\\]/), (part) => part.length > 0)) !== null && _b !== void 0 ? _b : 
    // Fall back to fsPath directly if the calculation fails
    vault.fsPath;
    if (!remote) {
        // local
        return path_1.default.join(constants_1.FOLDERS.DEPENDENCIES, constants_1.FOLDERS.LOCAL_DEPENDENCY, vaultName);
    }
    else {
        return path_1.default.join(constants_1.FOLDERS.DEPENDENCIES, remoteUrlToDependencyPath({
            vaultName,
            url: remote,
        }));
    }
}
exports.getDependencyPathWithRemote = getDependencyPathWithRemote;
function getVaultFromRepo(opts) {
    const { repoPath, wsRoot } = opts;
    return {
        fsPath: path_1.default.relative(wsRoot, repoPath),
        remote: { type: "git", url: opts.repoUrl },
    };
}
exports.getVaultFromRepo = getVaultFromRepo;
//# sourceMappingURL=git.js.map