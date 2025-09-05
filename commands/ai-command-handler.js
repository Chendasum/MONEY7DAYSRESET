// 🤖 AI Command Handler for Telegram Bot Integration - FIXED VERSION
const aiService = require('../services/enhanced-ai-integration');

class AICommandHandler {
    constructor(dbContext) {
        this.db = dbContext.db;
        this.users = dbContext.users;
        this.progress = dbContext.progress;
        this.eq = dbContext.eq;
        this.pool = dbContext.pool;
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

            // Get user context using Drizzle ORM
            const userContext = await this.getUserContext(userId);
            
            // Get AI response (if aiService is available)
            if (aiService && aiService.handleUserQuestion) {
                const aiResponse = await aiService.handleUserQuestion(question, userContext);
                await this.sendAIResponse(bot, chatId, aiResponse);
            } else {
                // Fallback response
                const response = `🤖 AI ជំនួយ:\n\nសំណួរ: "${question}"\n\n💡 AI កំពុងត្រូវបានកែលម្អ។ សូមទាក់ទង @Chendasum សម្រាប់ជំនួយផ្ទាល់។`;
                await bot.sendMessage(chatId, response);
            }

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
            // Check if user is paid
            const user = await this.getUser(userId);
            if (!user || !user.is_paid) {
                await bot.sendMessage(chatId, "🔒 ការវិភាគកម្រិតខ្ពស់ត្រូវការសមាជិកភាពបង់ប្រាក់។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
                return;
            }

            await bot.sendChatAction(chatId, 'typing');

            // Get user financial data
            const userFinances = await this.getUserFinancialData(userId);
            const currentDay = await this.getCurrentDay(userId);
            
            // Get AI analysis or fallback
            if (aiService && aiService.analyzeFinancialSituation) {
                const analysis = await aiService.analyzeFinancialSituation(userFinances, currentDay);
                await this.sendAIResponse(bot, chatId, analysis);
            } else {
                // Fallback analysis
                const analysis = this.generateBasicAnalysis(userFinances, currentDay);
                await bot.sendMessage(chatId, analysis);
            }

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

            // Get user progress using Drizzle ORM
            const userProgress = await this.getUserProgress(userId);
            const dayNumber = userProgress.current_day || 1;
            
            // Get personalized coaching or fallback
            if (aiService && aiService.getPersonalizedCoaching) {
                const coaching = await aiService.getPersonalizedCoaching(userProgress, dayNumber);
                await this.sendAIResponse(bot, chatId, coaching);
            } else {
                // Fallback coaching
                const coaching = this.generateBasicCoaching(userProgress, dayNumber);
                await bot.sendMessage(chatId, coaching);
            }

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
            
            // Get money leak analysis or fallback
            if (aiService && aiService.detectMoneyLeaks) {
                const leakAnalysis = await aiService.detectMoneyLeaks(expenses, income);
                await this.sendAIResponse(bot, chatId, leakAnalysis);
            } else {
                // Fallback leak detection
                const leakAnalysis = this.generateBasicLeakAnalysis(expenses, income);
                await bot.sendMessage(chatId, leakAnalysis);
            }

        } catch (error) {
            console.error('Error in /find_leaks command:', error);
            await bot.sendMessage(chatId, 
                "❌ មានបញ្ហាក្នុងការរកមើល Money Leaks។ សូមសាកម្តងទៀតក្រោយ។"
            );
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

    // 🗂️ Helper methods using Drizzle ORM
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
        try {
            const user = await this.getUser(userId);
            // Extract financial data from user object or set defaults
            return {
                monthlyIncome: 1000, // You can add these fields to your schema later
                monthlyExpenses: 800,
                currentSavings: 200,
                totalDebts: 0
            };
        } catch (error) {
            console.error('Error getting financial data:', error);
            return { monthlyIncome: 1000, monthlyExpenses: 800, currentSavings: 200, totalDebts: 0 };
        }
    }

    async getUserExpenses(userId) {
        try {
            // Return default expense categories - you can expand this later
            return {
                food: 300,
                transport: 100,
                entertainment: 150,
                subscriptions: 50,
                utilities: 200,
                other: 100
            };
        } catch (error) {
            console.error('Error getting expenses:', error);
            return {};
        }
    }

    async getUserIncome(userId) {
        try {
            return 1000; // Default income - you can expand this later
        } catch (error) {
            console.error('Error getting income:', error);
            return 1000;
        }
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

    // Fallback methods when AI service is not available
    generateBasicAnalysis(finances, currentDay) {
        const savingsRate = ((finances.monthlyIncome - finances.monthlyExpenses) / finances.monthlyIncome * 100).toFixed(1);
        
        return `📊 ការវិភាគហិរញ្ញវត្ថុ (ថ្ងៃទី ${currentDay})

💰 ចំណូលខែ: $${finances.monthlyIncome}
💸 ចំណាយខែ: $${finances.monthlyExpenses}
💎 អត្រាសន្សំ: ${savingsRate}%
🏦 សន្សំបច្ចុប្បន្ន: $${finances.currentSavings}

🎯 ការណែនាំ:
${savingsRate < 10 ? "• ព្យាយាមសន្សំឱ្យបាន 10-20%" : "• អត្រាសន្សំល្អណាស់!"}
${finances.totalDebts > 0 ? "• ផ្តោតលើការសង់បំណុល" : "• ពិចារណាការវិនិយោគ"}

💬 សម្រាប់ការវិភាគលម្អិត: @Chendasum`;
    }

    generateBasicCoaching(progress, dayNumber) {
        return `🎯 AI Coach (ថ្ងៃទី ${dayNumber})

🌟 ការណែនាំផ្ទាល់ខ្លួន:

📈 វឌ្ឍនភាព: អ្នកបានបញ្ចប់ ${this.countCompletedDays(progress)} ថ្ងៃ
🎯 គោលដៅថ្ងៃនេះ: ការបន្តទម្លាប់ល្អ

💡 ការណែនាំថ្ងៃនេះ:
• តាមដានចំណាយប្រចាំថ្ងៃ
• កំណត់គោលដៅសន្សំ
• អានមេរៀនថ្ងៃនេះឱ្យចប់

🚀 ចាប់ផ្តើម: /day${dayNumber}

💬 ការប្រឹក្សាផ្ទាល់: @Chendasum`;
    }

    generateBasicLeakAnalysis(expenses, income) {
        const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
        const biggestExpense = Object.entries(expenses).reduce((a, b) => expenses[a[0]] > expenses[b[0]] ? a : b);
        
        return `🔍 Money Leaks Analysis

💸 ចំណាយសរុប: $${totalExpenses}
📊 ចំណាយធំបំផុត: ${biggestExpense[0]} ($${biggestExpense[1]})

🚨 Money Leaks ដែលអាចកើតមាន:
${expenses.subscriptions > 30 ? "• Subscriptions ច្រើនពេក ($" + expenses.subscriptions + ")" : ""}
${expenses.entertainment > income * 0.2 ? "• កម្សាន្តច្រើនពេក ($" + expenses.entertainment + ")" : ""}
${expenses.food > income * 0.3 ? "• ចំណាយម្ហូបច្រើនពេក ($" + expenses.food + ")" : ""}

💡 ការណែនាំ:
• ពិនិត្យ subscriptions មិនប្រើ
• កំណត់ថវិកាកម្សាន្ត
• រៀបចំផែនការម្ហូប

💬 ជំនួយ: @Chendasum`;
    }

    async sendAIResponse(bot, chatId, response) {
        try {
            if (response && response.success && response.response) {
                await bot.sendMessage(chatId, response.response);
            } else if (typeof response === 'string') {
                await bot.sendMessage(chatId, response);
            } else {
                await bot.sendMessage(chatId, "❌ មិនអាចទទួលចម្លើយពី AI បានទេ។");
            }
        } catch (error) {
            console.error('Error sending AI response:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើចម្លើយ។");
        }
    }

    // 🎛️ Register all AI commands with database context
    registerCommands(bot, dbContext) {
        // Update database context
        this.db = dbContext.db;
        this.users = dbContext.users;
        this.progress = dbContext.progress;
        this.eq = dbContext.eq;
        this.pool = dbContext.pool;

        // Main AI commands
        bot.onText(/^\/ask\s+(.+)/i, (msg, match) => this.handleAskCommand(bot, msg));
        bot.onText(/^\/analyze/i, (msg) => this.handleAnalyzeCommand(bot, msg));
        bot.onText(/^\/coach/i, (msg) => this.handleCoachCommand(bot, msg));
        bot.onText(/^\/find_leaks/i, (msg) => this.handleFindLeaksCommand(bot, msg));
        bot.onText(/^\/ai_help/i, (msg) => this.handleAIHelpCommand(bot, msg));

        console.log('✅ AI command handlers registered with Drizzle ORM');
    }
}

module.exports = AICommandHandler;
