require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

console.log("🚀 Starting 7-Day Money Flow Bot...");

// Initialize Telegram bot for webhook mode
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
  onlyFirstMatch: true,
});

// Express app for handling webhooks
const app = express();

// Middleware for parsing JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Function to get Railway URL
function getRailwayUrl() {
  return "https://7daymoneyflowreset-production.up.railway.app";
}

// Bot initialization for webhook mode
async function initBotWebhook() {
  console.log("🔧 Initializing bot webhook...");

  if (!process.env.BOT_TOKEN) {
    console.error("❌ ERROR: BOT_TOKEN is not set!");
    process.exit(1);
  }

  try {
    // Stop polling if active
    try {
      await bot.stopPolling();
      console.log("✅ Polling stopped");
    } catch (error) {
      console.log("ℹ️ No polling to stop");
    }

    // Delete existing webhook
    try {
      await bot.deleteWebHook();
      console.log("✅ Webhook deleted");
    } catch (error) {
      console.log("ℹ️ No webhook to delete");
    }

    // Set new webhook
    const webhookUrl = `${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`;
    console.log(`🔗 Setting webhook to: ${webhookUrl}`);
    
    await bot.setWebHook(webhookUrl);
    console.log("✅ Webhook set successfully");

  } catch (error) {
    console.error("❌ Bot initialization error:", error.message);
    process.exit(1);
  }
}

// Basic bot commands
bot.onText(/\/start/i, async (msg) => {
  console.log("🚀 [START] User:", msg.from.id);
  
  try {
    const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;

    await bot.sendMessage(msg.chat.id, welcomeMessage);
    console.log("✅ [START] Message sent");
  } catch (error) {
    console.error("❌ [START] Error:", error.message);
  }
});

bot.onText(/\/help/i, async (msg) => {
  console.log("🔧 [HELP] User:", msg.from.id);
  
  try {
    const helpMessage = `📋 ជំនួយ 7-Day Money Flow Reset™

🎯 ពាក្យបញ្ជាមូលដ្ឋាន:
• /start - ចាប់ផ្តើម
• /pricing - មើលតម្លៃ ($24)
• /payment - ការទូទាត់
• /help - ជំនួយនេះ
• /test - ពិនិត្យ bot

👨‍💼 ទាក់ទង: @Chendasum ២៤/៧
🌐 Website: 7daymoneyflow.com`;

    await bot.sendMessage(msg.chat.id, helpMessage);
    console.log("✅ [HELP] Message sent");
  } catch (error) {
    console.error("❌ [HELP] Error:", error.message);
  }
});

bot.onText(/\/test/i, async (msg) => {
  console.log("🧪 [TEST] User:", msg.from.id);
  
  try {
    await bot.sendMessage(msg.chat.id, "✅ Bot is working perfectly! Webhook connected successfully.");
    console.log("✅ [TEST] Message sent");
  } catch (error) {
    console.error("❌ [TEST] Error:", error.message);
  }
});

// Webhook handler
app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    console.log("🔔 Webhook received");
    
    if (req.body && req.body.message) {
      console.log("📨 Message from:", req.body.message.from.id);
    }

    await bot.processUpdate(req.body);
    console.log("✅ Update processed");
    
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.sendStatus(500);
  }
});

// Health check endpoints
app.get("/", (req, res) => {
  res.json({
    name: "7-Day Money Flow Reset™ Bot",
    status: "Running",
    domain: getRailwayUrl(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    webhookUrl: `${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`,
  });
});

app.get("/ping", (req, res) => {
  console.log("🏓 Ping received");
  res.send("Pong!");
});

// Initialize and start server
(async () => {
  await initBotWebhook();

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0";

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`🔥 Bot is ready!`);
    console.log(`✅ Webhook URL: ${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`);
  });
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 Shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 Shutting down gracefully");
  process.exit(0);
});
