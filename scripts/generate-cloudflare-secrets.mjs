import { randomBytes } from "node:crypto";

console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
console.log(`DATA_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`);
console.log(`DATA_HASH_SECRET=${randomBytes(48).toString("base64url")}`);
