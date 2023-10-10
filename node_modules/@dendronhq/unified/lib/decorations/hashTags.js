"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateTag = exports.decorateHashTag = exports.isDecorationHashTag = void 0;
const common_all_1 = require("@dendronhq/common-all");
const wikilinks_1 = require("./wikilinks");
function isDecorationHashTag(decoration) {
    return decoration.color !== undefined;
}
exports.isDecorationHashTag = isDecorationHashTag;
const decorateHashTag = (opts) => {
    const { node: hashtag, engine, config } = opts;
    const { position } = hashtag;
    return decorateTag({
        fname: hashtag.fname,
        engine,
        position,
        config,
    });
};
exports.decorateHashTag = decorateHashTag;
async function decorateTag({ fname, engine, position, lineOffset, config, }) {
    var _a, _b;
    let color;
    const hashtag = (await engine.findNotesMeta({ fname }))[0];
    const { color: foundColor, type: colorType } = common_all_1.NoteUtils.color({
        fname,
        note: hashtag,
    });
    const enableRandomlyColoredTags = common_all_1.ConfigUtils.getPublishing(config).enableRandomlyColoredTags;
    if (colorType === "configured" || enableRandomlyColoredTags) {
        color = foundColor;
    }
    const { type, errors } = await (0, wikilinks_1.linkedNoteType)({
        fname,
        engine,
        vaults: (_b = (_a = config.workspace) === null || _a === void 0 ? void 0 : _a.vaults) !== null && _b !== void 0 ? _b : [],
    });
    const decoration = {
        type,
        range: (0, common_all_1.position2VSCodeRange)(position, { line: lineOffset }),
        color,
    };
    return { errors, decorations: [decoration] };
}
exports.decorateTag = decorateTag;
//# sourceMappingURL=hashTags.js.map