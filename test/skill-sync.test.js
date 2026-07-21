/* eslint-disable no-undef */

const { spawnSync } = require("node:child_process");
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const syncScript = path.join(
  repoRoot,
  "scripts",
  "sync-prefer-layer-skill.mjs"
);
const canonicalSkill = path.join(repoRoot, ".agents", "skills", "prefer-layer");
const temporaryRoots = [];

const makeTemporaryDirectory = (prefix) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(directory);
  return directory;
};

const writeFile = (filePath, content) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
};

const createPublicRepository = (validator = "") => {
  const root = makeTemporaryDirectory("prefer-layer-public-");
  mkdirSync(path.join(root, "skills"), { recursive: true });
  writeFile(
    path.join(root, "package.json"),
    `${JSON.stringify({ name: "chengchuu-skills" }, null, 2)}\n`
  );
  writeFile(
    path.join(root, ".codex-plugin", "plugin.json"),
    `${JSON.stringify({ skills: "./skills/" }, null, 2)}\n`
  );
  writeFile(
    path.join(root, "scripts", "validate-skills.mjs"),
    validator || 'console.log("fixture validation passed");\n'
  );
  const git = spawnSync("git", ["init", "--quiet"], {
    cwd: root,
    encoding: "utf8",
  });
  if (git.status !== 0) {
    throw new Error(git.stderr || "Unable to initialize Git fixture.");
  }
  return root;
};

const runSync = (target, args = [], script = syncScript) => {
  return spawnSync(process.execPath, [script, ...args, "--target", target], {
    cwd: repoRoot,
    encoding: "utf8",
  });
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

test("skill sync replaces the complete destination without staging files", () => {
  const publicRoot = createPublicRepository();
  const target = path.join(publicRoot, "skills", "prefer-layer");
  writeFile(path.join(target, "obsolete.txt"), "obsolete\n");

  const result = runSync(publicRoot);

  expect(result.status).toBe(0);
  expect(existsSync(path.join(target, "obsolete.txt"))).toBe(false);
  [
    "SKILL.md",
    path.join("agents", "openai.yaml"),
    path.join("references", "layer-api-map.md"),
  ].forEach((relativePath) => {
    expect(readFileSync(path.join(target, relativePath))).toEqual(
      readFileSync(path.join(canonicalSkill, relativePath))
    );
  });
  expect(
    readdirSync(path.join(publicRoot, "skills")).some((name) =>
      name.startsWith(".prefer-layer-sync-")
    )
  ).toBe(false);
  expect(
    spawnSync("git", ["diff", "--cached", "--quiet"], {
      cwd: publicRoot,
    }).status
  ).toBe(0);
});

test("check and dry-run report drift without modifying the destination", () => {
  const publicRoot = createPublicRepository();
  const target = path.join(publicRoot, "skills", "prefer-layer");
  writeFile(path.join(target, "existing.txt"), "keep\n");

  expect(runSync(publicRoot, ["--check"]).status).toBe(1);
  expect(runSync(publicRoot, ["--dry-run"]).status).toBe(0);
  expect(readFileSync(path.join(target, "existing.txt"), "utf8")).toBe(
    "keep\n"
  );
  expect(existsSync(path.join(target, "SKILL.md"))).toBe(false);
});

test("skill sync restores the previous copy when public validation fails", () => {
  const publicRoot = createPublicRepository(
    'console.error("fixture validation failed"); process.exitCode = 1;\n'
  );
  const target = path.join(publicRoot, "skills", "prefer-layer");
  writeFile(path.join(target, "original.txt"), "original\n");

  const result = runSync(publicRoot);

  expect(result.status).toBe(1);
  expect(readFileSync(path.join(target, "original.txt"), "utf8")).toBe(
    "original\n"
  );
  expect(existsSync(path.join(target, "SKILL.md"))).toBe(false);
  expect(
    readdirSync(path.join(publicRoot, "skills")).some((name) =>
      name.startsWith(".prefer-layer-sync-")
    )
  ).toBe(false);
});

test("skill sync rejects repository-owned paths that are symbolic links", () => {
  const publicRoot = createPublicRepository();
  const externalSkills = makeTemporaryDirectory("prefer-layer-external-");
  const skillsPath = path.join(publicRoot, "skills");
  rmSync(skillsPath, { recursive: true });
  symlinkSync(
    externalSkills,
    skillsPath,
    process.platform === "win32" ? "junction" : "dir"
  );

  expect(runSync(publicRoot).status).toBe(1);
  expect(readdirSync(externalSkills)).toEqual([]);

  if (process.platform === "win32") {
    return;
  }

  rmSync(skillsPath);
  mkdirSync(skillsPath);
  const validatorPath = path.join(publicRoot, "scripts", "validate-skills.mjs");
  const externalValidator = path.join(
    makeTemporaryDirectory("prefer-layer-validator-"),
    "validate.mjs"
  );
  writeFile(externalValidator, 'console.log("external");\n');
  rmSync(validatorPath);
  symlinkSync(externalValidator, validatorPath, "file");

  expect(runSync(publicRoot).status).toBe(1);
  expect(readdirSync(skillsPath)).toEqual([]);
});

test("skill sync accepts CRLF frontmatter with reordered fields", () => {
  const publicRoot = createPublicRepository();
  const fixtureRoot = makeTemporaryDirectory("prefer-layer-source-");
  const fixtureScript = path.join(
    fixtureRoot,
    "scripts",
    "sync-prefer-layer-skill.mjs"
  );
  const fixtureSkill = path.join(
    fixtureRoot,
    ".agents",
    "skills",
    "prefer-layer"
  );
  writeFile(fixtureScript, readFileSync(syncScript));
  writeFile(
    path.join(fixtureSkill, "SKILL.md"),
    "---\r\ndescription: Test description\r\nname: prefer-layer\r\n---\r\n\r\n# Test\r\n"
  );
  writeFile(
    path.join(fixtureSkill, "agents", "openai.yaml"),
    'interface:\n  display_name: "Test"\n'
  );
  writeFile(
    path.join(fixtureSkill, "references", "layer-api-map.md"),
    "# API map\n"
  );

  const result = runSync(publicRoot, [], fixtureScript);

  expect(result.status).toBe(0);
  expect(
    readFileSync(
      path.join(publicRoot, "skills", "prefer-layer", "SKILL.md"),
      "utf8"
    )
  ).toContain("description: Test description\r\nname: prefer-layer");
});

test("prefer-layer API map covers root exports and has valid tables", () => {
  const source = readFileSync(path.join(repoRoot, "src", "index.ts"), "utf8");
  const apiMap = readFileSync(
    path.join(canonicalSkill, "references", "layer-api-map.md"),
    "utf8"
  );
  const exportNames = [
    ...source.matchAll(/export (?:type )?\{([\s\S]*?)\n\};/g),
  ].flatMap((match) =>
    match[1]
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const publicNames = new Set(["default", "layerStyles", ...exportNames]);

  expect(
    [...publicNames].filter((name) => !apiMap.includes(`\`${name}\``))
  ).toEqual([]);

  const tableGroups = [];
  let currentTable = [];
  apiMap.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("|")) {
      currentTable.push(line);
    } else if (currentTable.length > 0) {
      tableGroups.push(currentTable);
      currentTable = [];
    }
  });
  if (currentTable.length > 0) tableGroups.push(currentTable);

  const countColumns = (line) => {
    let pipes = 0;
    for (let index = 0; index < line.length; index += 1) {
      if (line[index] === "|" && line[index - 1] !== "\\") pipes += 1;
    }
    return pipes - 1;
  };
  tableGroups.forEach((table) => {
    expect(new Set(table.map(countColumns)).size).toBe(1);
  });
});
