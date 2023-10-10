"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMetadataStore = void 0;
const lodash_1 = __importDefault(require("lodash"));
const neverthrow_1 = require("neverthrow");
const constants_1 = require("../constants");
const error_1 = require("../error");
const utils_1 = require("../utils");
class SchemaMetadataStore {
    constructor(fuseEngine) {
        this._schemaMetadataById = {};
        this._fuseEngine = fuseEngine;
    }
    dispose() {
        this._schemaMetadataById = {};
        this._fuseEngine.replaceSchemaIndex({});
    }
    /**
     * See {@link IDataStore.get}
     */
    async get(key) {
        const maybeSchema = this._schemaMetadataById[key];
        if (maybeSchema) {
            return { data: lodash_1.default.cloneDeep(maybeSchema) };
        }
        else {
            return {
                error: error_1.DendronError.createFromStatus({
                    status: constants_1.ERROR_STATUS.CONTENT_NOT_FOUND,
                    message: `SchemaModuleProps not found for key ${key}.`,
                    severity: constants_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
    }
    async find(_opts) {
        throw new Error("Method not implemented.");
    }
    /**
     * See {@link IDataStore.write}
     *
     * Add schema to _schemaMetadataById. If schema root id already exists, override existing schema
     */
    async write(key, data) {
        const maybeSchema = this._schemaMetadataById[data.root.id];
        this._schemaMetadataById[data.root.id] = data;
        if (maybeSchema) {
            // Fuse has no update. Must remove first
            this._fuseEngine.removeSchemaFromIndex(maybeSchema);
        }
        this._fuseEngine.addSchemaToIndex(data);
        return { data: key };
    }
    /**
     * See {@link IDataStore.delete}
     *
     * Remove schema from both _schemaMetadataById and fuseEngine.
     */
    async delete(key) {
        const maybeSchema = this._schemaMetadataById[key];
        if (maybeSchema) {
            this._fuseEngine.removeSchemaFromIndex(maybeSchema);
        }
        delete this._schemaMetadataById[key];
        return { data: key };
    }
    /**
     * See {@link IDataStore.query}
     */
    query(opts) {
        const schemaIds = this._fuseEngine.querySchema(opts);
        const items = Promise.all(schemaIds.map(async (ent) => {
            const resp = await this.get(ent.id);
            return resp.data;
        })).then((result) => result.filter(utils_1.isNotUndefined));
        return neverthrow_1.ResultAsync.fromSafePromise(Promise.resolve(items));
    }
}
exports.SchemaMetadataStore = SchemaMetadataStore;
//# sourceMappingURL=SchemaMetadataStore.js.map