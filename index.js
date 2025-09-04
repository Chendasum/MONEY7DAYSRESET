require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

console.log("🚀 Starting 7-Day Money Flow Bot - Bulletproof Version");
console.log("Environment check:");
console.log("- BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("- DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("- PORT:", process.env.PORT || 5000);

// Initialize Express
const app = express();
app.use(express.json({ limit: "10mb" }));

// Initialize Bot with maximum error protection
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
  onlyFirstMatch: true,
});

// Ultra-safe message sender
async function safeSendMessage(chatId, text, options = {}) {
  try {
    console.log(`Sending message to ${chatId}: ${text.substring(0, 50)}...`);
    const result = await bot.sendMessage(chatId, text, options);
    console.log(`Message sent successfully, ID: ${result.message_id}`);
    return result;
  } catch (error) {
    console.error("Send message error:", error);
    // Try fallback without options
    try {
      return await bot.sendMessage(chatId, "❌ មានបញ្ហា។ សូមទាក់ទង @Chendasum");
    } catch (fallbackError) {
      console.error("Fallback message also failed:", fallbackError);
    }
  }
}

// Wrap all command handlers with try-catch
function safeCommandHandler(handlerName, handlerFn) {
  return async (msg, match) => {
    console.log(`${handlerName} command received from user: ${msg.from.id}`);
    try {
      await handlerFn(msg, match);
    } catch (error) {
      console.error(`Error in ${handlerName}:`, error);
      console.error("Stack:", error.stack);
      await safeSendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
    }
  };
}

// Commands with maximum safety
bot.onText(/\/start/i, safeCommandHandler("START", async (msg) => {
  console.log("Processing /start command");
  
  const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;

  await safeSendMessage(msg.chat.id, welcomeMessage);
  console.log("Start command completed successfully");
}));

bot.onText(/\/test/i, safeCommandHandler("TEST", async (msg) => {
  await safeSendMessage(msg.chat.id, "✅ Bot is working perfectly! Railway deployment successful.");
}));

bot.onText(/\/pricing/i, safeCommandHandler("PRICING", async (msg) => {
  const pricingMessage = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD

📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ឈ្មោះ: SUM CHENDA
• កំណត់ចំណាំ: BOT${msg.from.id}

👉 /payment - ការណែនាំទូទាត់ពេញលេញ`;

  await safeSendMessage(msg.chat.id, pricingMessage);
}));

bot.onText(/\/payment/i, safeCommandHandler("PAYMENT", async (msg) => {
  const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 ABA Bank
• គណនី: 000 194 742
• ឈ្មោះ: SUM CHENDA  
• ចំនួន: $24 USD
• Reference: BOT${msg.from.id}

📱 Wing
• លេខ: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD
• កំណត់ចំណាំ: BOT${msg.from.id}

⚡ បន្ទាប់ពីទូទាត់:
1. ថតរូបបញ្ជាក់ការទូទាត់
2. ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
3. ចាប់ផ្តើម Day 1 ភ្លាមៗ!

💬 ជំនួយ: @Chendasum`;

  await safeSendMessage(msg.chat.id, paymentMessage);
}));

bot.onText(/\/help/i, safeCommandHandler("HELP", async (msg) => {
  const helpMessage = `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ
- /test - ពិនិត្យ bot

💬 ជំនួយ: @Chendasum`;

  await safeSendMessage(msg.chat.id, helpMessage);
}));

// Global error handlers
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Express routes with error handling
app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    console.log("Webhook received, processing update");
    await bot.processUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send('Webhook Error');
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
  });
});

app.get('/ping', (req, res) => {
  console.log("Ping endpoint accessed");
  res.send("Pong! Bot is alive.");
});

app.get('/', (req, res) => {
  res.json({
    name: "7-Day Money Flow Reset™ Bot",
    status: "Running - Bulletproof Version",
    version: "1.0.1",
    time: new Date().toISOString()
  });
});

app.get('/bot-status', async (req, res) => {
  try {
    const botInfo = await bot.getMe();
    res.json({
      bot_status: "✅ Online",
      bot_info: botInfo,
      uptime: Math.floor(process.uptime()) + ' seconds',
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      bot_status: "❌ Error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server with comprehensive error handling
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

async function startServer() {
  try {
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server successfully started on ${HOST}:${PORT}`);
      console.log(`🌐 Health check: https://money7daysreset-production.up.railway.app/health`);
      console.log(`🤖 Bot status: https://money7daysreset-production.up.railway.app/bot-status`);
    });

    // Set webhook with retries
    let webhookSet = false;
    let retries = 3;
    
    while (!webhookSet && retries > 0) {
      try {
        const webhookUrl = `https://money7daysreset-production.up.railway.app/bot${process.env.BOT_TOKEN}`;
        console.log(`Attempting to set webhook: ${webhookUrl}`);
        
        const result = await bot.setWebHook(webhookUrl);
        console.log("Webhook set result:", result);
        
        if (result) {
          console.log(`✅ Webhook successfully set to: ${webhookUrl}`);
          webhookSet = true;
        }
      } catch (webhookError) {
        console.error(`Webhook setup attempt failed:`, webhookError);
        retries--;
        if (retries > 0) {
          console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (!webhookSet) {
      console.error("❌ Failed to set webhook after all retries");
    }

    console.log("🎯 Bot initialization complete!");
    console.log("Ready to receive commands!");
    
    return server;
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

// Start everything
startServer().catch(error => {
  console.error("❌ Fatal startup error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received - shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received - shutting down gracefully');  
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

console.log("✅ Bot script loaded successfully");
