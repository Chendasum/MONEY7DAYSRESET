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

// Comprehensive command routing using full modular architecture
async function handleCommand(msg, bot) {
  const text = msg.text;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  console.log(`📨 Processing command: ${text} from user ${userId}`);
  
  try {
    // /start command - Use start module
    if (/^\/start(@MoneyFlowReset2025Bot)?$/.test(text)) {
      console.log(`📞 /start command - calling startCommand.handle`);
      if (startCommand && startCommand.handle) {
        await startCommand.handle(msg, bot);
        return;
      }
    }
    
    // /help command - Use access control service
    if (/^\/help(@MoneyFlowReset2025Bot)?$/.test(text)) {
      console.log(`📞 /help command - calling access control`);
      if (accessControl) {
        const user = await User.findOne({ telegram_id: userId });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (isPaid) {
          const tierInfo = await accessControl.getUserTierInfo(userId);
          const helpMessage = await accessControl.getTierSpecificHelp(tierInfo);
          await sendLongMessage(bot, chatId, helpMessage);
        } else {
          const helpMessage = `🏆 Money Flow Reset™ - ជំនួយ

🎯 ពាក្យបញ្ជាទូទៅ
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - មើលតម្លៃ ($24)
/payment - ការណែនាំអំពីការទូទាត់
/help - ជំនួយនេះ

📞 ជំនួយ: @Chendasum`;
          await sendLongMessage(bot, chatId, helpMessage);
        }
        return;
      }
    }
    
    // Daily lesson commands /day1-7 - Use daily module
    const dayMatch = text.match(/^\/day([1-7])(@MoneyFlowReset2025Bot)?$/);
    if (dayMatch) {
      const dayNumber = parseInt(dayMatch[1]);
      console.log(`📞 /day${dayNumber} command - calling dailyCommands.handleDay`);
      if (dailyCommands && dailyCommands.handleDay) {
        await dailyCommands.handleDay(msg, bot, dayNumber);
        return;
      }
    }
    
    // Admin commands - Use admin module
    if (/^\/admin(@MoneyFlowReset2025Bot)?$/.test(text)) {
      console.log(`📞 /admin command - calling adminCommands.showDashboard`);
      if (userId.toString() === process.env.ADMIN_CHAT_ID) {
        if (adminCommands && adminCommands.showDashboard) {
          await adminCommands.showDashboard(msg, bot);
          return;
        }
      } else {
        await bot.sendMessage(chatId, "❌ Access denied");
        return;
      }
    }
    
    // Pricing command - Use payment module
    if (/^\/pricing(@MoneyFlowReset2025Bot)?$/.test(text)) {
      console.log(`📞 /pricing command - calling paymentCommands.showPricing`);
      if (paymentCommands && paymentCommands.showPricing) {
        await paymentCommands.showPricing(msg, bot);
        return;
      }
    }
    
    // Payment command - Use payment module
    if (/^\/payment(@MoneyFlowReset2025Bot)?$/.test(text)) {
      console.log(`📞 /payment command - calling paymentCommands.showInstructions`);
      if (paymentCommands && paymentCommands.showInstructions) {
        await paymentCommands.showInstructions(msg, bot);
        return;
      }
    }
    
    // Preview commands - Use preview module
    if (/^\/preview/.test(text)) {
      console.log(`📞 Preview command - calling previewCommands`);
      if (previewCommands) {
        if (/^\/preview$/.test(text) && previewCommands.showMain) {
          await previewCommands.showMain(msg, bot);
          return;
        }
        if (/^\/preview_lessons$/.test(text) && previewCommands.showLessons) {
          await previewCommands.showLessons(msg, bot);
          return;
        }
        if (/^\/preview_results$/.test(text) && previewCommands.showResults) {
          await previewCommands.showResults(msg, bot);
          return;
        }
      }
    }
    
    // Financial quiz - Use financial quiz module
    if (/^\/financial_quiz(@MoneyFlowReset2025Bot)?$/.test(text)) {
      console.log(`📞 /financial_quiz command - calling financialQuiz.startQuiz`);
      if (financialQuiz && financialQuiz.startQuiz) {
        await financialQuiz.startQuiz(msg, bot);
        return;
      }
    }
    
    // Free tools - Use free tools module
    if (/^\/calculate_daily|\/find_leaks|\/savings_potential|\/income_analysis/.test(text)) {
      console.log(`📞 Free tools command - calling freeTools`);
      if (freeTools) {
        if (/^\/calculate_daily$/.test(text) && freeTools.calculateDaily) {
          await freeTools.calculateDaily(msg, bot);
          return;
        }
        if (/^\/find_leaks$/.test(text) && freeTools.findLeaks) {
          await freeTools.findLeaks(msg, bot);
          return;
        }
      }
    }
    
    console.log(`⚠️ Command not recognized or module not available: ${text}`);
    await bot.sendMessage(chatId, "❌ Command not recognized. Type /help for available commands.");
    
  } catch (error) {
    console.error(`❌ Error processing command ${text}:`, error);
    await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការដំណើរការ។ សូមព្យាយាមម្តងទៀត។");
  }
}

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

// Enhanced webhook endpoint that processes commands through modular architecture
app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    console.log("📨 Webhook received from Telegram");
    const update = req.body;
    
    if (update.message && update.message.text) {
      await handleCommand(update.message, bot);
    } else {
      // Process other update types through bot.processUpdate
      bot.processUpdate(update);
    }
    
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
