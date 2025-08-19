// 🤖 AI Command Handler for Telegram Bot Integration
const aiService = require('../services/enhanced-ai-integration');
const User = require('../models/User');
const Progress = require('../models/Progress');
const AccessControl = require('../services/access-control');

class AICommandHandler {
    constructor() {
        this.accessControl = new AccessControl();
    }

    // 💬 Handle /ask command - General AI Chat
    async handleAskCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const question = msg.text.replace('/ask', '').trim();

        try {
            if (!question) {
                await bot.sendMessage(chatId, 
                    `🤖 ប្រើ AI Assistant:\n\n` +
                    `💬 /ask [សំណួរ] - សួរអ្វីក៏បាន\n` +
                    `📊 /analyze - វិភាគហិរញ្ញវត្ថុ\n` +
                    `🎯 /coach - ការណែនាំផ្ទាល់ខ្លួន\n` +
                    `🔍 /find_leaks - រកមើល Money Leaks\n\n` +
                    `ឧទាហរណ៍: /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?`
                );
                return;
            }

            // Show typing indicator
            await bot.sendChatAction(chatId, 'typing');

            // Get user context
            const userContext = await this.getUserContext(userId);
            
            // Get AI response
            const aiResponse = await aiService.handleUserQuestion(question, userContext);
            
            // Send response to user
            await aiService.sendAIResponse(bot, chatId, aiResponse);

        } catch (error) {
            console.error('Error in /ask command:', error);
            await bot.sendMessage(chatId, 
                "❌ មានបញ្ហាជាមួយ AI។ សូមសាកម្តងទៀតក្រោយ ឬប្រើ /help សម្រាប់ជម្រើសផ្សេង។"
            );
        }
    }

    // 📊 Handle /analyze command - Financial Analysis
    async handleAnalyzeCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            // Check access
            const access = await this.accessControl.checkAccess(userId, 'advanced_analytics');
            if (!access.hasAccess) {
                await bot.sendMessage(chatId, access.message);
                return;
            }

            await bot.sendChatAction(chatId, 'typing');

            // Get user financial data (you'll need to implement this based on your data structure)
            const userFinances = await this.getUserFinancialData(userId);
            const currentDay = await this.getCurrentDay(userId);
            
            // Get AI analysis
            const analysis = await aiService.analyzeFinancialSituation(userFinances, currentDay);
            
            // Send analysis to user
            await aiService.sendAIResponse(bot, chatId, analysis);

        } catch (error) {
            console.error('Error in /analyze command:', error);
            await bot.sendMessage(chatId, 
                "❌ មានបញ្ហាក្នុងការវិភាគ។ សូមសាកម្តងទៀតក្រោយ។"
            );
        }
    }

    // 🎯 Handle /coach command - Personalized Coaching
    async handleCoachCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            // Get user progress
            const userProgress = await this.getUserProgress(userId);
            const dayNumber = userProgress.currentDay || 1;
            
            // Get personalized coaching
            const coaching = await aiService.getPersonalizedCoaching(userProgress, dayNumber);
            
            // Send coaching to user
            await aiService.sendAIResponse(bot, chatId, coaching);

        } catch (error) {
            console.error('Error in /coach command:', error);
            await bot.sendMessage(chatId, 
                "❌ មានបញ្ហាក្នុងការណែនាំ។ សូមសាកម្តងទៀតក្រោយ។"
            );
        }
    }

    // 🔍 Handle /find_leaks command - Money Leak Detection
    async handleFindLeaksCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            // Get user expense data
            const expenses = await this.getUserExpenses(userId);
            const income = await this.getUserIncome(userId);
            
            // Get money leak analysis
            const leakAnalysis = await aiService.detectMoneyLeaks(expenses, income);
            
            // Send analysis to user
            await aiService.sendAIResponse(bot, chatId, leakAnalysis);

        } catch (error) {
            console.error('Error in /find_leaks command:', error);
            await bot.sendMessage(chatId, 
                "❌ មានបញ្ហាក្នុងការរកមើល Money Leaks។ សូមសាកម្តងទៀតក្រោយ។"
            );
        }
    }

    // 🔧 Handle /ai_status command - AI System Status (Admin only)
    async handleAIStatusCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            // Check admin access
            const hasAdmin = await this.accessControl.hasAdminAccess(userId);
            if (!hasAdmin) {
                await bot.sendMessage(chatId, "🔒 ត្រូវការសិទ្ធិអ្នកគ្រប់គ្រង។");
                return;
            }

            const status = aiService.getStatus();
            const testResult = await aiService.testConnection();

            const statusMessage = `🤖 AI System Status\n\n` +
                `✅ Initialized: ${status.initialized}\n` +
                `🔮 Claude Available: ${status.claude_available}\n` +
                `🧠 OpenAI Available: ${status.openai_available}\n` +
                `🎯 Primary AI: ${status.primary_ai}\n\n` +
                `🛠️ Capabilities:\n` +
                `• Chat: ${status.capabilities.chat_assistance}\n` +
                `• Analysis: ${status.capabilities.financial_analysis}\n` +
                `• Coaching: ${status.capabilities.personalized_coaching}\n` +
                `• Leak Detection: ${status.capabilities.money_leak_detection}\n\n` +
                `🧪 Connection Test: ${JSON.stringify(testResult)}\n\n` +
                `⏰ Last Check: ${status.last_check}`;

            await bot.sendMessage(chatId, statusMessage);

        } catch (error) {
            console.error('Error in /ai_status command:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការពិនិត្យស្ថានភាព AI។");
        }
    }

    // 🎓 Handle smart responses to regular messages (when AI can help)
    async handleSmartResponse(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text?.toLowerCase() || '';

        try {
            // Check if message contains financial keywords
            const financialKeywords = [
                'លុយ', 'ប្រាក់', 'សន្សំ', 'ចំណាយ', 'ចំណូល', 'ខ្ញុំ', 'money', 'save', 'spend', 'income',
                'ជំនួយ', 'help', 'មិនដឹង', 'confused', 'បញ្ហា', 'problem', 'យ៉ាងណា', 'how'
            ];

            const containsFinancialKeyword = financialKeywords.some(keyword => 
                text.includes(keyword)
            );

            if (containsFinancialKeyword && text.length > 10) {
                // Show brief thinking indicator
                await bot.sendChatAction(chatId, 'typing');

                // Get user context
                const userContext = await this.getUserContext(userId);
                
                // Get AI response
                const aiResponse = await aiService.handleUserQuestion(text, userContext);
                
                if (aiResponse.success) {
                    // Add prefix to show this is AI helping automatically
                    const smartResponse = `💡 AI ជំនួយ:\n\n${aiResponse.response}\n\n` +
                        `💬 ចង់សួរបន្ថែម? ប្រើ /ask [សំណួរ]`;
                    
                    await bot.sendMessage(chatId, smartResponse);
                }
            }

        } catch (error) {
            console.error('Error in smart response:', error);
            // Fail silently for smart responses
        }
    }

    // 📚 AI Help Menu
    async handleAIHelpCommand(bot, msg) {
        const chatId = msg.chat.id;

        const helpMessage = `🤖 AI Assistant ជំនួយ

🎯 **ពាក្យបញ្ជា AI:**
• /ask [សំណួរ] - សួរអ្វីក៏បាន អំពីលុយ
• /analyze - វិភាគហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• /coach - ការណែនាំផ្ទាល់ខ្លួន
• /find_leaks - រកមើល Money Leaks
• /ai_help - មើលមេនុនេះ

💡 **ឧទាហរណ៍សំណួរ:**
• "តើខ្ញុំគួរសន្សំយ៉ាងណា?"
• "ចំណាយអ្វីខ្លះដែលអាចកាត់បន្ថយ?"
• "តើធ្វើយ៉ាងណាដើម្បីបង្កើនចំណូល?"
• "រកមើល subscription ដែលខ្ញុំភ្លេច"

🔮 **AI វាជាអ្វី:**
• Claude AI - ឆ្លាតវៃ និងយល់ពីបរិបទ
• ការវិភាគហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• ការណែនាំតាមស្ថានការណ៍ពិត
• ជំនួយជាភាសាខ្មែរ

🎓 **Tips:**
• សួរជាកសាងរឿង - ទទួលចម្លើយល្អ
• AI អាចជួយបាន 24/7
• ចម្លើយទាន់ពេលវេលា ជាភាសាខ្មែរ
• សាកសួរជាច្រើន - AI មិនថប់!

🚀 ចាប់ផ្តើម: /ask តើខ្ញុំអាចសន្សំបានយ៉ាងណា?`;

        await bot.sendMessage(chatId, helpMessage);
    }

    // 🗂️ Helper methods to get user data
    async getUserContext(userId) {
        try {
            const user = await User.findOne({ telegramId: userId });
            const progress = await Progress.findOne({ userId });

            return {
                name: user?.username || user?.first_name || 'User',
                tier: user?.tier || 'essential',
                currentDay: progress?.currentDay || 1,
                completedDays: this.countCompletedDays(progress),
                isPaid: user?.is_paid || false
            };
        } catch (error) {
            console.error('Error getting user context:', error);
            return {};
        }
    }

    async getUserFinancialData(userId) {
        try {
            const user = await User.findOne({ telegramId: userId });
            // You'll need to adjust this based on how you store financial data
            return {
                monthlyIncome: user?.monthlyIncome || 0,
                monthlyExpenses: user?.monthlyExpenses || 0,
                currentSavings: user?.currentSavings || 0,
                totalDebts: user?.totalDebts || 0
            };
        } catch (error) {
            console.error('Error getting financial data:', error);
            return {};
        }
    }

    async getUserProgress(userId) {
        try {
            const progress = await Progress.findOne({ userId });
            return {
                currentDay: progress?.currentDay || 1,
                completedDays: this.countCompletedDays(progress),
                challenges: progress?.challenges || [],
                goals: progress?.goals || []
            };
        } catch (error) {
            console.error('Error getting user progress:', error);
            return { currentDay: 1, completedDays: 0 };
        }
    }

    async getUserExpenses(userId) {
        try {
            const user = await User.findOne({ telegramId: userId });
            // Return mock expense data - adjust based on your data structure
            return {
                food: user?.expenses?.food || 300,
                transport: user?.expenses?.transport || 100,
                entertainment: user?.expenses?.entertainment || 150,
                subscriptions: user?.expenses?.subscriptions || 50,
                utilities: user?.expenses?.utilities || 200,
                other: user?.expenses?.other || 100
            };
        } catch (error) {
            console.error('Error getting expenses:', error);
            return {};
        }
    }

    async getUserIncome(userId) {
        try {
            const user = await User.findOne({ telegramId: userId });
            return user?.monthlyIncome || 1000;
        } catch (error) {
            console.error('Error getting income:', error);
            return 1000;
        }
    }

    async getCurrentDay(userId) {
        try {
            const progress = await Progress.findOne({ userId });
            return progress?.currentDay || 1;
        } catch (error) {
            return 1;
        }
    }

    countCompletedDays(progress) {
        if (!progress) return 0;
        
        let count = 0;
        for (let i = 0; i <= 7; i++) {
            if (progress[`day${i}Completed`]) count++;
        }
        return count;
    }

    // 🎛️ Register all AI commands
    registerCommands(bot) {
        // Main AI commands
        bot.onText(/^\/ask/, (msg) => this.handleAskCommand(bot, msg));
        bot.onText(/^\/analyze/, (msg) => this.handleAnalyzeCommand(bot, msg));
        bot.onText(/^\/coach/, (msg) => this.handleCoachCommand(bot, msg));
        bot.onText(/^\/find_leaks/, (msg) => this.handleFindLeaksCommand(bot, msg));
        bot.onText(/^\/ai_help/, (msg) => this.handleAIHelpCommand(bot, msg));
        bot.onText(/^\/ai_status/, (msg) => this.handleAIStatusCommand(bot, msg));

        // Smart response to regular messages (optional)
        bot.on('message', (msg) => {
            // Only trigger on regular text messages (not commands)
            if (msg.text && !msg.text.startsWith('/')) {
                this.handleSmartResponse(bot, msg);
            }
        });

        console.log('✅ AI command handlers registered');
    }
}

module.exports = AICommandHandler;
