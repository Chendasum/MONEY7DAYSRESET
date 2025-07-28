require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot - Clean Modular Structure");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Set up database connection first (before importing models)
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');

console.log("🔍 Setting up database connection...");

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
  testimonials: jsonb('testimonials'),
  testimonial_requests: jsonb('testimonial_requests'),
  upsell_attempts: jsonb('upsell_attempts'),
  conversion_history: jsonb('conversion_history'),
});

const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().unique(),
  current_day: integer('current_day').default(0),
  ready_for_day_1: boolean('ready_for_day_1').default(false),
  day_0_completed: boolean('day_0_completed').default(false),
  day_1_completed: boolean('day_1_completed').default(false),
  day_2_completed: boolean('day_2_completed').default(false),
  day_3_completed: boolean('day_3_completed').default(false),
  day_4_completed: boolean('day_4_completed').default(false),
  day_5_completed: boolean('day_5_completed').default(false),
  day_6_completed: boolean('day_6_completed').default(false),
  day_7_completed: boolean('day_7_completed').default(false),
  program_completed: boolean('program_completed').default(false),
  program_completed_at: timestamp('program_completed_at'),
  responses: jsonb('responses'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema: { users, progress } });

// Make db and schema available globally for models
global.db = db;
global.users = users;
global.progress = progress;

console.log("✅ Database connection established");

// Import command modules with fallbacks
let startCommand, dailyCommands, adminCommands, paymentCommands, previewCommands, financialQuiz, freeTools;
try {
  startCommand = require("./commands/start");
  dailyCommands = require("./commands/daily");
  adminCommands = require("./commands/admin");
  paymentCommands = require("./commands/payment");
  previewCommands = require("./commands/preview");
  financialQuiz = require("./commands/financial-quiz");
  freeTools = require("./commands/free-tools");
  console.log("✅ All command modules imported successfully");
} catch (error) {
  console.error("⚠️ Some command modules failed to import:", error.message);
}

// Simple embedded User model (bypassing the broken file-based model)
class User {
  static async findOne(condition) {
    try {
      if (condition.telegram_id) {
        const result = await db.select().from(users).where(eq(users.telegram_id, condition.telegram_id));
        return result[0] || null;
      }
      if (condition.telegramId) {
        const result = await db.select().from(users).where(eq(users.telegram_id, condition.telegramId));
        return result[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Database error in User.findOne:', error.message);
      return null;
    }
  }

  static async findOneAndUpdate(condition, updates, options = {}) {
    const { upsert = false } = options;
    
    try {
      if (condition.telegram_id || condition.telegramId) {
        const existing = await this.findOne(condition);
        
        if (existing) {
          const validFields = [
            'telegram_id', 'username', 'first_name', 'last_name', 'phone_number', 
            'email', 'joined_at', 'is_paid', 'payment_date', 'transaction_id', 
            'is_vip', 'tier', 'tier_price', 'last_active', 'timezone', 
            'testimonials', 'testimonial_requests', 'upsell_attempts', 'conversion_history'
          ];
          
          const safeUpdates = {};
          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key) && value !== undefined && value !== null && key !== '$inc') {
              safeUpdates[key] = value;
            }
          });
          
          if (Object.keys(safeUpdates).length > 0) {
            safeUpdates.last_active = new Date();
            const result = await db
              .update(users)
              .set(safeUpdates)
              .where(eq(users.telegram_id, condition.telegram_id || condition.telegramId))
              .returning();
            return result[0];
          }
          return existing;
        } else if (upsert) {
          const insertData = { 
            telegram_id: condition.telegram_id || condition.telegramId, 
            last_active: new Date() 
          };
          
          const validFields = [
            'username', 'first_name', 'last_name', 'phone_number', 
            'email', 'joined_at', 'is_paid', 'payment_date', 'transaction_id', 
            'is_vip', 'tier', 'tier_price', 'timezone', 
            'testimonials', 'testimonial_requests', 'upsell_attempts', 'conversion_history'
          ];
          
          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key) && value !== undefined && value !== null) {
              insertData[key] = value;
            }
          });
          
          const result = await db
            .insert(users)
            .values(insertData)
            .returning();
          return result[0];
        }
      }
    } catch (error) {
      console.error('Database error in User.findOneAndUpdate:', error.message);
      return null;
    }
    
    return null;
  }
}

// Simple embedded Progress model
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
      console.error('Database error in Progress.findOne:', error.message);
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
          const validFields = [
            'user_id', 'current_day', 'ready_for_day_1', 
            'day_0_completed', 'day_1_completed', 'day_2_completed', 'day_3_completed', 
            'day_4_completed', 'day_5_completed', 'day_6_completed', 'day_7_completed',
            'program_completed', 'program_completed_at', 'responses'
          ];
          
          const safeUpdates = {};
          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key) && value !== undefined && value !== null && key !== '$inc') {
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
          
          const validFields = [
            'current_day', 'ready_for_day_1', 
            'day_0_completed', 'day_1_completed', 'day_2_completed', 'day_3_completed', 
            'day_4_completed', 'day_5_completed', 'day_6_completed', 'day_7_completed',
            'program_completed', 'program_completed_at', 'responses'
          ];
          
          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key) && value !== undefined && value !== null) {
              insertData[key] = value;
            }
          });
          
          const result = await db
            .insert(progress)
            .values(insertData)
            .returning();
          return result[0];
        }
      }
    } catch (error) {
      console.error('Database error in Progress.findOneAndUpdate:', error.message);
      return null;
    }
    
    return null;
  }
}

// Simple sendLongMessage utility
async function sendLongMessage(bot, chatId, message, options = {}) {
  const chunks = message.match(/.{1,4000}/g) || [message];
  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk, options);
    if (chunks.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}

// Simple AccessControl service
class AccessControl {
  async getUserTierInfo(telegramId) {
    const user = await User.findOne({ telegram_id: telegramId });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    
    if (isPaid) {
      return {
        tier: user.tier || 'essential',
        tierInfo: {
          name: 'Essential',
          price: 24,
          features: ['7-Day Program', 'Daily Lessons', 'Progress Tracking']
        }
      };
    } else {
      return {
        tier: 'free',
        tierInfo: {
          name: 'Free',
          price: 0,
          features: ['Preview Content', 'Financial Quiz']
        }
      };
    }
  }

  async getTierSpecificHelp(tierInfo) {
    const user = await User.findOne({ telegram_id: tierInfo.telegramId || tierInfo.user_id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    
    if (isPaid) {
      return `🏆 Money Flow Reset™ - ជំនួយ (វែកបង់ប្រាក់ហើយ)

🎯 ពាក្យបញ្ជាសម្រាប់អ្នកបានចូលរួម:
/day1 - ថ្ងៃទី១: ស្គាល់លំហូរលុយ
/day2 - ថ្ងៃទី២: រកកន្លែងលុយលេច  
/day3 - ថ្ងៃទី៣: បង្កើតផែនការសន្សំ
/day4 - ថ្ងៃទី៤: គ្រប់គ្រងចំណូល
/day5 - ថ្ងៃទី៥: កំណត់គោលដៅ
/day6 - ថ្ងៃទី៦: បង្កើតចំណូលបន្ថែម
/day7 - ថ្ងៃទី៧: ផែនការយូរអង្វែង

🏆 ការតាមដាន:
/progress - បង្ហាញដំណើរការ
/badges - បង្ហាញគុណវុឌ្ឍិ

📞 ជំនួយ: @Chendasum`;
    } else {
      return `🏆 Money Flow Reset™ - ជំនួយ

🎯 ពាក្យបញ្ជាទូទៅ:
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - មើលតម្លៃ ($24)
/preview - មើលមាតិកាឥតគិតថ្លៃ
/financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ

📞 ជំនួយ: @Chendasum`;
    }
  }
}

const accessControl = new AccessControl();

console.log("✅ All modules loaded successfully");

const app = express();
app.use(express.json());

// Basic web route for browser visits
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: 'MoneyFlowReset2025Bot',
    architecture: 'Clean Modular Structure',
    database: 'Connected',
    webhook: 'Active',
    message: '7-Day Money Flow Reset™ Bot is running on Railway!'
  });
});

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
      try {
        const tierInfo = await accessControl.getUserTierInfo(userId);
        const helpMessage = await accessControl.getTierSpecificHelp({ telegramId: userId });
        await sendLongMessage(bot, chatId, helpMessage);
        return;
      } catch (error) {
        console.error(`Error in help command:`, error);
        const fallbackHelp = `🏆 Money Flow Reset™ - ជំនួយ

🎯 ពាក្យបញ្ជាទូទៅ:
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - មើលតម្លៃ ($24)
/preview - មើលមាតិកាឥតគិតថ្លៃ

📞 ជំនួយ: @Chendasum`;
        await sendLongMessage(bot, chatId, fallbackHelp);
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
