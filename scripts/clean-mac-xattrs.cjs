const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
async function clearAttrs(filePath) {
  try {
    await execFileAsync("xattr", ["-c", "-s", filePath], { maxBuffer: 1024 * 1024 });
  } catch {
    // xattr returns non-zero for paths without attributes on some macOS versions.
  }
}

async function walk(root, callback) {
  await callback(root);
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const child = path.join(root, entry.name);
    if (entry.isDirectory()) await walk(child, callback);
    else await callback(child);
  }
}

exports.default = async function cleanMacXattrs(context) {
  if (context.electronPlatformName !== "darwin") return;
  console.log(`cleaning macOS extended attributes in ${context.appOutDir}`);
  try {
    await execFileAsync("xattr", ["-c", "-r", "-s", context.appOutDir], { maxBuffer: 1024 * 1024 });
  } catch {
    await walk(context.appOutDir, clearAttrs);
  }
};
