// 🚀 Enhanced Smart Automation & Interactive Features
// Add these to your existing bot to make it super interactive!

const cron = require('node-cron');
const User = require('../models/User');
const Progress = require('../models/Progress');
const aiService = require('../services/aiIntegration');

class SmartAutomation {
    constructor(bot) {
        this.bot = bot;
        this.userSessions = new Map(); // Store conversation context
        this.activeChats = new Set(); // Track active conversations
        this.init();
    }

    init() {
        console.log('🤖 Initializing Smart Automation System...');
        this.setupConversationHandlers();
        this.setupSmartNotifications();
        this.setupDailyAutomation();
        this.setupInactivityDetection();
    }

    // 💬 SMART CONVERSATION SYSTEM
    setupConversationHandlers() {
        // Handle ALL messages intelligently
        this.bot.on('message', async (msg) => {
            if (msg.text && !msg.text.startsWith('/')) {
                await this.handleSmartConversation(msg);
            }
        });

        // Handle callback queries (button presses)
        this.bot.on('callback_query', async (query) => {
            await this.handleCallbackQuery(query);
        });

        // Track when users join/leave
        this.bot.on('new_chat_members', async (msg) => {
            await this.handleNewMember(msg);
        });
    }

    // 🧠 INTELLIGENT MESSAGE PROCESSING
    async handleSmartConversation(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text.toLowerCase();

        try {
            // Update last active
            await User.findOneAndUpdate(
                { telegramId: userId },
                { lastActive: new Date() },
                { upsert: true }
            );

            // Get conversation context
            const context = this.getUserSession(userId);
            
            // Analyze message intent
            const intent = await this.analyzeIntent(text, context);
            
            // Handle different intents
            switch (intent.type) {
                case 'FINANCIAL_QUESTION':
                    await this.handleFinancialQuestion(msg, intent);
                    break;
                    
                case 'PROGRESS_CHECK':
                    await this.handleProgressInquiry(msg);
                    break;
                    
                case 'CONFUSED_USER':
                    await this.handleConfusedUser(msg);
                    break;
                    
                case 'MOTIVATION_NEEDED':
                    await this.handleMotivationRequest(msg);
                    break;
                    
                case 'CASUAL_CHAT':
                    await this.handleCasualChat(msg, intent);
                    break;
                    
                default:
                    // Smart fallback with context
                    await this.handleSmartFallback(msg, context);
            }

            // Update conversation context
            this.updateUserSession(userId, text, intent);

        } catch (error) {
            console.error('Smart conversation error:', error);
        }
    }

    // 🎯 INTENT ANALYSIS
    async analyzeIntent(text, context) {
        const intents = {
            FINANCIAL_QUESTION: [
                'លុយ', 'ប្រាក់', 'money', 'សន្សំ', 'save', 'ចំណាយ', 'spend',
                'ចំណូល', 'income', 'ថវិកា', 'budget', 'debt', 'បំណុល'
            ],
            PROGRESS_CHECK: [
                'progress', 'រីកចម្រើន', 'ទៅដល់ណា', 'how am i', 'status',
                'day', 'ថ្ងៃ', 'completed', 'បានបញ្ចប់'
            ],
            CONFUSED_USER: [
                'confused', 'មិនយល់', 'don\'t understand', 'help',
                'ជំនួយ', 'មិនដឹង', 'lost', 'what to do'
            ],
            MOTIVATION_NEEDED: [
                'give up', 'ប្រញាប់ចង់បោះបង់', 'difficult', 'hard',
                'motivation', 'encourage', 'ធ្វើមិនបាន'
            ],
            CASUAL_CHAT: [
                'hello', 'hi', 'ជម្រាបសួរ', 'good morning', 'thanks',
                'អរគុណ', 'how are you', 'ហើយយ៉ាងណាខ្លះ'
            ]
        };

        for (const [type, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return { 
                    type, 
                    confidence: 0.8, 
                    keywords: keywords.filter(k => text.includes(k))
                };
            }
        }

        return { type: 'UNKNOWN', confidence: 0.5 };
    }

    // 💰 HANDLE FINANCIAL QUESTIONS
    async handleFinancialQuestion(msg, intent) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Show smart typing indicator
        await this.bot.sendChatAction(chatId, 'typing');

        // Get user context for personalized response
        const userContext = await this.getUserFinancialContext(userId);
        
        // Use AI to provide contextual answer
        const response = await aiService.handleUserQuestion(msg.text, userContext);
        
        if (response.success) {
            await this.bot.sendMessage(chatId, 
                `💡 **AI ជំនួយ:**\n\n${response.response}\n\n` +
                `🎯 **បន្ថែម:** ប្រើ /analyze សម្រាប់ការវិភាគលម្អិត`
            );

            // Suggest follow-up actions
            await this.suggestFollowUpActions(chatId, intent.keywords);
        }
    }

    // 📊 HANDLE PROGRESS INQUIRIES  
    async handleProgressInquiry(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const progress = await Progress.findOne({ userId });
        const user = await User.findOne({ telegramId: userId });

        const currentDay = progress?.current_day || 1;
        const completedDays = this.countCompletedDays(progress);

        const progressMessage = `📊 **ការរីកចម្រើនរបស់អ្នក:**\n\n` +
            `🎯 ថ្ងៃបច្ចុប្បន្ន: **Day ${currentDay}**/7\n` +
            `✅ បានបញ្ចប់: **${completedDays}** ថ្ងៃ\n` +
            `⏱️ នៅសល់: **${7 - completedDays}** ថ្ងៃ\n\n` +
            `💪 **អ្នកកំពុងធ្វើបានល្អ!**\n\n` +
            `${this.getMotivationalMessage(completedDays)}`;

        await this.bot.sendMessage(chatId, progressMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎯 បន្តថ្ងៃនេះ', callback_data: `continue_day_${currentDay}` }],
                    [{ text: '🤖 ទទួលយោបល់ AI', callback_data: 'get_ai_advice' }],
                    [{ text: '📈 មើលលម្អិត', callback_data: 'detailed_progress' }]
                ]
            }
        });
    }

    // 😕 HANDLE CONFUSED USERS
    async handleConfusedUser(msg) {
        const chatId = msg.chat.id;
        
        const helpMessage = `🤝 **ខ្ញុំនៅទីនេះដើម្បីជួយ!**\n\n` +
            `🎯 **ធ្វើអ្វីបាន:**\n` +
            `• សួរសំណួរអ្វីក៏បាន អំពីលុយ\n` +
            `• ស្វែងរកការណែនាំផ្ទាល់ខ្លួន\n` +
            `• ពិនិត្យការរីកចម្រើន\n` +
            `• បង្រៀនជំហានបន្ទាប់\n\n` +
            `💬 **ឧទាហរណ៍:**\n` +
            `"ខ្ញុំគួរធ្វើអ្វីថ្ងៃនេះ?"\n` +
            `"តើខ្ញុំសន្សំបានយ៉ាងណា?"\n` +
            `"រកមើលចំណាយអ្វីកាត់បន្ថយបាន?"\n\n` +
            `🚀 ចាប់ផ្តើម: សួរអ្វីក៏បាន!`;

        await this.bot.sendMessage(chatId, helpMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎯 ម្តងទៀតពីដើម', callback_data: 'restart_program' }],
                    [{ text: '💬 សួរ AI', callback_data: 'ask_ai_anything' }],
                    [{ text: '📚 មើលមេរៀន', callback_data: 'view_lessons' }]
                ]
            }
        });
    }

    // 💪 HANDLE MOTIVATION REQUESTS
    async handleMotivationRequest(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Get personalized motivation from AI
        const userProgress = await this.getUserProgress(userId);
        const motivation = await aiService.getPersonalizedCoaching(userProgress, userProgress.currentDay);

        if (motivation.success) {
            await this.bot.sendMessage(chatId, 
                `💪 **ការលើកទឹកចិត្តពីAI:**\n\n${motivation.response}\n\n` +
                `🎯 **ចងចាំ:** រាល់ជំហានតូច = ជោគជ័យធំ!`
            );
        }

        // Send motivational quick actions
        await this.bot.sendMessage(chatId, 
            `🚀 **បន្តទៅមុខ:**`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✨ ទទួលកិច្ចការថ្ងៃនេះ', callback_data: 'daily_task' }],
                    [{ text: '🏆 មើលជោគជ័យ', callback_data: 'view_achievements' }],
                    [{ text: '👥 ចែករំលែកនៅGroup', callback_data: 'share_progress' }]
                ]
            }
        });
    }

    // 😊 HANDLE CASUAL CHAT
    async handleCasualChat(msg, intent) {
        const chatId = msg.chat.id;
        const text = msg.text.toLowerCase();

        const responses = {
            greeting: `👋 ជម្រាបសួរ! ខ្ញុំជា AI Assistant របស់ Money Flow Reset។ តើខ្ញុំអាចជួយអ្នកយ៉ាងណា?`,
            thanks: `🙏 មិនអីទេ! ខ្ញុំរីករាយដែលអាចជួយបាន។ មានសំណួរអ្វីទៀតទេ?`,
            how_are_you: `🤖 ខ្ញុំជា AI ដូច្នេះមិនមានអារម្មណ៍ទេ តែខ្ញុំចាប់អារម្មណ៍ចង់ជួយអ្នកឱ្យទទួលបានជោគជ័យ! តើអ្នកយ៉ាងណាខ្លះ?`
        };

        let response = responses.greeting; // default

        if (text.includes('thanks') || text.includes('អរគុណ')) {
            response = responses.thanks;
        } else if (text.includes('how are you') || text.includes('យ៉ាងណាខ្លះ')) {
            response = responses.how_are_you;
        }

        await this.bot.sendMessage(chatId, response);
    }

    // 🔄 SMART FALLBACK WITH CONTEXT
    async handleSmartFallback(msg, context) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // If user has been chatting, use AI
        if (context.messageCount > 2) {
            const userContext = await this.getUserFinancialContext(userId);
            const response = await aiService.handleUserQuestion(msg.text, userContext);
            
            if (response.success) {
                await this.bot.sendMessage(chatId, response.response);
                return;
            }
        }

        // Otherwise suggest specific actions
        await this.bot.sendMessage(chatId, 
            `🤔 ខ្ញុំយល់ថាអ្នកចង់ម៉េចបន្តិច?\n\n` +
            `ព្យាយាមប្រើពាក្យបញ្ជាទាំងនេះ:\n\n` +
            `💬 /ask [សំណួរ] - សួរអ្វីក៏បាន\n` +
            `📊 /progress - ពិនិត្យការរីកចម្រើន\n` +
            `🎯 /coach - ទទួលការណែនាំ\n` +
            `🔍 /analyze - វិភាគហិរញ្ញវត្ថុ\n\n` +
            `ឬប្រើ /help សម្រាប់ជម្រើសទាំងអស់!`
        );
    }

    // 🔔 SMART NOTIFICATIONS SYSTEM
    setupSmartNotifications() {
        // Daily motivation (8 AM Cambodia time)
        cron.schedule('0 8 * * *', async () => {
            await this.sendDailyMotivation();
        }, {
            timezone: "Asia/Phnom_Penh"
        });

        // Evening check-in (7 PM Cambodia time)
        cron.schedule('0 19 * * *', async () => {
            await this.sendEveningCheckIn();
        }, {
            timezone: "Asia/Phnom_Penh"
        });

        // Weekend reminders (Saturday 9 AM)
        cron.schedule('0 9 * * 6', async () => {
            await this.sendWeekendReminder();
        }, {
            timezone: "Asia/Phnom_Penh"
        });
    }

    // 🌅 DAILY MOTIVATION MESSAGES
    async sendDailyMotivation() {
        try {
            const activeUsers = await User.findAll({
                where: {
                    lastActive: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // Active in last 3 days
                }
            });

            for (const user of activeUsers) {
                const progress = await Progress.findOne({ userId: user.telegram_id });
                const currentDay = progress?.current_day || 1;
                
                if (currentDay <= 7) { // Only active program participants
                    const motivation = await aiService.getPersonalizedCoaching(
                        { currentDay, completedDays: this.countCompletedDays(progress) },
                        currentDay
                    );

                    const message = `🌅 **ថ្ងៃថ្មីបានចាប់ផ្តើម!**\n\n` +
                        `${motivation.success ? motivation.response : this.getDefaultMotivation(currentDay)}\n\n` +
                        `🎯 ចាប់ផ្តើមថ្ងៃនេះ: /day${currentDay}`;

                    await this.bot.sendMessage(user.telegram_id, message);
                    await this.sleep(2000); // Avoid rate limits
                }
            }

            console.log(`📱 Daily motivation sent to ${activeUsers.length} users`);
        } catch (error) {
            console.error('Daily motivation error:', error);
        }
    }

    // 🌆 EVENING CHECK-IN
    async sendEveningCheckIn() {
        try {
            const activeUsers = await User.findAll({
                where: {
                    lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Active today
                }
            });

            for (const user of activeUsers) {
                const message = `🌆 **បញ្ចប់ថ្ងៃយ៉ាងណា?**\n\n` +
                    `តើអ្នកបានធ្វើកិច្ចការ Money Flow ថ្ងៃនេះអស់ហើយទេ?\n\n` +
                    `💭 ចំណាំ: ការធ្វើតិចតួចជារៀងរាល់ថ្ងៃ ប្រសើរជាងការធ្វើច្រើននៅថ្ងៃតែមួយ!`;

                await this.bot.sendMessage(user.telegram_id, message, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ បានធ្វើហើយ', callback_data: 'completed_today' }],
                            [{ text: '⏰ នៅមានពេល', callback_data: 'need_more_time' }],
                            [{ text: '🤖 ត្រូវការជំនួយ', callback_data: 'need_help' }]
                        ]
                    }
                });

                await this.sleep(3000);
            }

            console.log(`🌆 Evening check-in sent to ${activeUsers.length} users`);
        } catch (error) {
            console.error('Evening check-in error:', error);
        }
    }

    // 📱 CALLBACK QUERY HANDLER
    async handleCallbackQuery(query) {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;

        try {
            await this.bot.answerCallbackQuery(query.id);

            switch (data) {
                case 'get_ai_advice':
                    await this.provideAIAdvice(chatId, userId);
                    break;

                case 'completed_today':
                    await this.handleDayCompletion(chatId, userId);
                    break;

                case 'need_help':
                    await this.provideHelpOptions(chatId);
                    break;

                case 'ask_ai_anything':
                    await this.promptAIQuestion(chatId);
                    break;

                default:
                    if (data.startsWith('continue_day_')) {
                        const day = data.split('_')[2];
                        await this.continueDayProgram(chatId, userId, day);
                    }
            }
        } catch (error) {
            console.error('Callback query error:', error);
        }
    }

    // 🎯 PROVIDE AI ADVICE
    async provideAIAdvice(chatId, userId) {
        const userFinances = await this.getUserFinancialContext(userId);
        const advice = await aiService.analyzeFinancialSituation(userFinances);

        if (advice.success) {
            await this.bot.sendMessage(chatId, 
                `🤖 **ការវិភាគរបស់ AI:**\n\n${advice.response}`
            );
        } else {
            await this.bot.sendMessage(chatId, 
                `🎯 **ចង់បានការវិភាគ AI?**\n\nសូមកំណត់ព័ត៌មានហិរញ្ញវត្ថុជាមុនសិន:\n• ចំណូលប្រចាំខែ\n• ចំណាយប្រចាំខែ\n• សន្សំបច្ចុប្បន្ន\n\nបន្ទាប់មកប្រើ /analyze`
            );
        }
    }

    // 🚨 INACTIVITY DETECTION
    setupInactivityDetection() {
        // Check for inactive users every 6 hours
        cron.schedule('0 */6 * * *', async () => {
            await this.checkInactiveUsers();
        });
    }

    async checkInactiveUsers() {
        try {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const inactiveUsers = await User.findAll({
                where: {
                    lastActive: { gte: twoDaysAgo }
                },
                orderBy: { lastActive: 'desc' }
            });

            for (const user of inactiveUsers) {
                const progress = await Progress.findOne({ userId: user.telegram_id });
                
                if (progress && progress.current_day <= 7) {
                    const message = `👋 **បានឃើញអ្នកពីយូរហើយ!**\n\n` +
                        `Money Flow Reset នៅតែរង់ចាំអ្នកនៅ Day ${progress.current_day}!\n\n` +
                        `🎯 ត្រលប់មកបន្ត: /day${progress.current_day}\n` +
                        `💬 ត្រូវការជំនួយ: /ask ខ្ញុំត្រូវការជំនួយ\n\n` +
                        `💪 រៀងរាល់ថ្ងៃតិចតួច = លទ្ធផលធំ!`;

                    await this.bot.sendMessage(user.telegram_id, message);
                    await this.sleep(5000); // Longer delay for re-engagement
                }
            }

            console.log(`📢 Re-engagement sent to ${inactiveUsers.length} inactive users`);
        } catch (error) {
            console.error('Inactivity detection error:', error);
        }
    }

    // 🛠️ HELPER METHODS
    getUserSession(userId) {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, {
                messageCount: 0,
                lastIntent: null,
                conversationStart: new Date(),
                topics: []
            });
        }
        return this.userSessions.get(userId);
    }

    updateUserSession(userId, message, intent) {
        const session = this.getUserSession(userId);
        session.messageCount++;
        session.lastIntent = intent;
        session.lastMessage = message;
        session.topics.push(intent.type);
        this.userSessions.set(userId, session);
    }

    async getUserFinancialContext(userId) {
        try {
            const user = await User.findOne({ telegramId: userId });
            const progress = await Progress.findOne({ userId });

            return {
                name: user?.first_name || 'User',
                currentDay: progress?.current_day || 1,
                completedDays: this.countCompletedDays(progress),
                monthlyIncome: user?.monthlyIncome || 0,
                monthlyExpenses: user?.monthlyExpenses || 0
            };
        } catch (error) {
            return { currentDay: 1, completedDays: 0 };
        }
    }

    countCompletedDays(progress) {
        if (!progress) return 0;
        
        let count = 0;
        for (let i = 0; i <= 7; i++) {
            if (progress[`day_${i}_completed`]) count++;
        }
        return count;
    }

    getMotivationalMessage(completedDays) {
        const messages = [
            "🎯 ការចាប់ផ្តើមជាការពិបាក ប៉ុន្តែអ្នកធ្វើបានហើយ!",
            "💪 ២ថ្ងៃហើយ! ការបន្តទៅមុខគឺជាចំនុចគន្លឹះ!",
            "🔥 ពាក់កណ្តាលហើយ! អ្នកកំពុងកាត់តាមនេះ!",
            "🚀 ជិតចប់ហើយ! អត្ថប្រយោជន៍របស់អ្នកកំពុងកើតឡើង!",
            "⭐ អស្ចារ្យណាស់! ថ្ងៃចុងក្រោយហើយ!",
            "🏆 អ្នកបានធ្វើវា! លទ្ធផលនឹងមកដល់ពីឥឡូវនេះ!",
            "🎊 បញ្ចប់កម្មវិធីហើយ! ជីវិតថ្មីចាប់ផ្តើម!"
        ];
        
        return messages[Math.min(completedDays, messages.length - 1)];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 🎮 REGISTER ALL AUTOMATION
    static registerAutomation(bot) {
        const automation = new SmartAutomation(bot);
        console.log('🤖 Smart Automation System Active!');
        return automation;
    }
}

module.exports = SmartAutomation;
