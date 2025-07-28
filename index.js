require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot - Clean Modular Version (FIXED) ...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);
console.log("📦 Loading modular architecture with function compatibility fixes...");

// Import Models
const User = require("./models/User");
const Progress = require("./models/Progress");

// Import Command Modules
const startCommand = require("./commands/start");
const dailyCommands = require("./commands/daily");
const paymentCommands = require("./commands/payment");
const vipCommands = require("./commands/vip");
const adminCommands = require("./commands/admin");
const badgesCommands = require("./commands/badges");
const quotesCommands = require("./commands/quotes");
const bookingCommands = require("./commands/booking");
const tierFeatures = require("./commands/tier-features");
const marketingCommands = require("./commands/marketing");
const marketingContent = require("./commands/marketing-content");
const extendedContent = require("./commands/extended-content");
const thirtyDayAdmin = require("./commands/30day-admin");
const previewCommands = require("./commands/preview");
const freeTools = require("./commands/free-tools");
const financialQuiz = require("./commands/financial-quiz");
const toolsTemplates = require("./commands/tools-templates");
const progressTracker = require("./commands/progress-tracker");

// Import Service Modules
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const celebrations = require("./services/celebrations");
const progressBadges = require("./services/progress-badges");
const emojiReactions = require("./services/emoji-reactions");
const AccessControl = require("./services/access-control");
const ContentScheduler = require("./services/content-scheduler");
const ConversionOptimizer = require("./services/conversion-optimizer");
const TierManager = require("./services/tier-manager");

// Import Utils
const { sendLongMessage } = require("./utils/message-splitter");

console.log("✅ All modules imported successfully");

// Initialize services
const accessControl = new AccessControl();
const tierManager = new TierManager();
const contentScheduler = new ContentScheduler();
const conversionOptimizer = new ConversionOptimizer();

// Constants
const MESSAGE_CHUNK_SIZE = 4090;
const app = express();
app.use(express.json());

// Bot configuration
const bot = new TelegramBot(process.env.BOT_TOKEN);

// Railway domain detection
function getRailwayUrl() {
  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`;
  }
  
  const serviceName = process.env.RAILWAY_SERVICE_NAME || 'money7daysreset';
  const environmentName = process.env.RAILWAY_ENVIRONMENT_NAME || 'production';
  
  return `https://${serviceName}-${environmentName}.up.railway.app`;
}

// Duplicate message prevention
const recentMessages = new Map();

function isDuplicateMessage(chatId, text) {
  // For Railway webhook mode - no duplicate prevention needed
  console.log(`📨 Message check for chat ${chatId}: "${text?.substring(0, 50)}..." (webhook mode - no blocking)`);
  return false;
}

// Store message for potential duplicate checking
function storeMessage(chatId, text) {
  const key = `${chatId}-${text}`;
  recentMessages.set(key, Date.now());
}

// Core command handlers using imported modules
bot.onText(/^\/start(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /start command received from user ${msg.from.id}`);
    await startCommand.handle(msg, bot);
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
    
    if (isPaid) {
      const tierInfo = await accessControl.getUserTierInfo(msg.from.id);
      const helpMessage = await accessControl.getTierSpecificHelp(tierInfo);
      await sendLongMessage(bot, msg.chat.id, helpMessage);
    } else {
      const unpaidHelp = `🏆 Money Flow Reset™ - ជំនួយ

🆓 មាតិកាឥតគិតថ្លៃ:
👀 /preview - មើលមាតិកាឥតគិតថ្លៃ
📚 /preview_lessons - មេរៀនសាកល្បង
🌟 /preview_results - រឿងជោគជ័យពិតប្រាកដ
🛠️ /preview_tools - ឧបករណ៍គណនាឥតគិតថ្លៃ
🚀 /preview_journey - ដំណើរ៧ថ្ងៃពេញលេញ

🧮 ឧបករណ៍គណនាឥតគិតថ្លៃ:
💰 /calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ
🔍 /find_leaks - រកកន្លែងលុយលេច
💡 /savings_potential - វាយតម្លៃសក្តានុពលសន្សំ
📊 /income_analysis - វិភាគចំណូល

🧠 ការវាយតម្លៃ:
🧮 /financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២នាទី)

📋 ការទិញ:
🎯 /pricing - មើលកម្មវិធី (បញ្ចុះ ៥០%!)
💳 /payment - វិធីសាស្ត្រទូទាត់

📞 ជំនួយ: @Chendasum`;
      await sendLongMessage(bot, msg.chat.id, unpaidHelp);
    }
  } catch (error) {
    console.error("❌ Error in /help command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/pricing(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /pricing command received from user ${msg.from.id}`);
    await paymentCommands.pricing(msg, bot);
  } catch (error) {
    console.error("❌ Error in /pricing command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញតម្លៃ។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/payment(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /payment command received from user ${msg.from.id}`);
    await paymentCommands.instructions(msg, bot);
  } catch (error) {
    console.error("❌ Error in /payment command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញវិធីទូទាត់។ សូមព្យាយាមម្តងទៀត។");
  }
});

// Daily lesson commands
bot.onText(/^\/day(\d+)(@MoneyFlowReset2025Bot)?$/, async (msg, match) => {
  try {
    const dayNumber = parseInt(match[1]);
    console.log(`📞 /day${dayNumber} command received from user ${msg.from.id}`);
    await dailyCommands.handleDay(msg, bot, dayNumber);
  } catch (error) {
    console.error(`❌ Error in /day${match[1]} command:`, error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញមេរៀន។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/day(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /day command received from user ${msg.from.id}`);
    await dailyCommands.showDayIntro(msg, bot);
  } catch (error) {
    console.error("❌ Error in /day command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញមេរៀន។ សូមព្យាយាមម្តងទៀត។");
  }
});

// Admin commands
bot.onText(/^\/admin_users(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    if (msg.from.id.toString() !== process.env.ADMIN_CHAT_ID) {
      await bot.sendMessage(msg.chat.id, "❌ អ្នកមិនមានសិទ្ធិប្រើប្រាស់ពាក្យបញ្ជានេះទេ។");
      return;
    }
    console.log(`📞 /admin_users command received from admin ${msg.from.id}`);
    await adminCommands.showUsers(msg, bot);
  } catch (error) {
    console.error("❌ Error in /admin_users command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញអ្នកប្រើប្រាស់។ សូមព្យាយាមម្តងទៀត។");
  }
});

bot.onText(/^\/admin_analytics(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    if (msg.from.id.toString() !== process.env.ADMIN_CHAT_ID) {
      await bot.sendMessage(msg.chat.id, "❌ អ្នកមិនមានសិទ្ធិប្រើប្រាស់ពាក្យបញ្ជានេះទេ។");
      return;
    }
    console.log(`📞 /admin_analytics command received from admin ${msg.from.id}`);
    await adminCommands.showAnalytics(msg, bot);
  } catch (error) {
    console.error("❌ Error in /admin_analytics command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញអាណាលីទិក។ សូមព្យាយាមម្តងទៀត។");
  }
});

// Preview commands
bot.onText(/^\/preview(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    await previewCommands.preview(msg, bot);
  } catch (error) {
    console.error("❌ Error in /preview command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញការមើលជាមុន។");
  }
});

bot.onText(/^\/financial_quiz(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    await financialQuiz.startQuiz(msg, bot);
  } catch (error) {
    console.error("❌ Error in /financial_quiz command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចាប់ផ្តើមការធ្វើតេស្ត។");
  }
});

// Whoami command
bot.onText(/^\/whoami(@MoneyFlowReset2025Bot)?$/, async (msg) => {
  try {
    console.log(`📞 /whoami command received from user ${msg.from.id}`);
    const user = await User.findOne({ telegram_id: msg.from.id });
    
    if (!user) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ។ សូមធ្វើ /start ជាមុនសិន។
      
💡 Your Telegram ID: ${msg.from.id}
📝 Name: ${msg.from.first_name || 'Unknown'} ${msg.from.last_name || ''}`);
      return;
    }
    
    const isPaid = user.is_paid === true || user.is_paid === 't';
    const paymentStatus = isPaid ? "✅ បានបង់ប្រាក់" : "❌ មិនទាន់បង់ប្រាក់";
    const tier = user.tier || "ទំនេរ";
    
    const userInfo = `👤 ព័ត៌មានអ្នកប្រើប្រាស់:

🆔 Telegram ID: ${user.telegram_id}
📛 ឈ្មោះ: ${user.first_name || 'N/A'} ${user.last_name || ''}
💰 ស្ថានភាព: ${paymentStatus}
🎯 កម្រិត: ${tier}
📅 ចូលរួម: ${user.joined_at ? new Date(user.joined_at).toLocaleDateString('km-KH') : 'Unknown'}

${isPaid ? '🎉 អ្នកមានសិទ្ធិប្រើប្រាស់កម្មវិធីពេញលេញ!' : '💡 សូមទិញកម្មវិធីដើម្បីទទួលបានមាតិকាពេញលេញ - /pricing'}`;
    
    await bot.sendMessage(msg.chat.id, userInfo);
  } catch (error) {
    console.error("❌ Error in /whoami command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្ហាញព័ត៌មានអ្នកប្រើប្រាស់។");
  }
});

// Text message handlers
bot.on('message', async (msg) => {
  try {
    if (msg.text && !msg.text.startsWith('/')) {
      const text = msg.text.toUpperCase().trim();
      
      if (text === "READY FOR DAY 1" || text === "ត្រៀមរួចសម្រាប់ថ្ងៃទី១") {
        console.log(`📞 "READY FOR DAY 1" text received from user ${msg.from.id}`);
        
        if (isDuplicateMessage(msg.chat.id, msg.text)) {
          console.log("⚠️ Duplicate 'READY FOR DAY 1' message blocked");
          return;
        }
        
        storeMessage(msg.chat.id, msg.text);
        
        const user = await User.findOne({ telegram_id: msg.from.id });
        if (!user) {
          await bot.sendMessage(msg.chat.id, "❌ សូមចាប់ផ្តើមដោយការធ្វើ /start ជាមុនសិន។");
          return;
        }
        
        const isPaid = user.is_paid === true || user.is_paid === 't';
        if (!isPaid) {
          const conversionMessage = `🚨 អ្នកត្រូវការចូលរួមកម្មវិធី 7-Day Money Flow Reset™ ជាមុនសិន!

💰 តម្លៃពិសេស: តែ $24 USD (ធម្មតា $47)
🔥 សន្សំបាន $23 (បញ្ចុះ ៥០%!)

📋 ការទិញ:
🎯 /pricing - មើលកម្មវិធីពេញលេញ
💳 /payment - វិធីទូទាត់

📞 ជំនួយ: @Chendasum`;
          await sendLongMessage(bot, msg.chat.id, conversionMessage);
          return;
        }
        
        // Set user as ready for Day 1
        const progress = await Progress.findOne({ user_id: msg.from.id }) || 
                        await Progress.create({ user_id: msg.from.id, ready_for_day_1: true });
        
        if (!progress.ready_for_day_1) {
          await Progress.findOneAndUpdate(
            { user_id: msg.from.id },
            { ready_for_day_1: true },
            { upsert: true }
          );
        }
        
        const readyMessage = `🎉 ល្អណាស់! អ្នកត្រៀមរួចរាល់ហើយ!

🚀 ចាប់ផ្តើមដំណើរ 7 ថ្ងៃ របស់អ្នកឥឡូវនេះ:

📚 /day1 - ថ្ងៃទី១: យល់ដឹងពីលំហូរលុយ

💪 រក្សាកម្លាំងចិត្ត! អ្នកនឹងមើលឃើញការផ្លាស់ប្តូរ!

📞ជំនួយ: @Chendasum`;
        
        await sendLongMessage(bot, msg.chat.id, readyMessage);
      }
    }
  } catch (error) {
    console.error("❌ Error in message handler:", error);
  }
});

// Webhook setup for Railway
async function setupWebhook() {
  try {
    console.log("Starting bot initialization process for webhooks on Railway...");
    
    if (!process.env.BOT_TOKEN) {
      throw new Error("BOT_TOKEN is not defined in environment variables");
    }
    console.log("✅ BOT_TOKEN loaded successfully.");
    
    // Stop polling if active
    await bot.stopPolling();
    console.log("Polling stopped successfully (if active).");
    
    // Clear any existing webhook
    const deleteResult = await bot.deleteWebHook();
    console.log("Webhook deleted successfully (via bot.deleteWebHook()):", deleteResult);
    
    const railwayUrl = getRailwayUrl();
    console.log(`🔍 Domain check - getRailwayUrl(): ${railwayUrl}`);
    
    const webhookUrl = `${railwayUrl}/bot${process.env.BOT_TOKEN}`;
    console.log(`Attempting to set webhook to: ${webhookUrl}`);
    
    const result = await bot.setWebHook(webhookUrl);
    console.log("✅ Webhook set successfully:", result);
    console.log("✅ Bot initialized successfully for webhook mode on Railway.");
    
    return true;
  } catch (error) {
    console.error("❌ Error setting up webhook:", error);
    throw error;
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

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: '7-Day Money Flow Reset Bot',
    version: 'Clean Modular v1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    bot: 'operational',
    webhook: 'active',
    modules: 'loaded',
    timestamp: new Date().toISOString()
  });
});

// Initialize automation systems
async function initializeAutomation() {
  try {
    // Daily messages cron job (9 AM Cambodia time)
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running daily messages cron job');
      if (scheduler && scheduler.sendDailyMessages) {
        await scheduler.sendDailyMessages(bot);
      }
    }, {
      timezone: "Asia/Phnom_Penh"
    });
    console.log("✅ Daily messages cron job scheduled for 9 AM");
    
    // Start content scheduler
    if (contentScheduler && contentScheduler.start) {
      console.log("🔄 Starting 30-day content scheduler...");
      await contentScheduler.start(bot);
      console.log("✅ 30-day content scheduler started successfully");
    }
    
    console.log("✅ Content scheduler started");
  } catch (error) {
    console.error("❌ Error initializing automation:", error);
  }
}

// Main initialization
async function main() {
  try {
    const port = process.env.PORT || 5000;
    
    // Setup webhook
    await setupWebhook();
    
    // Initialize automation
    await initializeAutomation();
    
    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log("🤖 Bot started successfully with enhanced error handling!");
      console.log("🚀 Core features loaded:");
      console.log("   • 7-Day Money Flow Program");
      console.log("   • 30-Day Extended Content");
      console.log("   • Enhanced Payment Processing");
      console.log("   • VIP Programs");
      console.log("   • Progress Tracking");
      console.log("   • Admin Commands");
      console.log("   • Free Tools");
      console.log("   • Clean Modular Architecture");
      console.log("🔱 7-Day Money Flow Reset™ READY on Railway!");
      console.log(`🚀 Server running on 0.0.0.0:${port}`);
      console.log(`🌐 URL: ${getRailwayUrl()}`);
      console.log("🎯 Features: Clean Modular Structure with Full Command Support");
    });
    
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

main();
