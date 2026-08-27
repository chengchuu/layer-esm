const { derivePackageMetadata, parseGitHubRepository } = require("mazey");

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

  return parseGitHubRepository(rawUrl);
}

module.exports = {
  packageDetails,
  repositoryDetails,
};
