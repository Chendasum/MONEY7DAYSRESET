// AI Command Handler for Telegram Bot Integration - FIXED VERSION
const aiService = require('../services/aiIntegration');

class AICommandHandler {
    constructor(dbContext) {
        this.db = dbContext.db;
        this.users = dbContext.users;
        this.progress = dbContext.progress;
        this.eq = dbContext.eq;
        this.pool = dbContext.pool;
    }

    // Handle /ask command
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

            await bot.sendChatAction(chatId, 'typing');

            // Get user context
            const userContext = await this.getUserContext(userId);
            
            // Get AI response
            const aiResponse = await aiService.handleUserQuestion(question, userContext);
            
            // Send response
            await this.sendAIResponse(bot, chatId, aiResponse);

        } catch (error) {
            console.error('Error in /ask command:', error);
            await bot.sendMessage(chatId, 
                "❌ មានបញ្ហាជាមួយ AI។ សូមសាកម្តងទៀតក្រោយ ឬប្រើ /help សម្រាប់ជម្រើសផ្សេង។"
            );
        }
    }

    // Handle /analyze command
    async handleAnalyzeCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            const user = await this.getUser(userId);
            if (!user || !user.is_paid) {
                await bot.sendMessage(chatId, "🔒 ការវិភាគកម្រិតខ្ពស់ត្រូវការសមាជិកភាពបង់ប្រាក់។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
                return;
            }

            await bot.sendChatAction(chatId, 'typing');

            const userFinances = await this.getUserFinancialData(userId);
            const currentDay = await this.getCurrentDay(userId);
            
            const analysis = await aiService.analyzeFinancialSituation(userFinances, currentDay);
            await this.sendAIResponse(bot, chatId, analysis);

        } catch (error) {
            console.error('Error in /analyze command:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការវិភាគ។ សូមសាកម្តងទៀតក្រោយ។");
        }
    }

    // Handle /coach command
    async handleCoachCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            const userProgress = await this.getUserProgress(userId);
            const dayNumber = userProgress.current_day || 1;
            
            const coaching = await aiService.getPersonalizedCoaching(userProgress, dayNumber);
            await this.sendAIResponse(bot, chatId, coaching);

        } catch (error) {
            console.error('Error in /coach command:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការណែនាំ។ សូមសាកម្តងទៀតក្រោយ។");
        }
    }

    // Handle /find_leaks command
    async handleFindLeaksCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            const expenses = await this.getUserExpenses(userId);
            const income = await this.getUserIncome(userId);
            
            const leakAnalysis = await aiService.detectMoneyLeaks(expenses, income);
            await this.sendAIResponse(bot, chatId, leakAnalysis);

        } catch (error) {
            console.error('Error in /find_leaks command:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការរកមើល Money Leaks។ សូមសាកម្តងទៀតក្រោយ។");
        }
    }

    // AI Help Menu
    async handleAIHelpCommand(bot, msg) {
        const chatId = msg.chat.id;

        const helpMessage = `🤖 AI Assistant ជំនួយ

🎯 **ពាក្យបញ្ជា AI:**
- /ask [សំណួរ] - សួរអ្វីក៏បាន អំពីលុយ
- /analyze - វិភាគហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
- /coach - ការណែនាំផ្ទាល់ខ្លួន
- /find_leaks - រកមើល Money Leaks
- /ai_help - មើលមេនុនេះ

💡 **ឧទាហរណ៍សំណួរ:**
- "តើខ្ញុំគួរសន្សំយ៉ាងណា?"
- "ចំណាយអ្វីខ្លះដែលអាចកាត់បន្ថយ?"
- "តើធ្វើយ៉ាងណាដើម្បីបង្កើនចំណូល?"

🚀 ចាប់ផ្តើម: /ask តើខ្ញុំអាចសន្សំបានយ៉ាងណា?`;

        await bot.sendMessage(chatId, helpMessage);
    }

    // Helper methods
    async getUser(userId) {
        try {
            const [user] = await this.db.select().from(this.users).where(this.eq(this.users.telegram_id, userId));
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async getUserContext(userId) {
        try {
            const user = await this.getUser(userId);
            const userProgress = await this.getUserProgress(userId);

            return {
                name: user?.username || user?.first_name || 'User',
                tier: user?.tier || 'free',
                currentDay: userProgress?.current_day || 1,
                completedDays: this.countCompletedDays(userProgress),
                isPaid: user?.is_paid || false
            };
        } catch (error) {
            console.error('Error getting user context:', error);
            return {};
        }
    }

    async getUserProgress(userId) {
        try {
            const [userProgress] = await this.db.select().from(this.progress).where(this.eq(this.progress.user_id, userId));
            return userProgress || { current_day: 1 };
        } catch (error) {
            console.error('Error getting user progress:', error);
            return { current_day: 1 };
        }
    }

    async getUserFinancialData(userId) {
        return {
            monthlyIncome: 1000,
            monthlyExpenses: 800,
            currentSavings: 200,
            totalDebts: 0
        };
    }

    async getUserExpenses(userId) {
        return {
            food: 300,
            transport: 100,
            entertainment: 150,
            subscriptions: 50,
            utilities: 200,
            other: 100
        };
    }

    async getUserIncome(userId) {
        return 1000;
    }

    async getCurrentDay(userId) {
        try {
            const userProgress = await this.getUserProgress(userId);
            return userProgress?.current_day || 1;
        } catch (error) {
            return 1;
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

    async sendAIResponse(bot, chatId, aiResponse) {
        try {
            if (aiResponse.success) {
                await bot.sendMessage(chatId, aiResponse.response);
            } else {
                await bot.sendMessage(chatId, aiResponse.response);
            }
        } catch (error) {
            console.error('Error sending AI response:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើចម្លើយ។");
        }
    }
}

module.exports = AICommandHandler;
