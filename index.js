require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

console.log("🚀 Starting Bot...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

const app = express();

// Middleware
app.use(express.json());

// Basic routes FIRST - before bot initialization
app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.json({
    status: "Bot is running",
    time: new Date().toISOString(),
    url: "money7daysreset-production.up.railway.app"
  });
});

app.get("/ping", (req, res) => {
  console.log("Ping endpoint hit");
  res.send("Pong!");
});

app.get("/health", (req, res) => {
  console.log("Health check");
  res.json({ status: "OK", time: new Date().toISOString() });
});

// Initialize bot only if token exists
let bot = null;
if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log("✅ Bot initialized");
    
    // Simple webhook handler
    app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
      try {
        console.log("🔔 Webhook received");
        if (bot) {
          await bot.processUpdate(req.body);
        }
        res.sendStatus(200);
      } catch (error) {
        console.error("Webhook error:", error.message);
        res.sendStatus(500);
      }
    });

    // Bot commands
    bot.onText(/\/start/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "🎉 Bot is working! Railway deployment successful!");
        console.log("Start command sent to:", msg.from.id);
      } catch (error) {
        console.error("Start command error:", error.message);
      }
    });

    bot.onText(/\/test/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "✅ Test successful! Bot is connected properly.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

  } catch (error) {
    console.error("❌ Bot initialization failed:", error.message);
  }
} else {
  console.error("❌ No BOT_TOKEN found");
}

// Start server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: https://money7daysreset-production.up.railway.app`);
});

// Keep the process alive
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received");  
  server.close(() => process.exit(0));
});

// Catch any unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
