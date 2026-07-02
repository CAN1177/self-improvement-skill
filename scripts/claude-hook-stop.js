#!/usr/bin/env node

const { handleStopPayload, readJsonStdin } = require("./hook-utils.js");

function main() {
  const payload = readJsonStdin();
  handleStopPayload(payload, { platform: "claude" });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
