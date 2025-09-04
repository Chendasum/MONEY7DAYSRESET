"use strict";
const fs = require("fs");
const path = require("path");

/**
 * Auto-load all command modules in /commands
 * Each command must export: register(bot, services, models)
 */
module.exports = (bot, services, models) => {
  const files = fs.readdirSync(__dirname).filter(
    f => f.endsWith(".js") && f !== "index.js"
  );

  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    try {
      const cmd = require(fullPath);
      if (cmd && typeof cmd.register === "function") {
        cmd.register(bot, services, models);
        console.log(`✅ Loaded command: ${file}`);
      } else {
        console.warn(`⚠️ Skipped ${file} (no register() function)`);
      }
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
    }
  });
};
