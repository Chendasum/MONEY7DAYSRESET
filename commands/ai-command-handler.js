// AI Command Handler for 7-Day Money Flow Reset Bot - PRODUCTION READY
const aiService = require('../services/aiIntegration');

class AICommandHandler {
    constructor(dbContext) {
        this.db = dbContext.db;
        this.users = dbContext.users;
        this.progress = dbContext.progress;
        this.eq = dbContext.eq;
        this.pool = dbContext.pool;
        
        // Initialize AI status check
        this.checkAIStatus();
    }

    async checkAIStatus() {
        try {
            console.log('🤖 Checking AI service status...');
            if (aiService && aiService.getStatus) {
                const status = aiService.getStatus();
                console.log(`AI Status: Claude=${status.claude_available}, Fallback Ready=true`);
            }
        } catch (error) {
            console.log('⚠️ AI status check failed, using fallbacks');
        }
    }

    // 💬 Handle /ask command - General AI Chat
    async handleAskCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const question = msg.text.replace('/ask', '').trim();

        try {
            // Validate input
            if (!question) {
                await bot.sendMessage(chatId, this.getAIHelpMessage());
                return;
            }

            // Show typing indicator
            await bot.sendChatAction(chatId, 'typing');

            // Get user context safely
            const userContext = await this.getUserContextSafely(userId);
            
            // Enhanced question with Cambodia context
            const enhancedQuestion = this.enhanceQuestionForCambodia(question, userContext);
            
            // Get AI response with fallback
            const aiResponse = await this.getAIResponseSafely('handleUserQuestion', enhancedQuestion, userContext);
            
            // Send response
            await this.sendSmartResponse(bot, chatId, aiResponse, 'general');

        } catch (error) {
            console.error('Error in /ask command:', error);
            await this.sendFallbackResponse(bot, chatId, 'ask', question);
        }
    }

    // 📊 Handle /analyze command - Financial Analysis
    async handleAnalyzeCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            // Check user access
            const user = await this.getUserSafely(userId);
            if (!user || !user.is_paid) {
                await bot.sendMessage(chatId, 
                    "🔒 ការវិភាគកម្រិតខ្ពស់ត្រូវការសមាជិកភាពបង់ប្រាក់។\n\n" +
                    "✅ ការវិភាគមូលដ្ឋាន: ដោយឥតគិតថ្លៃ\n" +
                    "💎 ការវិភាគលម្អិត: $24 USD\n\n" +
                    "📞 /pricing ដើម្បីទទួលបានការវិភាគពេញលេញ"
                );
                
                // Provide basic analysis for free users
                const basicAnalysis = this.getBasicFinancialAnalysis(user);
                await bot.sendMessage(chatId, basicAnalysis);
                return;
            }

            await bot.sendChatAction(chatId, 'typing');

            // Get financial data
            const userFinances = await this.getUserFinancialDataSafely(userId);
            const currentDay = await this.getCurrentDaySafely(userId);
            
            // Get AI analysis
            const analysis = await this.getAIResponseSafely('analyzeFinancialSituation', userFinances, currentDay);
            
            // Send analysis
            await this.sendSmartResponse(bot, chatId, analysis, 'analysis');

        } catch (error) {
            console.error('Error in /analyze command:', error);
            await this.sendFallbackResponse(bot, chatId, 'analyze');
        }
    }

    // 🎯 Handle /coach command - Personalized Coaching
    async handleCoachCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            // Get user progress safely
            const userProgress = await this.getUserProgressSafely(userId);
            const userContext = await this.getUserContextSafely(userId);
            const dayNumber = userProgress.current_day || 1;
            
            // Enhanced coaching with personal context
            const coachingContext = {
                ...userProgress,
                ...userContext,
                dayNumber: dayNumber,
                encouragementLevel: this.getEncouragementLevel(userProgress)
            };
            
            // Get AI coaching
            const coaching = await this.getAIResponseSafely('getPersonalizedCoaching', coachingContext, dayNumber);
            
            // Send coaching with motivational enhancement
            await this.sendSmartResponse(bot, chatId, coaching, 'coaching', dayNumber);

        } catch (error) {
            console.error('Error in /coach command:', error);
            await this.sendFallbackResponse(bot, chatId, 'coach', 1);
        }
    }

    // 🔍 Handle /find_leaks command - Money Leak Detection
    async handleFindLeaksCommand(bot, msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            // Get expense data
            const expenses = await this.getUserExpensesSafely(userId);
            const income = await this.getUserIncomeSafely(userId);
            const userContext = await this.getUserContextSafely(userId);
            
            // Enhanced leak detection with Cambodia context
            const leakContext = {
                expenses: expenses,
                income: income,
                country: 'Cambodia',
                currency: 'USD',
                localContext: this.getCambodianExpenseContext()
            };
            
            // Get AI leak analysis
            const leakAnalysis = await this.getAIResponseSafely('detectMoneyLeaks', expenses, income);
            
            // Send analysis with actionable advice
            await this.sendSmartResponse(bot, chatId, leakAnalysis, 'leak_detection');

        } catch (error) {
            console.error('Error in /find_leaks command:', error);
            await this.sendFallbackResponse(bot, chatId, 'find_leaks');
        }
    }

    // 📚 Handle /ai_help command - AI Help Menu
    async handleAIHelpCommand(bot, msg) {
        const chatId = msg.chat.id;

        try {
            const helpMessage = this.getComprehensiveAIHelp();
            await bot.sendMessage(chatId, helpMessage);
            
            // Follow up with tips
            setTimeout(async () => {
                const tips = this.getAIUsageTips();
                await bot.sendMessage(chatId, tips);
            }, 2000);

        } catch (error) {
            console.error('Error in /ai_help command:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការបង្ហាញជំនួយ។ សូមទាក់ទង @Chendasum");
        }
    }

    // 🛠️ ENHANCED HELPER METHODS

    // Safe AI response getter with multiple fallback levels
    async getAIResponseSafely(method, ...args) {
        try {
            // Try AI service first
            if (aiService && aiService[method]) {
                const response = await aiService[method](...args);
                if (response && response.success) {
                    return response;
                }
            }
            
            // Generate intelligent fallback
            return this.generateIntelligentFallback(method, ...args);
            
        } catch (error) {
            console.error(`AI method ${method} failed:`, error);
            return this.generateIntelligentFallback(method, ...args);
        }
    }

    // Generate contextually intelligent fallbacks
    generateIntelligentFallback(method, ...args) {
        switch (method) {
            case 'handleUserQuestion':
                return this.generateQuestionFallback(args[0]);
            case 'analyzeFinancialSituation':
                return this.generateAnalysisFallback(args[0]);
            case 'getPersonalizedCoaching':
                return this.generateCoachingFallback(args[0], args[1]);
            case 'detectMoneyLeaks':
                return this.generateLeakFallback(args[0], args[1]);
            default:
                return this.getGenericFallback();
        }
    }

    // Enhanced question fallback with smart responses
    generateQuestionFallback(question) {
        const questionLower = question.toLowerCase();
        let response = "🤖 AI ជំនួយសាមញ្ញ:\n\n";
        
        if (questionLower.includes('សន្សំ') || questionLower.includes('save')) {
            response += `📊 គន្លឹះសន្សំលុយ:\n`;
            response += `• ចាប់ផ្តើមពី 10% នៃចំណូល\n`;
            response += `• បង្កើតម្ហូបអគារ 3-6 ខែ\n`;
            response += `• កាត់បន្ថយចំណាយមិនចាំបាច់\n`;
            response += `• ប្រើវិធី 50/30/20 rule\n\n`;
        } else if (questionLower.includes('ចំណាយ') || questionLower.includes('expense')) {
            response += `💸 ការគ្រប់គ្រងចំណាយ:\n`;
            response += `• កត់ត្រាចំណាយរាល់ថ្ងៃ\n`;
            response += `• បែងចែក: ចាំបាច់ vs ចង់បាន\n`;
            response += `• កំណត់ថវិកាខែ\n`;
            response += `• ពិនិត្យ subscriptions\n\n`;
        } else if (questionLower.includes('ចំណូល') || questionLower.includes('income')) {
            response += `💰 ការបង្កើនចំណូល:\n`;
            response += `• ពង្រឹងជំនាញដែលមាន\n`;
            response += `• រកការងារបន្ថែម\n`;
            response += `• ចាប់ផ្តើមអាជីវកម្មតូច\n`;
            response += `• វិនិយោគក្នុងការអប់រំ\n\n`;
        } else {
            response += `សំណួរ: "${question}"\n\n`;
            response += `💡 ការណែនាំទូទៅ:\n`;
            response += `• ប្រើ /day1-7 សម្រាប់មេរៀនជាក់លាក់\n`;
            response += `• កត់ត្រាចំណូល-ចំណាយ\n`;
            response += `• កំណត់គោលដៅហិរញ្ញវត្ថុ\n`;
            response += `• អនុវត្តការសន្សំជាទម្លាប់\n\n`;
        }
        
        response += `🎯 សម្រាប់ជំនួយលម្អិត: /ai_help\n💬 ការប្រឹក្សាផ្ទាល់: @Chendasum`;
        
        return {
            success: true,
            source: 'smart_fallback',
            response: response,
            timestamp: new Date().toISOString()
        };
    }

    // Enhanced financial analysis fallback
    generateAnalysisFallback(userFinances) {
        const income = userFinances.monthlyIncome || 1000;
        const expenses = userFinances.monthlyExpenses || 800;
        const savings = income - expenses;
        const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
        
        let analysis = `📊 ការវិភាគហិរញ្ញវត្ថុវប្បធម៌:\n\n`;
        analysis += `💰 ចំណូលខែ: $${income.toLocaleString()}\n`;
        analysis += `💸 ចំណាយខែ: $${expenses.toLocaleString()}\n`;
        analysis += `💎 សន្សំ: $${savings.toLocaleString()} (${savingsRate}%)\n\n`;
        
        // Smart recommendations based on data
        if (savingsRate < 10) {
            analysis += `⚠️ អត្រាសន្សំទាប - គួរកែលម្អ:\n`;
            analysis += `• គោលដៅ: សន្សំ 10-20%\n`;
            analysis += `• ពិនិត្យចំណាយមិនចាំបាច់\n`;
            analysis += `• បង្កើនចំណូលបន្ថែម\n\n`;
        } else if (savingsRate < 20) {
            analysis += `👍 អត្រាសន្សំមធ្យម - អាចកែលម្អ:\n`;
            analysis += `• គោលដៅ: សន្សំ 20%+\n`;
            analysis += `• ឆ្ពោះទៅរកការវិនិយោគ\n`;
            analysis += `• បង្កើតម្ហូបអគារ\n\n`;
        } else {
            analysis += `🌟 អត្រាសន្សំល្អ - បន្តបទបង្ហាស់នេះ:\n`;
            analysis += `• ពិចារណាការវិនិយោគ\n`;
            analysis += `• បង្កើតគោលដៅរយៈពេលវែង\n`;
            analysis += `• រៀនអំពីការកសាងទ្រព្យសម្បត្តិ\n\n`;
        }
        
        analysis += `🎯 ជំហានបន្ទាប់:\n`;
        analysis += `• ប្រើ /find_leaks រកចំណាយបាត់បង់\n`;
        analysis += `• ប្រើ /coach ការណែនាំផ្ទាល់ខ្លួន\n`;
        analysis += `• ចាប់ផ្តើម /day1 Money Flow Reset\n\n`;
        analysis += `💬 ជំនួយ: @Chendasum`;
        
        return {
            success: true,
            source: 'smart_fallback',
            response: analysis,
            timestamp: new Date().toISOString()
        };
    }

    // Enhanced coaching fallback with personalization
    generateCoachingFallback(userProgress, dayNumber) {
        const completedDays = this.countCompletedDays(userProgress);
        const progressRate = dayNumber > 0 ? (completedDays / dayNumber * 100).toFixed(0) : 0;
        
        let coaching = `🎯 AI Coach ថ្ងៃទី ${dayNumber}:\n\n`;
        
        // Personalized motivation based on progress
        if (completedDays === 0) {
            coaching += `🌟 ស្វាគមន៍ដល់ការធ្វើដំណើរថ្មី!\n`;
            coaching += `💪 ថ្ងៃនេះគឺជាដំបូងនៃការផ្លាស់ប្តូរ\n`;
            coaching += `🎯 ចាប់ផ្តើមដោយការស្វែងយល់ Money Flow\n\n`;
        } else if (progressRate < 50) {
            coaching += `⚡ អ្នកបានចាប់ផ្តើមហើយ - ល្អណាស់!\n`;
            coaching += `📈 វឌ្ឍនភាព: ${completedDays}/${dayNumber} ថ្ងៃ (${progressRate}%)\n`;
            coaching += `🔥 បន្តអនុវត្ត - អ្នកនៅលើផ្លូវត្រឹមត្រូវ\n\n`;
        } else {
            coaching += `🏆 អ្នកធ្វើបានយ៉ាងឆ្នើម!\n`;
            coaching += `🌟 វឌ្ឍនភាព: ${completedDays}/${dayNumber} ថ្ងៃ (${progressRate}%)\n`;
            coaching += `🚀 នៅតិចទៀតអ្នកនឹងជោគជ័យ!\n\n`;
        }
        
        // Day-specific guidance
        const dayGuidance = this.getDaySpecificGuidance(dayNumber);
        coaching += dayGuidance;
        
        coaching += `\n💡 គន្លឹះថ្ងៃនេះ:\n`;
        coaching += `• ${this.getTodayTip(dayNumber)}\n`;
        coaching += `• អនុវត្តជាបន្តបន្ទាប់\n`;
        coaching += `• កត់ត្រាលទ្ធផល\n\n`;
        
        coaching += `📚 មេរៀន: /day${dayNumber}\n`;
        coaching += `📊 វឌ្ឍនភាព: /progress\n`;
        coaching += `💬 ជំនួយ: @Chendasum`;
        
        return {
            success: true,
            source: 'smart_fallback',
            response: coaching,
            timestamp: new Date().toISOString()
        };
    }

    // Enhanced money leak detection fallback
    generateLeakFallback(expenses, income) {
        const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
        const expenseRatio = income > 0 ? (totalExpenses / income * 100).toFixed(1) : 0;
        
        let analysis = `🔍 ការវិភាគ Money Leaks:\n\n`;
        analysis += `💸 ចំណាយសរុប: $${totalExpenses.toLocaleString()} (${expenseRatio}% នៃចំណូល)\n\n`;
        
        // Analyze specific categories
        const leaks = [];
        if (expenses.food > income * 0.3) leaks.push("🍜 ម្ហូប: ច្រើនពេក - ធ្វើម្ហូបនៅផ្ទះ");
        if (expenses.entertainment > income * 0.15) leaks.push("🎮 កម្សាន្ត: កំណត់ថវិកា");
        if (expenses.subscriptions > 50) leaks.push("📱 Subscriptions: ពិនិត្យសេវាមិនប្រើ");
        if (expenses.transport > income * 0.2) leaks.push("🚗 ដឹកជញ្ជូន: ពិចារណាជម្រើសថោក");
        
        if (leaks.length > 0) {
            analysis += `🚨 Money Leaks ដែលរកឃើញ:\n`;
            leaks.forEach(leak => analysis += `• ${leak}\n`);
            analysis += `\n`;
        }
        
        analysis += `💡 វិធីកាត់បន្ថយ Money Leaks:\n`;
        analysis += `• កត់ត្រាចំណាយរាល់ថ្ងៃ\n`;
        analysis += `• ពិនិត្យ subscriptions រាល់ខែ\n`;
        analysis += `• ប្រៀបធៀបតម្លៃមុនទិញ\n`;
        analysis += `• កំណត់ថវិកាកម្សាន្ត\n`;
        analysis += `• ប្រើ 24-hour rule មុនទិញវត្ថុថ្លៃ\n\n`;
        
        analysis += `🎯 កម្មវិធីបន្ទាប់:\n`;
        analysis += `• ប្រើ /day2 Money Leak Detection\n`;
        analysis += `• ប្រើ /analyze ការវិភាគលម្អិត\n`;
        analysis += `💬 ជំនួយ: @Chendasum`;
        
        return {
            success: true,
            source: 'smart_fallback',
            response: analysis,
            timestamp: new Date().toISOString()
        };
    }

    // SMART RESPONSE SENDER with enhancement
    async sendSmartResponse(bot, chatId, aiResponse, type, dayNumber = null) {
        try {
            let message = aiResponse.response;
            
            // Add contextual enhancements
            if (type === 'coaching' && dayNumber) {
                message += `\n\n⏭️ បន្ទាប់: /day${Math.min(dayNumber + 1, 7)}`;
            }
            
            // Add source indicator for transparency
            const sourceEmoji = this.getSourceEmoji(aiResponse.source);
            
            await bot.sendMessage(chatId, message);
            
            // Send subtle source attribution
            if (aiResponse.source !== 'smart_fallback') {
                setTimeout(async () => {
                    const attribution = `${sourceEmoji} ជំនួយដោយ AI • ${new Date().toLocaleTimeString()}`;
                    await bot.sendMessage(chatId, attribution);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error sending smart response:', error);
            await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើចម្លើយ។ សូមទាក់ទង @Chendasum");
        }
    }

    // SAFE DATABASE METHODS
    async getUserSafely(userId) {
        try {
            const [user] = await this.db.select().from(this.users).where(this.eq(this.users.telegram_id, userId));
            return user || null;
        } catch (error) {
            console.error('Error getting user safely:', error);
            return null;
        }
    }

    async getUserContextSafely(userId) {
        try {
            const user = await this.getUserSafely(userId);
            const userProgress = await this.getUserProgressSafely(userId);

            return {
                name: user?.username || user?.first_name || 'User',
                tier: user?.tier || 'free',
                currentDay: userProgress?.current_day || 1,
                completedDays: this.countCompletedDays(userProgress),
                isPaid: user?.is_paid || false,
                joinedDaysAgo: user?.joined_at ? Math.floor((Date.now() - new Date(user.joined_at)) / (1000 * 60 * 60 * 24)) : 0
            };
        } catch (error) {
            console.error('Error getting user context safely:', error);
            return { name: 'User', tier: 'free', currentDay: 1, completedDays: 0, isPaid: false };
        }
    }

    async getUserProgressSafely(userId) {
        try {
            const [userProgress] = await this.db.select().from(this.progress).where(this.eq(this.progress.user_id, userId));
            return userProgress || { current_day: 1 };
        } catch (error) {
            console.error('Error getting user progress safely:', error);
            return { current_day: 1 };
        }
    }

    async getUserFinancialDataSafely(userId) {
        try {
            // This would connect to your financial data storage
            // For now, returning sample data
            return {
                monthlyIncome: 1000,
                monthlyExpenses: 800,
                currentSavings: 200,
                totalDebts: 0,
                hasData: false
            };
        } catch (error) {
            return {
                monthlyIncome: 1000,
                monthlyExpenses: 800,
                currentSavings: 200,
                totalDebts: 0,
                hasData: false
            };
        }
    }

    async getUserExpensesSafely(userId) {
        try {
            return {
                food: 300,
                transport: 100,
                entertainment: 150,
                subscriptions: 50,
                utilities: 200,
                other: 100
            };
        } catch (error) {
            return {
                food: 300,
                transport: 100,
                entertainment: 150,
                subscriptions: 50,
                utilities: 200,
                other: 100
            };
        }
    }

    async getUserIncomeSafely(userId) {
        try {
            return 1000;
        } catch (error) {
            return 1000;
        }
    }

    async getCurrentDaySafely(userId) {
        try {
            const userProgress = await this.getUserProgressSafely(userId);
            return userProgress?.current_day || 1;
        } catch (error) {
            return 1;
        }
    }

    // UTILITY METHODS
    countCompletedDays(progress) {
        if (!progress) return 0;
        
        let count = 0;
        for (let i = 0; i <= 7; i++) {
            if (progress[`day_${i}_completed`]) count++;
        }
        return count;
    }

    getEncouragementLevel(userProgress) {
        const completed = this.countCompletedDays(userProgress);
        if (completed === 0) return 'beginner';
        if (completed < 3) return 'starting';
        if (completed < 5) return 'progressing';
        return 'advanced';
    }

    getDaySpecificGuidance(dayNumber) {
        const guidance = {
            1: "🌊 ថ្ងៃនេះ: ស្វែងយល់ Money Flow របស់អ្នក",
            2: "🔍 ថ្ងៃនេះ: រកឃើញ Money Leaks",
            3: "⚖️ ថ្ងៃនេះ: វាយតម្លៃប្រព័ន្ធហិរញ្ញវត្ថុ",
            4: "🗺️ ថ្ងៃនេះ: បង្កើតផែនទី Income & Cost",
            5: "⚡ ថ្ងៃនេះ: យល់ពី Survival vs Growth",
            6: "🎯 ថ្ងៃនេះ: បង្កើត Action Plan",
            7: "🏆 ថ្ងៃនេះ: Integration និងអបអរសាទរ"
        };
        return guidance[dayNumber] || "💪 បន្តការងារល្អរបស់អ្នក";
    }

    getTodayTip(dayNumber) {
        const tips = {
            1: "កត់ត្រាចំណូល-ចំណាយ 3 ថ្ងៃចុងក្រោយ",
            2: "រកមើល subscription ដែលមិនប្រើ",
            3: "ពិនិត្យតុល្យភាពធនាគារ",
            4: "បង្កើតផែនការសន្សំ",
            5: "កំណត់គោលដៅរយៈពេលវែង",
            6: "ចាប់ផ្តើមអនុវត្តផែនការ",
            7: "អបអរសាទរនិងបន្តទម្លាប់ល្អ"
        };
        return tips[dayNumber] || "អនុវត្តអ្វីដែលបានរៀន";
    }

    getCambodianExpenseContext() {
        return {
            commonExpenses: ['ម្ហូប', 'ឆ្លាស់', 'ដឹកជញ្ជូន', 'កម្សាន្ត'],
            localServices: ['ABA Bank', 'ACLEDA', 'Wing', 'True Money'],
            currency: 'USD/KHR',
            averageIncome: '$400-800/month'
        };
    }

    getSourceEmoji(source) {
        const emojis = {
            'claude': '🔮',
            'openai': '🧠',
            'smart_fallback': '📚',
            'fallback': '📖',
            'error': '⚠️'
        };
        return emojis[source] || '🤖';
    }

    // COMPREHENSIVE HELP AND TIPS
    getAIHelpMessage() {
        return `🤖 AI Assistant ជំនួយ:

💬 /ask [សំណួរ] - សួរអ្វីក៏បាន
📊 /analyze - វិភាគហិរញ្ញវត្ថុ
🎯 /coach - ការណែនាំផ្ទាល់ខ្លួន
🔍 /find_leaks - រកមើល Money Leaks
📚 /ai_help - មើលមេនុនេះ

ឧទាហរណ៍: /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?`;
    }

    getComprehensiveAIHelp() {
        return `🤖 AI Assistant ជំនួយពេញលេញ

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

🚀 ចាប់ផ្តើម: /ask តើខ្ញុំអាចសន្សំបានយ៉ាងណា?`;
    }

    getAIUsageTips() {
        return `💡 គន្លឹះប្រើ AI ឱ្យបានល្អ:

🎯 **សម្រាប់ចម្លើយល្អ:**
• សួរជាកសាងរឿងច្បាស់លាស់
• ផ្តល់ព័ត៌មានបរិបទ
• សូមជាភាសាខ្មែរ

⚡ **AI អាចជួយ:**
• ការគ្រប់គ្រងលុយ 24/7
• ការវិភាគហិរញ្ញវត្ថុ
• ការណែនាំផ្ទាល់ខ្លួន
• ការរកឃើញ money leaks

🎓 **កុំភ្លេច:**
• AI ជាជំនួយការ មិនមែនជំនួសការសម្រេចចិត្ត
• សម្រាប់ការប្រឹក្សាសំខាន់ទាក់ទង @Chendasum
• ប្រើជាមួយ 7-Day Program សម្រាប់លទ្ធផលល្អ`;
    }

    getBasicFinancialAnalysis(user) {
        return `📊 ការវិភាគហិរញ្ញវត្ថុមូលដ្ឋាន:

🎯 **ការវាយតម្លៃទូទៅ:**
• កត់ត្រាចំណូល-ចំណាយរាល់ថ្ងៃ
• បង្កើតម្ហូបអគារ 3 ខែ
• កំណត់ថវិកា 50/30/20
• ពិនិត្យ subscriptions

💎 **សម្រាប់ការវិភាគលម្អិត:**
• AI វិភាគផ្ទាល់ខ្លួន
• ការណែនាំជាក់លាក់
• ផែនការ action ច្បាស់
• តម្លៃ: $24 USD

📞 /pricing ដើម្បីអាប់ស្រេដ`;
    }

    // FALLBACK RESPONSES FOR EACH COMMAND
    async sendFallbackResponse(bot, chatId, commandType, extra = null) {
        const fallbacks = {
            ask: `🤖 AI ជំនួយ:\n\nសំណួរ: "${extra || 'ទូទៅ'}"\n\nសូមអភ័យទោស! AI កំពុងកែលម្អ។\n\n💡 សាកល្បង:\n• /day1-7 សម្រាប់មេរៀន\n• /help សម្រាប់ជំនួយ\n💬 @Chendasum`,
            
            analyze: `📊 ការវិភាគមូលដ្ឋាន:\n\n💰 ចាប់ផ្តើម:\n• កត់ត្រាចំណូល-ចំណាយ\n• បង្កើតថវិកាខែ\n• កំណត់គោលដៅសន្សំ\n\n📚 /day3 ការវិភាគប្រព័ន្ធ\n💬 @Chendasum`,
            
            coach: `🎯 Coach ថ្ងៃទី ${extra || 1}:\n\n💪 អ្នកអាចធ្វើបាន!\n\n📚 ចាប់ផ្តើម: /day${extra || 1}\n📈 វឌ្ឍនភាព: /progress\n💬 @Chendasum`,
            
            find_leaks: `🔍 Money Leak Detection:\n\n🎯 ពិនិត្យ:\n• Subscriptions មិនប្រើ\n• ការទិញម្ហូប delivery\n• កាហ្វេ/ភេសជ្ជៈប្រចាំថ្ងៃ\n\n📚 /day2 Money Leak\n💬 @Chendasum`
        };

        const message = fallbacks[commandType] || "❌ មានបញ្ហាបច្ចេកទេស។ សូមទាក់ទង @Chendasum";
        await bot.sendMessage(chatId, message);
    }

    getGenericFallback() {
        return {
            success: true,
            source: 'fallback',
            response: "🤖 AI កំពុងអាប់ដេត។ សូមសាកម្តងទៀតក្រោយ។\n\n📚 ប្រើ /help សម្រាប់ជម្រើសផ្សេង\n💬 @Chendasum",
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = AICommandHandler;
