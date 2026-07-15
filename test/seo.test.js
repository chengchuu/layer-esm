/** @jest-environment node */
const {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  buildPages,
  normalizeHeadingOrder,
  transformApiHtml,
} = require("../scripts/build-pages.cjs");
const projectConfig = require("../project.config.cjs");

const { displayName } = projectConfig.brand;
const { pages } = projectConfig.site;

const typeDocHtml = `<!doctype html><html><head><title>${displayName}</title><meta name="description" content="old"><link rel="canonical" href="https://example.com/"><link rel="icon" href="old.png"></head><body><script>document.body.style.display="none"</script><header><div class="tsd-toolbar-contents container"></div></header><div class="tsd-page-title"><h1>${displayName}</h1></div><main><h1>${displayName}</h1><h2>API</h2><p>Public API documentation content.</p></main></body></html>`;

test("API metadata transformation is complete and idempotent", () => {
  const transformed = transformApiHtml(typeDocHtml, "index.html");
  expect(transformApiHtml(transformed, "index.html")).toBe(transformed);
  expect(transformed).toContain(
    `<link rel="canonical" href="${pages.api.url}"/>`
  );
  expect(transformed).toContain(
    `<link rel="icon" href="${projectConfig.assets.faviconUrl}" type="image/png"/>`
  );
  expect(transformed).toContain(`<a href="${pages.home.url}">Project home</a>`);
  expect(transformed).toContain(
    `<meta property="og:image" content="${projectConfig.seo.openGraphImage.url}"/>`
  );
  expect(transformed).toContain(
    '<meta name="twitter:card" content="summary_large_image"/>'
  );
  expect(transformed).toContain('href="../assets/api.css"');
  expect(transformed).toContain('src="../assets/api.js"');
  expect(transformed).not.toMatch(/<button\b[^>]*data-pwa-install\b/);
  expect(transformed.match(/<h1\b/g)).toHaveLength(1);
  expect(transformed).not.toContain('document.body.style.display="none"');
  expect(() =>
    JSON.parse(
      transformed.match(
        /<script type="application\/ld\+json">([^<]+)<\/script>/
      )[1]
    )
  ).not.toThrow();
});

test("API subpages receive self-referencing canonical URLs", () => {
  const source = `<html><head><title>open | ${displayName}</title></head><body><header><div class="tsd-toolbar-contents container"></div></header><main><h1>open</h1></main></body></html>`;
  const transformed = transformApiHtml(source, "functions/open.html");
  expect(transformed).toContain(
    `href="${new URL("functions/open.html", pages.api.url).href}"`
  );
  expect(transformed).toContain('href="../../assets/api.css"');
  expect(transformed).toContain(`open | ${displayName} API Reference`);
});

test("API guide links resolve to the handwritten GitHub source", () => {
  const source = typeDocHtml.replace(
    "</main>",
    '<a href="../guides/release-notes/README.md">Release notes</a></main>'
  );
  const transformed = transformApiHtml(source, "index.html");
  expect(transformed).toContain(
    `href="${projectConfig.urls.guidesSource}release-notes/README.md"`
  );
  expect(transformed).not.toContain('href="../guides/release-notes/README.md"');
});

test("generated TypeDoc headings are normalized without changing content", () => {
  expect(
    normalizeHeadingOrder(
      '<main><h1 id="entry">Entry</h1><h4 id="signature">Signature</h4><h5>Returns</h5></main>'
    )
  ).toBe(
    '<main><h1 id="entry">Entry</h1><h2 id="signature">Signature</h2><h3>Returns</h3></main>'
  );
});

test("site templates use the styled update, code panel, and muted section classes", () => {
  const root = path.resolve(__dirname, "..");
  const homepage = readFileSync(path.join(root, "site", "index.html"), "utf8");
  const playground = readFileSync(
    path.join(root, "examples", "index.html"),
    "utf8"
  );
  const playgroundScript = readFileSync(
    path.join(root, "examples", "index.ts"),
    "utf8"
  );
  const stylesheet = readFileSync(path.join(root, "site", "site.css"), "utf8");

  for (const template of [homepage, playground]) {
    expect(template).toContain('class="pwa-update-notice"');
    expect(template).toContain("section-band--muted");
    expect(template).not.toContain('class="pwa-update"');
    expect(template).not.toContain("section-band-muted");
  }
  expect(homepage).toContain('class="code-panel"');
  expect(playground).toContain('class="playground-demo-gallery"');
  for (const template of [homepage, playground]) {
    expect(template).not.toContain("data-pwa-install-container");
    expect(template).not.toContain("data-pwa-install>");
    expect(template).not.toContain(">Basic usage<");
    expect(template).toContain(">Usage<");
  }
  expect(homepage).not.toContain('href="#features">Features</a>');
  expect(homepage.indexOf(">Home</a>")).toBeLessThan(
    homepage.indexOf(">Playground</a>")
  );
  expect(playgroundScript).not.toContain("bg-white");
  expect(playgroundScript).not.toContain("btn-outline-dark");
  expect(stylesheet).toContain(".playground-demo-grid .card");
  expect(stylesheet).toContain(".playground-demo-grid .btn-outline-secondary");
  expect(stylesheet).toContain(".site-footer nav");
  expect(stylesheet).toContain("gap: 0.75rem 1.25rem");
  expect(stylesheet).toContain(".code-panel {");
  expect(stylesheet).toContain(".code-panel-header {");
  expect(stylesheet).toContain(".pwa-update-notice {");
  expect(stylesheet).toContain(".section-band--muted {");
});

test("Pages assembly fails clearly for missing sources", () => {
  const rootDir = mkdtempSync(
    path.join(os.tmpdir(), "layer-esm-pages-missing-")
  );
  try {
    expect(() => buildPages({ rootDir })).toThrow(
      /Required Pages source is missing/
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("Pages assembly is repeatable without duplicating API metadata", () => {
  const rootDir = mkdtempSync(
    path.join(os.tmpdir(), "layer-esm-pages-repeat-")
  );
  const files = {
    "docs/api/index.html": typeDocHtml,
    "dist-dev/index.html": "<html><body><h1>Home</h1></body></html>",
    "dist-dev/playground/index.html":
      "<html><body><h1>Playground</h1></body></html>",
    "dist-dev/assets/api.css": "body {}",
    "dist-dev/assets/api.js": "void 0;",
    [`dist-dev/images/${projectConfig.seo.openGraphImage.file}`]:
      "open graph image",
    "site/service-worker.js":
      'const base = "__PWA_PROJECT_BASE__"; const prefix = "__PWA_CACHE_PREFIX__"; const version = "__PWA_CACHE_VERSION__";\n',
    ...Object.fromEntries(
      projectConfig.pwa.icons.map((icon) => [`images/${icon.file}`, icon.sizes])
    ),
  };
  try {
    for (const [relative, contents] of Object.entries(files)) {
      const file = path.join(rootDir, relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, contents);
    }
    buildPages({ rootDir });
    const first = readFileSync(
      path.join(rootDir, "docs/api/index.html"),
      "utf8"
    );
    const firstWorker = readFileSync(
      path.join(rootDir, "docs/service-worker.js"),
      "utf8"
    );
    buildPages({ rootDir });
    const second = readFileSync(
      path.join(rootDir, "docs/api/index.html"),
      "utf8"
    );
    expect(second).toBe(first);
    expect(
      readFileSync(path.join(rootDir, "docs/service-worker.js"), "utf8")
    ).toBe(firstWorker);
    expect(
      second.match(
        new RegExp(`${projectConfig.site.markerPrefix}-seo:start`, "g")
      )
    ).toHaveLength(1);
    expect(
      second.match(
        new RegExp(`${projectConfig.site.markerPrefix}-pwa-ui:start`, "g")
      )
    ).toHaveLength(1);
    expect(firstWorker).not.toMatch(/__PWA_[A-Z_]+__/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
