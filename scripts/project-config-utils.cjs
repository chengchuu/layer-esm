const { derivePackageMetadata } = require("mazey");

function packageDetails(pkg) {
  const metadata = derivePackageMetadata(pkg);

  return {
    ...metadata,
    bundleBaseName: metadata.unscopedName,
  };
}

function repositoryDetails(repository) {
  const rawUrl = typeof repository === "string" ? repository : repository?.url;
  if (typeof rawUrl !== "string" || !rawUrl.trim())
    throw new Error("package.json must define a GitHub repository URL");

  const raw = rawUrl.trim();
  const shorthand = raw.match(
    /^(?:github:)?([^/:@\s]+)\/([^/\s]+?)(?:\.git)?$/i
  );
  const scp = raw.match(
    /^(?:git@)?github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i
  );
  let owner;
  let name;

  if (shorthand || scp) {
    [, owner, name] = shorthand || scp;
  } else {
    let parsed;
    try {
      parsed = new URL(raw.replace(/^git\+/, ""));
    } catch {
      throw new Error(
        `Cannot derive GitHub repository identity from ${rawUrl}`
      );
    }
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (hostname !== "github.com" || parts.length !== 2)
      throw new Error(`Expected a GitHub repository URL, received ${rawUrl}`);
    [owner, name] = parts;
    name = name.replace(/\.git$/i, "");
  }

  if (!owner || !name)
    throw new Error(`Cannot derive GitHub repository identity from ${rawUrl}`);
  const url = `https://github.com/${owner}/${name}`;
  return { name, owner, slug: `${owner}/${name}`, url };
}

module.exports = {
  packageDetails,
  repositoryDetails,
};
