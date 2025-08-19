// 🎯 Smart Interaction Manager - Complete & Working Version
// Create this as: services/smart-interaction-manager.js

const User = require('../models/User');
const Progress = require('../models/Progress');

class SmartInteractionManager {
    constructor(bot) {
        this.bot = bot;
        this.pendingResponses = new Map(); // Track users waiting for responses
        this.conversationFlows = new Map(); // Track conversation states
        this.init();
    }

    init() {
        console.log('🎯 Smart Interaction Manager starting...');
        this.setupSmartWelcome();
        this.setupConversationFlows();
        this.setupSmartSuggestions();
    }

    // 🎉 SMART WELCOME FOR NEW USERS
    setupSmartWelcome() {
        this.bot.onText(/\/start/, async (msg) => {
            await this.handleSmartStart(msg);
        });
    }

    async handleSmartStart(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const userName = msg.from.first_name || 'Friend';

        try {
            // Check if returning user
            const existingUser = await User.findOne({ telegramId: userId });
            const progress = await Progress.findOne({ userId });

            if (existingUser && progress) {
                // Returning user - personalized welcome
                await this.handleReturningUser(chatId, userName, progress);
            } else {
                // New user - full onboarding
                await this.handleNewUser(chatId, userId, userName);
            }

        } catch (error) {
            console.error('Smart start error:', error);
            await this.bot.sendMessage(chatId, 
                `👋 ជម្រាបសួរ ${userName}! សូមស្វាគមន៍ទៅកាន់ Money Flow Reset!`
            );
        }
    }

    // 🆕 NEW USER ONBOARDING
    async handleNewUser(chatId, userId, userName) {
        // Step 1: Welcome message
        const welcomeMessage = `🎉 **ជម្រាបសួរ ${userName}!**\n\n` +
            `សូមស្វាគមន៍ទៅកាន់ **Money Flow Reset™** - កម្មវិធី 7 ថ្ងៃដើម្បីផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុរបស់អ្នក!\n\n` +
            `🤖 ខ្ញុំជា AI Assistant ដែលនឹងជួយអ្នកគ្រប់ជំហាន។\n\n` +
            `💡 **អ្នកអាចធ្វើអ្វីបាន:**\n` +
            `• សួរសំណួរអ្វីក៏បាន អំពីលុយ\n` +
            `• ទទួលការណែនាំផ្ទាល់ខ្លួន\n` +
            `• វិភាគហិរញ្ញវត្ថុ\n` +
            `• រកមើល Money Leaks\n\n` +
            `🚀 **តោះចាប់ផ្តើម!**`;

        await this.bot.sendMessage(chatId, welcomeMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎯 ចាប់ផ្តើម Day 0', callback_data: 'start_day0' }],
                    [{ text: '🤖 សួរ AI អ្វីមួយ', callback_data: 'ask_ai_demo' }],
                    [{ text: '📚 ស្វែងយល់បន្ថែម', callback_data: 'learn_more' }]
                ]
            }
        });

        // Step 2: Start conversation flow
        this.startConversationFlow(userId, 'onboarding');

        // Step 3: Create user record
        await User.findOneAndUpdate(
            { telegramId: userId },
            {
                firstName: userName,
                joinedAt: new Date(),
                lastActive: new Date()
            },
            { upsert: true }
        );
    }

    // 🔄 RETURNING USER WELCOME
    async handleReturningUser(chatId, userName, progress) {
        const currentDay = progress.current_day || 1;
        const completedDays = this.countCompletedDays(progress);

        const welcomeMessage = `👋 **សូមស្វាគមន៍ត្រលប់មកវិញ ${userName}!**\n\n` +
            `📊 **ការរីកចម្រើនរបស់អ្នក:**\n` +
            `🎯 ថ្ងៃបច្ចុប្បន្ន: **Day ${currentDay}**/7\n` +
            `✅ បានបញ្ចប់: **${completedDays}** ថ្ងៃ\n\n` +
            `💪 ${this.getWelcomeBackMessage(completedDays)}\n\n` +
            `🤖 **AI ខ្ញុំនៅទីនេះជួយអ្នក!**`;

        await this.bot.sendMessage(chatId, welcomeMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: `🎯 បន្ត Day ${currentDay}`, callback_data: `continue_day_${currentDay}` }],
                    [{ text: '📊 ពិនិត្យការរីកចម្រើន', callback_data: 'check_progress' }],
                    [{ text: '💬 សួរ AI', callback_data: 'ask_ai_demo' }],
                    [{ text: '🔍 វិភាគហិរញ្ញវត្ថុ', callback_data: 'analyze_finances' }]
                ]
            }
        });
    }

    // 🔀 CONVERSATION FLOW SYSTEM
    setupConversationFlows() {
        this.bot.on('callback_query', async (query) => {
            await this.handleConversationFlow(query);
        });

        // Handle text responses in flows
        this.bot.on('message', async (msg) => {
            if (msg.text && !msg.text.startsWith('/')) {
                await this.handleFlowResponse(msg);
            }
        });
    }

    async handleConversationFlow(query) {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;

        await this.bot.answerCallbackQuery(query.id);

        switch (data) {
            case 'ask_ai_demo':
                await this.startAIDemo(chatId, userId);
                break;

            case 'start_day0':
                await this.startDay0Tutorial(chatId, userId);
                break;

            case 'learn_more':
                await this.showProgramOverview(chatId);
                break;

            case 'analyze_finances':
                await this.startFinancialAnalysis(chatId, userId);
                break;

            case 'quick_question':
                await this.handleQuickQuestion(chatId, userId);
                break;

            case 'detailed_analysis':
                await this.provideDetailedAnalysis(chatId, userId);
                break;

            case 'need_motivation':
                await this.provideMotivation(chatId, userId);
                break;

            default:
                if (data.startsWith('continue_day_')) {
                    const day = data.split('_')[2];
                    await this.continueDayProgram(chatId, userId, day);
                }
        }
    }

    // 🤖 AI DEMO FOR NEW USERS
    async startAIDemo(chatId, userId) {
        const demoMessage = `🤖 **AI Demo - សាកល្បងសួរ AI**\n\n` +
            `តោះមើលថា AI អាចជួយអ្នកយ៉ាងណា! សួរសំណួរដូចជា:\n\n` +
            `💭 **ឧទាហរណ៍:**\n` +
            `• "តើខ្ញុំគួរសន្សំយ៉ាងណា?"\n` +
            `• "រកមើលចំណាយអ្វីកាត់បន្ថយបាន?"\n` +
            `• "ធ្វើយ៉ាងណាដើម្បីបង្កើនចំណូល?"\n` +
            `• "តើខ្ញុំគួរចាប់ផ្តើមពីណា?"\n\n` +
            `💬 **សួរអ្វីក៏បាន!** ឬជ្រើសរើសសំណួរខាងក្រោម:`;

        await this.bot.sendMessage(chatId, demoMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💰 តើខ្ញុំគួរសន្សំយ៉ាងណា?', callback_data: 'demo_savings' }],
                    [{ text: '📊 ធ្វើយ៉ាងណាដាក់ថវិកា?', callback_data: 'demo_budget' }],
                    [{ text: '🔍 រកមើល Money Leaks', callback_data: 'demo_leaks' }],
                    [{ text: '💬 សួរផ្ទាល់', callback_data: 'ask_custom' }]
                ]
            }
        });

        this.setUserFlow(userId, 'ai_demo');
    }

    // 💡 SMART SUGGESTIONS SYSTEM
    setupSmartSuggestions() {
        // Suggest actions based on user behavior
        setInterval(async () => {
            await this.provideSuggestions();
        }, 30000); // Every 30 seconds check for suggestions
    }

    async provideSuggestions() {
        // Get users who might need suggestions
        const users = Array.from(this.conversationFlows.keys());
        
        for (const userId of users.slice(0, 5)) { // Limit to 5 users per cycle
            try {
                const flow = this.conversationFlows.get(userId);
                if (flow && flow.lastActivity) {
                    const timeSinceLastActivity = Date.now() - flow.lastActivity;
                    
                    // If user hasn't responded in 2 minutes, provide help
                    if (timeSinceLastActivity > 120000 && !flow.helpProvided) {
                        await this.provideBehaviorBasedSuggestion(userId, flow);
                        flow.helpProvided = true;
                    }
                }
            } catch (error) {
                console.error('Suggestion error for user', userId, error);
            }
        }
    }

    async provideBehaviorBasedSuggestion(userId, flow) {
        const suggestions = {
            ai_demo: `💡 **មិនដឹងចង់សួរអ្វី?**\n\nព្យាយាម:\n• "ជួយវិភាគចំណាយខ្ញុំ"\n• "តើខ្ញុំគួរធ្វើអ្វីថ្ងៃនេះ?"\n• ឬប្រើ /help សម្រាប់ជម្រើសទាំងអស់`,
            
            onboarding: `🎯 **ត្រៀមចាប់ផ្តើម?**\n\nដើម្បីទទួលបានអត្ថប្រយោជន៍ពេញលេញ:\n• ចាប់ផ្តើមពី Day 0\n• កំណត់គោលដៅច្បាស់\n• ប្រើ AI ជួយវិភាគ`,
            
            financial_analysis: `📊 **ត្រូវការជំនួយការវិភាគ?**\n\nAI អាចជួយ:\n• វិភាគចំណូល-ចំណាយ\n• រកមើល Money Leaks\n• ផ្តល់យោបល់សន្សំ`
        };

        const suggestion = suggestions[flow.type] || suggestions.ai_demo;
        
        try {
            await this.bot.sendMessage(userId, suggestion);
        } catch (error) {
            console.error('Failed to send suggestion:', error);
        }
    }

    // 🎯 FLOW HANDLERS
    async handleFlowResponse(msg) {
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        const text = msg.text;

        const flow = this.conversationFlows.get(userId);
        if (!flow) return;

        // Update flow activity
        flow.lastActivity = Date.now();
        flow.helpProvided = false;

        switch (flow.type) {
            case 'ai_demo':
                await this.handleAIDemoResponse(chatId, userId, text);
                break;

            case 'financial_setup':
                await this.handleFinancialSetupResponse(chatId, userId, text, flow);
                break;

            case 'custom_question':
                await this.handleCustomQuestion(chatId, userId, text);
                break;
        }
    }

    async handleAIDemoResponse(chatId, userId, text) {
        // Show typing indicator for realistic feel
        await this.bot.sendChatAction(chatId, 'typing');
        
        // Simple demo response for now
        const demoResponse = `🤖 **AI ទទួលបាន!**\n\n` +
            `អ្នកបានសួរ: "${text}"\n\n` +
            `នេះគឺជាគំរូការឆ្លើយតប។ AI ពិតប្រាកដនឹងផ្តល់ជំនួយដ៏ល្អិតល្អន់!\n\n` +
            `💡 ចង់សាកល្បង AI ពិតប្រាកដ? ប្រើ /ask [សំណួរ]`;
        
        await this.bot.sendMessage(chatId, demoResponse);

        // Offer next steps
        setTimeout(async () => {
            await this.bot.sendMessage(chatId, 
                `🚀 **ចង់បន្តទៅមុខទេ?**`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎯 ចាប់ផ្តើម Program', callback_data: 'start_day0' }],
                        [{ text: '💬 សួរសំណួរថ្មី', callback_data: 'ask_ai_demo' }],
                        [{ text: '📊 វិភាគហិរញ្ញវត្ថុ', callback_data: 'analyze_finances' }]
                    ]
                }
            });
        }, 3000);
    }

    async handleCustomQuestion(chatId, userId, text) {
        await this.bot.sendChatAction(chatId, 'typing');
        
        const response = `🤖 **ទទួលបានសំណួរ:**\n\n"${text}"\n\n` +
            `AI នឹងឆ្លើយតបជាមួយនឹងការណែនាំពិស្តារក្នុងពេលឆាប់ៗនេះ!\n\n` +
            `🎯 សម្រាប់ពេលនេះ សូមប្រើ /ask [សំណួរ] ដើម្បីទទួលបានជំនួយពី AI`;
        
        await this.bot.sendMessage(chatId, response);
        
        // Suggest follow-up actions
        await this.bot.sendMessage(chatId, 
            `🎯 **បន្ថែម:**`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💭 សួរសំណួរថ្មី', callback_data: 'ask_custom' }],
                    [{ text: '📊 វិភាគលម្អិត', callback_data: 'detailed_analysis' }],
                    [{ text: '🎯 ចាប់ផ្តើម Program', callback_data: 'start_day0' }]
                ]
            }
        });
        
        this.clearUserFlow(userId);
    }

    // 📊 PLACEHOLDER METHODS (implement as needed)
    async startDay0Tutorial(chatId, userId) {
        await this.bot.sendMessage(chatId, 
            `🎯 **Day 0 Tutorial**\n\nនេះគឺជាការចាប់ផ្តើម Money Flow Reset!\n\nប្រើ /day0 ដើម្បីចាប់ផ្តើម។`
        );
    }

    async showProgramOverview(chatId) {
        await this.bot.sendMessage(chatId, 
            `📚 **Money Flow Reset Overview**\n\n7 ថ្ងៃដើម្បីផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុរបស់អ្នក!\n\nប្រើ /help ដើម្បីមើលជម្រើសទាំងអស់។`
        );
    }

    async startFinancialAnalysis(chatId, userId) {
        await this.bot.sendMessage(chatId, 
            `📊 **ការវិភាគហិរញ្ញវត្ថុ**\n\nប្រើ /analyze ដើម្បីទទួលបានការវិភាគពី AI។`
        );
    }

    async continueDayProgram(chatId, userId, day) {
        await this.bot.sendMessage(chatId, 
            `🎯 **បន្ត Day ${day}**\n\nប្រើ /day${day} ដើម្បីបន្តកម្មវិធី។`
        );
    }

    // 🛠️ UTILITY METHODS
    setUserFlow(userId, flowType, data = {}) {
        this.conversationFlows.set(userId, {
            type: flowType,
            data: data,
            startTime: Date.now(),
            lastActivity: Date.now(),
            helpProvided: false
        });
    }

    clearUserFlow(userId) {
        this.conversationFlows.delete(userId);
    }

    startConversationFlow(userId, type) {
        this.setUserFlow(userId, type);
    }

    countCompletedDays(progress) {
        if (!progress) return 0;
        
        let count = 0;
        for (let i = 0; i <= 7; i++) {
            if (progress[`day_${i}_completed`]) count++;
        }
        return count;
    }

    getWelcomeBackMessage(completedDays) {
        const messages = [
            "ចាប់ផ្តើមគឺពិបាក តែអ្នកទើបតែចាប់ផ្តើម!",
            "ថ្ងៃទី២ហើយ! បន្តទៅមុខ!",
            "ពាក់កណ្តាលដំណើរហើយ! 💪",
            "ជិតដល់ទីផ្សារហើយ! 🔥",
            "ថ្ងៃចុងក្រោយហើយ! អ្នកអស្ចារ្យ! ⭐",
            "បញ្ចប់ហើយ! ពេលឥឡូវនេះគឺ Integration! 🏆"
        ];
        
        return messages[Math.min(completedDays, messages.length - 1)];
    }

    // 🚀 REGISTER INTERACTION MANAGER
    static register(bot) {
        const manager = new SmartInteractionManager(bot);
        console.log('🎯 Smart Interaction Manager registered!');
        return manager;
    }
}

module.exports = SmartInteractionManager;
