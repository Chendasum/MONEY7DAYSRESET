require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot - Quick Fix Version...");

// Constants
const MESSAGE_CHUNK_SIZE = 4090;
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// Database setup (embedded for now - no separate file needed)
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');

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

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema: { users, progress } });

// Database Models
class User {
  static async findOne(condition) {
    try {
      if (condition.telegram_id) {
        const result = await db.select().from(users).where(eq(users.telegram_id, condition.telegram_id));
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
      if (condition.telegram_id) {
        const existing = await this.findOne(condition);
        
        if (existing) {
          const validFields = [
            'username', 'first_name', 'last_name', 'phone_number', 
            'email', 'is_paid', 'payment_date', 'transaction_id', 
            'is_vip', 'tier', 'tier_price', 'last_active', 'timezone'
          ];
          
          const safeUpdates = {};
          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key) && value !== undefined && value !== null) {
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
          
          const validFields = [
            'username', 'first_name', 'last_name', 'phone_number', 
            'email', 'is_paid', 'payment_date', 'transaction_id', 
            'is_vip', 'tier', 'tier_price', 'timezone'
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
            'current_day', 'ready_for_day_1', 
            'day_0_completed', 'day_1_completed', 'day_2_completed', 'day_3_completed',
            'day_4_completed', 'day_5_completed', 'day_6_completed', 'day_7_completed',
            'program_completed', 'program_completed_at', 'responses'
          ];
          
          const safeUpdates = {};
          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key) && value !== undefined && value !== null) {
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

// Utilities
async function sendLongMessage(bot, chatId, message, options = {}, chunkSize = MESSAGE_CHUNK_SIZE) {
  try {
    if (message.length <= chunkSize) {
      return await bot.sendMessage(chatId, message, options);
    }

    const chunks = [];
    let currentChunk = '';
    const paragraphs = message.split('\n\n');
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= chunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          const sentences = paragraph.split('\n');
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= chunkSize) {
              currentChunk += (currentChunk ? '\n' : '') + sentence;
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = sentence;
            }
          }
        }
      }
    }
    
    if (currentChunk) chunks.push(currentChunk);

    for (let i = 0; i < chunks.length; i++) {
      try {
        await bot.sendMessage(chatId, chunks[i], {
          ...options,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (chunkError) {
        console.error(`Error sending chunk ${i + 1}:`, chunkError.message);
      }
    }
    
  } catch (error) {
    console.error('Error in sendLongMessage:', error.message);
    throw error;
  }
}

// Duplicate message prevention
const processedMessages = new Set();
function isDuplicateMessage(msg) {
  const messageId = `${msg.chat.id}-${msg.message_id}`;
  processedMessages.add(messageId);
  
  if (processedMessages.size > 200) {
    const messagesToKeep = Array.from(processedMessages).slice(-100);
    processedMessages.clear();
    messagesToKeep.forEach(id => processedMessages.add(id));
  }
  
  return false; // Never block in webhook mode
}

// Express app setup
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
  onlyFirstMatch: true,
});

function getRailwayUrl() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return `https://money7daysreset-production.up.railway.app`;
}

// Try to import your existing modules (with fallbacks)
let startCommand, dailyCommands, paymentCommands, vipCommands, adminCommands;

function safeRequire(modulePath, fallbackName) {
  try {
    const module = require(modulePath);
    console.log(`✅ ${fallbackName} loaded successfully`);
    return module;
  } catch (error) {
    console.log(`⚠️ ${fallbackName} not found, using fallback`);
    return null;
  }
}

// Try to load your existing command modules
startCommand = safeRequire("./commands/start", "startCommand");
dailyCommands = safeRequire("./commands/daily", "dailyCommands");
paymentCommands = safeRequire("./commands/payment", "paymentCommands");
vipCommands = safeRequire("./commands/vip", "vipCommands");
adminCommands = safeRequire("./commands/admin", "adminCommands");

// Built-in daily content (fallback)
function getDailyContent(day) {
  const dailyContent = {
    1: `🔱 ថ្ងៃទី ១: ចាប់ផ្តើមស្គាល់លំហូរលុយរបស់អ្នក

🔥 គោលដៅថ្ងៃនេះ: រកលុយ $30-50+ ក្នុង ២០ នាទី តាមវិធីសាស្ត្រពិតប្រាកដ!

👋 ជំរាបសួរ! ថ្ងៃនេះយើងនឹងមកយល់ដឹងអំពីលុយរបស់អ្នកឱ្យបានច្បាស់លាស់ និងរកលុយភ្លាមៗ!

💎 តំបន់សកម្មភាពបន្ទាន់ (២០ នាទី)

⚡ ជំហានភ្លាមៗ (៥ នាទី): ពិនិត្យមើលការជាវឌីជីថល
→ បើក Phone Settings → Subscriptions/App Store
→ រកមើលកម្មវិធីដែលអ្នកលែងប្រើប្រាស់ហើយ
→ គោលដៅ: រកឃើញ $15+ ភ្លាមៗដែលអ្នកអាចសន្សំបានរៀងរាល់ខែ

📞 ជំនួយ: @Chendasum | Website: 7daymoneyflow.com`,

    2: `💧 ថ្ងៃទី ២: ស្វែងរកកន្លែងដែលលុយលេចធ្លាយ (Money Leaks) 💧

🎯 គោលដៅថ្ងៃនេះ: រកកន្លែងលេចធ្លាយលុយ $50-100+ ដែលអ្នកមិនដឹង!

🔍 កន្លែងលេចធ្លាយលុយទូទៅនៅកម្ពុជា:
• ថ្លៃធនាគារ និង ថ្លៃសេវាកម្ម
• ចំណាយដឹកជញ្ជូន
• ចំណាយអាហារ

📞 ជំនួយ: @Chendasum`,
    
    // Add more days as needed
  };

  return dailyContent[day] || `📚 ថ្ងៃទី ${day} - មាតិកានឹងមកដល់ឆាប់ៗ\n\n📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ។`;
}

// Basic command handlers (fallbacks if modules don't exist)
async function handleStart(msg) {
  if (startCommand && startCommand.handle) {
    await startCommand.handle(msg, bot);
  } else {
    const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
🏷️ កូដ: LAUNCH50

📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ
✅ ការបង្កើនចំណូល
✅ ផែនការហិរញ្ញវត្ថុច្បាស់

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169  
• Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA
• កំណត់ចំណាំ: BOT${msg.from.id}

📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;

    await sendLongMessage(bot, msg.chat.id, welcomeMessage);
    
    // Register user in database
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
    } catch (dbError) {
      console.log("Database registration skipped (fallback mode)");
    }
  }
}

async function handleDaily(msg, match) {
  const dayNumber = parseInt(match[1]);
  
  if (dailyCommands && dailyCommands.handle) {
    await dailyCommands.handle(msg, match, bot);
  } else {
    // Check if user is paid
    try {
      const user = await User.findOne({ telegram_id: msg.from.id });
      const isPaid = user?.is_paid === true || user?.is_paid === 't';

      if (!user || !isPaid) {
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
        return;
      }

      // Send daily content
      const dayContent = getDailyContent(dayNumber);
      await sendLongMessage(bot, msg.chat.id, dayContent);
      
      // Update progress
      try {
        await Progress.findOneAndUpdate(
          { user_id: msg.from.id },
          { current_day: Math.max(dayNumber, 0) },
          { upsert: true }
        );
      } catch (progressError) {
        console.log("Progress update skipped");
      }
      
    } catch (error) {
      console.error("Error in daily handler:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
    }
  }
}

async function handlePricing(msg) {
  if (paymentCommands && paymentCommands.pricing) {
    await paymentCommands.pricing(msg, bot);
  } else {
    const pricingMessage = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD (បញ្ចុះតម្លៃ 50%)

📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ
✅ ការបង្កើនចំណូល

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169  
• Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA
• កំណត់ចំណាំ: BOT${msg.from.id}

⚡ ចាប់ផ្តើមភ្លាមៗ: /payment`;

    await bot.sendMessage(msg.chat.id, pricingMessage);
  }
}

// Set up bot commands
bot.onText(/\/start/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await handleStart(msg);
});

bot.onText(/\/day([1-7])/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  await handleDaily(msg, match);
});

bot.onText(/\/pricing/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await handlePricing(msg);
});

bot.onText(/\/help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  const helpMessage = `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ

💬 ជំនួយ: @Chendasum`;
  
  await bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/payment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 ABA Bank (រហ័ស)
• គណនី: 000 194 742
• ឈ្មោះ: SUM CHENDA  
• ចំនួន: $24 USD
• Reference: BOT${msg.from.id}

📱 Wing (លឿនបំផុត)
• លេខ: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD
• កំណត់ចំណាំ: BOT${msg.from.id}

⚡ បន្ទាប់ពីទូទាត់:
1. ថតរូបបញ្ជាក់ការទូទាត់
2. ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
3. ចាប់ផ្តើម Day 1 ភ្លាមៗ!

💬 ជំនួយ: @Chendasum`;

  await bot.sendMessage(msg.chat.id, paymentMessage);
});

// Express routes
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

app.get("/", (req, res) => {
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "Running - Quick Fix Version",
    time: new Date().toISOString(),
    version: "2.1.0 - Quick Fix",
    modules_loaded: {
      startCommand: !!startCommand,
      dailyCommands: !!dailyCommands,
      paymentCommands: !!paymentCommands,
      database: "embedded"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    time: new Date().toISOString(),
    bot_initialized: !!bot,
    database: "connected"
  });
});

// Initialize webhook
async function initBotWebhook() {
  try {
    await bot.stopPolling();
    await bot.deleteWebHook();
    
    const webhookUrl = `${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`;
    console.log(`🔧 Setting webhook to: ${webhookUrl}`);
    
    await bot.setWebHook(webhookUrl);
    console.log("✅ Webhook set successfully");
  } catch (error) {
    console.error("❌ Webhook setup failed:", error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    await initBotWebhook();
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`🌐 URL: ${getRailwayUrl()}`);
      console.log("✅ Quick Fix Version - Bot is ready!");
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down gracefully");  
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
