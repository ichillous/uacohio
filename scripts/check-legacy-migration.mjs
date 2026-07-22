import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expectedHashes = new Map([
  [
    "drizzle/0000_thankful_ricochet.sql",
    "87c673480791e3cdd124757e84345d0b18c5bbbf502184ec2460d2dbc7a86717",
  ],
  [
    "drizzle/0000_thankful_ricochet.down.sql",
    "37fccfbf3c5a0da5755b886d9779f7d89e0deb54f09e3daf662c2cc3d87b0afb",
  ],
  [
    "drizzle/meta/0000_snapshot.json",
    "da8be9814fc8267ba7a069a7029e0efc4de53dba078a3f3da3856a5c2d27fa49",
  ],
  [
    "drizzle/meta/_journal.json",
    "1b46bcdf78575b99426615f8cf9669a1e36eb9ceb593167170f0b7f3def818d4",
  ],
]);

for (const [path, expected] of expectedHashes) {
  const actual = createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

  if (actual !== expected) {
    throw new Error(`Historical MySQL migration evidence changed: ${path}`);
  }
}

console.log("Historical MySQL migration evidence is unchanged.");
