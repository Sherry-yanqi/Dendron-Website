import { StatusCodes } from "../constants";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import { NotePropsMeta, RespV3, QueryNotesOpts } from "../types";
import { FindNoteOpts } from "../types/FindNoteOpts";
import { ResultAsync } from "../utils";
import { INoteMetadataStore } from "./IMetadataStore";
export declare class NoteMetadataStore implements INoteMetadataStore {
    /**
     * Map of noteId -> noteProp metadata
     */
    private _noteMetadataById;
    /**
     * Map of noteFname -> list of noteIds. Since fname is not unique across vaults, there can be multiple ids with the same fname
     */
    private _noteIdsByFname;
    private _fuseEngine;
    constructor(fuseEngine: FuseEngine);
    dispose(): void;
    /**
     * See {@link IDataStore.get}
     */
    get(key: string): Promise<RespV3<NotePropsMeta>>;
    /**
     * See {@link IDataStore.find}
     */
    find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>>;
    /**
     * See {@link IDataStore.write}
     *
     * Add note to _noteMetadataById and _noteIdsByFname.
     * If note id already exists, check to see if it corresponds to same note by fname.
     * If fname match, then we only need to update _noteMetadataById. If fname doesn't match, remove old id from _noteIdsByFname first before updating both.
     *
     * Otherwise, if note id doesn't exist, add to both dictionaries
     */
    write(key: string, data: NotePropsMeta): Promise<RespV3<string>>;
    /**
     * See {@link IDataStore.delete}
     *
     * Remove note from both _noteMetadataById and _noteIdsByFname.
     */
    delete(key: string): Promise<RespV3<string>>;
    /**
     * See {@link IDataStore.query}
     */
    query(opts: QueryNotesOpts): ResultAsync<NotePropsMeta[], DendronError<StatusCodes | undefined>>;
}
