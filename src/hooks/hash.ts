import { createHmac } from "node:crypto";
import { HASH_KEY } from "../../env";

export function hashToBuffer(text : string){
    return createHmac("SHA256",HASH_KEY).update(text).digest();
}