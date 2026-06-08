#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

const type = process.argv[2] || "patch";
const [major, minor, patch] = pkg.version.split(".").map(Number);

let newVersion;
switch (type) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

const oldVersion = pkg.version;
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

try {
  execSync(`git add package.json`, { cwd: path.join(__dirname, ".."), stdio: "ignore" });
  execSync(`git tag v${newVersion}`, { cwd: path.join(__dirname, ".."), stdio: "ignore" });
  console.log(`✓ v${oldVersion} → v${newVersion} (tagged)`);
} catch {
  console.log(`✓ v${oldVersion} → v${newVersion}`);
}
