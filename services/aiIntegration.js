// 🤖 Enhanced AI Integration Service for MONEY7DAYSRESET
// Connects your money flow bot to the IMPERIUM-VAULT-SYSTEM dual AI

const path = require('path');

// 🔧 ENHANCED AI SYSTEM CONNECTION
let dualAISystem = null;
let claudeClient = null;
let openaiClient = null;
let cashFlowOptimizer = null;
let portfolioOptimizer = null;
let riskManager = null;
let wealthTracker = null;
let aiAvailable = false;

try {
    // Connect to your IMPERIUM-VAULT-SYSTEM modules
    const basePath = '../../IMPERIUM-VAULT-SYSTEM/utils';
    
    dualAISystem = require(path.join(basePath, 'dualAISystem'));
    claudeClient = require(path.join(basePath, 'claudeClient'));
    openaiClient = require(path.join(basePath, 'openaiClient'));
    cashFlowOptimizer = require(path.join(basePath, 'cashFlowOptimizer'));
    portfolioOptimizer = require(path.join(basePath, 'portfolioOptimizer'));
    riskManager = require(path.join(basePath, 'riskManager'));
    wealthTracker = require(path.join(basePath, 'wealthTracker'));
    
    aiAvailable = true;
    console.log('✅ IMPERIUM-VAULT-SYSTEM connected to MONEY7DAYSRESET');
    console.log('🔗 Available modules:', {
        dualAI: !!dualAISystem,
        claude: !!claudeClient,
        openai: !!openaiClient,
        cashFlow: !!cashFlowOptimizer,
        portfolio: !!portfolioOptimizer,
        risk: !!riskManager,
        wealth: !!wealthTracker
    });
} catch (error) {
    console.log('⚠️ IMPERIUM-VAULT-SYSTEM not available, using fallback logic');
    console.log('Error:', error.message);
    aiAvailable = false;
}

class EnhancedAIIntegrationService {
    constructor() {
        this.isAIAvailable = aiAvailable;
        this.fallbackMode = !aiAvailable;
        this.modules = {
            dualAI: dualAISystem,
            claude: claudeClient,
            openai: openaiClient,
            cashFlow: cashFlowOptimizer,
            portfolio: portfolioOptimizer,
            risk: riskManager,
            wealth: wealthTracker
        };
    }

    // 🧠 SMART MONEY FLOW ANALYSIS FOR 7-DAY PROGRAM
    async analyzeDayProgress(userId, dayNumber, userInput) {
        if (!this.isAIAvailable) {
            return this.getFallbackDayAnalysis(dayNumber, userInput);
        }

        try {
            const prompt = `
7-DAY MONEY FLOW RESET™ - DAY ${dayNumber} ANALYSIS:

User Input: "${userInput}"
Current Day: ${dayNumber}
Program Context: Cambodia financial coaching in Khmer language

Analyze this user's progress and provide:
1. Personalized feedback on their day ${dayNumber} work
2. Specific actionable advice for improvement
3. Encouragement in Khmer language style
4. Next steps preparation

REQUIRED OUTPUT FORMAT:
{
    "feedback": "[personalized feedback in English]",
    "khmer_encouragement": "[motivational message in Khmer]",
    "actionable_advice": ["tip1", "tip2", "tip3"],
    "money_insights": "[specific money flow insights]",
    "next_day_prep": "[preparation advice]",
    "confidence_score": [0-100]
}

Focus on practical Cambodia context and money management.
            `;

            const response = await this.modules.dualAI.getUniversalAnalysis(prompt, {
                maxTokens: 800,
                temperature: 0.3
            });

            return this.parseDayAnalysis(response, dayNumber);

        } catch (error) {
            console.error('AI day analysis failed:', error.message);
            return this.getFallbackDayAnalysis(dayNumber, userInput);
        }
    }

    // 💰 SMART MONEY ALLOCATION FOR CAMBODIAN CONTEXT
    async getSmartAllocation(amount, userProfile = {}) {
        if (!this.isAIAvailable) {
            return this.getFallbackAllocation(amount, 'moderate');
        }

        try {
            const prompt = `
CAMBODIAN MONEY FLOW ALLOCATION:

Amount: $${amount}
User Profile: ${JSON.stringify(userProfile)}
Context: Cambodia financial management, local market conditions

Provide allocation considering:
- Cambodia banking system (ABA, ACLEDA)
- Local investment opportunities
- Risk tolerance for Cambodia context
- Currency stability factors

REQUIRED OUTPUT FORMAT:
{
    "local_savings_percent": [number],
    "usd_savings_percent": [number], 
    "emergency_fund_percent": [number],
    "investment_percent": [number],
    "local_savings_amount": [dollar amount],
    "usd_savings_amount": [dollar amount],
    "emergency_fund_amount": [dollar amount],
    "investment_amount": [dollar amount],
    "reasoning": "[Cambodia-specific explanation]",
    "risk_level": "[LOW/MODERATE/HIGH]",
    "cambodia_tips": ["tip1", "tip2", "tip3"],
    "confidence": [0-100]
}

Consider Cambodia inflation, USD vs KHR, local opportunities.
            `;

            const response = await this.modules.cashFlow ? 
                await this.modules.cashFlow.optimizeCashFlow(prompt) :
                await this.modules.dualAI.getUniversalAnalysis(prompt, {
                    maxTokens: 800,
                    temperature: 0.3
                });

            return this.parseAllocation(response, amount);

        } catch (error) {
            console.error('AI allocation failed:', error.message);
            return this.getFallbackAllocation(amount, 'moderate');
        }
    }

    // 🎯 PERSONALIZED MONEY COACHING
    async getPersonalizedCoaching(userId, currentProgress, userGoals) {
        if (!this.isAIAvailable) {
            return this.getFallbackCoaching(currentProgress);
        }

        try {
            const prompt = `
PERSONALIZED MONEY COACHING - 7-DAY PROGRAM:

User Progress: ${JSON.stringify(currentProgress)}
User Goals: ${JSON.stringify(userGoals)}
Context: Cambodia money management coaching

Provide personalized coaching that includes:
1. Assessment of current progress
2. Specific advice for their situation
3. Cambodia-relevant examples
4. Motivation in appropriate tone

REQUIRED OUTPUT FORMAT:
{
    "progress_assessment": "[honest assessment]",
    "specific_advice": ["advice1", "advice2", "advice3"],
    "cambodia_examples": ["example1", "example2"],
    "motivation_message": "[encouraging message]",
    "next_focus_areas": ["area1", "area2"],
    "success_probability": [0-100]
}

Keep advice practical and Cambodia-relevant.
            `;

            const response = await this.modules.dualAI.getUniversalAnalysis(prompt, {
                maxTokens: 1000,
                temperature: 0.4
            });

            return this.parseCoaching(response);

        } catch (error) {
            console.error('AI coaching failed:', error.message);
            return this.getFallbackCoaching(currentProgress);
        }
    }

    // 📊 PORTFOLIO ANALYSIS FOR VIP USERS
    async analyzePortfolio(userId, portfolioData, goals) {
        if (!this.isAIAvailable || !this.modules.portfolio) {
            return this.getFallbackPortfolioAnalysis();
        }

        try {
            const analysis = await this.modules.portfolio.analyzePortfolio({
                ...portfolioData,
                userId,
                goals,
                context: 'Cambodia VIP Capital Strategy'
            });

            return {
                analysis: analysis,
                recommendations: await this.getPortfolioRecommendations(analysis),
                cambodia_context: this.getCambodiaPortfolioTips(),
                ai_used: true
            };

        } catch (error) {
            console.error('Portfolio analysis failed:', error.message);
            return this.getFallbackPortfolioAnalysis();
        }
    }

    // 🚨 RISK ASSESSMENT FOR MONEY DECISIONS
    async assessRisk(decision, amount, userProfile) {
        if (!this.isAIAvailable || !this.modules.risk) {
            return this.getFallbackRiskAssessment();
        }

        try {
            const riskAnalysis = await this.modules.risk.assessRisk({
                decision,
                amount,
                userProfile,
                context: 'Cambodia financial decision'
            });

            return {
                risk_level: riskAnalysis.riskLevel,
                risk_factors: riskAnalysis.factors,
                mitigation_strategies: riskAnalysis.mitigation,
                cambodia_considerations: this.getCambodiaRiskFactors(),
                recommendation: riskAnalysis.recommendation,
                ai_used: true
            };

        } catch (error) {
            console.error('Risk assessment failed:', error.message);
            return this.getFallbackRiskAssessment();
        }
    }

    // 💎 WEALTH TRACKING FOR PREMIUM/VIP
    async trackWealth(userId, wealthData) {
        if (!this.isAIAvailable || !this.modules.wealth) {
            return this.getFallbackWealthTracking();
        }

        try {
            const tracking = await this.modules.wealth.trackWealth({
                userId,
                ...wealthData,
                context: 'Cambodia wealth building'
            });

            return {
                current_status: tracking.status,
                growth_analysis: tracking.growth,
                projections: tracking.projections,
                cambodia_opportunities: this.getCambodiaWealthTips(),
                ai_insights: tracking.insights,
                ai_used: true
            };

        } catch (error) {
            console.error('Wealth tracking failed:', error.message);
            return this.getFallbackWealthTracking();
        }
    }

    // 🔧 PARSING METHODS
    parseDayAnalysis(response, dayNumber) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { ...parsed, ai_used: true, day: dayNumber };
            }

            return this.parseTextDayAnalysis(response, dayNumber);

        } catch (error) {
            console.warn('Day analysis parsing failed:', error.message);
            return this.getFallbackDayAnalysis(dayNumber, '');
        }
    }

    parseAllocation(response, totalAmount) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { ...parsed, ai_used: true, total_amount: totalAmount };
            }

            return this.parseTextAllocation(response, totalAmount);

        } catch (error) {
            console.warn('Allocation parsing failed:', error.message);
            return this.getFallbackAllocation(totalAmount, 'moderate');
        }
    }

    parseCoaching(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { ...JSON.parse(jsonMatch[0]), ai_used: true };
            }

            return { 
                progress_assessment: response.substring(0, 200),
                specific_advice: ['Follow program daily', 'Track expenses', 'Ask questions'],
                motivation_message: 'Continue your great progress!',
                ai_used: true 
            };

        } catch (error) {
            return this.getFallbackCoaching({});
        }
    }

    // 🔧 FALLBACK METHODS (when AI unavailable)
    getFallbackDayAnalysis(dayNumber, userInput) {
        const dayMessages = {
            1: 'Great start! Focus on understanding your money flow patterns.',
            2: 'Good progress! Look for those money leaks we discussed.',
            3: 'Excellent work! Your system evaluation will reveal key insights.',
            4: 'Fantastic! Income mapping is crucial for success.',
            5: 'Amazing progress! Balance is the key to financial growth.',
            6: 'Outstanding! Your action plan will drive real results.',
            7: 'Congratulations! You\'ve mastered the money flow system!'
        };

        return {
            feedback: dayMessages[dayNumber] || 'Keep up the excellent work!',
            khmer_encouragement: 'អ្នកកំពុងធ្វើបានល្អ! បន្តទៅ! 💪',
            actionable_advice: [
                'Review today\'s lesson carefully',
                'Complete all exercises',
                'Apply what you learned immediately'
            ],
            money_insights: 'Focus on practical application of today\'s concepts',
            next_day_prep: 'Prepare for tomorrow\'s lesson by reviewing notes',
            confidence_score: 75,
            ai_used: false
        };
    }

    getFallbackAllocation(amount, riskLevel) {
        const allocations = {
            conservative: { local: 40, usd: 30, emergency: 25, investment: 5 },
            moderate: { local: 30, usd: 35, emergency: 20, investment: 15 },
            aggressive: { local: 20, usd: 30, emergency: 15, investment: 35 }
        };

        const allocation = allocations[riskLevel] || allocations.moderate;

        return {
            local_savings_percent: allocation.local,
            usd_savings_percent: allocation.usd,
            emergency_fund_percent: allocation.emergency,
            investment_percent: allocation.investment,
            local_savings_amount: amount * (allocation.local / 100),
            usd_savings_amount: amount * (allocation.usd / 100),
            emergency_fund_amount: amount * (allocation.emergency / 100),
            investment_amount: amount * (allocation.investment / 100),
            reasoning: `Fallback ${riskLevel} allocation for Cambodia context`,
            risk_level: riskLevel.toUpperCase(),
            cambodia_tips: [
                'Use ABA/ACLEDA for local savings',
                'Keep some USD for stability',
                'Build emergency fund first'
            ],
            confidence: 70,
            ai_used: false
        };
    }

    getFallbackCoaching(progress) {
        return {
            progress_assessment: 'You are making steady progress through the program',
            specific_advice: [
                'Continue following the daily lessons',
                'Apply the concepts to your real situation',
                'Ask questions when you need help'
            ],
            cambodia_examples: [
                'Like saving for Pchum Ben expenses',
                'Planning for seasonal business income'
            ],
            motivation_message: 'Your dedication to improving your finances will pay off!',
            next_focus_areas: ['Daily tracking', 'Expense reduction'],
            success_probability: 80,
            ai_used: false
        };
    }

    getFallbackPortfolioAnalysis() {
        return {
            analysis: 'Basic portfolio review completed',
            recommendations: ['Diversify investments', 'Review risk tolerance'],
            cambodia_context: ['Consider local market conditions', 'Currency diversification'],
            ai_used: false
        };
    }

    getFallbackRiskAssessment() {
        return {
            risk_level: 'MODERATE',
            risk_factors: ['Market volatility', 'Currency fluctuation'],
            mitigation_strategies: ['Diversification', 'Emergency fund'],
            cambodia_considerations: ['USD/KHR exchange rates', 'Local economic factors'],
            recommendation: 'Proceed with caution and proper planning',
            ai_used: false
        };
    }

    getFallbackWealthTracking() {
        return {
            current_status: 'Building wealth steadily',
            growth_analysis: 'Positive trajectory with room for improvement',
            projections: 'Continue current strategy for steady growth',
            cambodia_opportunities: ['Real estate', 'Local business investment'],
            ai_insights: ['Stay consistent', 'Monitor progress monthly'],
            ai_used: false
        };
    }

    // 🇰🇭 CAMBODIA-SPECIFIC HELPERS
    getCambodiaPortfolioTips() {
        return [
            'Consider Cambodia real estate opportunities',
            'Diversify between USD and KHR assets',
            'Look into ASEAN market opportunities',
            'Keep emergency fund in stable currency'
        ];
    }

    getCambodiaRiskFactors() {
        return [
            'Currency exchange rate volatility',
            'Seasonal business income variations',
            'Political stability considerations',
            'Regional economic developments'
        ];
    }

    getCambodiaWealthTips() {
        return [
            'Property investment in growing areas',
            'Small business opportunities',
            'Education and skill development',
            'Network building for opportunities'
        ];
    }

    // 🔍 SYSTEM STATUS AND TESTING
    getStatus() {
        return {
            ai_available: this.isAIAvailable,
            fallback_mode: this.fallbackMode,
            connected_modules: Object.keys(this.modules).filter(key => !!this.modules[key]),
            system_version: '2.0.0',
            last_check: new Date().toISOString()
        };
    }

    async testConnection() {
        if (!this.isAIAvailable) {
            return { success: false, message: 'IMPERIUM-VAULT-SYSTEM not available' };
        }

        try {
            const response = await this.modules.dualAI.getUniversalAnalysis('Test connection for MONEY7DAYSRESET integration', { maxTokens: 50 });
            return { 
                success: true, 
                message: 'IMPERIUM-VAULT-SYSTEM connection successful',
                response: response.substring(0, 100)
            };
        } catch (error) {
            return { 
                success: false, 
                message: 'Connection test failed: ' + error.message 
            };
        }
    }
}

// Export singleton instance
module.exports = new EnhancedAIIntegrationService();
