// 🛠️ AI Helper Utilities for MONEY7DAYSRESET
// Utility functions for AI integration, parsing, and validation

class AIHelper {
    
    // 🔍 VALIDATE AI ALLOCATION RESPONSE
    static validateAllocation(allocation, totalAmount) {
        try {
            // Check required fields
            const requiredFields = ['stocks_percent', 'bonds_percent', 'cash_percent', 'crypto_percent'];
            for (const field of requiredFields) {
                if (typeof allocation[field] !== 'number') {
                    throw new Error(`Missing or invalid ${field}`);
                }
            }

            // Check percentages add up to 100 (with tolerance)
            const totalPercent = allocation.stocks_percent + allocation.bonds_percent + 
                               allocation.cash_percent + allocation.crypto_percent;
            
            if (Math.abs(totalPercent - 100) > 5) { // 5% tolerance
                console.warn(`Allocation percentages don't add to 100%: ${totalPercent}%`);
                return this.normalizeAllocation(allocation, totalAmount);
            }

            // Check amounts match percentages
            const expectedStocks = totalAmount * (allocation.stocks_percent / 100);
            if (Math.abs(allocation.stocks_amount - expectedStocks) > 10) {
                allocation.stocks_amount = expectedStocks;
                allocation.bonds_amount = totalAmount * (allocation.bonds_percent / 100);
                allocation.cash_amount = totalAmount * (allocation.cash_percent / 100);
                allocation.crypto_amount = totalAmount * (allocation.crypto_percent / 100);
            }

            return { valid: true, allocation: allocation };

        } catch (error) {
            console.error('Allocation validation failed:', error.message);
            return { 
                valid: false, 
                error: error.message,
                allocation: this.getEmergencyAllocation(totalAmount)
            };
        }
    }

    // 🔧 NORMALIZE ALLOCATION PERCENTAGES
    static normalizeAllocation(allocation, totalAmount) {
        console.log('🔧 Normalizing allocation percentages...');
        
        const totalPercent = allocation.stocks_percent + allocation.bonds_percent + 
                           allocation.cash_percent + allocation.crypto_percent;
        
        if (totalPercent === 0) {
            return this.getEmergencyAllocation(totalAmount);
        }

        // Normalize to 100%
        const factor = 100 / totalPercent;
        
        const normalized = {
            stocks_percent: Math.round(allocation.stocks_percent * factor),
            bonds_percent: Math.round(allocation.bonds_percent * factor),
            cash_percent: Math.round(allocation.cash_percent * factor),
            crypto_percent: Math.round(allocation.crypto_percent * factor)
        };

        // Recalculate amounts
        normalized.stocks_amount = totalAmount * (normalized.stocks_percent / 100);
        normalized.bonds_amount = totalAmount * (normalized.bonds_percent / 100);
        normalized.cash_amount = totalAmount * (normalized.cash_percent / 100);
        normalized.crypto_amount = totalAmount * (normalized.crypto_percent / 100);

        return { ...allocation, ...normalized };
    }

    // 🚨 EMERGENCY SAFE ALLOCATION
    static getEmergencyAllocation(totalAmount) {
        console.log('🚨 Using emergency safe allocation');
        
        return {
            stocks_percent: 40,
            bonds_percent: 50,
            cash_percent: 10,
            crypto_percent: 0,
            stocks_amount: totalAmount * 0.40,
            bonds_amount: totalAmount * 0.50,
            cash_amount: totalAmount * 0.10,
            crypto_amount: 0,
            reasoning: 'Emergency safe allocation due to AI parsing failure',
            risk_level: 'CONSERVATIVE',
            confidence: 60,
            emergency_mode: true
        };
    }

    // 📊 PARSE ALLOCATION FROM AI TEXT
    static parseAllocationFromText(text, totalAmount) {
        try {
            console.log('📊 Parsing allocation from AI text...');
            
            // Multiple parsing strategies
            let allocation = {};

            // Strategy 1: Look for JSON in response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    allocation = JSON.parse(jsonMatch[0]);
                    if (allocation.stocks_percent) {
                        return this.validateAllocation(allocation, totalAmount);
                    }
                } catch (e) {
                    console.log('JSON parsing failed, trying text extraction');
                }
            }

            // Strategy 2: Extract percentages from text
            allocation = this.extractPercentagesFromText(text);
            
            // Strategy 3: Look for dollar amounts
            if (!allocation.stocks_percent) {
                allocation = this.extractAmountsFromText(text, totalAmount);
            }

            return this.validateAllocation(allocation, totalAmount);

        } catch (error) {
            console.error('Text parsing failed:', error.message);
            return { 
                valid: false, 
                allocation: this.getEmergencyAllocation(totalAmount),
                error: error.message
            };
        }
    }

    // 🔍 EXTRACT PERCENTAGES FROM TEXT
    static extractPercentagesFromText(text) {
        const patterns = {
            stocks: /(?:stocks?|equity|equities)[:\s]*(\d+(?:\.\d+)?)%/i,
            bonds: /(?:bonds?|fixed\s+income)[:\s]*(\d+(?:\.\d+)?)%/i,
            cash: /(?:cash|money\s+market)[:\s]*(\d+(?:\.\d+)?)%/i,
            crypto: /(?:crypto|bitcoin|cryptocurrency)[:\s]*(\d+(?:\.\d+)?)%/i
        };

        const allocation = {};
        
        for (const [asset, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            allocation[`${asset}_percent`] = match ? parseFloat(match[1]) : 0;
        }

        return allocation;
    }

    // 💰 EXTRACT DOLLAR AMOUNTS FROM TEXT
    static extractAmountsFromText(text, totalAmount) {
        const patterns = {
            stocks: /(?:stocks?|equity)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
            bonds: /(?:bonds?|fixed\s+income)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
            cash: /(?:cash|money\s+market)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
            crypto: /(?:crypto|bitcoin)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
        };

        const allocation = {};
        
        for (const [asset, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            const amount = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
            allocation[`${asset}_amount`] = amount;
            allocation[`${asset}_percent`] = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        }

        return allocation;
    }

    // ✅ VALIDATE RESET DECISION
    static validateResetDecision(decision) {
        try {
            // Ensure required fields
            if (!decision.decision || !['YES', 'NO'].includes(decision.decision.toUpperCase())) {
                decision.decision = 'YES'; // Default to proceed
            }

            decision.confidence = Math.max(0, Math.min(100, decision.confidence || 70));
            decision.wait_days = Math.max(0, decision.wait_days || 0);
            decision.reasoning = decision.reasoning || 'AI decision validation applied';

            return { valid: true, decision: decision };

        } catch (error) {
            return {
                valid: false,
                decision: {
                    decision: 'YES',
                    confidence: 50,
                    reasoning: 'Fallback decision due to validation error',
                    wait_days: 0,
                    risk_factors: ['Validation error'],
                    opportunities: []
                }
            };
        }
    }

    // 🎯 CALCULATE ALLOCATION CHANGES
    static calculateAllocationChanges(currentAllocation, newAllocation, totalAmount) {
        const changes = [];
        const assets = ['stocks', 'bonds', 'cash', 'crypto'];

        for (const asset of assets) {
            const currentAmount = currentAllocation[`${asset}_amount`] || 0;
            const newAmount = newAllocation[`${asset}_amount`] || 0;
            const difference = newAmount - currentAmount;

            if (Math.abs(difference) > 10) { // Only significant changes
                changes.push({
                    asset: asset,
                    current_amount: currentAmount,
                    new_amount: newAmount,
                    change_amount: difference,
                    change_percent: currentAmount > 0 ? (difference / currentAmount) * 100 : 0,
                    action: difference > 0 ? 'BUY' : 'SELL'
                });
            }
        }

        return changes;
    }

    // 📈 CALCULATE RISK SCORE
    static calculateRiskScore(allocation) {
        try {
            // Risk weights (higher = more risky)
            const riskWeights = {
                stocks: 1.0,
                crypto: 1.5,
                bonds: 0.3,
                cash: 0.0
            };

            let totalRisk = 0;
            let totalWeight = 0;

            for (const [asset, weight] of Object.entries(riskWeights)) {
                const percent = allocation[`${asset}_percent`] || 0;
                totalRisk += (percent / 100) * weight;
                totalWeight += percent / 100;
            }

            const riskScore = totalWeight > 0 ? (totalRisk / totalWeight) * 100 : 50;
            
            let riskLevel = 'MODERATE';
            if (riskScore < 30) riskLevel = 'LOW';
            else if (riskScore > 70) riskLevel = 'HIGH';

            return {
                risk_score: Math.round(riskScore),
                risk_level: riskLevel,
                explanation: `Portfolio risk score based on asset allocation weighting`
            };

        } catch (error) {
            return {
                risk_score: 50,
                risk_level: 'MODERATE',
                explanation: 'Default risk assessment due to calculation error'
            };
        }
    }

    // 🔧 SANITIZE AI RESPONSE
    static sanitizeAIResponse(response) {
        if (!response || typeof response !== 'string') {
            return 'Invalid AI response';
        }

        return response
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
            .substring(0, 2000); // Limit length
    }

    // 📝 FORMAT ALLOCATION FOR DISPLAY
    static formatAllocationDisplay(allocation) {
        const formatted = {
            summary: {
                stocks: `${allocation.stocks_percent || 0}% ($${(allocation.stocks_amount || 0).toLocaleString()})`,
                bonds: `${allocation.bonds_percent || 0}% ($${(allocation.bonds_amount || 0).toLocaleString()})`,
                cash: `${allocation.cash_percent || 0}% ($${(allocation.cash_amount || 0).toLocaleString()})`,
                crypto: `${allocation.crypto_percent || 0}% ($${(allocation.crypto_amount || 0).toLocaleString()})`
            },
            total_amount: (allocation.stocks_amount + allocation.bonds_amount + 
                          allocation.cash_amount + allocation.crypto_amount).toLocaleString(),
            risk_info: this.calculateRiskScore(allocation),
            ai_confidence: allocation.confidence || 'Unknown',
            reasoning: allocation.reasoning || 'No reasoning provided'
        };

        return formatted;
    }

    // 🕐 CHECK IF MARKET HOURS
    static isMarketHours() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getHours();

        // Simple check: Monday-Friday, 9 AM - 4 PM EST
        const isWeekday = day >= 1 && day <= 5;
        const isBusinessHours = hour >= 9 && hour <= 16;

        return {
            is_market_hours: isWeekday && isBusinessHours,
            current_time: now.toLocaleString(),
            next_open: !isWeekday ? 'Monday 9 AM' : !isBusinessHours ? 'Next business day 9 AM' : 'Currently open'
        };
    }

    // 🧪 TEST AI RESPONSE PARSING
    static testParsing(sampleResponse, totalAmount = 10000) {
        console.log('🧪 Testing AI response parsing...');
        
        const result = this.parseAllocationFromText(sampleResponse, totalAmount);
        
        console.log('Parse result:', result);
        console.log('Formatted display:', this.formatAllocationDisplay(result.allocation));
        
        return result;
    }

    // ⚡ QUICK ALLOCATION BUILDER
    static buildQuickAllocation(stocks, bonds, cash, crypto, totalAmount) {
        // Ensure percentages add to 100
        const total = stocks + bonds + cash + crypto;
        if (Math.abs(total - 100) > 1) {
            console.warn(`Percentages don't add to 100: ${total}%`);
        }

        return {
            stocks_percent: stocks,
            bonds_percent: bonds,
            cash_percent: cash,
            crypto_percent: crypto,
            stocks_amount: totalAmount * (stocks / 100),
            bonds_amount: totalAmount * (bonds / 100),
            cash_amount: totalAmount * (cash / 100),
            crypto_amount: totalAmount * (crypto / 100),
            reasoning: 'Quick allocation builder',
            confidence: 85,
            manual_build: true
        };
    }
}

// 🔧 UTILITY FUNCTIONS FOR EXPORT
const utils = {
    // Main helper class
    AIHelper,

    // Quick access functions
    validateAllocation: (allocation, total) => AIHelper.validateAllocation(allocation, total),
    parseFromText: (text, total) => AIHelper.parseAllocationFromText(text, total),
    calculateRisk: (allocation) => AIHelper.calculateRiskScore(allocation),
    formatDisplay: (allocation) => AIHelper.formatAllocationDisplay(allocation),
    sanitizeResponse: (response) => AIHelper.sanitizeAIResponse(response),
    isMarketOpen: () => AIHelper.isMarketHours(),
    
    // Emergency functions
    emergencyAllocation: (total) => AIHelper.getEmergencyAllocation(total),
    quickAllocation: (s, b, c, cr, total) => AIHelper.buildQuickAllocation(s, b, c, cr, total),

    // Constants
    DEFAULT_ALLOCATIONS: {
        conservative: { stocks: 30, bonds: 60, cash: 10, crypto: 0 },
        moderate: { stocks: 50, bonds: 40, cash: 8, crypto: 2 },
        aggressive: { stocks: 70, bonds: 20, cash: 5, crypto: 5 }
    },

    RISK_LEVELS: ['LOW', 'MODERATE', 'HIGH'],
    ASSET_TYPES: ['stocks', 'bonds', 'cash', 'crypto']
};

module.exports = utils;
