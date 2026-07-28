/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
const { release } = require("mazey/scripts/legacy/git-helper");

release(undefined, { defaultBranch: "main" });
