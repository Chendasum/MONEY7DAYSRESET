const User = require("../models/User");
const KhmerQuoteGenerator = require("../services/khmer-quotes");

const quoteGenerator = new KhmerQuoteGenerator();

/**
 * Handle /quote command - show daily motivational quote
 */
async function dailyQuote(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid (quotes are premium feature)
    if (!user.isPaid) {
      await bot.sendMessage(chatId, "🔒 សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។");
      return;
    }

    // Get daily quote
    const quoteData = quoteGenerator.getDailyQuote();
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() }
    );

  } catch (error) {
    console.error("Error in daily quote command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

/**
 * Handle /wisdom command - show random wisdom quote
 */
async function randomWisdom(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid
    if (!user.isPaid) {
      await bot.sendMessage(chatId, "🔒 សម្រង់ប្រាជ្ញា សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។");
      return;
    }

    // Get random wisdom quote
    const quoteData = quoteGenerator.getRandomWisdom();
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() }
    );

  } catch (error) {
    console.error("Error in wisdom command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

/**
 * Handle /quote_categories command - show available quote categories
 */
async function showCategories(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid
    if (!user.isPaid) {
      await bot.sendMessage(chatId, "🔒 សម្រង់ប្រាជ្ញា សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។");
      return;
    }

    // Get quote statistics
    const stats = quoteGenerator.getQuoteStats();
    
    let categoriesMessage = `📚 ប្រភេទសម្រង់ប្រាជ្ញា:

🏛️ ប្រាជ្ញាប្រពៃណី (${stats.traditional} សម្រង់)
   ភាពប្រាជ្ញាពីបុរាណកាលអំពីលុយកាក់ និងជោគជ័យ

💰 គំនិតហិរញ្ញវត្ថុ (${stats.financial} សម្រង់)
   គោលការណ៍គ្រប់គ្រងលុយកាក់ និងការវិនិយោគ

🌟 ការលើកទឹកចិត្ត (${stats.motivation} សម្រង់)
   ការជំរុញចិត្ត និងការផ្លាស់ប្តូរជីវិត

🏆 ជោគជ័យ (${stats.success} សម្រង់)
   ការសម្រេចគោលដៅ និងភាពជោគជ័យ

📊 សរុប: ${stats.total} សម្រង់ក្នុង ${stats.categories} ប្រភេទ

🎯 របៀបប្រើ:
• /quote - សម្រង់ប្រចាំថ្ងៃ
• /wisdom - សម្រង់ចៃដន្យ
• /quote_traditional - ប្រាជ្ញាប្រពៃណី
• /quote_financial - គំនិតហិរញ្ញវត្ថុ
• /quote_motivation - ការលើកទឹកចិត្ត
• /quote_success - ជោគជ័យ`;

    await bot.sendMessage(chatId, categoriesMessage);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() }
    );

  } catch (error) {
    console.error("Error in categories command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

/**
 * Handle category-specific quote commands
 */
async function categoryQuote(msg, bot, category) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid
    if (!user.isPaid) {
      await bot.sendMessage(chatId, "🔒 សម្រង់ប្រាជ្ញា សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។");
      return;
    }

    // Get quote by category
    const quoteData = quoteGenerator.getQuoteByCategory(category);
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() }
    );

  } catch (error) {
    console.error("Error in category quote command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

/**
 * Get quote for milestone celebration
 * @param {Object} bot - Bot instance
 * @param {number} chatId - Chat ID
 * @param {string} milestone - Milestone type
 */
async function sendMilestoneQuote(bot, chatId, milestone) {
  try {
    const quoteData = quoteGenerator.getMilestoneQuote(milestone);
    const formattedQuote = quoteGenerator.formatQuote(quoteData);
    
    await bot.sendMessage(chatId, formattedQuote);
  } catch (error) {
    console.error("Error sending milestone quote:", error);
  }
}

/**
 * Get quote for specific day lesson
 * @param {Object} bot - Bot instance
 * @param {number} chatId - Chat ID
 * @param {number} dayNumber - Day number (1-7)
 */
async function sendDayQuote(bot, chatId, dayNumber) {
  try {
    const quoteData = quoteGenerator.getQuoteForDay(dayNumber);
    const formattedQuote = quoteGenerator.formatQuote(quoteData);
    
    await bot.sendMessage(chatId, formattedQuote);
  } catch (error) {
    console.error("Error sending day quote:", error);
  }
}

module.exports = {
  dailyQuote,
  randomWisdom,
  showCategories,
  categoryQuote,
  sendMilestoneQuote,
  sendDayQuote
};