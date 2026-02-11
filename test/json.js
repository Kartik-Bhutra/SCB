import { readFileSync } from "fs";

const cert = JSON.parse(readFileSync(new URL("../cert.json", import.meta.url)));

console.log(JSON.stringify(cert));
