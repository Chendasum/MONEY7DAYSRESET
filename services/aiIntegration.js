// Claude Sonnet 4 AI Integration - Production Ready
class ClaudeAIService {
    constructor() {
        this.claudeAvailable = false;
        this.isInitialized = false;
        this.initializeClaude();
    }

    async initializeClaude() {
        try {
            console.log('🔮 Initializing Claude Sonnet 4...');
            
            if (!process.env.ANTHROPIC_API_KEY) {
                console.log('❌ No ANTHROPIC_API_KEY found');
                return;
            }

            const Anthropic = require('@anthropic-ai/sdk');
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            // Test the connection
            console.log('🧪 Testing Claude connection...');
            const testResponse = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 50,
                messages: [{ role: "user", content: "សួស្តី" }]
            });

            if (testResponse && testResponse.content && testResponse.content[0]) {
                this.claudeAvailable = true;
                console.log('✅ Claude Sonnet 4 connected successfully!');
                console.log('Test response:', testResponse.content[0].text);
            }

        } catch (error) {
            console.log('❌ Claude connection failed:', error.message);
            this.claudeAvailable = false;
        } finally {
            this.isInitialized = true;
        }
    }

    // Main question handler
    async handleUserQuestion(question, userContext = {}) {
        console.log('🤖 Handling question:', question.substring(0, 50));
        
        if (!this.claudeAvailable) {
            console.log('📚 Claude not available, using smart fallback');
            return this.getSmartFallback(question);
        }

        try {
            const prompt = `អ្នកប្រើប្រាស់ពីកម្ពុជាសួរ: "${question}"

បរិបទ: កម្មវិធី 7-Day Money Flow Reset, ថ្ងៃទី ${userContext.currentDay || 1}

សូមឆ្លើយជាភាសាខ្មែរដោយផ្តល់ដំបូន្មានហិរញ្ញវត្ថុដ៏ជាក់ស្តែងសម្រាប់បរិបទកម្ពុជា។ រួមបញ្ចូល:
- ដំបូន្មានជាក់ស្តែងអាចអនុវត្តបាន
- បរិបទកម្ពុជា (USD/KHR, ABA/ACLEDA)
- លើកទឹកចិត្តនិងវិជ្ជមាន
- រក្សាឱ្យខ្លីនិងងាយយល់`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 800,
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                console.log('✅ Claude responded successfully');
                return {
                    success: true,
                    source: 'claude',
                    response: response.content[0].text,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Claude API error:', error.message);
        }

        return this.getSmartFallback(question);
    }

    // Financial analysis
    async analyzeFinancialSituation(userFinances, currentDay = 1) {
        console.log('📊 Analyzing financial situation...');
        
        if (!this.claudeAvailable) {
            return this.getAnalysisFallback(userFinances);
        }

        try {
            const prompt = `វិភាគស្ថានភាពហិរញ្ញវត្ថុសម្រាប់អ្នកប្រើប្រាស់កម្ពុជានៅថ្ងៃទី ${currentDay}:

ចំណូលខែ: $${userFinances.monthlyIncome || 0}
ចំណាយខែ: $${userFinances.monthlyExpenses || 0}
សន្សំបច្ចុប្បន្ន: $${userFinances.currentSavings || 0}
បំណុល: $${userFinances.totalDebts || 0}

សូមផ្តល់ការវិភាគនិងដំបូន្មានជាភាសាខ្មែរ រួមបញ្ចូល:
- វាយតម្លៃសុខភាពហិរញ្ញវត្ថុបច្ចុប្បន្ន
- ដំបូន្មានអំពីការកែលម្អ
- កម្មវិធីសកម្មភាពជាក់ស្តែងសម្រាប់ថ្ងៃទី ${currentDay}
- បរិបទកម្ពុជា (ធនាគារ ABA/ACLEDA)`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                return {
                    success: true,
                    source: 'claude',
                    response: response.content[0].text,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Claude analysis error:', error.message);
        }

        return this.getAnalysisFallback(userFinances);
    }

    // Personalized coaching
    async getPersonalizedCoaching(userProgress, dayNumber) {
        console.log('🎯 Generating coaching...');
        
        if (!this.claudeAvailable) {
            return this.getCoachingFallback(dayNumber);
        }

        try {
            const prompt = `បង្កើតការណែនាំផ្ទាល់ខ្លួនសម្រាប់ថ្ងៃទី ${dayNumber} នៃកម្មវិធី 7-Day Money Flow Reset:

ថ្ងៃបានបញ្ចប់: ${userProgress.completedDays || 0}
ថ្ងៃបច្ចុប្បន្ន: ${dayNumber}

សូមផ្តល់ជាភាសាខ្មែរ:
- ការលើកទឹកចិត្តសម្រាប់វឌ្ឍនភាពរបស់គាត់
- ការណែនាំជាក់ស្តែងសម្រាប់ថ្ងៃនេះ
- ការលើកកម្ពស់សមាជិក
- ជំហានបន្ទាប់ច្បាស់លាស់`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 800,
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                return {
                    success: true,
                    source: 'claude',
                    response: response.content[0].text,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Claude coaching error:', error.message);
        }

        return this.getCoachingFallback(dayNumber);
    }

    // Money leak detection
    async detectMoneyLeaks(expenses, income) {
        console.log('🔍 Detecting money leaks...');
        
        if (!this.claudeAvailable) {
            return this.getLeaksFallback(expenses);
        }

        try {
            const prompt = `រកមើល Money Leaks សម្រាប់អ្នកប្រើប្រាស់កម្ពុជា:

ចំណូលខែ: $${income}
ចំណាយ: ${JSON.stringify(expenses)}

សូមវិភាគនិងផ្តល់ដំបូន្មានជាភាសាខ្មែរ:
- កន្លែងដែលលុយបាត់បង់
- ការ subscription មិនចាំបាច់
- ឱកាសសន្សំសម្រាប់បរិបទកម្ពុជា
- ចំណាយតូចៗដែលកើនឡើង`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 800,
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                return {
                    success: true,
                    source: 'claude',
                    response: response.content[0].text,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Claude leaks error:', error.message);
        }

        return this.getLeaksFallback(expenses);
    }

    // Smart fallback responses
    getSmartFallback(question) {
        const questionLower = question.toLowerCase();
        let response = "🔮 Claude AI ឆ្លើយតប:\n\n";
        
        if (questionLower.includes('សន្សំ') || questionLower.includes('save')) {
            response += `💰 គន្លឹះសន្សំលុយពីជំនាញការ:\n\n`;
            response += `🎯 ចាប់ផ្តើមសាមញ្ញ:\n`;
            response += `• សន្សំ 10% នៃចំណូលជាដំបូង\n`;
            response += `• បង្កើតម្ហូបអគារ 3-6 ខែ\n`;
            response += `• កាត់បន្ថយចំណាយមិនចាំបាច់\n\n`;
            response += `💡 វិធី 50/30/20 Rule:\n`;
            response += `• 50% - ចំណាយចាំបាច់\n`;
            response += `• 30% - ចំណាយកម្សាន្ត\n`;
            response += `• 20% - សន្សំនិងវិនិយោគ\n\n`;
        } else if (questionLower.includes('រកលុយ') || questionLower.includes('ចំណូល')) {
            response += `💰 វិធីបង្កើនចំណូល:\n\n`;
            response += `🚀 ឱកាសក្នុងកម្ពុជា:\n`;
            response += `• បង្រៀនភាសាអង់គ្លេស\n`;
            response += `• អាជីវកម្មអនឡាញ (Facebook/Instagram)\n`;
            response += `• ការងារ freelance (design, writing)\n`;
            response += `• ការលក់ទំនិញតូច\n\n`;
        } else {
            response += `សំណួរ: "${question}"\n\n`;
            response += `💡 ការណែនាំទូទៅ:\n`;
            response += `• កត់ត្រាចំណូល-ចំណាយ\n`;
            response += `• កំណត់គោលដៅហិរញ្ញវត្ថុ\n`;
            response += `• ប្រើ /day1-7 សម្រាប់មេរៀនជាក់ស្តែង\n\n`;
        }
        
        response += `📚 កម្មវិធីពេញលេញ:\n`;
        response += `• /day1 - ចាប់ផ្តើម Money Flow\n`;
        response += `• /progress - មើលវឌ្ឍនភាព\n`;
        response += `• /coach - ការណែនាំផ្ទាល់ខ្លួន\n\n`;
        response += `💬 ជំនួយ: @Chendasum`;
        
        return {
            success: true,
            source: 'smart_fallback',
            response: response,
            timestamp: new Date().toISOString()
        };
    }

    getAnalysisFallback(userFinances) {
        const income = userFinances.monthlyIncome || 1000;
        const expenses = userFinances.monthlyExpenses || 800;
        const savings = income - expenses;
        const rate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
        
        return {
            success: true,
            source: 'fallback',
            response: `📊 ការវិភាគហិរញ្ញវត្ថុ:\n\n💰 ចំណូល: $${income}\n💸 ចំណាយ: $${expenses}\n💎 សន្សំ: $${savings} (${rate}%)\n\n${rate > 15 ? '✅ អត្រាសន្សំល្អ!' : '⚠️ គួរបង្កើនការសន្សំ'}\n\n🎯 /day3 ការវិភាគប្រព័ន្ធ\n💬 @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getCoachingFallback(dayNumber) {
        const messages = {
            1: "🌊 ថ្ងៃទី 1: ចាប់ផ្តើម Money Flow ជាមួយក្តីសង្ឃឹម!",
            2: "🔍 ថ្ងៃទី 2: រកឃើញ Money Leaks - ការធ្វើឱ្យប្រសើរ!",
            3: "⚖️ ថ្ងៃទី 3: វាយតម្លៃប្រព័ន្ធ - អ្នកកំពុងរៀនល្អ!",
            4: "🗺️ ថ្ងៃទី 4: បង្កើតផែនទី - ក្រុមការងារអស្ចារ្យ!",
            5: "⚡ ថ្ងៃទី 5: Survival vs Growth - កម្រិតខ្ពស់!",
            6: "🎯 ថ្ងៃទី 6: Action Plan - ជិតបានហើយ!",
            7: "🏆 ថ្ងៃទី 7: ជោគជ័យ - អ្នកអស្ចារ្យពិតប្រាកដ!"
        };
        
        return {
            success: true,
            source: 'fallback',
            response: `🎯 AI Coach:\n\n${messages[dayNumber] || 'បន្តការងារល្អ!'}\n\n📚 /day${dayNumber} មេរៀនថ្ងៃនេះ\n💬 @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getLeaksFallback(expenses) {
        return {
            success: true,
            source: 'fallback',
            response: `🔍 Money Leak Detection:\n\n🎯 ពិនិត្យតំបន់ទាំងនេះ:\n• Subscriptions មិនប្រើ (Netflix, Spotify)\n• ម្ហូប delivery ញឹកញាប់\n• កាហ្វេ/ភេសជ្ជៈ ប្រចាំថ្ងៃ\n• Impulse shopping\n• ចំណាយធ្វើដំណើរមិនចាំបាច់\n\n💡 ការកាត់បន្ថយតូចៗ = សន្សំធំ!\n\n📚 /day2 Money Leak Detection\n💬 @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            claude_available: this.claudeAvailable,
            model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514"
        };
    }
}

module.exports = new ClaudeAIService();
