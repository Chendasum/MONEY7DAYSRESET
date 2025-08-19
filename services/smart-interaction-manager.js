// 🎯 Smart Interaction Manager - Makes your bot super interactive!
// Add this to work alongside your existing commands

const aiService = require('../services/aiIntegration');
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
            `💡 **
