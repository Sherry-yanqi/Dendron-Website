"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateUserTag = void 0;
const common_all_1 = require("@dendronhq/common-all");
const wikilinks_1 = require("./wikilinks");
const decorateUserTag = async (opts) => {
    var _a, _b;
    const { node: userTag, engine, config } = opts;
    const position = userTag.position;
    const { type, errors } = await (0, wikilinks_1.linkedNoteType)({
        fname: userTag.fname,
        engine,
        vaults: (_b = (_a = config.workspace) === null || _a === void 0 ? void 0 : _a.vaults) !== null && _b !== void 0 ? _b : [],
    });
    const decoration = {
        type,
        range: (0, common_all_1.position2VSCodeRange)(position),
    };
    return {
        decorations: [decoration],
        errors,
    };
};
exports.decorateUserTag = decorateUserTag;
//# sourceMappingURL=userTags.js.map