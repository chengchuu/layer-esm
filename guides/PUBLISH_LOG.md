# Publish Log

## Version 1.0.1

- Package name: `layer-esm`
- Description: `Modern ESM Layer Library for Web Popups and Dialogs`
- npm publish target: `https://registry.npmjs.org/`
- GitHub Packages target: `https://npm.pkg.github.com/`

### Publish pipeline

1. Install dependencies with `npm install`
2. Build with `npm run build`
3. Test with `npm test`
4. Publish to npm with `npm publish --access public`
5. Publish to GitHub Packages with a temporary scoped name
6. Create and push the version tag

### Notes

- The GitHub Actions workflow publishes npm first, then GitHub Packages.
- The GitHub Packages step temporarily rewrites the package name to `@<repository_owner>/layer-esm`.
- Workflow permissions must include both `contents: write` and `packages: write`.
