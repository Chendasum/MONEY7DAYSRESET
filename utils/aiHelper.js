// Simple AI Helper for 7-Day Money Flow Reset Bot
class MoneyFlowAIHelper {
    
    // Format user financial data for AI prompts
    static formatFinancialData(userFinances) {
        return {
            monthly_income: userFinances.monthlyIncome || 0,
            monthly_expenses: userFinances.monthlyExpenses || 0,
            current_savings: userFinances.currentSavings || 0,
            total_debts: userFinances.totalDebts || 0,
            savings_rate: userFinances.monthlyIncome > 0 ? 
                ((userFinances.monthlyIncome - userFinances.monthlyExpenses) / userFinances.monthlyIncome * 100).toFixed(1) : 0
        };
    }

    // Generate money leak suggestions
    static analyzeExpenses(expenses, income) {
        const suggestions = [];
        const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
        
        // Check each category
        if (expenses.food > income * 0.3) {
            suggestions.push("ចំណាយម្ហូបច្រើនពេក - ព្យាយាមធ្វើម្ហូបនៅផ្ទះ");
        }
        
        if (expenses.entertainment > income * 0.15) {
            suggestions.push("ចំណាយកម្សាន្តច្រើនពេក - កំណត់ថវិកាកម្សាន្ត");
        }
        
        if (expenses.subscriptions > 50) {
            suggestions.push("ពិនិត្យ subscriptions ដែលមិនប្រើ");
        }
        
        return {
            total_expenses: totalExpenses,
            expense_ratio: (totalExpenses / income * 100).toFixed(1),
            suggestions: suggestions
        };
    }

    // Calculate savings goals
    static calculateSavingsGoals(income) {
        return {
            emergency_fund_3_months: income * 3,
            emergency_fund_6_months: income * 6,
            monthly_savings_10_percent: income * 0.1,
            monthly_savings_20_percent: income * 0.2
        };
    }

    // Format progress for coaching
    static formatProgress(userProgress) {
        const completedDays = this.countCompletedDays(userProgress);
        const currentDay = userProgress.current_day || 1;
        
        return {
            current_day: currentDay,
            completed_days: completedDays,
            completion_rate: (completedDays / 7 * 100).toFixed(1),
            days_remaining: Math.max(0, 7 - currentDay)
        };
    }

    // Count completed days
    static countCompletedDays(progress) {
        if (!progress) return 0;
        
        let count = 0;
        for (let i = 0; i <= 7; i++) {
            if (progress[`day_${i}_completed`]) count++;
        }
        return count;
    }

    // Generate simple budget breakdown
    static generateBudgetBreakdown(income) {
        return {
            needs: {
                amount: income * 0.5,
                percentage: 50,
                description: "ចំណាយចាំបាច់ (ម្ហូប, ផ្ទះ, ឆ្លាស់)"
            },
            wants: {
                amount: income * 0.3,
                percentage: 30,
                description: "ចំណាយកម្សាន្ត និងចង់បាន"
            },
            savings: {
                amount: income * 0.2,
                percentage: 20,
                description: "សន្សំ និងការវិនិយោគ"
            }
        };
    }

    // Clean and format AI responses
    static cleanAIResponse(response) {
        if (!response || typeof response !== 'string') {
            return 'មិនអាចទទួលចម្លើយពី AI បានទេ។';
        }

        return response
            .replace(/```/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
            .substring(0, 2000);
    }

    // Format currency for Cambodia
    static formatCurrency(amount, currency = 'USD') {
        if (currency === 'USD') {
            return `$${amount.toLocaleString()}`;
        } else if (currency === 'KHR') {
            return `${amount.toLocaleString()} ៛`;
        }
        return amount.toString();
    }

    // Get motivational message based on progress
    static getMotivationalMessage(dayNumber, completedDays) {
        const messages = {
            1: "ចាប់ផ្តើមដំណើរអស្ចារ្យ! ថ្ងៃដំបូងជាមួយ Money Flow",
            2: "អ្នកកំពុងដើរត្រឹមផ្លូវ! បន្តការងារល្អ",
            3: "កម្រិតពាក់កណ្តាល! អ្នកធ្វើបានល្អណាស់",
            4: "លើសពាក់កណ្តាលហើយ! គ្រាន់តែថ្ងៃចុងក្រោយ",
            5: "ស្ទើរតែបាន! អ្នកពិតជាអស្ចារ្យ",
            6: "មួយថ្ងៃទៀតប៉ុណ្ណោះ! អ្នកនឹងជោគជ័យ",
            7: "ថ្ងៃចុងក្រោយ! អ្នកពិតជាវីរបុរស!"
        };

        return messages[dayNumber] || "បន្តការងារល្អរបស់អ្នក!";
    }

    // Validate financial inputs
    static validateFinancialInput(data) {
        const errors = [];
        
        if (data.income < 0) errors.push("ចំណូលត្រូវតែជាចំនួនវិជ្ជមាន");
        if (data.expenses < 0) errors.push("ចំណាយត្រូវតែជាចំនួនវិជ្ជមាន");
        if (data.expenses > data.income * 2) errors.push("ចំណាយហាក់ដូចជាខ្ពស់ពេក");
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = MoneyFlowAIHelper;
