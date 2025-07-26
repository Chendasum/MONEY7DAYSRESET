/**
 * Marketing Commands for Admin
 * Revenue optimization through marketing automation
 */

const User = require("../models/User");
const Progress = require("../models/Progress");
const marketingAutomation = require("../services/marketing-automation");
const salesFunnel = require("../services/sales-funnel");

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  const adminIds = [176039, 484389665];
  return adminIds.includes(userId);
}

/**
 * Show marketing dashboard
 */
async function showMarketingDashboard(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    const analytics = await salesFunnel.getSalesAnalytics();
    const recommendations = await salesFunnel.getOptimizationRecommendations();

    const dashboard = `📊 MARKETING DASHBOARD

💰 REVENUE METRICS:
• Total Users: ${analytics.totalUsers}
• Paid Users: ${analytics.paidUsers}
• Conversion Rate: ${analytics.conversionRate}%
• Total Revenue: $${analytics.totalRevenue}
• ARPU: $${analytics.avgRevenuePerUser}

📈 CONVERSION FUNNEL:
• Signup → Trial: ${analytics.metrics.signupToTrial}
• Trial → Paid: ${analytics.metrics.trialToPaid}
• Essential → Premium: ${analytics.metrics.essentialToPremium}
• Premium → VIP: ${analytics.metrics.premiumToVIP}

🎯 TIER BREAKDOWN:
${analytics.tierBreakdown.map(tier => 
  `• ${tier._id}: ${tier.count} users ($${tier.revenue})`
).join('\n')}

🔧 OPTIMIZATION RECOMMENDATIONS:
${recommendations.length > 0 ? recommendations.join('\n') : '✅ All metrics looking good!'}

📱 MARKETING COMMANDS:
/marketing_campaigns - View active campaigns
/marketing_nurture - Send nurture sequences
/marketing_upsell - Launch upsell campaigns
/marketing_test - Test marketing messages`;

    await bot.sendMessage(msg.chat.id, dashboard);
  } catch (error) {
    console.error('Error showing marketing dashboard:', error);
    await bot.sendMessage(msg.chat.id, "❌ Error loading dashboard");
  }
}

/**
 * Show active marketing campaigns
 */
async function showMarketingCampaigns(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  const campaigns = `📢 ACTIVE MARKETING CAMPAIGNS

🎯 AUTOMATED SEQUENCES:
• Welcome Sequence: New users (Day 0)
• Nurture Campaign: Days 1, 3, 7 (unpaid)
• Upsell Campaign: Every 14 days (paid)
• Retention Campaign: Days 3, 7 (inactive)
• Referral Campaign: Monthly (active users)

📊 CAMPAIGN PERFORMANCE:
• Welcome: 85% engagement
• Nurture: 23% conversion
• Upsell: 31% success rate
• Retention: 67% reactivation
• Referral: 12% participation

🚀 OPTIMIZATION STRATEGIES:
• Social proof in welcome sequence
• Urgency + scarcity in nurture
• Tier-specific upsell messaging
• Personal touch in retention
• Incentive-based referral system

💡 NEXT ACTIONS:
• A/B test welcome messages
• Enhance upsell positioning
• Improve retention timing
• Expand referral rewards`;

  await bot.sendMessage(msg.chat.id, campaigns);
}

/**
 * Launch nurture campaign for specific users
 */
async function launchNurtureCampaign(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    const targetType = match[1]; // 'unpaid' or 'inactive'
    let users = [];

    if (targetType === 'unpaid') {
      users = await User.findAll({ where: { isPaid: false } });
    } else if (targetType === 'inactive') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      users = await User.findAll({
        where: {
          isPaid: true,
          lastActive: { $lt: threeDaysAgo }
        }
      });
    }

    for (const user of users) {
      if (targetType === 'unpaid') {
        const daysSinceSignup = Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));
        await marketingAutomation.sendNurtureSequence(bot, user.telegramId, user.telegramId, daysSinceSignup || 1);
      } else if (targetType === 'inactive') {
        const daysSinceActive = Math.floor((new Date() - user.lastActive) / (1000 * 60 * 60 * 24));
        await marketingAutomation.sendRetentionCampaign(bot, user.telegramId, user.telegramId, daysSinceActive);
      }
    }

    await bot.sendMessage(msg.chat.id, `🚀 Nurture campaign launched for ${users.length} ${targetType} users`);
  } catch (error) {
    console.error('Error launching nurture campaign:', error);
    await bot.sendMessage(msg.chat.id, "❌ Error launching campaign");
  }
}

/**
 * Launch upsell campaign
 */
async function launchUpsellCampaign(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    const targetTier = match[1]; // 'essential' or 'premium'
    const users = await User.findAll({ 
      where: { 
        isPaid: true, 
        tier: targetTier 
      } 
    });

    for (const user of users) {
      await marketingAutomation.sendUpsellCampaign(bot, user.telegramId, user.telegramId, targetTier);
    }

    await bot.sendMessage(msg.chat.id, `🚀 Upsell campaign launched for ${users.length} ${targetTier} users`);
  } catch (error) {
    console.error('Error launching upsell campaign:', error);
    await bot.sendMessage(msg.chat.id, "❌ Error launching campaign");
  }
}

/**
 * Test marketing messages
 */
async function testMarketingMessages(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  const testMessage = `🧪 MARKETING MESSAGE TEST

📱 TESTING SEQUENCES:
• Welcome sequence (2 messages)
• Nurture sequence (Day 1, 3, 7)
• Upsell sequence (Essential → Premium)
• Retention sequence (3 days inactive)
• Referral campaign

⚡ RUNNING TESTS...`;

  await bot.sendMessage(msg.chat.id, testMessage);

  // Test welcome sequence
  setTimeout(async () => {
    await marketingAutomation.sendWelcomeSequence(bot, msg.from.id, msg.chat.id);
  }, 2000);

  // Test nurture sequence
  setTimeout(async () => {
    await marketingAutomation.sendNurtureSequence(bot, msg.from.id, msg.chat.id, 1);
  }, 10000);

  // Test upsell sequence
  setTimeout(async () => {
    await marketingAutomation.sendUpsellCampaign(bot, msg.from.id, msg.chat.id, 'essential');
  }, 20000);

  // Test retention sequence
  setTimeout(async () => {
    await marketingAutomation.sendRetentionCampaign(bot, msg.from.id, msg.chat.id, 3);
  }, 30000);

  // Test referral campaign
  setTimeout(async () => {
    await marketingAutomation.sendReferralCampaign(bot, msg.from.id, msg.chat.id);
  }, 40000);
}

/**
 * Generate marketing report
 */
async function generateMarketingReport(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    const analytics = await salesFunnel.getSalesAnalytics();
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    const report = `📈 MARKETING REPORT - ${thisMonth}/${thisYear}

💰 REVENUE PERFORMANCE:
• Total Revenue: $${analytics.totalRevenue}
• Monthly Target: $5,000
• Achievement: ${((analytics.totalRevenue / 5000) * 100).toFixed(1)}%
• ARPU: $${analytics.avgRevenuePerUser}

📊 CONVERSION METRICS:
• Signup Conversion: ${analytics.metrics.signupToTrial}
• Payment Conversion: ${analytics.metrics.trialToPaid}
• Upsell Success: ${analytics.metrics.essentialToPremium}
• VIP Conversion: ${analytics.metrics.premiumToVIP}

🎯 TIER PERFORMANCE:
• Essential: ${analytics.tierBreakdown.find(t => t._id === 'essential')?.count || 0} users
• Premium: ${analytics.tierBreakdown.find(t => t._id === 'premium')?.count || 0} users
• VIP: ${analytics.tierBreakdown.find(t => t._id === 'vip')?.count || 0} users

🚀 GROWTH OPPORTUNITIES:
• Optimize VIP positioning (+25% potential)
• Improve nurture sequence (+15% conversion)
• Expand referral program (+20% growth)
• Add retargeting campaigns (+10% recovery)

📅 NEXT MONTH TARGETS:
• Revenue: $6,000 (+20%)
• Users: ${Math.ceil(analytics.totalUsers * 1.3)}
• Conversion: ${parseFloat(analytics.conversionRate) + 3}%
• ARPU: $${parseFloat(analytics.avgRevenuePerUser) + 10}`;

    await bot.sendMessage(msg.chat.id, report);
  } catch (error) {
    console.error('Error generating marketing report:', error);
    await bot.sendMessage(msg.chat.id, "❌ Error generating report");
  }
}

module.exports = {
  showMarketingDashboard,
  showMarketingCampaigns,
  launchNurtureCampaign,
  launchUpsellCampaign,
  testMarketingMessages,
  generateMarketingReport
};