"use strict";
// Compatibility shim: legacy modules may require '../services/enhanced-ai-integration'
// We map it to './aiIntegration' so older code keeps working.
try {
  module.exports = require("./aiIntegration");
} catch (e) {
  module.exports = {
    getStatus: () => ({ available: false, reason: "aiIntegration not found" })
  };
}
