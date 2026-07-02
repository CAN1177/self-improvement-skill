#!/usr/bin/env node

const { handlePromptPayload, readJsonStdin } = require("./hook-utils.js");

function main() {
  const payload = readJsonStdin();
  handlePromptPayload(payload, { platform: "codex" });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
