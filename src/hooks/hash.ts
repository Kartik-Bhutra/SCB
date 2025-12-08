import { createHmac } from "node:crypto";
import { HASH_KEY } from "../../env";

export function hash(text : string){
    return createHmac("SHA256",HASH_KEY).update(text).digest();
}