"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultUtils = void 0;
const neverthrow_1 = require("neverthrow");
class ResultUtils {
    static PromiseRespV3ToResultAsync(p) {
        return neverthrow_1.ResultAsync.fromPromise(p, (err) => err).andThen((resp) => {
            if (resp.error) {
                return (0, neverthrow_1.errAsync)(resp.error);
            }
            return (0, neverthrow_1.okAsync)(resp.data);
        });
    }
}
exports.ResultUtils = ResultUtils;
//# sourceMappingURL=ResultUtils.js.map