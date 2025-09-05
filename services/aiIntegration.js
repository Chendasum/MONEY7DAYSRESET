// Enhanced AI Integration Service - Claude Only Version
class ClaudeAIIntegration {
    constructor() {
        this.claudeAvailable = false;
        this.isInitialized = false;
        
        this.initializeClaudeService();
    }

    async initializeClaudeService() {
        try {
            console.log('Initializing Claude AI service...');
            console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
            
            if (process.env.ANTHROPIC_API_KEY) {
                try {
                    console.log('📦 Loading Anthropic SDK...');
                    const Anthropic = require('@anthropic-ai/sdk');
                    
                    this.anthropic = new Anthropic({
                        apiKey: process.env.ANTHROPIC_API_KEY,
                    });
                    
                    console.log('🧪 Testing Claude connection...');
                    
                    // Simple test call
                    const testMessage = await this.anthropic.messages.create({
                        model: "claude-3-sonnet-20240229",
                        max_tokens: 50,
                        messages: [
                            {
                                role: "user",
                                content: "Hello"
                            }
                        ]
                    });
                    
                    if (testMessage && testMessage.content) {
                        this.claudeAvailable = true;
                        console.log('✅ Claude AI initialized and tested successfully');
                    } else {
                        throw new Error('Invalid response from Claude');
                    }
                    
                } catch (error) {
                    console.log('❌ Claude initialization failed:', error.message);
                    console.log('Full error:', error);
                    this.claudeAvailable = false;
                }
            } else {
                console.log('⚠️ No ANTHROPIC_API_KEY found');
                this.claudeAvailable = false;
            }

            this.isInitialized = true;
            console.log(`🎯 Claude Status: Available=${this.claudeAvailable}`);
            
        } catch (error) {
            console.error('❌ Claude service initialization failed:', error);
            this.isInitialized = true;
            this.claudeAvailable = false;
        }
    }

    // Main chat assistance
    async handleUserQuestion(question, userContext = {}) {
        try {
            console.log('🤖 Processing user question:', question.substring(0, 50) + '...');
            
            if (!this.isInitialized) {
                console.log('🔄 Re-initializing Claude service...');
                await this.initializeClaudeService();
            }

            if (this.claudeAvailable) {
                console.log('🔮 Using Claude AI...');
                const response = await this.askClaude(question, userContext, 'chat');
                if (response.success) {
                    console.log('✅ Claude responded successfully');
                    return response;
                }
                console.log('⚠️ Claude response failed, using fallback');
            } else {
                console.log('📚 Claude not available, using fallback');
            }
            
            return this.getFallbackResponse(question);
            
        } catch (error) {
            console.error('❌ handleUserQuestion error:', error);
            return this.getFallbackResponse(question);
        }
    }

    // Financial analysis
    async analyzeFinancialSituation(userFinances, currentDay = 1) {
        try {
            console.log(`🧮 Analyzing financial situation for day ${currentDay}...`);
            
            if (this.claudeAvailable) {
                const prompt = this.buildFinancialAnalysisPrompt(userFinances, currentDay);
                const response = await this.askClaude(prompt, {currentDay}, 'financial_analysis');
                if (response.success) return response;
            }
            
            return this.getFallbackFinancialAnalysis(userFinances);
            
        } catch (error) {
            console.error('❌ Financial analysis failed:', error);
            return this.getFallbackFinancialAnalysis(userFinances);
        }
    }

    // Personalized coaching
    async getPersonalizedCoaching(userProgress, dayNumber) {
        try {
            console.log(`🎯 Generating coaching for day ${dayNumber}...`);
            
            if (this.claudeAvailable) {
                const prompt = this.buildCoachingPrompt(userProgress, dayNumber);
                const response = await this.askClaude(prompt, {dayNumber}, 'coaching');
                if (response.success) return response;
            }
            
            return this.getFallbackCoaching(dayNumber);
            
        } catch (error) {
            console.error('❌ Coaching generation failed:', error);
            return this.getFallbackCoaching(dayNumber);
        }
    }

    // Money leak detection
    async detectMoneyLeaks(expenses, income) {
        try {
            console.log('🔍 Detecting money leaks...');
            
            if (this.claudeAvailable) {
                const prompt = this.buildMoneyLeakPrompt(expenses, income);
                const response = await this.askClaude(prompt, {}, 'money_leak');
                if (response.success) return response;
            }
            
            return this.getFallbackMoneyLeakAnalysis(expenses);
            
        } catch (error) {
            console.error('❌ Money leak detection failed:', error);
            return this.getFallbackMoneyLeakAnalysis(expenses);
        }
    }

    // Claude API integration with detailed logging
    async askClaude(prompt, userContext = {}, type = 'general') {
        try {
            console.log(`🔥 Making Claude API call for type: ${type}`);
            
            const fullPrompt = this.buildFullPrompt(prompt, userContext, type);
            console.log('📤 Sending to Claude (first 100 chars):', fullPrompt.substring(0, 100) + '...');

            const message = await this.anthropic.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: this.getMaxTokens(type),
                system: this.getSystemPrompt(type),
                messages: [
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ]
            });

            if (!message || !message.content || !message.content[0] || !message.content[0].text) {
                throw new Error('Invalid response structure from Claude');
            }

            const responseText = message.content[0].text;
            console.log('✅ Claude responded with', responseText.length, 'characters');
            console.log('📥 Response preview:', responseText.substring(0, 100) + '...');
            
            return {
                success: true,
                source: 'claude',
                response: responseText,
                type: type,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Claude API call failed:', error.message);
            console.error('Error type:', error.constructor.name);
            console.error('Error details:', {
                status: error.status,
                message: error.message,
                code: error.code
            });
            
            return {
                success: false,
                error: error.message,
                source: 'claude_error'
            };
        }
    }

    // Prompt builders
    buildFullPrompt(prompt, userContext, type) {
        const contextString = `
User Context:
- Name: ${userContext.name || 'User'}
- Current Day: ${userContext.currentDay || 1}
- Country: Cambodia
- Program: 7-Day Money Flow Reset
- Language: Respond in Khmer

Request: ${prompt}`;

        return contextString;
    }

    buildFinancialAnalysisPrompt(userFinances, currentDay) {
        return `Analyze this financial situation for a Cambodian user on Day ${currentDay}:

Income: $${userFinances.monthlyIncome || 0}
Expenses: $${userFinances.monthlyExpenses || 0}
Savings: $${userFinances.currentSavings || 0}
Debts: $${userFinances.totalDebts || 0}

Provide practical financial advice in Khmer for Cambodia context (USD/KHR, ABA/ACLEDA banks).`;
    }

    buildCoachingPrompt(userProgress, dayNumber) {
        return `Create personalized coaching for Day ${dayNumber} of 7-Day Money Flow Reset:

User Progress: ${userProgress.completedDays || 0} days completed
Current Day: ${dayNumber}

Provide encouraging coaching in Khmer with specific action items for today.`;
    }

    buildMoneyLeakPrompt(expenses, income) {
        return `Money leak analysis for Cambodian user:

Monthly Income: $${income}
Expenses: ${JSON.stringify(expenses)}

Identify money leaks and provide savings recommendations in Khmer.`;
    }

    getSystemPrompt(type) {
        const prompts = {
            chat: "You are an expert financial coach for the 7-Day Money Flow Reset program in Cambodia. Respond in clear Khmer with practical advice.",
            financial_analysis: "You are a financial analyst specializing in Cambodia. Provide analysis in Khmer with local context (USD/KHR, ABA/ACLEDA banks).",
            coaching: "You are a motivational coach for Cambodian users. Provide encouraging guidance in Khmer.",
            money_leak: "You are a financial detective helping Cambodians find money leaks. Respond in Khmer with practical savings tips.",
            general: "You are a helpful financial assistant for Cambodian users. Always respond in Khmer."
        };
        return prompts[type] || prompts.general;
    }

    getMaxTokens(type) {
        const tokens = {
            chat: 800,
            financial_analysis: 1200,
            coaching: 1000,
            money_leak: 800,
            general: 600
        };
        return tokens[type] || 600;
    }

    // Fallback responses
    getFallbackResponse(question) {
        const questionLower = question.toLowerCase();
        let response = "🤖 AI ជំនួយ:\n\n";
        
        if (questionLower.includes('សន្សំ') || questionLower.includes('save')) {
            response += `💰 គន្លឹះសន្សំលុយ:\n`;
            response += `• ចាប់ផ្តើមពី 10% នៃចំណូល\n`;
            response += `• បង្កើតម្ហូបអគារ 3-6 ខែ\n`;
            response += `• កាត់បន្ថយចំណាយមិនចាំបាច់\n`;
            response += `• ប្រើវិធី 50/30/20 rule\n\n`;
        } else {
            response += `សំណួរ: "${question}"\n\n`;
            response += `💡 ការណែនាំទូទៅ:\n`;
            response += `• កត់ត្រាចំណូល-ចំណាយ\n`;
            response += `• កំណត់គោលដៅហិរញ្ញវត្ថុ\n`;
            response += `• ប្រើ /day1-7 សម្រាប់មេរៀន\n\n`;
        }
        
        response += `🔮 Claude AI នឹងត្រលប់មកក្នុងពេលឆាប់ៗ!\n💬 @Chendasum`;
        
        return {
            success: true,
            source: 'fallback',
            response: response,
            timestamp: new Date().toISOString()
        };
    }

    getFallbackFinancialAnalysis(userFinances) {
        const income = userFinances.monthlyIncome || 1000;
        const expenses = userFinances.monthlyExpenses || 800;
        const savings = income - expenses;
        const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
        
        let analysis = `📊 ការវិភាគហិរញ្ញវត្ថុ:\n\n`;
        analysis += `💰 ចំណូល: $${income}\n💸 ចំណាយ: $${expenses}\n💎 សន្សំ: $${savings} (${savingsRate}%)\n\n`;
        
        if (savingsRate < 10) {
            analysis += `⚠️ អត្រាសន្សំទាប - ត្រូវកែលម្អ:\n• គោលដៅ: 10-20%\n• កាត់បន្ថយចំណាយ\n• បង្កើនចំណូល\n\n`;
        } else {
            analysis += `✅ អត្រាសន្សំល្អ - បន្តទម្លាប់នេះ!\n\n`;
        }
        
        analysis += `🎯 /day3 ការវិភាគប្រព័ន្ធ\n💬 @Chendasum`;
        
        return {
            success: true,
            source: 'fallback',
            response: analysis,
            timestamp: new Date().toISOString()
        };
    }

    getFallbackCoaching(dayNumber) {
        const messages = {
            1: "🌊 ថ្ងៃទី 1: ចាប់ផ្តើម Money Flow! អ្នកកំពុងធ្វើជំហានសំខាន់",
            2: "🔍 ថ្ងៃទី 2: រកឃើញ Money Leaks! ពិនិត្យចំណាយតូចៗ",
            3: "⚖️ ថ្ងៃទី 3: វាយតម្លៃប្រព័ន្ធ! អ្នកកំពុងរៀនល្អ",
            4: "🗺️ ថ្ងៃទី 4: បង្កើតផែនទី! ទស្សនវិស័យកាន់តែច្បាស់",
            5: "⚡ ថ្ងៃទី 5: Survival vs Growth! កម្រិតកាន់តែខ្ពស់",
            6: "🎯 ថ្ងៃទី 6: Action Plan! ស្ទើរបានហើយ",
            7: "🏆 ថ្ងៃទី 7: ជោគជ័យ! អ្នកអស្ចារ្យ!"
        };
        
        const message = messages[dayNumber] || "💪 បន្តដំណើរហិរញ្ញវត្ថុ!";
        
        return {
            success: true,
            source: 'fallback',
            response: `🎯 AI Coach:\n\n${message}\n\n📚 /day${dayNumber} មេរៀនថ្ងៃនេះ\n📈 /progress វឌ្ឍនភាព\n💬 @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getFallbackMoneyLeakAnalysis(expenses) {
        return {
            success: true,
            source: 'fallback',
            response: `🔍 Money Leak Analysis:\n\n🎯 ពិនិត្យតំបន់ទាំងនេះ:\n• Subscriptions មិនប្រើ\n• ម្ហូប delivery ញឹកញាប់\n• កាហ្វេ/ភេសជ្ជៈ ប្រចាំថ្ងៃ\n• Impulse buying\n\n💡 ការកាត់បន្ថយតូចៗ = សន្សំធំ!\n\n📚 /day2 Money Leak Detection\n💬 @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    // Status and utilities
    getStatus() {
        return {
            initialized: this.isInitialized,
            claude_available: this.claudeAvailable,
            primary_ai: 'Claude',
            last_check: new Date().toISOString()
        };
    }

    async testConnection() {
        try {
            if (this.claudeAvailable) {
                const test = await this.askClaude("Test", {}, 'general');
                return { claude: true, test: test.success };
            }
            return { available: false, message: 'Claude not available' };
        } catch (error) {
            return { error: error.message };
        }
    }
}

async debugClaudeConnection() {
    try {
        console.log('🧪 Testing Claude with minimal request...');
        
        const message = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 100,
            messages: [
                {
                    role: "user", 
                    content: "Say hello in Khmer"
                }
            ]
        });
        
        console.log('✅ Debug test successful:', message.content[0].text);
        return true;
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
        console.error('Status:', error.status);
        console.error('Type:', error.type);
        return false;
    }
}

module.exports = new ClaudeAIIntegration();
