import { createHash } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: node scripts/hash-admin-password.mjs <password-of-at-least-10-characters>");
  process.exit(1);
}

const hash = createHash("sha256").update(password, "utf8").digest("hex");
console.log(`sha256-hex:${hash}`);
