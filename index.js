require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

// Database imports
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');

console.log("🚀 Starting 7-Day Money Flow Bot...");

// Database Schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegram_id: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  joined_at: timestamp('joined_at').defaultNow(),
  is_paid: boolean('is_paid').default(false),
  payment_date: timestamp('payment_date'),
  is_vip: boolean('is_vip').default(false),
  tier: text('tier').default('essential'),
  tier_price: integer('tier_price').default(24),
  last_active: timestamp('last_active').defaultNow()
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
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Main Bot Class - Everything is inside here
class MoneyFlowBot {
  constructor() {
    this.bot = null;
    this.app = express();
    this.db = null;
    this.modules = {};
    
    this.init();
  }

  async init() {
    await this.setupDatabase();
    this.setupBot();
    this.loadModules();
    this.setupCommands();
    this.setupRoutes();
    this.setupCronJobs();
    this.startServer();
  }

  async setupDatabase() {
    console.log("📊 Setting up database...");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    this.db = drizzle(pool, { schema: { users, progress } });
    console.log("✅ Database connected");
  }

  setupBot() {
    console.log("🤖 Setting up bot...");
    this.bot = new TelegramBot(process.env.BOT_TOKEN, {
      polling: false,
      onlyFirstMatch: true,
    });
    console.log("✅ Bot initialized");
  }

  loadModules() {
    console.log("📦 Loading modules...");
    
    // Safe module loader
    const safeRequire = (path, name) => {
      try {
        const module = require(path);
        console.log(`✅ ${name} loaded`);
        return module;
      } catch (error) {
        console.log(`⚠️ ${name} not found: ${error.message}`);
        return null;
      }
    };

    // Load all your existing modules
    this.modules = {
      // Commands
      start: safeRequire('./commands/start', 'Start Command'),
      daily: safeRequire('./commands/daily', 'Daily Commands'),
      payment: safeRequire('./commands/payment', 'Payment Commands'),
      vip: safeRequire('./commands/vip', 'VIP Commands'),
      admin: safeRequire('./commands/admin', 'Admin Commands'),
      badges: safeRequire('./commands/badges', 'Badges Commands'),
      quotes: safeRequire('./commands/quotes', 'Quotes Commands'),
      booking: safeRequire('./commands/booking', 'Booking Commands'),
      freeTools: safeRequire('./commands/free-tools', 'Free Tools'),
      financialQuiz: safeRequire('./commands/financial-quiz', 'Financial Quiz'),
      
      // Services
      scheduler: safeRequire('./services/scheduler', 'Scheduler'),
      analytics: safeRequire('./services/analytics', 'Analytics'),
      celebrations: safeRequire('./services/celebrations', 'Celebrations'),
      accessControl: safeRequire('./services/access-control', 'Access Control'),
      aiIntegration: safeRequire('./services/aiintegration', 'AI Integration'),
      
      // Utils
      messageSplitter: safeRequire('./utils/message-splitter', 'Message Splitter')
    };

    console.log("✅ Module loading complete");
  }

  setupCommands() {
    console.log("🔧 Setting up all commands...");

    // /start command
    this.bot.onText(/\/start/i, async (msg) => {
      try {
        if (this.modules.start && this.modules.start.handle) {
          await this.modules.start.handle(msg, this.bot);
        } else {
          await this.handleStart(msg);
        }
      } catch (error) {
        console.error('Start command error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // /day1-7 commands
    this.bot.onText(/\/day([1-7])/i, async (msg, match) => {
      try {
        if (this.modules.daily && this.modules.daily.handle) {
          await this.modules.daily.handle(msg, match, this.bot);
        } else {
          await this.handleDay(msg, match);
        }
      } catch (error) {
        console.error('Daily command error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // /pricing command
    this.bot.onText(/\/pricing/i, async (msg) => {
      try {
        if (this.modules.payment && this.modules.payment.pricing) {
          await this.modules.payment.pricing(msg, this.bot);
        } else {
          await this.handlePricing(msg);
        }
      } catch (error) {
        console.error('Pricing command error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // /payment command
    this.bot.onText(/\/payment/i, async (msg) => {
      try {
        if (this.modules.payment && this.modules.payment.instructions) {
          await this.modules.payment.instructions(msg, this.bot);
        } else {
          await this.handlePayment(msg);
        }
      } catch (error) {
        console.error('Payment command error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // /help command
    this.bot.onText(/\/help/i, async (msg) => {
      try {
        await this.handleHelp(msg);
      } catch (error) {
        console.error('Help command error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // /vip command
    this.bot.onText(/\/vip/i, async (msg) => {
      try {
        if (this.modules.vip && this.modules.vip.info) {
          await this.modules.vip.info(msg, this.bot);
        } else {
          await this.handleVip(msg);
        }
      } catch (error) {
        console.error('VIP command error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // Admin commands
    this.bot.onText(/\/admin_users/i, async (msg) => {
      try {
        await this.handleAdminUsers(msg);
      } catch (error) {
        console.error('Admin users error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    this.bot.onText(/\/admin_analytics/i, async (msg) => {
      try {
        await this.handleAdminAnalytics(msg);
      } catch (error) {
        console.error('Admin analytics error:', error);
        await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // Message handler for text messages
    this.bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      
      try {
        await this.handleTextMessage(msg);
      } catch (error) {
        console.error('Text message error:', error);
      }
    });

    console.log("✅ All commands registered");
  }

  // Command handler methods - all inside the class
  async handleStart(msg) {
    const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;

    await this.sendLongMessage(msg.chat.id, welcomeMessage);

    // Register user
    try {
      await this.db.insert(users)
        .values({
          telegram_id: msg.from.id,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
          username: msg.from.username,
          joined_at: new Date()
        })
        .onConflictDoUpdate({
          target: users.telegram_id,
          set: {
            last_active: new Date(),
            first_name: msg.from.first_name,
            last_name: msg.from.last_name,
            username: msg.from.username
          }
        });
    } catch (error) {
      console.error('User registration error:', error);
    }
  }

  async handleDay(msg, match) {
    const dayNumber = parseInt(match[1]);
    
    // Check if user is paid
    const user = await this.getUser(msg.from.id);
    if (!user || !user.is_paid) {
      await this.bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing");
      return;
    }

    const dayContent = this.getDayContent(dayNumber);
    await this.sendLongMessage(msg.chat.id, dayContent);

    // Update progress
    try {
      await this.db.insert(progress)
        .values({
          user_id: msg.from.id,
          current_day: dayNumber,
          [`day_${dayNumber}_completed`]: true,
          updated_at: new Date()
        })
        .onConflictDoUpdate({
          target: progress.user_id,
          set: {
            current_day: dayNumber,
            [`day_${dayNumber}_completed`]: true,
            updated_at: new Date()
          }
        });
    } catch (error) {
      console.error('Progress update error:', error);
    }
  }

  async handlePricing(msg) {
    const pricingMessage = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD

📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ
✅ ការបង្កើនចំណូល

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ឈ្មោះ: SUM CHENDA
• កំណត់ចំណាំ: BOT${msg.from.id}

👉 /payment - ការណែនាំទូទាត់ពេញលេញ`;

    await this.sendLongMessage(msg.chat.id, pricingMessage);
  }

  async handlePayment(msg) {
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

    await this.sendLongMessage(msg.chat.id, paymentMessage);
  }

  async handleHelp(msg) {
    const helpMessage = `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ

💬 ជំនួយ: @Chendasum`;

    await this.sendLongMessage(msg.chat.id, helpMessage);
  }

  async handleVip(msg) {
    const vipMessage = `👑 VIP Program

🌟 កម្មវិធី VIP រួមមាន:
• ការប្រឹក្សាផ្ទាល់ខ្លួន 1-on-1  
• ការតាមដានដោយផ្ទាល់
• មាតិកាកម្រិតខ្ពស់

💰 តម្លៃ VIP: $197
📞 ពិគ្រោះ: @Chendasum

✅ សរសេរ "VIP APPLY" ដើម្បីដាក់ពាក្យ`;

    await this.sendLongMessage(msg.chat.id, vipMessage);
  }

  async handleAdminUsers(msg) {
    if (!this.isAdmin(msg.from.id)) {
      await this.bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }

    try {
      const allUsers = await this.db.select().from(users).limit(20);
      const totalUsers = allUsers.length;
      const paidUsers = allUsers.filter(u => u.is_paid).length;

      let response = `📊 ADMIN - បញ្ជីអ្នកប្រើប្រាស់

📈 សង្ខេប:
• អ្នកប្រើប្រាស់សរុប: ${totalUsers}
• បានទូទាត់: ${paidUsers}

👥 អ្នកប្រើប្រាស់ថ្មីៗ:
`;

      allUsers.slice(0, 5).forEach((user, index) => {
        response += `${index + 1}. ${user.first_name} (${user.is_paid ? '✅' : '❌'})\n`;
      });

      await this.sendLongMessage(msg.chat.id, response);
    } catch (error) {
      await this.bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។");
    }
  }

  async handleAdminAnalytics(msg) {
    if (!this.isAdmin(msg.from.id)) {
      await this.bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }

    const analyticsMessage = `📈 Analytics Dashboard

📊 System Status: ✅ Online
💻 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
🕒 Uptime: ${Math.floor(process.uptime() / 3600)}h

💡 ប្រើ /admin_users សម្រាប់ការវិភាគលម្អិត`;

    await this.sendLongMessage(msg.chat.id, analyticsMessage);
  }

  async handleTextMessage(msg) {
    const text = msg.text.toLowerCase();
    
    // Update user activity
    try {
      await this.db.update(users)
        .set({ last_active: new Date() })
        .where(eq(users.telegram_id, msg.from.id));
    } catch (error) {
      console.error('User activity update error:', error);
    }

    // Handle VIP applications
    if (text === "vip apply") {
      const user = await this.getUser(msg.from.id);
      if (!user || !user.is_paid) {
        await this.bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។");
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

      await this.sendLongMessage(msg.chat.id, vipApplyMessage);
    }
  }

  setupRoutes() {
    console.log("🌐 Setting up routes...");
    
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Webhook
    this.app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
      try {
        await this.bot.processUpdate(req.body);
        res.sendStatus(200);
      } catch (error) {
        console.error("Webhook error:", error);
        res.sendStatus(500);
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Bot status
    this.app.get('/bot-status', async (req, res) => {
      try {
        const botInfo = await this.bot.getMe();
        res.json({
          bot_status: "Online",
          bot_info: botInfo,
          server_uptime: process.uptime()
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log("✅ Routes configured");
  }

  setupCronJobs() {
    console.log("⏰ Setting up cron jobs...");
    
    if (this.modules.scheduler && this.modules.scheduler.setupCronJobs) {
      this.modules.scheduler.setupCronJobs(this.bot);
    } else {
      // Basic daily reminder
      cron.schedule("0 9 * * *", async () => {
        console.log("🕘 Daily reminder - 9 AM Cambodia time");
      });
    }

    console.log("✅ Cron jobs configured");
  }

  startServer() {
    const PORT = process.env.PORT || 5000;
    const HOST = "0.0.0.0";

    this.app.listen(PORT, HOST, async () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      
      // Set webhook
      try {
        const webhookUrl = `${this.getRailwayUrl()}/bot${process.env.BOT_TOKEN}`;
        await this.bot.setWebHook(webhookUrl);
        console.log(`🔗 Webhook set to: ${webhookUrl}`);
      } catch (error) {
        console.error("⚠️ Webhook setup failed:", error);
      }
      
      console.log("🎯 7-Day Money Flow Bot is fully operational!");
    });
  }

  // Helper methods - all inside the class
  async sendLongMessage(chatId, message, options = {}, chunkSize = 4090) {
    if (this.modules.messageSplitter && this.modules.messageSplitter.sendLongMessage) {
      return await this.modules.messageSplitter.sendLongMessage(this.bot, chatId, message, options, chunkSize);
    }

    // Fallback
    try {
      if (message.length <= chunkSize) {
        return await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...options });
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
        await this.bot.sendMessage(chatId, chunks[i], { parse_mode: 'HTML', ...options });
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Error in sendLongMessage:", error);
      throw error;
    }
  }

  async getUser(telegramId) {
    try {
      const result = await this.db.select().from(users).where(eq(users.telegram_id, telegramId));
      return result[0] || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  isAdmin(userId) {
    const adminIds = [parseInt(process.env.ADMIN_CHAT_ID), 484389665];
    return adminIds.includes(userId);
  }

  getRailwayUrl() {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    return `https://money7daysreset-production.up.railway.app`;
  }

  getDayContent(dayNumber) {
    const content = {
      1: "📚 ថ្ងៃទី ១: ការយល់ដឹងពីលំហូរលុយ\n\nមេរៀនថ្ងៃទី ១ នឹងជួយអ្នកយល់ដឹងពីរបៀបគ្រប់គ្រងលុយ។",
      2: "📚 ថ្ងៃទី ២: ការស្វែងរកកន្លែងលុយលេច\n\nរកមើលកន្លែងដែលអ្នកចំណាយលុយមិនចាំបាច់។",
      3: "📚 ថ្ងៃទី ៣: ការបង្កើតគោលដៅ\n\nកំណត់គោលដៅហិរញ្ញវត្ថុច្បាស់លាស់។",
      4: "📚 ថ្ងៃទី ៤: ការតាមដានប្រចាំថ្ងៃ\n\nរៀនតាមដានចំណាយប្រចាំថ្ងៃ។",
      5: "📚 ថ្ងៃទី ៥: ការបង្កើតម្ហូបអាសន្ន\n\nបង្កើតម្ហូបអាសន្នសម្រាប់ភាពចាំបាច់។",
      6: "📚 ថ្ងៃទី ៦: ការបង្កើនចំណូល\n\nរកវិធីបង្កើនចំណូលបន្ថែម។",
      7: "📚 ថ្ងៃទី ៧: ការរក្សាការវិវត្តន៍\n\nរៀនរក្សាទម្លាប់ល្អដែលបានបង្កើត។"
    };

    return content[dayNumber] || `📚 ថ្ងៃទី ${dayNumber} - មាតិកាកំពុងត្រូវបានផ្ទុក`;
  }
}

// Start the bot
new MoneyFlowBot();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});
