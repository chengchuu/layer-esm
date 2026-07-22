/* eslint-env node */

import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  cp,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_NAME = "prefer-layer";
const TEMP_PREFIX = `.${SKILL_NAME}-sync-`;

const fail = (message) => {
  throw new Error(message);
};

const pathExists = async (filePath) => {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const parseArgs = (argv) => {
  const options = { check: false, dryRun: false, target: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--target") {
      if (options.target) fail("--target may only be provided once.");
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        fail("--target requires a repository path.");
      }
      options.target = value;
      index += 1;
    } else {
      fail(`Unsupported argument: ${argument}`);
    }
  }
  if (options.check && options.dryRun) {
    fail("--check and --dry-run cannot be combined.");
  }
  return options;
};

const run = (command, args, cwd, environment = process.env) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    fail(
      result.stderr.trim() || result.stdout.trim() || `Exit ${result.status}`
    );
  }
  return result.stdout.trim();
};

const collectTree = async (root) => {
  const tree = new Map();
  if (!(await pathExists(root))) return tree;
  const rootStats = await lstat(root);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    fail(`Expected a regular directory: ${root}`);
  }

  const walk = async (directory, relativeDirectory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.join(relativeDirectory, entry.name);
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink()) {
        fail(`Symbolic links are not synchronized: ${absolutePath}`);
      }
      if (stats.isDirectory()) {
        tree.set(relativePath, { type: "directory" });
        await walk(absolutePath, relativePath);
      } else if (stats.isFile()) {
        tree.set(relativePath, {
          type: "file",
          content: await readFile(absolutePath),
        });
      } else {
        fail(`Unsupported skill entry: ${absolutePath}`);
      }
    }
  };

  await walk(root, "");
  return tree;
};

const compareTrees = (sourceTree, targetTree) => {
  const changes = { added: [], updated: [], removed: [] };
  for (const [relativePath, source] of sourceTree) {
    const target = targetTree.get(relativePath);
    if (!target) {
      changes.added.push(relativePath);
    } else if (
      source.type !== target.type ||
      (source.type === "file" && !source.content.equals(target.content))
    ) {
      changes.updated.push(relativePath);
    }
  }
  for (const relativePath of targetTree.keys()) {
    if (!sourceTree.has(relativePath)) changes.removed.push(relativePath);
  }
  Object.values(changes).forEach((values) => values.sort());
  return changes;
};

const hasChanges = (changes) =>
  changes.added.length > 0 ||
  changes.updated.length > 0 ||
  changes.removed.length > 0;

const printSummary = (changes) => {
  console.log(
    `prefer-layer sync: ${changes.added.length} added, ${changes.updated.length} updated, ${changes.removed.length} removed.`
  );
  for (const [kind, values] of Object.entries(changes)) {
    values.forEach((value) => console.log(`  ${kind}: ${value}`));
  }
};

const parseFrontmatterScalar = (value, filePath, key) => {
  const doubleQuoted = /^("(?:[^"\\]|\\.)*")\s*(?:#.*)?$/.exec(value);
  if (doubleQuoted) {
    try {
      return JSON.parse(doubleQuoted[1]);
    } catch {
      fail(`${filePath} has an invalid quoted value for ${key}.`);
    }
  }
  const singleQuoted = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(value);
  if (singleQuoted) {
    return singleQuoted[1].replace(/''/g, "'");
  }
  return value.replace(/\s+#.*$/, "").trim();
};

const parseFrontmatter = (markdown, filePath) => {
  const lines = markdown.split(/\r?\n/);
  if (lines[0] !== "---") {
    fail(`${filePath} must start with YAML frontmatter.`);
  }
  const endIndex = lines.indexOf("---", 1);
  if (endIndex === -1) {
    fail(`${filePath} has unterminated YAML frontmatter.`);
  }

  const fields = new Map();
  for (let index = 1; index < endIndex; index += 1) {
    const line = lines[index];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (/^\s/.test(line)) continue;
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match || fields.has(match[1])) continue;

    const blockScalar = /^[|>][+-]?\s*(?:#.*)?$/.test(match[2]);
    if (!blockScalar) {
      fields.set(
        match[1],
        parseFrontmatterScalar(match[2], filePath, match[1])
      );
      continue;
    }

    const blockLines = [];
    while (index + 1 < endIndex && /^\s|^$/.test(lines[index + 1])) {
      index += 1;
      blockLines.push(lines[index].trim());
    }
    fields.set(match[1], blockLines.filter(Boolean).join(" "));
  }
  return fields;
};

const validateSource = async (sourcePath) => {
  const required = [
    "SKILL.md",
    path.join("agents", "openai.yaml"),
    path.join("references", "layer-api-map.md"),
  ];
  for (const relativePath of required) {
    if (!(await pathExists(path.join(sourcePath, relativePath)))) {
      fail(`Canonical skill is missing ${relativePath}.`);
    }
  }
  const skillPath = path.join(sourcePath, "SKILL.md");
  const fields = parseFrontmatter(await readFile(skillPath, "utf8"), skillPath);
  if (fields.get("name") !== SKILL_NAME) {
    fail(
      `Canonical SKILL.md must declare name: ${SKILL_NAME}; found ${
        fields.get("name") || "nothing"
      }.`
    );
  }
  if (!fields.get("description")?.trim()) {
    fail("Canonical SKILL.md must contain a non-empty description.");
  }
  return collectTree(sourcePath);
};

const validatePublicRepository = async (requestedRoot) => {
  const resolved = path.resolve(requestedRoot);
  if (resolved === path.parse(resolved).root || !(await pathExists(resolved))) {
    fail(`Unsafe or missing public repository path: ${resolved}`);
  }
  const rootStats = await lstat(resolved);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    fail(`Public repository must be a regular directory: ${resolved}`);
  }
  const repositoryRoot = await realpath(resolved);
  const gitRoot = await realpath(
    run("git", ["rev-parse", "--show-toplevel"], repositoryRoot)
  );
  if (gitRoot !== repositoryRoot) {
    fail(`Target must be the public Git repository root: ${repositoryRoot}`);
  }

  const packageJson = JSON.parse(
    await readFile(path.join(repositoryRoot, "package.json"), "utf8")
  );
  if (packageJson.name !== "chengchuu-skills") {
    fail(`Unexpected public repository package: ${packageJson.name}`);
  }
  const manifest = JSON.parse(
    await readFile(
      path.join(repositoryRoot, ".codex-plugin", "plugin.json"),
      "utf8"
    )
  );
  if (manifest.skills !== "./skills/") {
    fail('Public plugin manifest must declare "skills": "./skills/".');
  }

  const skillsDirectory = path.join(repositoryRoot, "skills");
  const targetPath = path.join(skillsDirectory, SKILL_NAME);
  const validatorPath = path.join(
    repositoryRoot,
    "scripts",
    "validate-skills.mjs"
  );
  if (
    !(await pathExists(skillsDirectory)) ||
    !(await pathExists(validatorPath))
  ) {
    fail(`Unsafe or incomplete public skill destination: ${targetPath}`);
  }
  const skillsStats = await lstat(skillsDirectory);
  const validatorStats = await lstat(validatorPath);
  const canonicalSkillsDirectory = await realpath(skillsDirectory);
  const canonicalValidatorPath = await realpath(validatorPath);
  if (
    !skillsStats.isDirectory() ||
    skillsStats.isSymbolicLink() ||
    canonicalSkillsDirectory !== skillsDirectory ||
    !validatorStats.isFile() ||
    validatorStats.isSymbolicLink() ||
    canonicalValidatorPath !== validatorPath ||
    !isInside(repositoryRoot, skillsDirectory) ||
    !isInside(repositoryRoot, validatorPath) ||
    path.relative(skillsDirectory, targetPath) !== SKILL_NAME
  ) {
    fail(`Unsafe or ambiguous public skill destination: ${targetPath}`);
  }
  const interrupted = (await readdir(skillsDirectory)).filter((name) =>
    name.startsWith(TEMP_PREFIX)
  );
  if (interrupted.length > 0) {
    fail(
      `Interrupted synchronization artifacts found: ${interrupted.join(", ")}`
    );
  }
  return { repositoryRoot, skillsDirectory, targetPath, validatorPath };
};

const runPublicValidator = (repository, ignoredPath = "") => {
  run(process.execPath, [repository.validatorPath], repository.repositoryRoot, {
    ...process.env,
    SKILLS_VALIDATOR_IGNORE_PATH: ignoredPath,
  });
};

const synchronize = async (sourcePath, sourceTree, repository) => {
  const temporaryRoot = await mkdtemp(
    path.join(repository.skillsDirectory, TEMP_PREFIX)
  );
  const stagedPath = path.join(temporaryRoot, "staged");
  const backupPath = path.join(temporaryRoot, "backup");
  let oldTargetMoved = false;
  let newTargetInstalled = false;

  try {
    await cp(sourcePath, stagedPath, {
      recursive: true,
      force: false,
      errorOnExist: true,
      preserveTimestamps: true,
    });
    if (hasChanges(compareTrees(sourceTree, await collectTree(stagedPath)))) {
      fail("Staged copy does not exactly match the canonical skill.");
    }
    if (await pathExists(repository.targetPath)) {
      await rename(repository.targetPath, backupPath);
      oldTargetMoved = true;
    }
    await rename(stagedPath, repository.targetPath);
    newTargetInstalled = true;
    runPublicValidator(repository, temporaryRoot);
    await rm(temporaryRoot, { recursive: true, force: true });
  } catch (error) {
    if (newTargetInstalled && (await pathExists(repository.targetPath))) {
      await rm(repository.targetPath, { recursive: true, force: true });
    }
    if (oldTargetMoved && (await pathExists(backupPath))) {
      await rename(backupPath, repository.targetPath);
    }
    if (await pathExists(temporaryRoot)) {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
    throw error;
  }
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
  );
  const sourcePath = path.join(repositoryRoot, ".agents", "skills", SKILL_NAME);
  if (!isInside(repositoryRoot, sourcePath)) {
    fail(`Unsafe canonical source path: ${sourcePath}`);
  }
  const publicRoot =
    options.target ??
    process.env.LAYER_ESM_SKILLS_REPO ??
    path.resolve(repositoryRoot, "..", "skills");
  const sourceTree = await validateSource(sourcePath);
  const publicRepository = await validatePublicRepository(publicRoot);
  const changes = compareTrees(
    sourceTree,
    await collectTree(publicRepository.targetPath)
  );
  printSummary(changes);

  if (options.check) {
    if (hasChanges(changes)) {
      console.error("Synchronization check failed.");
      process.exitCode = 1;
    } else {
      runPublicValidator(publicRepository);
      console.log("Synchronization check passed.");
    }
    return;
  }
  if (options.dryRun) {
    console.log("Dry run complete; no files changed.");
    return;
  }
  if (hasChanges(changes)) {
    await synchronize(sourcePath, sourceTree, publicRepository);
  } else {
    runPublicValidator(publicRepository);
  }
  if (
    hasChanges(
      compareTrees(sourceTree, await collectTree(publicRepository.targetPath))
    )
  ) {
    fail("Public copy differs from the canonical skill after synchronization.");
  }
  console.log("Public prefer-layer skill is synchronized and valid.");
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
