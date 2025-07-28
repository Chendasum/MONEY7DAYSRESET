require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot - Clean Modular Structure");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Import command modules with fallbacks
const startCommand = require("./commands/start");
const dailyCommands = require("./commands/daily");
const adminCommands = require("./commands/admin");
const paymentCommands = require("./commands/payment");

// Import models
const User = require("./models/User");
const Progress = require("./models/Progress");

// Import services
const AccessControl = require("./services/access-control");
const { sendLongMessage } = require("./utils/message-splitter");

const accessControl = new AccessControl();

console.log("✅ All modules loaded successfully");

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN);

// Railway domain detection
function getRailwayUrl() {
  const serviceName = process.env.RAILWAY_SERVICE_NAME || 'money7daysreset';
  const environmentName = process.env.RAILWAY_ENVIRONMENT_NAME || 'production';
  return `https://${serviceName}-${environmentName}.up.railway.app`;
}

// Core command handlers using modular architecture
bot.onText(/^\/start(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /start command received from user ${msg.from.id}`);
    if (startCommand && startCommand.handle) {
      await startCommand.handle(msg, bot);
    } else {
      await bot.sendMessage(msg.chat.id, "🎉 Welcome to 7-Day Money Flow Reset™!");
    }
  } catch (error) {
    console.error("❌ Error in /start command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចាប់ផ្តើម។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/help(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /help command received from user ${msg.from.id}`);
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    
    if (isPaid && accessControl) {
      const tierInfo = await accessControl.getUserTierInfo(msg.from.id);
      const helpMessage = await accessControl.getTierSpecificHelp(tierInfo);
      await sendLongMessage(bot, msg.chat.id, helpMessage);
    } else {
      const helpMessage = `🏆 Money Flow Reset™ - ជំនួយ

🎯 ពាក្យបញ្ជាទូទៅ
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - មើលតម្លៃ ($24)
/payment - ការណែនាំអំពីការទូទាត់
/help - ជំនួយនេះ

📞 ជំនួយ: @Chendasum`;
      
      await sendLongMessage(bot, msg.chat.id, helpMessage);
    }
  } catch (error) {
    console.error("❌ Error in /help command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/day([1-7])(@MoneyFlowReset2025Bot)?$/, async (msg, match) => {
  try {
    const dayNumber = parseInt(match[1]);
    console.log(`📞 /day${dayNumber} command received from user ${msg.from.id}`);
    
    if (dailyCommands && dailyCommands.handleDay) {
      await dailyCommands.handleDay(msg, bot, dayNumber);
    } else {
      await bot.sendMessage(msg.chat.id, `📚 Day ${dayNumber} content coming soon!`);
    }
  } catch (error) {
    console.error(`❌ Error in /day command:`, error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកមេរៀន។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/admin(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /admin command received from user ${msg.from.id}`);
    
    if (msg.from.id.toString() === process.env.ADMIN_CHAT_ID) {
      if (adminCommands && adminCommands.showDashboard) {
        await adminCommands.showDashboard(msg, bot);
      } else {
        await bot.sendMessage(msg.chat.id, "🔧 Admin Dashboard\n\nAdmin functions available!");
      }
    } else {
      await bot.sendMessage(msg.chat.id, "❌ Access denied");
    }
  } catch (error) {
    console.error("❌ Error in /admin command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចូលប្រើ។");
  }
});

bot.onText(/^\/pricing(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /pricing command received from user ${msg.from.id}`);
    
    if (paymentCommands && paymentCommands.showPricing) {
      await paymentCommands.showPricing(msg, bot);
    } else {
      const pricingMessage = `💰 7-Day Money Flow Reset™ Pricing

🎯 Essential Program - $24 USD
✅ Complete 7-day financial education
✅ Daily lessons in Khmer
✅ Progress tracking
✅ Access to all tools

🔥 Special Launch Price: $24 (50% off from $47)

📞 Contact: @Chendasum`;
      
      await bot.sendMessage(msg.chat.id, pricingMessage);
    }
  } catch (error) {
    console.error("❌ Error in /pricing command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញតម្លៃ។");
  }
});

// Webhook setup for Railway
async function setupWebhook() {
  try {
    console.log("Starting bot initialization for webhook mode on Railway...");
    
    await bot.deleteWebHook();
    console.log("Webhook deleted successfully");
    
    const railwayUrl = getRailwayUrl();
    const webhookUrl = `${railwayUrl}/bot${process.env.BOT_TOKEN}`;
    
    console.log(`Attempting to set webhook to: ${webhookUrl}`);
    const result = await bot.setWebHook(webhookUrl);
    console.log(`✅ Webhook set successfully: ${result}`);
    
    return true;
  } catch (error) {
    console.error("❌ Error setting up webhook:", error);
    return false;
  }
}

// Webhook endpoint
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  try {
    console.log("📨 Webhook received:", JSON.stringify(req.body, null, 2));
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.sendStatus(500);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bot: 'operational',
    webhook: 'active',
    architecture: 'clean_modular',
    timestamp: new Date().toISOString()
  });
});

// Start server and setup webhook
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
  console.log(`🌐 URL: ${getRailwayUrl()}`);
  
  await setupWebhook();
  
  console.log("🔱 7-Day Money Flow Reset™ READY on Railway!");
  console.log("🎯 Architecture: Clean Modular Structure");
  console.log("✅ All core commands operational");
});
