// 🤖 AI Integration Service for MONEY7DAYSRESET
// Connects your money flow bot to the IMPERIUM-VAULT-SYSTEM dual AI

const path = require('path');

// 🔧 SAFE AI SYSTEM CONNECTION
let aiSystem = null;
let aiAvailable = false;

try {
    // Try to connect to your dual AI system
    // Adjust this path to match your setup
    aiSystem = require('../../IMPERIUM-VAULT-SYSTEM/utils/dualAISystem');
    aiAvailable = true;
    console.log('✅ AI System connected to MONEY7DAYSRESET');
} catch (error) {
    console.log('⚠️ AI System not available, using fallback logic');
    console.log('Error:', error.message);
    aiAvailable = false;
}

class AIIntegrationService {
    constructor() {
        this.isAIAvailable = aiAvailable;
        this.fallbackMode = !aiAvailable;
    }

    // 🧠 GET SMART ALLOCATION RECOMMENDATIONS
    async getSmartAllocation(amount, riskLevel = 'moderate', userPreferences = {}) {
        if (!this.isAIAvailable) {
            return this.getFallbackAllocation(amount, riskLevel);
        }

        try {
            const prompt = `
MONEY FLOW ALLOCATION ANALYSIS:

Amount to allocate: $${amount.toLocaleString()}
Risk tolerance: ${riskLevel}
Current market analysis needed for 7-day money flow reset.

REQUIRED OUTPUT FORMAT:
{
    "stocks_percent": [number],
    "bonds_percent": [number], 
    "cash_percent": [number],
    "crypto_percent": [number],
    "stocks_amount": [dollar amount],
    "bonds_amount": [dollar amount],
    "cash_amount": [dollar amount],
    "crypto_amount": [dollar amount],
    "reasoning": "[explanation]",
    "risk_level": "[LOW/MODERATE/HIGH]",
    "confidence": [0-100]
}

Consider:
- Current market volatility
- Economic indicators
- Optimal risk-adjusted returns
- 7-day time horizon
- Market regime analysis

Provide specific dollar amounts and percentages for each asset class.
            `;

            const response = await aiSystem.getUniversalAnalysis(prompt, {
                maxTokens: 800,
                temperature: 0.3
            });

            return this.parseAIAllocation(response, amount);

        } catch (error) {
            console.error('AI allocation failed:', error.message);
            return this.getFallbackAllocation(amount, riskLevel);
        }
    }

    // 🎯 SHOULD WE EXECUTE RESET TODAY?
    async shouldExecuteReset(marketConditions, portfolioState) {
        if (!this.isAIAvailable) {
            return this.getFallbackResetDecision();
        }

        try {
            const prompt = `
MONEY FLOW RESET DECISION ANALYSIS:

Market Conditions: ${JSON.stringify(marketConditions)}
Portfolio State: ${JSON.stringify(portfolioState)}

Should we execute the 7-day money flow reset today?

REQUIRED OUTPUT FORMAT:
{
    "decision": "[YES/NO]",
    "confidence": [0-100],
    "reasoning": "[detailed explanation]",
    "wait_days": [number if NO],
    "risk_factors": ["factor1", "factor2"],
    "opportunities": ["opportunity1", "opportunity2"]
}

Consider:
- Market volatility and timing
- Economic events this week
- Portfolio performance
- Risk management
- Optimal entry points

Provide clear YES/NO decision with reasoning.
            `;

            const response = await aiSystem.getUniversalAnalysis(prompt, {
                maxTokens: 600,
                temperature: 0.2
            });

            return this.parseResetDecision(response);

        } catch (error) {
            console.error('AI reset decision failed:', error.message);
            return this.getFallbackResetDecision();
        }
    }

    // 📊 GET MARKET ANALYSIS FOR CONTEXT
    async getMarketAnalysis(context = {}) {
        if (!this.isAIAvailable) {
            return this.getFallbackMarketAnalysis();
        }

        try {
            const prompt = `
COMPREHENSIVE MARKET ANALYSIS FOR MONEY FLOW:

Context: ${JSON.stringify(context)}

Provide market analysis for money flow optimization:

REQUIRED OUTPUT FORMAT:
{
    "market_sentiment": "[BULLISH/BEARISH/NEUTRAL]",
    "volatility_level": "[LOW/MODERATE/HIGH]",
    "economic_regime": "[GROWTH/RECESSION/TRANSITION]",
    "key_risks": ["risk1", "risk2", "risk3"],
    "opportunities": ["opp1", "opp2", "opp3"],
    "asset_outlook": {
        "stocks": "[POSITIVE/NEGATIVE/NEUTRAL]",
        "bonds": "[POSITIVE/NEGATIVE/NEUTRAL]",
        "crypto": "[POSITIVE/NEGATIVE/NEUTRAL]",
        "cash": "[POSITIVE/NEGATIVE/NEUTRAL]"
    },
    "recommendation": "[detailed strategy]",
    "timeframe": "[SHORT/MEDIUM/LONG]"
}

Focus on 7-day money flow implications and optimal positioning.
            `;

            const response = await aiSystem.getDualAnalysis(prompt, {
                maxTokens: 1000,
                temperature: 0.4
            });

            return this.parseMarketAnalysis(response);

        } catch (error) {
            console.error('AI market analysis failed:', error.message);
            return this.getFallbackMarketAnalysis();
        }
    }

    // 💰 OPTIMIZE EXISTING ALLOCATION
    async optimizeAllocation(currentAllocation, performance, market) {
        if (!this.isAIAvailable) {
            return this.getFallbackOptimization(currentAllocation);
        }

        try {
            const prompt = `
ALLOCATION OPTIMIZATION ANALYSIS:

Current Allocation: ${JSON.stringify(currentAllocation)}
Performance: ${JSON.stringify(performance)}
Market Conditions: ${JSON.stringify(market)}

Optimize this allocation for better risk-adjusted returns:

REQUIRED OUTPUT FORMAT:
{
    "optimized_allocation": {
        "stocks_percent": [number],
        "bonds_percent": [number],
        "cash_percent": [number],
        "crypto_percent": [number]
    },
    "changes_needed": [
        {"from": "asset", "to": "asset", "amount": [number], "reason": "explanation"}
    ],
    "expected_improvement": "[percentage]",
    "risk_reduction": "[percentage]",
    "reasoning": "[detailed explanation]",
    "implementation_priority": "[HIGH/MEDIUM/LOW]"
}

Focus on practical improvements for 7-day money flow cycles.
            `;

            const response = await aiSystem.getUniversalAnalysis(prompt, {
                maxTokens: 800,
                temperature: 0.3
            });

            return this.parseOptimization(response);

        } catch (error) {
            console.error('AI optimization failed:', error.message);
            return this.getFallbackOptimization(currentAllocation);
        }
    }

    // 🔧 FALLBACK FUNCTIONS (when AI unavailable)
    getFallbackAllocation(amount, riskLevel) {
        console.log('🔄 Using fallback allocation logic');
        
        let allocation;
        switch (riskLevel.toLowerCase()) {
            case 'conservative':
                allocation = { stocks: 0.3, bonds: 0.6, cash: 0.1, crypto: 0.0 };
                break;
            case 'aggressive':
                allocation = { stocks: 0.7, bonds: 0.2, cash: 0.05, crypto: 0.05 };
                break;
            default: // moderate
                allocation = { stocks: 0.5, bonds: 0.4, cash: 0.08, crypto: 0.02 };
        }

        return {
            stocks_percent: allocation.stocks * 100,
            bonds_percent: allocation.bonds * 100,
            cash_percent: allocation.cash * 100,
            crypto_percent: allocation.crypto * 100,
            stocks_amount: amount * allocation.stocks,
            bonds_amount: amount * allocation.bonds,
            cash_amount: amount * allocation.cash,
            crypto_amount: amount * allocation.crypto,
            reasoning: `Fallback allocation for ${riskLevel} risk profile`,
            risk_level: riskLevel.toUpperCase(),
            confidence: 70,
            ai_used: false
        };
    }

    getFallbackResetDecision() {
        return {
            decision: 'YES',
            confidence: 75,
            reasoning: 'Fallback logic: proceeding with standard 7-day reset',
            wait_days: 0,
            risk_factors: ['AI system unavailable'],
            opportunities: ['Maintaining regular flow schedule'],
            ai_used: false
        };
    }

    getFallbackMarketAnalysis() {
        return {
            market_sentiment: 'NEUTRAL',
            volatility_level: 'MODERATE',
            economic_regime: 'TRANSITION',
            key_risks: ['AI system unavailable', 'Limited market insight'],
            opportunities: ['Consistent allocation strategy'],
            asset_outlook: {
                stocks: 'NEUTRAL',
                bonds: 'NEUTRAL', 
                crypto: 'NEUTRAL',
                cash: 'POSITIVE'
            },
            recommendation: 'Proceed with conservative balanced allocation',
            timeframe: 'SHORT',
            ai_used: false
        };
    }

    getFallbackOptimization(currentAllocation) {
        return {
            optimized_allocation: currentAllocation,
            changes_needed: [],
            expected_improvement: '0%',
            risk_reduction: '0%',
            reasoning: 'AI optimization unavailable, maintaining current allocation',
            implementation_priority: 'LOW',
            ai_used: false
        };
    }

    // 🔧 AI RESPONSE PARSING METHODS
    parseAIAllocation(response, totalAmount) {
        try {
            // Try to extract JSON from AI response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { ...parsed, ai_used: true };
            }

            // Fallback parsing for non-JSON responses
            return this.parseTextAllocation(response, totalAmount);

        } catch (error) {
            console.warn('AI response parsing failed:', error.message);
            return this.getFallbackAllocation(totalAmount, 'moderate');
        }
    }

    parseTextAllocation(text, totalAmount) {
        // Extract percentages from text
        const stocksMatch = text.match(/stocks?[:\s]*(\d+)%/i);
        const bondsMatch = text.match(/bonds?[:\s]*(\d+)%/i);
        const cashMatch = text.match(/cash[:\s]*(\d+)%/i);
        const cryptoMatch = text.match(/crypto[:\s]*(\d+)%/i);

        const stocks = stocksMatch ? parseInt(stocksMatch[1]) : 50;
        const bonds = bondsMatch ? parseInt(bondsMatch[1]) : 40;
        const cash = cashMatch ? parseInt(cashMatch[1]) : 8;
        const crypto = cryptoMatch ? parseInt(cryptoMatch[1]) : 2;

        return {
            stocks_percent: stocks,
            bonds_percent: bonds,
            cash_percent: cash,
            crypto_percent: crypto,
            stocks_amount: totalAmount * (stocks / 100),
            bonds_amount: totalAmount * (bonds / 100),
            cash_amount: totalAmount * (cash / 100),
            crypto_amount: totalAmount * (crypto / 100),
            reasoning: 'Parsed from AI text response',
            risk_level: 'MODERATE',
            confidence: 80,
            ai_used: true
        };
    }

    parseResetDecision(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { ...JSON.parse(jsonMatch[0]), ai_used: true };
            }

            // Simple text parsing
            const decision = response.toLowerCase().includes('yes') ? 'YES' : 'NO';
            return {
                decision: decision,
                confidence: 80,
                reasoning: response.substring(0, 200),
                wait_days: decision === 'NO' ? 1 : 0,
                risk_factors: [],
                opportunities: [],
                ai_used: true
            };

        } catch (error) {
            return this.getFallbackResetDecision();
        }
    }

    parseMarketAnalysis(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { ...JSON.parse(jsonMatch[0]), ai_used: true };
            }

            return { ...this.getFallbackMarketAnalysis(), reasoning: response, ai_used: true };

        } catch (error) {
            return this.getFallbackMarketAnalysis();
        }
    }

    parseOptimization(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { ...JSON.parse(jsonMatch[0]), ai_used: true };
            }

            return { ...this.getFallbackOptimization({}), reasoning: response, ai_used: true };

        } catch (error) {
            return this.getFallbackOptimization({});
        }
    }

    // 🔍 SYSTEM STATUS
    getStatus() {
        return {
            ai_available: this.isAIAvailable,
            fallback_mode: this.fallbackMode,
            system_version: '1.0.0',
            last_check: new Date().toISOString()
        };
    }

    // 🧪 TEST AI CONNECTION
    async testConnection() {
        if (!this.isAIAvailable) {
            return { success: false, message: 'AI system not available' };
        }

        try {
            const response = await aiSystem.getUniversalAnalysis('Test connection', { maxTokens: 50 });
            return { 
                success: true, 
                message: 'AI connection successful',
                response: response.substring(0, 100)
            };
        } catch (error) {
            return { 
                success: false, 
                message: 'AI connection failed: ' + error.message 
            };
        }
    }
}

// Export singleton instance
module.exports = new AIIntegrationService();
