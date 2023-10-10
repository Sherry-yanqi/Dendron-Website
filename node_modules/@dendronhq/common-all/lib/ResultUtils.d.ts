import { ResultAsync } from "neverthrow";
import { DendronError } from ".";
import { RespV3 } from "./types";
export declare class ResultUtils {
    static PromiseRespV3ToResultAsync<T>(p: Promise<RespV3<T>>): ResultAsync<T, DendronError<import("http-status-codes/build/cjs/status-codes").StatusCodes | undefined>>;
}
