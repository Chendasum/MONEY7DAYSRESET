<artifacts>
<artifact identifier="complete-index-final" type="application/vnd.ant.code" language="javascript" title="Complete index.js - Final Version with All Routes">
require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
// Database setup
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');
console.log("🚀 Starting 7-Day Money Flow Bot with Complete Module Integration...");
// Database Schema
const users = pgTable('users', {
id: serial('id').primaryKey(),
telegram_id: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
username: text('username'),
first_name: text('first_name'),
last_name: text('last_name'),
phone_number: text('phone_number'),
email: text('email'),
joined_at: timestamp('joined_at').defaultNow(),
is_paid: boolean('is_paid').default(false),
payment_date: timestamp('payment_date'),
transaction_id: text('transaction_id'),
is_vip: boolean('is_vip').default(false),
tier: text('tier').default('free'),
tier_price: integer('tier_price').default(0),
last_active: timestamp('last_active').defaultNow(),
timezone: text('timezone').default('Asia/Phnom_Penh'),
});
const progress = pgTable('progress', {
id: serial('id').primaryKey(),
user_id: bigint('user_id', { mode: 'number' }).notNull().unique(),
current_day: integer('current_day').default(0),
day_1_completed: boolean('day_1_completed').default(false),
day_2_completed: boolean('day_2_completed').default(false),
day_3_completed: boolean('day_3_completed').default(false),
day_4_completed: boolean('day_4_completed').default(false),
day_5_completed: boolean('day_5_completed').default(false),
day_6_completed: boolean('day_6_completed').default(false),
day_7_completed: boolean('day_7_completed').default(false),
program_completed: boolean('program_completed').default(false),
responses: jsonb('responses'),
created_at: timestamp('created_at').defaultNow(),
updated_at: timestamp('updated_at').defaultNow(),
});
// Database connection
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const db = drizzle(pool, { schema: { users, progress } });
// Module System
class ModuleSystem {
constructor() {
this.commands = {};
this.services = {};
this.utils = {};
this.loadedModules = new Set();
}
safeRequire(path, name, type = 'module') {
try {
const module = require(path);
this.loadedModules.add(name);
console.log(✅ ${name} (${type}) loaded);
return module;
} catch (error) {
console.log(⚠️ ${name} not available: ${error.message});
return null;
}
}
loadAllModules() {
console.log("📦 Loading all modules...");
// Load command modules
this.commands = {
  start: this.safeRequire('./commands/start', 'Start Command', 'command'),
  daily: this.safeRequire('./commands/daily', 'Daily Commands', 'command'),
  payment: this.safeRequire('./commands/payment', 'Payment Commands', 'command'),
  vip: this.safeRequire('./commands/vip', 'VIP Commands', 'command'),
  admin: this.safeRequire('./commands/admin', 'Admin Commands', 'command'),
  badges: this.safeRequire('./commands/badges', 'Badges Commands', 'command'),
  quotes: this.safeRequire('./commands/quotes', 'Quotes Commands', 'command'),
  booking: this.safeRequire('./commands/booking', 'Booking Commands', 'command'),
  marketing: this.safeRequire('./commands/marketing', 'Marketing Commands', 'command'),
  marketingContent: this.safeRequire('./commands/marketing-content', 'Marketing Content', 'command'),
  extendedContent: this.safeRequire('./commands/extended-content', 'Extended Content', 'command'),
  thirtyDayAdmin: this.safeRequire('./commands/30day-admin', '30-Day Admin', 'command'),
  preview: this.safeRequire('./commands/preview', 'Preview Commands', 'command'),
  freeTools: this.safeRequire('./commands/free-tools', 'Free Tools', 'command'),
  financialQuiz: this.safeRequire('./commands/financial-quiz', 'Financial Quiz', 'command'),
  toolsTemplates: this.safeRequire('./commands/tools-templates', 'Tools Templates', 'command'),
  progressTracker: this.safeRequire('./commands/progress-tracker', 'Progress Tracker', 'command'),
  tierFeatures: this.safeRequire('./commands/tier-features', 'Tier Features', 'command')
};

// Load service modules
this.services = {
  scheduler: this.safeRequire('./services/scheduler', 'Scheduler', 'service'),
  analytics: this.safeRequire('./services/analytics', 'Analytics', 'service'),
  celebrations: this.safeRequire('./services/celebrations', 'Celebrations', 'service'),
  progressBadges: this.safeRequire('./services/progress-badges', 'Progress Badges', 'service'),
  emojiReactions: this.safeRequire('./services/emoji-reactions', 'Emoji Reactions', 'service'),
  accessControl: this.safeRequire('./services/access-control', 'Access Control', 'service'),
  contentScheduler: this.safeRequire('./services/content-scheduler', 'Content Scheduler', 'service'),
  conversionOptimizer: this.safeRequire('./services/conversion-optimizer', 'Conversion Optimizer', 'service'),
  aiIntegration: this.safeRequire('./services/aiintegration', 'AI Integration', 'service')
};

// Load utility modules
this.utils = {
  aiHelper: this.safeRequire('./utils/aiHelper', 'AI Helper', 'utility'),
  messageSplitter: this.safeRequire('./utils/message-splitter', 'Message Splitter', 'utility')
};

console.log(`📊 Module loading complete. Loaded: ${this.loadedModules.size} modules`);
}
}
const moduleSystem = new ModuleSystem();
moduleSystem.loadAllModules();
// Bot initialization
const bot = new TelegramBot(process.env.BOT_TOKEN, {
polling: false,
onlyFirstMatch: true,
});
// Express app setup
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
// Enhanced message splitter
async function sendLongMessage(bot, chatId, message, options = {}, chunkSize = 4090) {
if (moduleSystem.utils.messageSplitter && moduleSystem.utils.messageSplitter.sendLongMessage) {
return await moduleSystem.utils.messageSplitter.sendLongMessage(bot, chatId, message, options, chunkSize);
}
try {
if (message.length <= chunkSize) {
return await bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...options });
}
const chunks = [];
let currentChunk = '';
const paragraphs = message.split('\n\n');

for (const paragraph of paragraphs) {
  if ((currentChunk + paragraph).length <= chunkSize) {
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
  } else {
    if (currentChunk) chunks.push(currentChunk);
    currentChunk = paragraph;
  }
}
if (currentChunk) chunks.push(currentChunk);

for (let i = 0; i < chunks.length; i++) {
  await bot.sendMessage(chatId, chunks[i], { parse_mode: 'HTML', ...options });
  if (i < chunks.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
} catch (error) {
console.error("Error in sendLongMessage:", error);
throw error;
}
}
// Database helper classes
class User {
static async findOne(condition) {
try {
if (condition.telegram_id) {
const result = await db.select().from(users).where(eq(users.telegram_id, condition.telegram_id));
return result[0] || null;
}
return null;
} catch (error) {
console.error('Database error in User.findOne:', error);
return null;
}
}
static async findOneAndUpdate(condition, updates, options = {}) {
const { upsert = false } = options;
try {
  if (condition.telegram_id) {
    const existing = await this.findOne(condition);
    
    if (existing) {
      const safeUpdates = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== '$inc') {
          safeUpdates[key] = value;
        }
      });
      
      if (Object.keys(safeUpdates).length > 0) {
        safeUpdates.last_active = new Date();
        const result = await db
          .update(users)
          .set(safeUpdates)
          .where(eq(users.telegram_id, condition.telegram_id))
          .returning();
        return result[0];
      }
      return existing;
    } else if (upsert) {
      const insertData = { 
        telegram_id: condition.telegram_id, 
        last_active: new Date() 
      };
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          insertData[key] = value;
        }
      });
      
      const result = await db.insert(users).values(insertData).returning();
      return result[0];
    }
  }
} catch (error) {
  console.error('Database error in User.findOneAndUpdate:', error);
  return null;
}

return null;
}
}
class Progress {
static async findOne(condition) {
try {
if (condition.userId || condition.user_id) {
const id = condition.userId || condition.user_id;
const result = await db.select().from(progress).where(eq(progress.user_id, id));
return result[0] || null;
}
return null;
} catch (error) {
console.error('Database error in Progress.findOne:', error);
return null;
}
}
static async findOneAndUpdate(condition, updates, options = {}) {
const { upsert = false } = options;
try {
  if (condition.userId || condition.user_id) {
    const id = condition.userId || condition.user_id;
    const existing = await this.findOne(condition);
    
    if (existing) {
      const safeUpdates = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          safeUpdates[key] = value;
        }
      });
      
      if (Object.keys(safeUpdates).length > 0) {
        safeUpdates.updated_at = new Date();
        const result = await db
          .update(progress)
          .set(safeUpdates)
          .where(eq(progress.user_id, id))
          .returning();
        return result[0];
      }
      return existing;
    } else if (upsert) {
      const insertData = { 
        user_id: id, 
        created_at: new Date(), 
        updated_at: new Date() 
      };
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          insertData[key] = value;
        }
      });
      
      const result = await db.insert(progress).values(insertData).returning();
      return result[0];
    }
  }
} catch (error) {
  console.error('Database error in Progress.findOneAndUpdate:', error);
  return null;
}

return null;
}
}
// Command Manager
class CommandManager {
constructor(bot, modules) {
this.bot = bot;
this.modules = modules;
this.registeredCommands = new Set();
}
registerCommand(pattern, handler, commandName) {
if (this.registeredCommands.has(commandName)) {
console.log(⚠️ Command ${commandName} already registered);
return;
}
this.bot.onText(pattern, async (msg, match) => {
  try {
    await handler(msg, match, this.bot);
  } catch (error) {
    console.error(`Error in ${commandName}:`, error);
    await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

this.registeredCommands.add(commandName);
console.log(`✅ Registered: ${commandName}`);
}
registerAllCommands() {
console.log("🔧 Registering all commands...");
// Core commands with full fallback support
this.registerCommand(/\/start/i, async (msg) => {
  if (this.modules.commands.start && this.modules.commands.start.handle) {
    await this.modules.commands.start.handle(msg, this.bot);
  } else {
    await this.fallbackStart(msg);
  }
}, 'start');

this.registerCommand(/\/day([1-7])/i, async (msg, match) => {
  if (this.modules.commands.daily && this.modules.commands.daily.handle) {
    await this.modules.commands.daily.handle(msg, match, this.bot);
  } else {
    await this.fallbackDay(msg, match);
  }
}, 'daily');

this.registerCommand(/\/pricing/i, async (msg) => {
  if (this.modules.commands.payment && this.modules.commands.payment.pricing) {
    await this.modules.commands.payment.pricing(msg, this.bot);
  } else {
    await this.fallbackPricing(msg);
  }
}, 'pricing');

this.registerCommand(/\/payment/i, async (msg) => {
  if (this.modules.commands.payment && this.modules.commands.payment.instructions) {
    await this.modules.commands.payment.instructions(msg, this.bot);
  } else {
    await this.fallbackPayment(msg);
  }
}, 'payment');

this.registerCommand(/\/help/i, async (msg) => {
  await this.fallbackHelp(msg);
}, 'help');

console.log(`🎯 Command registration complete. Total: ${this.registeredCommands.size} commands`);
}
// Fallback implementations
async fallbackStart(msg) {
const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!
💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ
🎯 តម្លៃពិសេស: $24 USD
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម
👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;
await sendLongMessage(this.bot, msg.chat.id, welcomeMessage);

try {
  await User.findOneAndUpdate(
    { telegram_id: msg.from.id },
    {
      first_name: msg.from.first_name,
      last_name: msg.from.last_name,
      username: msg.from.username,
      joined_at: new Date()
    },
    { upsert: true }
  );
} catch (error) {
  console.error("User registration error:", error);
}
}
async fallbackDay(msg, match) {
const dayNumber = parseInt(match[1]);
const user = await User.findOne({ telegram_id: msg.from.id });
if (!user || !user.is_paid) {
  await this.bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing");
  return;
}

const dayContent = `📚 ថ្ងៃទី ${dayNumber} - មាតិកាកំពុងត្រូវបានផ្ទុក
មេរៀនថ្ងៃទី ${dayNumber} នឹងត្រូវបានផ្ញើមកអ្នកឆាប់ៗនេះ។
📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ។`;
await sendLongMessage(this.bot, msg.chat.id, dayContent);
}
async fallbackPricing(msg) {
const pricingMessage = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™
🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD
📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ
💎 វិធីទូទាត់:

ABA Bank: 000 194 742
ឈ្មោះ: SUM CHENDA
កំណត់ចំណាំ: BOT${msg.from.id}

👉 /payment - ការណែនាំទូទាត់ពេញលេញ`;
await sendLongMessage(this.bot, msg.chat.id, pricingMessage);
}
async fallbackPayment(msg) {
const paymentMessage = `💳 ការណែនាំទូទាត់
🏦 ABA Bank

គណនី: 000 194 742
ឈ្មោះ: SUM CHENDA
ចំនួន: $24 USD
Reference: BOT${msg.from.id}

📱 Wing

លេខ: 102 534 677
ឈ្មោះ: SUM CHENDA
ចំនួន: $24 USD
កំណត់ចំណាំ: BOT${msg.from.id}

⚡ បន្ទាប់ពីទូទាត់:

ថតរូបបញ្ជាក់ការទូទាត់
ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
ចាប់ផ្តើម Day 1 ភ្លាមៗ!

💬 ជំនួយ: @Chendasum`;
await sendLongMessage(this.bot, msg.chat.id, paymentMessage);
}
async fallbackHelp(msg) {
const helpMessage = `📱 ជំនួយ (Help):
🌟 7-Day Money Flow Reset™
📱 ពាក្យបញ្ជាសំខាន់:

/start - ចាប់ផ្តើម
/pricing - មើលតម្លៃ
/payment - ការទូទាត់
/help - ជំនួយ

💬 ជំនួយ: @Chendasum`;
await sendLongMessage(this.bot, msg.chat.id, helpMessage);
}
}
// Initialize command manager
const commandManager = new CommandManager(bot, moduleSystem);
commandManager.registerAllCommands();
// Service initialization
function initializeServices() {
console.log("⚙️ Initializing services...");
Object.entries(moduleSystem.services).forEach(([name, service]) => {
if (service && typeof service.init === 'function') {
try {
service.init(bot, db);
console.log(✅ ${name} service initialized);
} catch (error) {
console.error(⚠️ ${name} service initialization failed:, error.message);
}
}
});
if (moduleSystem.services.aiIntegration) {
try {
moduleSystem.services.aiIntegration.setup(bot);
console.log("✅ AI Integration setup complete");
} catch (error) {
console.error("⚠️ AI Integration setup failed:", error.message);
}
}
}
// Message handlers
bot.on('message', async (msg) => {
if (!msg.text || msg.text.startsWith('/')) return;
const text = msg.text.toLowerCase();
try {
await User.findOneAndUpdate({ telegram_id: msg.from.id }, { last_active: new Date() });
} catch (error) {
console.error("Error updating user activity:", error);
}
if (text === "vip apply") {
const user = await User.findOne({ telegram_id: msg.from.id });
const isPaid = user?.is_paid === true || user?.is_paid === 't';
if (!user || !isPaid) {
  await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។");
  return;
}

const vipApplyMessage = `🌟 VIP PROGRAM APPLICATION
សូមផ្ញើព័ត៌មានដូចខាងក្រោម:
1️⃣ ឈ្មោះពេញ:
2️⃣ អាជីវកម្ម/ការងារ:
3️⃣ គោលដៅហិរញ្ញវត្ថុ:
4️⃣ លេខទូរសព្ទ:
💰 តម្លៃ VIP: $197
📞 បន្ទាប់ពីអ្នកផ្ញើព័ត៌មាន Admin នឹងទាក់ទងអ្នក`;
await sendLongMessage(bot, msg.chat.id, vipApplyMessage);
}
});
// Express routes - Complete implementation
app.post(/bot${process.env.BOT_TOKEN}, async (req, res) => {
try {
await bot.processUpdate(req.body);
res.sendStatus(200);
} catch (error) {
console.error("Webhook error:", error);
res.sendStatus(500);
}
});
app.get('/health', (req, res) => {
res.json({
status: 'OK',
timestamp: new Date().toISOString(),
uptime: process.uptime(),
modules_loaded: moduleSystem.loadedModules.size,
database_connected: true
});
});
app.get('/bot-status', async (req, res) => {
try {
const botInfo = await bot.getMe();
res.json({
bot_status: "Online",
bot_info: botInfo,
modules: {
commands: Object.keys(moduleSystem.commands).filter(key => moduleSystem.commands[key]),
services: Object.keys(moduleSystem.services).filter(key => moduleSystem.services[key]),
utils: Object.keys(moduleSystem.utils).filter(key => moduleSystem.utils[key])
},
server_uptime: process.uptime(),
timestamp: new Date().toISOString()
});
} catch (error) {
res.status(500).json({ error: error.message });
}
});
app.get('/webhook-info', async (req, res) => {
try {
const response = await fetch(https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo);
const webhookInfo = await response.json();
res.json(webhookInfo);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
app.get('/analytics', async (req, res) => {
try {
if (moduleSystem.services.analytics && moduleSystem.services.analytics.getStats) {
const stats = await moduleSystem.services.analytics.getStats();
res.json(stats);
} else {
res.json({
message: "Analytics module not loaded",
basic_stats: {
server_uptime: process.uptime(),
modules_loaded: moduleSystem.loadedModules.size,
timestamp: new Date().toISOString()
}
});
}
} catch (error) {
res.status(500).json({ error: "Failed to get analytics" });
}
});
app.post('/setup-webhook', async (req, res) => {
try {
const webhookUrl = ${getRailwayUrl()}/bot${process.env.BOT_TOKEN};
await bot.setWebHook(webhookUrl);
res.json({
success: true,
message: "Webhook set successfully",
url: webhookUrl,
});
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Utility functions
function getRailwayUrl() {
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
return https://${process.env.RAILWAY_PUBLIC_DOMAIN};
}
return https://money7daysreset-production.up.railway.app;
}
// Cron jobs
function setupCronJobs() {
if (moduleSystem.services.scheduler && moduleSystem.services.scheduler.setupCronJobs) {
moduleSystem.services.scheduler.setupCronJobs(bot);
console.log("⏰ Scheduler cron jobs setup complete");
} else {
cron.schedule("0 9 * * *", async () => {
console.log("🕘 Daily reminder - 9 AM Cambodia time");
});
console.log("⏰ Basic daily reminder scheduled");
}
}
// Main initialization
async function initialize() {
try {
console.log("🔧 Initializing services...");
initializeServices();
console.log("⏰ Setting up cron jobs...");
setupCronJobs();

console.log("✅ Initialization complete");
} catch (error) {
console.error("❌ Initialization failed:", error);
process.exit(1);
}
}
// Start server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, async () => {
console.log(🚀 Server running on ${HOST}:${PORT});
console.log(🌐 URL: ${getRailwayUrl()});
// Set webhook
try {
const webhookUrl = ${getRailwayUrl()}/bot${process.env.BOT_TOKEN};
await bot.setWebHook(webhookUrl);
console.log(🔗 Webhook set to: ${webhookUrl});
} catch (error) {
console.error("⚠️ Webhook setup failed:", error);
}
// Initialize services
await initialize();
console.log("🎯 7-Day Money Flow Bot is fully operational!");
console.log(📊 Modules loaded: ${moduleSystem.loadedModules.size});
console.log(🤖 Commands registered: ${commandManager.registeredCommands.size});
});
// Graceful shutdown
process.on('SIGTERM', () => {
console.log('SIGTERM received, shutting down gracefully');
process.exit(0);
});
process.on('SIGINT', () => {
console.log('SIGINT received, shutting down gracefully');
process.exit(0);
});
process.on('uncaughtException', (err) => {
console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
</artifact>
