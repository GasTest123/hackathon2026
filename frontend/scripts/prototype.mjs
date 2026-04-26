import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prototypeDir = resolve(projectRoot, "prototype");
const distDir = resolve(projectRoot, "dist/prototype");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(prototypeDir, distDir, { recursive: true });

console.log(`Built static prototype: ${prototypeDir} -> ${distDir}`);
