import { createHash, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: node scripts/hash-admin-password.mjs <password-of-at-least-10-characters>");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = createHash("sha256").update(salt).update(password, "utf8").digest();
console.log(`sha256-salted:${salt.toString("base64")}:${hash.toString("base64")}`);
