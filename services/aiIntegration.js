// Enhanced AI Integration Service with Claude AI - PRODUCTION READY
async initializeAIServices() {
    try {
        console.log('🔍 Initializing AI services...');
        console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
        console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
        
        // Check for Claude API
        if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) {
            try {
                console.log('📦 Loading Anthropic SDK...');
                const Anthropic = require('@anthropic-ai/sdk');
                console.log('✅ Anthropic SDK loaded successfully');
                
                this.anthropic = new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
                });
                
                console.log('🧪 Testing Claude connection...');
                // Test the connection
                await this.anthropic.messages.create({
                    model: "claude-3-sonnet-20240229",
                    max_tokens: 50,
                    messages: [{ role: "user", content: "Test" }]
                });
                
                this.claudeAvailable = true;
                console.log('✅ Claude AI initialized and tested successfully');
            } catch (error) {
                console.log('❌ Claude initialization failed:', error.message);
                console.log('Error details:', error);
            }
        } else {
            console.log('⚠️ No Claude API key found');
        }
        
        // ... rest of your initialization code

class EnhancedAIIntegration {
    constructor() {
        this.claudeAvailable = false;
        this.openaiAvailable = false;
        this.isInitialized = false;
        
        this.initializeAIServices();
    }

    async initializeAIServices() {
        try {
            console.log('Initializing AI services...');
            
            // Check for Claude API
            if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) {
                try {
                    const Anthropic = require('@anthropic-ai/sdk');
                    this.anthropic = new Anthropic({
                        apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
                    });
                    this.claudeAvailable = true;
                    console.log('Claude AI initialized successfully');
                } catch (error) {
                    console.log('Claude initialization failed:', error.message);
                }
            }
            
            // Check for OpenAI API as fallback
            if (process.env.OPENAI_API_KEY) {
                try {
                    const OpenAI = require('openai');
                    this.openai = new OpenAI({
                        apiKey: process.env.OPENAI_API_KEY,
                    });
                    this.openaiAvailable = true;
                    console.log('OpenAI initialized as fallback');
                } catch (error) {
                    console.log('OpenAI initialization failed:', error.message);
                }
            }

            this.isInitialized = true;
            console.log(`AI Integration Status: Claude=${this.claudeAvailable}, OpenAI=${this.openaiAvailable}`);
            
        } catch (error) {
            console.error('AI service initialization failed:', error);
        }
    }

    // Main chat assistance
    async handleUserQuestion(question, userContext = {}) {
        try {
            if (!this.isInitialized) {
                await this.initializeAIServices();
            }

            console.log('Processing user question with AI...');
            
            const context = this.buildUserContext(userContext);
            const prompt = this.buildQuestionPrompt(question, context);
            
            // Try Claude first (preferred)
            if (this.claudeAvailable) {
                return await this.askClaude(prompt, 'chat');
            }
            
            // Fallback to OpenAI
            if (this.openaiAvailable) {
                return await this.askOpenAI(prompt, 'chat');
            }
            
            // Ultimate fallback
            return this.getFallbackResponse(question);
            
        } catch (error) {
            console.error('AI question handling failed:', error);
            return this.getErrorResponse();
        }
    }

    // Financial analysis
    async analyzeFinancialSituation(userFinances, currentDay = 1) {
        try {
            console.log(`Analyzing financial situation for day ${currentDay}...`);
            
            const prompt = this.buildFinancialAnalysisPrompt(userFinances, currentDay);
            
            if (this.claudeAvailable) {
                return await this.askClaude(prompt, 'financial_analysis');
            }
            
            if (this.openaiAvailable) {
                return await this.askOpenAI(prompt, 'financial_analysis');
            }
            
            return this.getFallbackFinancialAnalysis(userFinances);
            
        } catch (error) {
            console.error('Financial analysis failed:', error);
            return this.getErrorResponse();
        }
    }

    // Personalized coaching
    async getPersonalizedCoaching(userProgress, dayNumber) {
        try {
            console.log(`Generating personalized coaching for day ${dayNumber}...`);
            
            const prompt = this.buildCoachingPrompt(userProgress, dayNumber);
            
            if (this.claudeAvailable) {
                return await this.askClaude(prompt, 'coaching');
            }
            
            if (this.openaiAvailable) {
                return await this.askOpenAI(prompt, 'coaching');
            }
            
            return this.getFallbackCoaching(dayNumber);
            
        } catch (error) {
            console.error('Coaching generation failed:', error);
            return this.getErrorResponse();
        }
    }

    // Money leak detection
    async detectMoneyLeaks(expenses, income) {
        try {
            console.log('AI-powered money leak detection...');
            
            const prompt = this.buildMoneyLeakPrompt(expenses, income);
            
            if (this.claudeAvailable) {
                return await this.askClaude(prompt, 'money_leak');
            }
            
            if (this.openaiAvailable) {
                return await this.askOpenAI(prompt, 'money_leak');
            }
            
            return this.getFallbackMoneyLeakAnalysis(expenses);
            
        } catch (error) {
            console.error('Money leak detection failed:', error);
            return this.getErrorResponse();
        }
    }

    // Claude AI integration
    async askClaude(prompt, type = 'general') {
        try {
            const modelConfigs = {
                chat: { model: "claude-3-sonnet-20240229", max_tokens: 1000 },
                financial_analysis: { model: "claude-3-sonnet-20240229", max_tokens: 1500 },
                coaching: { model: "claude-3-sonnet-20240229", max_tokens: 1200 },
                money_leak: { model: "claude-3-sonnet-20240229", max_tokens: 1000 },
                general: { model: "claude-3-sonnet-20240229", max_tokens: 800 }
            };

            const config = modelConfigs[type] || modelConfigs.general;

            const message = await this.anthropic.messages.create({
                model: config.model,
                max_tokens: config.max_tokens,
                system: this.getSystemPrompt(type),
                messages: [{
                    role: "user",
                    content: prompt
                }]
            });

            const response = message.content[0].text;
            
            return {
                success: true,
                source: 'claude',
                response: response,
                type: type,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    // OpenAI fallback
    async askOpenAI(prompt, type = 'general') {
        try {
            const systemPrompts = {
                chat: "You are a helpful financial coach for the 7-Day Money Flow Reset program in Cambodia.",
                financial_analysis: "You are an expert financial analyst providing advice for Cambodian users.",
                coaching: "You are a motivational financial coach helping users achieve their money goals.",
                money_leak: "You are a financial detective helping users find unnecessary expenses.",
                general: "You are a helpful assistant for financial education."
            };

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompts[type] },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.7
            });

            return {
                success: true,
                source: 'openai',
                response: completion.choices[0].message.content,
                type: type,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }

    // Prompt builders
    buildUserContext(userContext) {
        return `
User Profile:
- Name: ${userContext.name || 'User'}
- Tier: ${userContext.tier || 'Essential'}
- Current Day: ${userContext.currentDay || 1}
- Completed Days: ${userContext.completedDays || 0}
- Country: Cambodia
- Language: Khmer (respond in Khmer)
        `.trim();
    }

    buildQuestionPrompt(question, context) {
        return `
${context}

User Question: "${question}"

Please provide a helpful, practical response in Khmer about financial management, money flow, or the 7-Day Money Flow Reset program. Keep it encouraging and specific to the Cambodian context.

Format your response to be:
1. Clear and easy to understand
2. Practical and actionable
3. Encouraging and motivational
4. Specific to Cambodia's financial environment
5. Maximum 500 words

Response in Khmer:
        `.trim();
    }

    buildFinancialAnalysisPrompt(userFinances, currentDay) {
        return `
Analyze this financial situation for a Cambodian user on Day ${currentDay} of the 7-Day Money Flow Reset:

Income: $${userFinances.monthlyIncome || 0}
Expenses: $${userFinances.monthlyExpenses || 0}
Savings: $${userFinances.currentSavings || 0}
Debts: $${userFinances.totalDebts || 0}

Please provide:
1. Current financial health assessment
2. Specific money leak areas to investigate
3. Day ${currentDay} action items
4. Cambodia-specific advice (USD/KHR, local banks, etc.)
5. Encouraging next steps

Respond in Khmer with practical, actionable advice.
        `.trim();
    }

    buildCoachingPrompt(userProgress, dayNumber) {
        return `
Create personalized coaching for Day ${dayNumber} of the 7-Day Money Flow Reset program.

User Progress:
- Completed Days: ${userProgress.completedDays || 0}
- Current Challenges: ${userProgress.challenges || 'General progress'}
- Goals: ${userProgress.goals || 'Improve money management'}

Provide:
1. Motivation specific to their progress
2. Day ${dayNumber} focus areas
3. Personalized encouragement
4. Next action steps
5. Success reminders

Respond in Khmer with an encouraging, coaching tone.
        `.trim();
    }

    buildMoneyLeakPrompt(expenses, income) {
        return `
Analyze these expenses for money leaks in a Cambodian context:

Monthly Income: $${income}
Expense Categories:
${JSON.stringify(expenses, null, 2)}

Identify:
1. Potential money leaks
2. Unnecessary subscriptions/services
3. Cambodia-specific savings opportunities
4. Small expenses that add up
5. Behavioral patterns to change

Provide specific, actionable recommendations in Khmer.
        `.trim();
    }

    getSystemPrompt(type) {
        const systemPrompts = {
            chat: `You are an expert financial coach for the 7-Day Money Flow Reset program specifically designed for Cambodian users. 

Your role:
- Provide practical financial advice for Cambodia's economy
- Support users through their 7-day transformation journey
- Respond in clear, encouraging Khmer language
- Focus on actionable steps and local context (USD/KHR, ABA/ACLEDA banks, etc.)
- Maintain an encouraging, professional tone`,

            financial_analysis: `You are a financial analyst specializing in the Cambodian market and personal finance.

Your expertise:
- Understanding Cambodia's banking system (ABA, ACLEDA, etc.)
- USD/KHR currency considerations
- Local expense patterns and money leaks
- Practical saving strategies for Cambodian families
- Small business financial management in Cambodia`,

            coaching: `You are a motivational financial coach for the 7-Day Money Flow Reset program.

Your approach:
- Encouraging and supportive tone
- Practical, step-by-step guidance
- Cultural sensitivity to Cambodian values
- Focus on building confidence and financial literacy
- Celebrate small wins and progress`,

            money_leak: `You are a financial detective helping Cambodian users identify money leaks.

Your focus:
- Common expense categories in Cambodia
- Subscription services and recurring payments
- Small daily expenses that accumulate
- Behavioral spending patterns
- Local-specific money-saving opportunities`,

            general: `You are a helpful financial education assistant for Cambodian users of the 7-Day Money Flow Reset program. Always respond in Khmer with practical, encouraging advice.`
        };

        return systemPrompts[type] || systemPrompts.general;
    }

    // Fallback responses
    getFallbackResponse(question) {
        const fallbacks = [
            "សូមអភ័យទោស! AI ដើម្បីជួយមិនអាចឆ្លើយបាន។ សូមទាក់ទង @Chendasum សម្រាប់ជំនួយផ្ទាល់។",
            "ប្រព័ន្ធ AI កំពុងតែបច្ចុប្បន្នភាព។ សូមសាកសំណួរម្តងទៀតក្រោយ ឬប្រើ /help សម្រាប់ជម្រើសផ្សេងៗ។",
            "សម្រាប់ជំនួយជាក់លាក់ អ្នកអាចសាកល្បង:\n• /day[1-7] សម្រាប់មេរៀន\n• /progress សម្រាប់ការរីកចម្រើន\n• /quote សម្រាប់ការលើកទឹកចិត្ត"
        ];
        
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        return {
            success: false,
            source: 'fallback',
            response: randomFallback,
            timestamp: new Date().toISOString()
        };
    }

    getFallbackFinancialAnalysis(userFinances) {
        const income = userFinances.monthlyIncome || 0;
        const expenses = userFinances.monthlyExpenses || 0;
        const savings = income - expenses;
        
        let analysis = "ការវិភាគហិរញ្ញវត្ថុមូលដ្ឋាន:\n\n";
        
        if (savings > 0) {
            analysis += `អ្នកកំពុងសន្សំបាន $${savings}/ខែ - ល្អណាស់!\n\n`;
        } else {
            analysis += `ចំណាយលើសពីចំណូល $${Math.abs(savings)}/ខែ\n\n`;
        }
        
        analysis += `ជំហានបន្ទាប់:\n`;
        analysis += `• ពិនិត្យមើលចំណាយតូចៗប្រចាំថ្ងៃ\n`;
        analysis += `• រកមើល subscriptions ឬសេវាកម្មដែលមិនចាំបាច់\n`;
        analysis += `• កំណត់ថវិកាសម្រាប់ការចំណាយចាំបាច់\n`;
        analysis += `• ប្រើ /day1 ដើម្បីចាប់ផ្តើម Money Flow Reset\n\n`;
        analysis += `AI ពេញលេញនឹងអាចប្រើបានក្នុងពេលឆាប់ៗនេះ!`;

        return {
            success: true,
            source: 'fallback',
            response: analysis,
            timestamp: new Date().toISOString()
        };
    }

    getFallbackCoaching(dayNumber) {
        const coachingMessages = {
            1: "ថ្ងៃទី 1: ចាប់ផ្តើមដោយការស្គាល់ Money Flow របស់អ្នក! កុំបារម្ភ - គ្រប់គ្នាចាប់ផ្តើមពីចំណុចនេះ។",
            2: "ថ្ងៃទី 2: ពេលវេលារកឃើញ Money Leaks! មើលចំណាយតូចៗដែលអាចកាត់បន្ថយបាន។",
            3: "ថ្ងៃទី 3: វាយតម្លៃប្រព័ន្ធរបស់អ្នក! អ្នកកំពុងធ្វើបានល្អហើយ។",
            4: "ថ្ងៃទី 4: បង្កើតផែនទី Income & Cost ច្បាស់លាស់។",
            5: "ថ្ងៃទី 5: យល់ពី Survival vs Growth - កម្រិតខ្ពស់!",
            6: "ថ្ងៃទី 6: ពេលធ្វើ Action Plan! អ្នកស្ទើរបានហើយ។",
            7: "ថ្ងៃទី 7: Integration និងសមិទ្ធផល! អ្នកអស្ចារ្យ!"
        };

        const message = coachingMessages[dayNumber] || "បន្តដំណើរហិរញ្ញវត្ថុរបស់អ្នក!";
        
        return {
            success: true,
            source: 'fallback',
            response: `${message}\n\nAI ពេញលេញនឹងអាចប្រើបានក្នុងពេលឆាប់ៗនេះ!\n\nសម្រាប់ជំនួយបន្ថែម: @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getFallbackMoneyLeakAnalysis(expenses) {
        return {
            success: true,
            source: 'fallback',
            response: `ការវិភាគ Money Leak មូលដ្ឋាន:

ពិនិត្យមើលតំបន់ទាំងនេះ:
• Subscriptions (Netflix, Spotify, Apps)
• ការទិញម្ហូប delivery ញឹកញាប់
• កាហ្វេ/ភេសជ្ជៈ ប្រចាំថ្ងៃ
• Impulse buying
• ថ្លៃសេវាកម្មដែលមិនប្រើ

ការកាត់បន្ថយតូចៗ = សន្សំធំ!

AI ពេញលេញនឹងផ្តល់ការវិភាគលម្អិតក្នុងពេលឆាប់ៗនេះ!`,
            timestamp: new Date().toISOString()
        };
    }

    getErrorResponse() {
        return {
            success: false,
            source: 'error',
            response: "មានបញ្ហាបច្ចេកទេស។ សូមសាកម្តងទៀតក្រោយ ឬទាក់ទង @Chendasum",
            timestamp: new Date().toISOString()
        };
    }

    // AI health check
    async testConnection() {
        try {
            if (this.claudeAvailable) {
                const test = await this.askClaude("Test connection", 'general');
                return { claude: true, test: test.success };
            }
            
            if (this.openaiAvailable) {
                const test = await this.askOpenAI("Test connection", 'general');
                return { openai: true, test: test.success };
            }
            
            return { available: false, message: 'No AI services available' };
            
        } catch (error) {
            return { error: error.message };
        }
    }

    // Send response helper
    async sendAIResponse(bot, chatId, aiResponse) {
        try {
            if (aiResponse.success) {
                await bot.sendMessage(chatId, aiResponse.response);
                
                // Add source indicator
                const sourceEmoji = aiResponse.source === 'claude' ? '🔮' : 
                                  aiResponse.source === 'openai' ? '🧠' : '📚';
                const timestamp = new Date().toLocaleTimeString();
                await bot.sendMessage(chatId, `${sourceEmoji} ជំនួយដោយ AI • ${timestamp}`);
            } else {
                await bot.sendMessage(chatId, aiResponse.response);
            }
        } catch (error) {
            console.error('Error sending AI response:', error);
            await bot.sendMessage(chatId, "មានបញ្ហាក្នុងការផ្ញើចម្លើយ។ សូមទាក់ទង @Chendasum");
        }
    }

    // Get AI status
    getStatus() {
        return {
            initialized: this.isInitialized,
            claude_available: this.claudeAvailable,
            openai_available: this.openaiAvailable,
            primary_ai: this.claudeAvailable ? 'Claude' : this.openaiAvailable ? 'OpenAI' : 'None',
            capabilities: {
                chat_assistance: this.claudeAvailable || this.openaiAvailable,
                financial_analysis: this.claudeAvailable || this.openaiAvailable,
                personalized_coaching: this.claudeAvailable || this.openaiAvailable,
                money_leak_detection: this.claudeAvailable || this.openaiAvailable
            },
            last_check: new Date().toISOString()
        };
    }
}

// Export singleton
module.exports = new EnhancedAIIntegration();
