// Complete Enhanced Claude Sonnet 4 AI Integration - Fixed & Finished
class EnhancedClaudeAIService {
    constructor() {
        this.claudeAvailable = false;
        this.isInitialized = false;
        this.initializeClaude();
    }

    async initializeClaude() {
        try {
            console.log('🔮 Initializing Enhanced Claude Sonnet 4...');
            
            if (!process.env.ANTHROPIC_API_KEY) {
                console.log('❌ No ANTHROPIC_API_KEY found');
                this.claudeAvailable = false;
                this.isInitialized = true;
                return;
            }

            const Anthropic = require('@anthropic-ai/sdk');
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            // Test with a formatted response
            console.log('🧪 Testing Claude with formatted response...');
            const testResponse = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 100,
                system: this.getSystemPrompt('test'),
                messages: [{ role: "user", content: "សួស្តី អ្នកជាអ្វី?" }]
            });

            if (testResponse && testResponse.content && testResponse.content[0]) {
                this.claudeAvailable = true;
                console.log('✅ Enhanced Claude connected successfully!');
                console.log('Test response preview:', testResponse.content[0].text.substring(0, 100));
            }

        } catch (error) {
            console.log('❌ Claude connection failed:', error.message);
            this.claudeAvailable = false;
        } finally {
            this.isInitialized = true;
        }
    }

    // Enhanced question handler with better formatting
    async handleUserQuestion(question, userContext = {}) {
        console.log('🤖 Processing enhanced question:', question.substring(0, 50));
        
        if (!this.claudeAvailable) {
            console.log('📚 Using enhanced fallback');
            return this.getEnhancedFallback(question, userContext);
        }

        try {
            const enhancedPrompt = `អ្នកប្រើប្រាស់កម្ពុជាមានសំណួរ: "${question}"

បរិបទ: 
- កម្មវិធី "7-Day Money Flow Reset™"
- ថ្ងៃទី ${userContext.currentDay || 1} នៃកម្មវិធី
- អ្នកប្រើប្រាស់: ${userContext.name || 'សមាជិក'}
- កម្រិត: ${userContext.tier || 'Essential'}

សូមឆ្លើយជាភាសាខ្មែរតាមទម្រង់ដូចខាងក្រោម:

🎯 **ចម្លើយដ៏ស្ម័គ្រចិត្ត:**
[ផ្តល់ចម្លើយជាក់ស្តែងនិងងាយយល់]

💡 **គន្លឹះជាក់ស្តែង:**
• [គន្លឹះទី១]
• [គន្លឹះទី២] 
• [គន្លឹះទី៣]

🇰🇭 **បរិបទកម្ពុជា:**
[ដំបូន្មានជាក់ស្តែងសម្រាប់កម្ពុជា - USD/KHR, ABA/ACLEDA, Wing]

📚 **ជំហានបន្ទាប់:**
• [សកម្មភាពអាចធ្វើបានថ្ងៃនេះ]
• [ការរៀនបន្ថែម]

កុំប្រើពាក្យ "Claude" ក្នុងចម្លើយ។ ធ្វើឱ្យមានភាពផ្ទាល់ខ្លួន និងមានប្រយោជន៍។`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 1000,
                system: this.getSystemPrompt('chat'),
                messages: [{ role: "user", content: enhancedPrompt }]
            });

            if (response && response.content && response.content[0]) {
                const formattedResponse = this.formatClaudeResponse(response.content[0].text);
                console.log('✅ Enhanced Claude response generated');
                
                return {
                    success: true,
                    source: 'claude_enhanced',
                    response: formattedResponse,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Enhanced Claude error:', error.message);
        }

        return this.getEnhancedFallback(question, userContext);
    }

    // Enhanced financial analysis
    async analyzeFinancialSituation(userFinances, currentDay = 1) {
        console.log('📊 Enhanced financial analysis...');
        
        if (!this.claudeAvailable) {
            return this.getEnhancedAnalysisFallback(userFinances, currentDay);
        }

        try {
            const prompt = `សូមវិភាគស្ថានភាពហិរញ្ញវត្ថុនេះសម្រាប់អ្នកប្រើប្រាស់កម្ពុជានៅថ្ងៃទី ${currentDay}:

📊 **ទិន្នន័យហិរញ្ញវត្ថុ:**
• ចំណូលខែ: $${userFinances.monthlyIncome || 0} USD
• ចំណាយខែ: $${userFinances.monthlyExpenses || 0} USD  
• សន្សំបច្ចុប្បន្ន: $${userFinances.currentSavings || 0} USD
• បំណុលសរុប: $${userFinances.totalDebts || 0} USD

សូមផ្តល់ការវិភាគជាភាសាខ្មែរតាមទម្រង់:

📈 **ការវាយតម្លៃសុខភាពហិរញ្ញវត្ថុ:**
[វិភាគជាលក្ខណៈវិជ្ជមាន/អវិជ្ជមាន និងពន្យល់]

🎯 **អាទិភាពសម្រាប់ថ្ងៃទី ${currentDay}:**
• [កិច្ចការ ១]
• [កិច្ចការ ២]
• [កិច្ចការ ៣]

🏦 **ដំបូន្មានធនាគារកម្ពុជា:**
[ABA, ACLEDA, Wing - តើគួរប្រើយ៉ាងណា]

⚡ **សកម្មភាពរួចរាល់:**
[អ្វីដែលអាចធ្វើបានភ្លាមៗ]

ធ្វើឱ្យស៊ីជម្រៅនិងមានប្រាជ្ញា។`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 1200,
                system: this.getSystemPrompt('analysis'),
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                const formattedResponse = this.formatClaudeResponse(response.content[0].text);
                
                return {
                    success: true,
                    source: 'claude_enhanced',
                    response: formattedResponse,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Enhanced analysis error:', error.message);
        }

        return this.getEnhancedAnalysisFallback(userFinances, currentDay);
    }

    // Enhanced coaching
    async getPersonalizedCoaching(userProgress, dayNumber) {
        console.log('🎯 Enhanced coaching generation...');
        
        if (!this.claudeAvailable) {
            return this.getEnhancedCoachingFallback(dayNumber, userProgress);
        }

        try {
            const completedDays = this.countCompletedDays(userProgress);
            const progressPercent = dayNumber > 0 ? Math.round((completedDays / dayNumber) * 100) : 0;

            const prompt = `បង្កើតការណែនាំផ្ទាល់ខ្លួនសម្រាប់ថ្ងៃទី ${dayNumber} នៃកម្មវិធី "7-Day Money Flow Reset™":

👤 **ព័ត៌មានអ្នកប្រើប្រាស់:**
• ថ្ងៃបានបញ្ចប់: ${completedDays} ថ្ងៃ
• ថ្ងៃបច្ចុប្បន្ន: ថ្ងៃទី ${dayNumber}
• អត្រាវឌ្ឍនភាព: ${progressPercent}%

សូមផ្តល់ការណែនាំជាភាសាខ្មែរតាមទម្រង់:

🌟 **ការលើកទឹកចិត្តផ្ទាល់ខ្លួន:**
[លើកទឹកចិត្តផ្អែកលើវឌ្ឍនភាពរបស់គាត់]

🎯 **គោលដៅថ្ងៃទី ${dayNumber}:**
[អ្វីដែលត្រូវផ្តោតលើថ្ងៃនេះ]

💪 **យុទ្ធសាស្ត្រជោគជ័យ:**
• [យុទ្ធសាស្ត្រ ១]
• [យុទ្ធសាស្ត្រ ២]
• [យុទ្ធសាស្ត្រ ៣]

🚀 **ជំហានកម្មវិធី:**
1. [ជំហានទី១]
2. [ជំហានទី២]  
3. [ជំហានទី៣]

ធ្វើឱ្យមានការលើកទឹកចិត្តខ្លាំង និងមានបំផុសគំនិត។`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 1000,
                system: this.getSystemPrompt('coaching'),
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                const formattedResponse = this.formatClaudeResponse(response.content[0].text);
                
                return {
                    success: true,
                    source: 'claude_enhanced',
                    response: formattedResponse,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Enhanced coaching error:', error.message);
        }

        return this.getEnhancedCoachingFallback(dayNumber, userProgress);
    }

    // Enhanced money leak detection
    async detectMoneyLeaks(expenses, income) {
        console.log('🔍 Enhanced money leak detection...');
        
        if (!this.claudeAvailable) {
            return this.getEnhancedLeaksFallback(expenses, income);
        }

        try {
            const expenseEntries = Object.entries(expenses).map(([category, amount]) => 
                `• ${this.translateCategory(category)}: $${amount}`
            ).join('\n');

            const prompt = `វិភាគ Money Leaks សម្រាប់អ្នកប្រើប្រាស់កម្ពុជា:

💰 **ព័ត៌មានហិរញ្ញវត្ថុ:**
• ចំណូលខែ: $${income} USD
• ចំណាយតាមប្រភេទ:
${expenseEntries}

សូមវិភាគនិងផ្តល់ដំបូន្មានជាភាសាខ្មែរតាមទម្រង់:

🚨 **Money Leaks ដែលរកឃើញ:**
[បញ្ជីកន្លែងដែលលុយបាត់បង់ដែលអាចកាត់បន្ថយបាន]

💡 **ឱកាសសន្សំលុយ:**
• [ឱកាស ១ - ចំនួនលុយអាចសន្សំបាន]
• [ឱកាស ២ - ចំនួនលុយអាចសន្សំបាន]
• [ឱកាស ៣ - ចំនួនលុយអាចសន្សំបាន]

🇰🇭 **ជម្រើសកម្ពុជា:**
[ដំបូន្មានជាក់ស្តែងសម្រាប់ការរស់នៅកម្ពុជា]

📱 **កម្មវិធីកម្ពុជាមានប្រយោជន៍:**
[កម្មវិធី/សេវាកម្មក្នុងស្រុកដែលអាចជួយសន្សំ]

🎯 **ផែនការ 7 ថ្ងៃ:**
[សកម្មភាពជាក់ស្តែងអាចធ្វើបានក្នុង ៧ ថ្ងៃខាងមុខ]

ធ្វើឱ្យជាក់ស្តែងនិងអាចអនុវត្តបាន។`;

            const response = await this.anthropic.messages.create({
                model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
                max_tokens: 1200,
                system: this.getSystemPrompt('money_leak'),
                messages: [{ role: "user", content: prompt }]
            });

            if (response && response.content && response.content[0]) {
                const formattedResponse = this.formatClaudeResponse(response.content[0].text);
                
                return {
                    success: true,
                    source: 'claude_enhanced',
                    response: formattedResponse,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error('❌ Enhanced leak detection error:', error.message);
        }

        return this.getEnhancedLeaksFallback(expenses, income);
    }

    // Enhanced system prompts
    getSystemPrompt(type) {
        const prompts = {
            test: "អ្នកជាជំនួយការហិរញ្ញវត្ថុដ៏ឆ្លាតវៃសម្រាប់កម្ពុជា។ ឆ្លើយជាភាសាខ្មែរប្រកបដោយភាពរាក់ទាក់។",
            
            chat: `អ្នកជាគ្រូបង្រៀនហិរញ្ញវត្ថុជំនាញកម្រិតខ្ពស់សម្រាប់កម្មវិធី "7-Day Money Flow Reset™" ក្នុងប្រទេសកម្ពុជា។

តួនាទីរបស់អ្នក:
- ផ្តល់ដំបូន្មានហិរញ្ញវត្ថុជាក់ស្តែងសម្រាប់បរិបទកម្ពុជា
- ឆ្លើយជាភាសាខ្មែរយ៉ាងច្បាស់លាស់និងងាយយល់
- ផ្តោតលើការអនុវត្តជាក់ស្តែងនិងមានទម្រង់រៀបរយ
- រួមបញ្ចូលបរិបទស្រុក (USD/KHR, ABA/ACLEDA/Wing)
- លើកទឹកចិត្តនិងផ្តល់កម្លាំងចិត្ត
- កុំប្រើពាក្យ "Claude" ក្នុងចម្លើយ`,

            analysis: `អ្នកជាអ្នកវិភាគហិរញ្ញវត្ថុជំនាញការសម្រាប់ទីផ្សារកម្ពុជា។

ភាពជំនាញរបស់អ្នក:
- យល់ដឹងស៊ីជម្រៅអំពីប្រព័ន្ធធនាគារកម្ពុជា
- ការវិភាគលម្អិតអំពីគោលការណ៍ USD/KHR
- ផ្តល់ដំបូន្មានជាក់លាក់អាចអនុវត្តបាន
- ការវាយតម្លៃហានិភ័យហិរញ្ញវត្ថុ
- យុទ្ធសាស្ត្រសន្សំប្រាក់សម្រាប់គ្រួសារកម្ពុជា`,

            coaching: `អ្នកជា coach លើកទឹកចិត្តសម្រាប់កម្មវិធី "7-Day Money Flow Reset™"។

វិធីសាស្រ្តរបស់អ្នក:
- ការលើកទឹកចិត្តនិងការគាំទ្រ
- ការណែនាំជាក់ស្តែងជំហានម្តងមួយៗ
- ការយកចិត្តទុកដាក់ចំពោះតម្លៃកម្ពុជា
- ផ្តោតលើការកសាងទំនុកចិត្តនិងចំណេះដឹងហិរញ្ញវត្ថុ
- អបអរសាទរជោគជ័យតូចៗនិងវឌ្ឍនភាព`,

            money_leak: `អ្នកជាអ្នកស៊ើបអង្កេតហិរញ្ញវត្ថុជួយអ្នកប្រើប្រាស់កម្ពុជារកឃើញ money leaks។

ការផ្តោតរបស់អ្នក:
- ប្រភេទចំណាយទូទៅក្នុងកម្ពុជា
- សេវាកម្ម subscription និងការទូទាត់ប្រចាំ
- ចំណាយតូចប្រចាំថ្ងៃដែលកើនឡើង
- គំរូនៃការចំណាយប្រតិបត្តិការ
- ឱកាសសន្សំលុយជាក់ស្តែងសម្រាប់បរិបទកម្ពុជា`
        };

        return prompts[type] || prompts.chat;
    }

    // Response formatting
    formatClaudeResponse(rawResponse) {
        return rawResponse
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/^\s*[\*\-\+]\s+/gm, '• ') // Standardize bullet points
            .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
            .trim();
    }

    // Utility methods
    translateCategory(category) {
        const translations = {
            food: 'ម្ហូប',
            transport: 'ដឹកជញ្ជូន', 
            entertainment: 'កម្សាន្ត',
            subscriptions: 'សេវាកម្មប្រចាំ',
            utilities: 'ឆ្លាស់',
            shopping: 'ទិញឥវ៉ាន់',
            healthcare: 'សុខភាព',
            education: 'ការអប់រំ',
            other: 'ផ្សេងៗ'
        };
        return translations[category] || category;
    }

    countCompletedDays(progress) {
        if (!progress) return 0;
        let count = 0;
        for (let i = 1; i <= 7; i++) {
            if (progress[`day_${i}_completed`] || progress[`day${i}Completed`]) count++;
        }
        return count;
    }

    // Enhanced fallback responses with better formatting
    getEnhancedFallback(question, userContext = {}) {
        const questionLower = question.toLowerCase();
        
        if (questionLower.includes('សន្សំ') || questionLower.includes('save')) {
            return {
                success: true,
                source: 'enhanced_fallback',
                response: `🎯 **គន្លឹះសន្សំលុយពីជំនាញការ:**

💰 **ការចាប់ផ្តើមឆ្លាត:**
• សន្សំ 10% នៃចំណូលជាដំបូង
• បង្កើតម្ហូបអគារ 3-6 ខែ  
• កាត់បន្ថយចំណាយមិនចាំបាច់

📊 **វិធី 50/30/20 Rule:**
• 50% - ចំណាយចាំបាច់ (ម្ហូប, ផ្ទះ, ឆ្លាស់)
• 30% - ចំណាយកម្សាន្ត (ញ៉ាំលេង, ចូលរូប)
• 20% - សន្សំនិងវិនិយោគ

🏦 **ធនាគារកម្ពុជា:**
• ABA Bank - គណនីសន្សំការប្រាក់ល្អ
• ACLEDA - សេវាកម្មទូទាំងប្រទេស
• Wing - ងាយស្រួលនិងរហ័ស

📚 **ជំហានបន្ទាប់:**
• /day${userContext.currentDay || 1} - ចាប់ផ្តើម Money Flow Reset
• /coach - ការណែនាំផ្ទាល់ខ្លួន  
• @Chendasum - ការប្រឹក្សាផ្ទាល់`,
                timestamp: new Date().toISOString()
            };
        }

        if (questionLower.includes('រកលុយ') || questionLower.includes('ចំណូល') || questionLower.includes('income')) {
            return {
                success: true,
                source: 'enhanced_fallback',
                response: `🚀 **វិធីបង្កើនចំណូលក្នុងកម្ពុជា:**

💼 **ឱកាសធំៗ:**
• បង្រៀនភាសាអង់គ្លេស ($10-20/hour)
• Freelance Design/Content (Fiverr, Upwork)
• អាជីវកម្មអនឡាញ (Facebook Shop, TikTok)
• បកប្រែឯកសារ ($5-15/page)

📱 **Digital Opportunities:**
• YouTube Channel (Khmer Content)
• Instagram/TikTok Marketing  
• Online Course Creation
• E-commerce តាម Telegram/Facebook

💡 **ចាប់ផ្តើមតូច:**
• ប្រើជំនាញដែលមានស្រាប់
• ចាប់ផ្តើម 2-3 hours/day
• រកសម្រាប់ $100-300 បន្ថែម/ខែ

📚 **ជំហានបន្ទាប់:** /day${userContext.currentDay || 1} | 💬 **ជំនួយ:** @Chendasum`,
                timestamp: new Date().toISOString()
            };
        }

        return {
            success: true,
            source: 'enhanced_fallback',
            response: `🔮 **AI ជំនួយការហិរញ្ញវត្ថុ:**

សំណួរ: "${question}"

💡 **ការណែនាំទូទៅ:**
• កត់ត្រាចំណូល-ចំណាយប្រចាំថ្ងៃ
• កំណត់គោលដៅហិរញ្ញវត្ថុច្បាស់លាស់
• ប្រើកម្មវិធី 7-Day Money Flow Reset

📚 **ឧបករណ៍មានប្រយោជន៍:**
• /day1-7 - មេរៀនជំហានម្តងមួយៗ
• /analyze - ការវិភាគហិរញ្ញវត្ថុ
• /find_leaks - រកឃើញ Money Leaks

💬 **ជំនួយផ្ទាល់:** @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getEnhancedAnalysisFallback(userFinances, currentDay) {
        const income = userFinances.monthlyIncome || 1000;
        const expenses = userFinances.monthlyExpenses || 800;
        const savings = income - expenses;
        const rate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
        
        return {
            success: true,
            source: 'enhanced_fallback',
            response: `📊 **ការវិភាគហិរញ្ញវត្ថុថ្ងៃទី ${currentDay}:**

💰 **ទិន្នន័យបច្ចុប្បន្ន:**
• ចំណូលខែ: $${income.toLocaleString()} USD
• ចំណាយខែ: $${expenses.toLocaleString()} USD  
• សន្សំខែ: $${savings.toLocaleString()} USD
• អត្រាសន្សំ: ${rate}%

${rate > 15 ? '🌟 **ស្ថានភាពល្អ!** អត្រាសន្សំរបស់អ្នកគួរឱ្យកត់សម្គាល់' : 
  rate > 5 ? '⚡ **អាចកែលម្អបាន!** ព្យាយាមបង្កើនការសន្សំ' : 
  '🚨 **ត្រូវការកែលម្អ!** ចាំបាច់ត្រូវកាត់បន្ថយចំណាយ'}

🎯 **សកម្មភាពថ្ងៃទី ${currentDay}:**
• ពិនិត្យគណនីធនាគារ
• កត់ត្រាចំណាយ 3 ថ្ងៃចុងក្រោយ
• កំណត់គោលដៅសន្សំខែនេះ

📚 **រៀនបន្ថែម:** /day${currentDay} | 💬 **ជំនួយ:** @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    getEnhancedCoachingFallback(dayNumber, userProgress) {
        const completedDays = this.countCompletedDays(userProgress);
        const progressPercent = dayNumber > 0 ? Math.round((completedDays / dayNumber) * 100) : 0;
        
        const messages = {
            1: { focus: "ចាប់ផ្តើម Money Flow", tip: "កត់ត្រាចំណូល-ចំណាយ", action: "វាយតម្លៃស្ថានភាពបច្ចុប្បន្ន" },
            2: { focus: "រកឃើញ Money Leaks", tip: "ពិនិត្យ subscriptions", action: "រកកន្លែងលុយបាត់បង់" },
            3: { focus: "វាយតម្លៃប្រព័ន្ធ", tip: "ពិនិត្យតុល្យភាពធនាគារ", action: "បង្កើនប្រសិទ្ធភាពហិរញ្ញវត្ថុ" },
            4: { focus: "បង្កើតផែនទី", tip: "បង្កើតថវិកាខែ", action: "រៀបចំយុទ្ធសាស្រ្តហិរញ្ញវត្ថុ" },
            5: { focus: "យល់ពី Survival vs Growth", tip: "កំណត់គោលដៅរយៈពេលវែង", action: "ជ្រើសរើសយុទ្ធសាស្រ្តសមស្រប" },
            6: { focus: "បង្កើត Action Plan", tip: "ចាប់ផ្តើមអនុវត្តផែនការ", action: "អនុវត្តកម្មវិធីជាក់ស្តែង" },
            7: { focus: "Integration និងអបអរសាទរ", tip: "អបអរសាទរនិងបន្តទម្លាប់ល្អ", action: "បញ្ចប់និងផែនការអនាគត" }
        };
        
        const dayInfo = messages[dayNumber] || { focus: "បន្តការងារល្អ", tip: "អនុវត្តអ្វីដែលបានរៀន", action: "ធ្វើដំណើរបន្ត" };
        
        return {
            success: true,
            source: 'enhanced_fallback',
            response: `🎯 **AI Coach ថ្ងៃទី ${dayNumber}:**

🌟 **ការលើកទឹកចិត្ត:**
${completedDays === 0 ? 'ស្វាគមន៍ដល់ដំណើរថ្មី! អ្នកកំពុងធ្វើជំហានសំខាន់' :
  completedDays < dayNumber ? `អ្នកបានបញ្ចប់ ${completedDays} ថ្ងៃ! បន្តទៅមុខ 💪` :
  'អស្ចារ្យ! អ្នកកំពុងធ្វើបានល្អណាស់! 🏆'}

📈 **វឌ្ឍនភាព:** ${progressPercent}% បានបញ្ចប់

🎯 **ការផ្តោតថ្ងៃនេះ:**
${dayInfo.focus}

💡 **គន្លឹះពិសេស:**
${dayInfo.tip}

🚀 **សកម្មភាពធំ:**
${dayInfo.action}

🔥 **កម្រិតថាមពល:**
${progressPercent >= 80 ? 'ឆេះឆេះ! អ្នកជាអ្នកឈ្នះ! 🔥' :
  progressPercent >= 50 ? 'ល្អណាស់! បន្តទៅមុខ! ⚡' :
  'ចាប់ផ្តើមល្អហើយ! ទទួលបានកម្លាំង! 💪'}

📚 **ជំហានបន្ទាប់:**
• /day${dayNumber} - ចាប់ផ្តើមមេរៀនថ្ងៃនេះ
• /progress - ពិនិត្យវឌ្ឍនភាពលម្អិត
• @Chendasum - ជំនួយផ្ទាល់`,
            timestamp: new Date().toISOString()
        };
    }

    getEnhancedLeaksFallback(expenses, income) {
        const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
        const savingsRate = income > 0 ? ((income - totalExpenses) / income * 100).toFixed(1) : 0;
        
        // Find highest expense categories
        const sortedExpenses = Object.entries(expenses)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        return {
            success: true,
            source: 'enhanced_fallback',
            response: `🔍 **Money Leak Detection Analysis:**

💰 **ទិន្នន័យសរុប:**
• ចំណូល: ${income.toLocaleString()} USD
• ចំណាយសរុប: ${totalExpenses.toLocaleString()} USD
• អត្រាសន្សំ: ${savingsRate}%

🚨 **ចំណាយធំបំផុត:**
${sortedExpenses.map(([category, amount], index) => 
    `${index + 1}. ${this.translateCategory(category)}: ${amount.toLocaleString()}`
).join('\n')}

💡 **Money Leaks ទូទៅ:**
• Netflix/Spotify មិនប្រើ ($8-15/month)
• ម្ហូប delivery ញឹកញាប់ ($5-10/day)
• កាហ្វេ ប្រចាំថ្ងៃ ($2-3/day = $60-90/month)
• Impulse buying តាម social media

🇰🇭 **ដំបូន្មានកម្ពុជា:**
• ប្រើ ABA Pay/ACLEDA Mobile សម្រាប់ tracking
• ការទិញនៅផ្សារខ្មែរថោកជាង supermarket
• ប្រើ PassApp/Grab smart សម្រាប់ transport

🎯 **ឱកាសសន្សំ:**
• កាត់បន្ថយចំណាយធំបំផុត 20%
• Cancel subscriptions មិនប្រើ
• Plan ម្ហូបមុន (meal prep)

📱 **កម្មវិធីជំនួយ:**
• Wing Money - tracking ចំណាយ
• Smart Axiata - data package សន្សំ
• ACLEDA Mobile - វិភាគចំណាយ

📚 **ជំហានបន្ទាប់:** /day2 Money Leak Detection | 💬 **ជំនួយ:** @Chendasum`,
            timestamp: new Date().toISOString()
        };
    }

    // Status and debugging
    getStatus() {
        return {
            initialized: this.isInitialized,
            claude_available: this.claudeAvailable,
            model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
            features: [
                'enhanced_formatting',
                'khmer_responses', 
                'cambodia_context',
                'smart_fallbacks',
                'financial_analysis',
                'coaching_system',
                'money_leak_detection'
            ],
            version: 'enhanced_v2.0'
        };
    }

    // Test method for debugging
    async testConnection() {
        if (!this.claudeAvailable) {
            return {
                success: false,
                message: 'Claude API not available - using fallback mode',
                fallback_working: true
            };
        }

        try {
            const testResponse = await this.handleUserQuestion("តេស្ត", { currentDay: 1 });
            return {
                success: true,
                message: 'Claude connection working perfectly',
                response_preview: testResponse.response.substring(0, 100) + '...',
                source: testResponse.source
            };
        } catch (error) {
            return {
                success: false,
                message: 'Claude test failed',
                error: error.message,
                fallback_working: true
            };
        }
    }
}

module.exports = new EnhancedClaudeAIService();
