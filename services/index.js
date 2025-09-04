\
"use strict";

module.exports = {
  aiIntegration: safeRequire("./aiIntegration"),
  analytics: safeRequire("./analytics"),
  accessControl: safeRequire("./access-control"),
  botHealth: safeRequire("./bot-health-monitor"),
  celebrations: safeRequire("./celebrations"),
  contentScheduler: safeRequire("./content-scheduler"),
  conversionOptimizer: safeRequire("./conversion-optimizer"),
  databasePool: safeRequire("./database-connection-pool"),
  databaseIndexing: safeRequire("./database-indexing"),
  databaseOptimizer: safeRequire("./database-optimizer"),
  databasePerf: safeRequire("./database-performance-monitor"),
  emojiReactions: safeRequire("./emoji-reactions"),
  khmerQuotes: safeRequire("./khmer-quotes"),
  marketing: safeRequire("./marketing-automation"),
  messageQueue: safeRequire("./message-queue"),
  performanceMonitor: safeRequire("./performance-monitor"),
  progressBadges: safeRequire("./progress-badges"),
  responseCache: safeRequire("./response-cache"),
  revenue: safeRequire("./revenue-optimizer"),
  salesFunnel: safeRequire("./sales-funnel"),
  scheduler: safeRequire("./scheduler"),
};

function safeRequire(p) {
  try { return require(p); } catch (e) { return null; }
}
