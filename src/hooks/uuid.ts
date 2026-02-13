import { UUID } from "node:crypto";

export function uuidToBuffer(uuid: UUID) {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

export function bufferToUuid(buffer: Buffer): UUID {
  const hex = buffer.toString("hex");

  return (hex.substring(0, 8) +
    "-" +
    hex.substring(8, 12) +
    "-" +
    hex.substring(12, 16) +
    "-" +
    hex.substring(16, 20) +
    "-" +
    hex.substring(20)) as UUID;
}
