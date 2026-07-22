const { existsSync, readFileSync, readdirSync, statSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const guides = path.join(root, "guides");
const generatedDocs = path.join(root, "docs");
const obsoleteReleaseNotes = path.join(root, "release-notes");
const failures = [];
const headingCache = new Map();
let localLinkCount = 0;

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory()
      ? markdownFiles(file)
      : file.endsWith(".md")
      ? [file]
      : [];
  });
}

function markdownWithoutCode(source) {
  return source
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]*`/g, "");
}

function localTargets(source) {
  const markdown = markdownWithoutCode(source);
  const inline = [...markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map(
    (match) =>
      match[1]
        .trim()
        .replace(/^<|>$/g, "")
        .split(/\s+["']/)[0]
  );
  const references = [...markdown.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)].map(
    (match) => match[1].trim().replace(/^<|>$/g, "")
  );
  return [...inline, ...references].filter(
    (target) =>
      target &&
      !target.startsWith("/") &&
      !target.startsWith("//") &&
      !/^[a-z][a-z\d+.-]*:/i.test(target)
  );
}

function headingAnchors(file) {
  if (headingCache.has(file)) return headingCache.get(file);
  const counts = new Map();
  const anchors = new Set();
  const source = readFileSync(file, "utf8")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
  for (const match of source.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = match[1]
      .replace(/!?\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[`*_~]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    anchors.add(count ? `${base}-${count}` : base);
  }
  headingCache.set(file, anchors);
  return anchors;
}

function validateTarget(file, target) {
  const [pathAndQuery, fragment] = target.split("#", 2);
  const pathname = pathAndQuery.split("?", 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    failures.push(
      `${path.relative(root, file)}: invalid URL encoding in ${target}`
    );
    return;
  }
  const resolved = decoded ? path.resolve(path.dirname(file), decoded) : file;
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    failures.push(
      `${path.relative(root, file)}: link escapes the repository: ${target}`
    );
    return;
  }
  localLinkCount += 1;
  if (!existsSync(resolved))
    failures.push(
      `${path.relative(root, file)}: missing local target ${target}`
    );
  else if (fragment && resolved.endsWith(".md")) {
    let anchor;
    try {
      anchor = decodeURIComponent(fragment);
    } catch {
      failures.push(
        `${path.relative(root, file)}: invalid anchor encoding in ${target}`
      );
      return;
    }
    if (!headingAnchors(resolved).has(anchor))
      failures.push(
        `${path.relative(root, file)}: missing Markdown heading ${target}`
      );
  }
}

if (!existsSync(guides))
  failures.push("Missing handwritten guides directory: guides/");
if (existsSync(obsoleteReleaseNotes))
  failures.push("Obsolete source directory still exists: release-notes/");
for (const file of markdownFiles(generatedDocs)) {
  failures.push(
    `Generated docs directory contains Markdown source: ${path.relative(
      root,
      file
    )}`
  );
}

const sourceFiles = [path.join(root, "README.md"), ...markdownFiles(guides)];
for (const file of sourceFiles) {
  if (!existsSync(file)) {
    failures.push(`Missing documentation source: ${path.relative(root, file)}`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  for (const target of localTargets(source)) validateTarget(file, target);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${localLinkCount} local Markdown links across ${sourceFiles.length} source files.`
  );
}
