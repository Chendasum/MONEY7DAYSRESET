// 🤖 AI-Powered Commands for Money Flow Bot
const aiIntegration = require('../services/aiIntegration');
const AccessControl = require('../services/access-control');
const { sendLongMessage } = require('../utils/message-splitter');

// 🧠 AI Analysis Command
async function handleAIAnalysis(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userInput = msg.text.replace('/ai_analysis', '').trim();

    // Check access
    const access = await new AccessControl().checkAccess(userId, 'ai_analysis');
    if (!access.hasAccess) {
        return bot.sendMessage(chatId, access.message);
    }

    if (!userInput) {
        return bot.sendMessage(chatId, `🤖 AI វិភាគ

ប្រើប្រាស់: /ai_analysis [សំណួរ ឬ បញ្ហារបស់អ្នក]

ឧទាហរណ៍:
/ai_analysis ខ្ញុំលំបាកសន្សំលុយ តើធ្វើម៉េច?
/ai_analysis តើខ្ញុំគួរវិនិយោគអ្វីខ្លះ?
/ai_analysis ចង់បានដំបូន្មានគ្រប់គ្រងលុយ`);
    }

    bot.sendMessage(chatId, "🤖 កំពុងវិភាគ... សូមរង់ចាំ");

    try {
        const analysis = await aiIntegration.getPersonalizedCoaching(
            userId, 
            { question: userInput }, 
            { general_advice: true }
        );

        const response = `🤖 **AI Analysis Results**

**📊 Assessment:**
${analysis.progress_assessment}

**💡 Specific Advice:**
${analysis.specific_advice.map(advice => `• ${advice}`).join('\n')}

**🇰🇭 Cambodia Examples:**
${analysis.cambodia_examples ? analysis.cambodia_examples.map(ex => `• ${ex}`).join('\n') : 'N/A'}

**💪 Motivation:**
${analysis.motivation_message}

**🎯 Focus Areas:**
${analysis.next_focus_areas ? analysis.next_focus_areas.map(area => `• ${area}`).join('\n') : 'Continue current program'}

${analysis.ai_used ? '🔗 Powered by IMPERIUM-VAULT-SYSTEM' : '⚡ Fallback analysis'}`;

        await sendLongMessage(bot, chatId, response);

    } catch (error) {
        console.error('AI analysis error:', error);
        bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការវិភាគ។ សូមសាកល្បងម្តងទៀត។");
    }
}

// 💰 Smart Allocation Command
async function handleSmartAllocation(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const args = msg.text.split(' ');
    const amount = parseFloat(args[1]);

    // Check access
    const access = await new AccessControl().checkAccess(userId, 'smart_allocation');
    if (!access.hasAccess) {
        return bot.sendMessage(chatId, access.message);
    }

    if (!amount || amount <= 0) {
        return bot.sendMessage(chatId, `💰 ការបែងចែកលុយដ៏ឆ្លាត

ប្រើប្រាស់: /smart_allocation [ចំនួនទឹកប្រាក់]

ឧទាហរណ៍:
/smart_allocation 1000
/smart_allocation 5000
/smart_allocation 500

AI នឹងណែនាំការបែងចែកលុយល្អបំផុតសម្រាប់អ្នក។`);
    }

    bot.sendMessage(chatId, "🤖 កំពុងគណនាការបែងចែកដ៏ឆ្លាត...");

    try {
        const allocation = await aiIntegration.getSmartAllocation(amount, {
            country: 'Cambodia',
            currency_preference: 'USD_KHR_mixed'
        });

        const response = `💰 **Smart Money Allocation - $${amount}**

**🏦 Local Savings (${allocation.local_savings_percent}%)**
Amount: $${allocation.local_savings_amount.toFixed(2)}
Purpose: Daily expenses & local opportunities

**💵 USD Savings (${allocation.usd_savings_percent}%)**
Amount: $${allocation.usd_savings_amount.toFixed(2)}
Purpose: Stability & inflation protection

**🚨 Emergency Fund (${allocation.emergency_fund_percent}%)**
Amount: $${allocation.emergency_fund_amount.toFixed(2)}
Purpose: Unexpected expenses

**📈 Investment (${allocation.investment_percent}%)**
Amount: $${allocation.investment_amount.toFixed(2)}
Purpose: Long-term growth

**🧠 AI Reasoning:**
${allocation.reasoning}

**🇰🇭 Cambodia Tips:**
${allocation.cambodia_tips.map(tip => `• ${tip}`).join('\n')}

**Risk Level:** ${allocation.risk_level}
**Confidence:** ${allocation.confidence}%

${allocation.ai_used ? '🔗 Powered by IMPERIUM-VAULT-SYSTEM' : '⚡ Fallback allocation'}`;

        await sendLongMessage(bot, chatId, response);

    } catch (error) {
        console.error('Smart allocation error:', error);
        bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការគណនា។ សូមសាកល្បងម្តងទៀត។");
    }
}

// 🎯 AI Status Command
async function handleAIStatus(bot, msg) {
    const chatId = msg.chat.id;
    
    try {
        const status = aiIntegration.getStatus();
        const testResult = await aiIntegration.testConnection();

        const response = `🤖 **AI System Status**

**Connection:** ${status.ai_available ? '✅ Connected' : '❌ Disconnected'}
**Mode:** ${status.fallback_mode ? 'Fallback' : 'AI-Powered'}
**Version:** ${status.system_version}

**Connected Modules:**
${status.connected_modules.map(module => `• ${module}`).join('\n')}

**Connection Test:**
${testResult.success ? '✅ ' + testResult.message : '❌ ' + testResult.message}

**Last Check:** ${new Date(status.last_check).toLocaleString()}

${status.ai_available ? 
'🔗 IMPERIUM-VAULT-SYSTEM is fully operational!' : 
'⚡ Using fallback logic - basic functionality available'}`;

        bot.sendMessage(chatId, response);

    } catch (error) {
        console.error('AI status error:', error);
        bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការពិនិត្យ។");
    }
}

module.exports = {
    handleAIAnalysis,
    handleSmartAllocation,
    handleAIStatus
};
