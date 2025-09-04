
"use strict";
const fs = require("fs");
const path = require("path");

/**
 * Super-compatible command auto-loader + registrar.
 *
 * Supports:
 *  - module.exports.register(bot, services, models)
 *  - module.exports.setup(bot, services, models)
 *  - module.exports = function(bot, services, models)
 *  - module.exports.default = function(...) or with .register/.setup
 *  - module.exports = Class; with .registerCommands(bot, ...)
 *  - module.exports = { handle, ... } => auto-register by filename
 */
module.exports = (bot, services, models) => {
  const files = fs.readdirSync(__dirname).filter(
    f => f.endsWith(".js") && f !== "index.js"
  );

  const map = {
    "start.js": { "/start": "handle" },
    "daily.js": { "/day": "handle" },
    "quotes.js": { "/quote": "randomWisdom", "/quotes": "showCategories" },
    "payment.js": { "/pricing": "pricing" },
    "vip.js": { "/vip": "info" },
  };

  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    try {
      const mod = require(fullPath);
      if (!mod) { console.warn(`⚠️ Skipped ${file} (empty module)`); return; }

      // 1) Direct callable (function export) or named register/setup
      const callable = resolveCallable(mod);
      if (callable) {
        try {
          callable(bot, services, models);
          console.log(`✅ Loaded (callable) command: ${file}`);
          return;
        } catch (invokeErr) {
          console.error(`❌ Command init error in ${file}:`, invokeErr?.message || invokeErr);
          return;
        }
      }

      // 2) Class export -> instantiate; call registerCommands if present
      if (isClass(mod)) {
        try {
          const instance = new mod(services, models);
          if (typeof instance.registerCommands === "function") {
            instance.registerCommands(bot, services, models);
            console.log(`✅ Loaded (class.registerCommands) command: ${file}`);
            return;
          }
          // Fallback: if there is a register or setup instance method
          if (typeof instance.register === "function") {
            instance.register(bot, services, models);
            console.log(`✅ Loaded (class.register) command: ${file}`);
            return;
          }
          if (typeof instance.setup === "function") {
            instance.setup(bot, services, models);
            console.log(`✅ Loaded (class.setup) command: ${file}`);
            return;
          }
          console.warn(`⚠️ Class ${file} has no registerCommands/register/setup method`);
        } catch (e) {
          console.error(`❌ Failed to instantiate class in ${file}:`, e?.message || e);
        }
      }

      // 3) Object export with common handlers (handle, run, execute)
      if (typeof mod === "object") {
        // Known routes by file name
        const routeMap = map[file] || {};
        let boundAny = false;

        Object.entries(routeMap).forEach(([cmd, fnName]) => {
          const fn = mod[fnName];
          if (typeof fn === "function") {
            registerSimple(bot, cmd, fn);
            boundAny = true;
          }
        });

        // Generic fallback: if it has a "handle" function, bind "/<basename>"
        if (!boundAny && typeof mod.handle === "function") {
          const base = "/" + path.basename(file, ".js");
          registerSimple(bot, base, mod.handle);
          boundAny = true;
        }

        if (boundAny) {
          console.log(`✅ Loaded (object handlers) command: ${file}`);
          return;
        }
      }

      console.warn(`⚠️ Skipped ${file} (no recognizable export shape)`);
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err?.message || err);
    }
  });
};

function resolveCallable(mod) {
  if (!mod) return null;
  if (typeof mod.register === "function") return mod.register;
  if (typeof mod.setup === "function") return mod.setup;
  if (typeof mod === "function" && !isClass(mod)) return mod;

  if (mod.default) {
    if (typeof mod.default.register === "function") return mod.default.register;
    if (typeof mod.default.setup === "function") return mod.default.setup;
    if (typeof mod.default === "function" && !isClass(mod.default)) return mod.default;
  }
  return null;
}

function isClass(func) {
  return typeof func === "function" && /^class\s/.test(Function.prototype.toString.call(func));
}

function registerSimple(bot, command, fn) {
  const regex = new RegExp("^" + command.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + "(?:\\s+(.*))?$", "i");
  bot.onText(regex, async (msg, match) => {
    try {
      await fn(msg, bot, match && match[1]);
    } catch (e) {
      console.error(`❌ Error in handler for ${command}:`, e?.message || e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមព្យាយាមម្ដងទៀត។");
    }
  });
}
