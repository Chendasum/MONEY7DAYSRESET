\
"use strict";

module.exports = {
  User: safeRequire("./User"),
  Progress: safeRequire("./Progress"),
};

function safeRequire(p) {
  try { return require(p); } catch (e) { return null; }
}
