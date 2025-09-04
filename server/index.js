"use strict";

module.exports = {
  db: safeRequire("./db") || {},
  storage: safeRequire("./storage") || {},
  bot: safeRequire("./bot")?.bot || null,
  initBotWebhook: safeRequire("./bot")?.initBotWebhook || (async () => {}),
};

function safeRequire(p) {
  try { return require(p); } catch (e) { return null; }
}
