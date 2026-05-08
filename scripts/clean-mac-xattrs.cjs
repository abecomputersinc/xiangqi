const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const ATTRS = [
  "com.apple.provenance",
  "com.apple.FinderInfo",
  "com.apple.ResourceFork",
  "com.apple.fileprovider.fpfs#P",
];

async function removeAttr(filePath, attr) {
  try {
    await execFileAsync("xattr", ["-d", attr, filePath], { maxBuffer: 1024 * 1024 });
  } catch {
    // xattr returns non-zero when the attribute is absent or protected.
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
  await walk(context.appOutDir, async filePath => {
    for (const attr of ATTRS) await removeAttr(filePath, attr);
  });
};
