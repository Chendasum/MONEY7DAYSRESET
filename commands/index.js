"use strict";
const fs = require("fs");
const path = require("path");

/**
 * Backward-compatible command auto-loader.
 * Supports exports in shapes:
 *  - module.exports.register = (bot, services, models) => {}
 *  - module.exports.setup = (bot, services, models) => {}
 *  - module.exports = function(bot, services, models) {}
 *  - module.exports.default = function(...) or with .register/.setup
 */
module.exports = (bot, services, models) => {
  const files = fs.readdirSync(__dirname).filter(
    f => f.endsWith(".js") && f !== "index.js"
  );

  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    try {
      const mod = require(fullPath);
      const cand = resolveCallable(mod);

      if (cand) {
        try {
          cand(bot, services, models);
          console.log(`✅ Loaded command: ${file}`);
        } catch (invokeErr) {
          console.error(`❌ Command init error in ${file}:`, invokeErr?.message || invokeErr);
        }
      } else {
        console.warn(`⚠️ Skipped ${file} (no register/setup/function export)`);
      }
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err?.message || err);
    }
  });
};

function resolveCallable(mod) {
  if (!mod) return null;
  if (typeof mod.register === "function") return mod.register;
  if (typeof mod.setup === "function") return mod.setup;
  if (typeof mod === "function") return mod;

  if (mod.default) {
    if (typeof mod.default.register === "function") return mod.default.register;
    if (typeof mod.default.setup === "function") return mod.default.setup;
    if (typeof mod.default === "function") return mod.default;
  }
  return null;
}
