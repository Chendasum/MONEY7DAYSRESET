// Tools and Templates for Daily Downloads
const User = require("../models/User");
const Progress = require("../models/Progress");

// Check if user is admin
function isAdmin(userId) {
  const adminIds = [176039, 484389665];
  return adminIds.includes(userId);
}

// Admin command: Generate daily tracking template
async function generateDailyTemplate(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const today = new Date().toDateString();
    const users = await User.findAll({ where: { isPaid: true } });
    
    let template = `📊 DAILY TRACKING TEMPLATE - ${today}\n\n`;
    template += `🎯 DAILY CHECKLIST:\n`;
    template += `□ Check /admin_activity (active users)\n`;
    template += `□ Check /admin_stuck (users needing help)\n`;
    template += `□ Check /admin_uploads (photo submissions)\n`;
    template += `□ Send reminders to stuck users\n`;
    template += `□ Reply to user messages\n\n`;
    
    template += `📈 USER PROGRESS TRACKING:\n`;
    template += `Total Paid Users: ${users.length}\n\n`;
    
    // Group users by current day
    const dayGroups = {};
    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      const currentDay = progress ? progress.currentDay : 0;
      
      if (!dayGroups[currentDay]) {
        dayGroups[currentDay] = [];
      }
      dayGroups[currentDay].push({
        name: `${user.firstName || 'N/A'} ${user.lastName || ''}`,
        id: user.telegramId,
        lastActive: user.lastActive
      });
    }
    
    // Display users by day
    for (let day = 0; day <= 7; day++) {
      if (dayGroups[day] && dayGroups[day].length > 0) {
        template += `\n📅 DAY ${day} USERS (${dayGroups[day].length}):\n`;
        dayGroups[day].forEach(user => {
          const daysSinceActive = user.lastActive ? Math.floor((new Date() - user.lastActive) / (1000 * 60 * 60 * 24)) : 999;
          const status = daysSinceActive > 2 ? '🔴 STUCK' : '🟢 ACTIVE';
          template += `• ${user.name} (${user.id}) - ${status}\n`;
        });
      }
    }
    
    template += `\n💡 NOTES:\n`;
    template += `• Focus on 🔴 STUCK users first\n`;
    template += `• Send encouragement to Day 3-5 users\n`;
    template += `• Check photo uploads for verification\n`;
    template += `• Confirm pending payments\n\n`;
    
    template += `📞 CONTACT LOG:\n`;
    template += `□ User contacted: _____ (ID: _____)\n`;
    template += `□ Issue: _________________\n`;
    template += `□ Action taken: __________\n`;
    template += `□ Follow-up needed: ______\n\n`;
    
    template += `📸 PHOTO UPLOADS:\n`;
    template += `□ Check /admin_uploads\n`;
    template += `□ Users with uploads: ____\n`;
    template += `□ Users without uploads: ____\n\n`;
    
    template += `🔚 END OF DAY SUMMARY:\n`;
    template += `□ Messages sent: ____\n`;
    template += `□ Payments confirmed: ____\n`;
    template += `□ Users helped: ____\n`;
    template += `□ Tomorrow's focus: ___________\n`;
    
    await bot.sendMessage(msg.chat.id, template);
    
  } catch (error) {
    console.error('Error generating daily template:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការបង្កើតគំរូ');
  }
}

// Admin command: Generate weekly report template
async function generateWeeklyTemplate(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    let template = `📊 WEEKLY REPORT TEMPLATE\n`;
    template += `📅 Week: ${weekStart.toDateString()} - ${weekEnd.toDateString()}\n\n`;
    
    template += `🎯 WEEKLY SUMMARY:\n`;
    template += `□ New signups: ____\n`;
    template += `□ New payments: ____\n`;
    template += `□ Program completions: ____\n`;
    template += `□ VIP upgrades: ____\n`;
    template += `□ Total revenue: $____\n\n`;
    
    template += `📈 COMPLETION RATES:\n`;
    for (let day = 1; day <= 7; day++) {
      template += `□ Day ${day}: ____% (____/____)\n`;
    }
    
    template += `\n📸 PHOTO UPLOADS:\n`;
    template += `□ Total uploads: ____\n`;
    template += `□ Users with uploads: ____\n`;
    template += `□ Most active day: ____\n\n`;
    
    template += `🔴 ISSUES IDENTIFIED:\n`;
    template += `□ Bottleneck days: ____\n`;
    template += `□ Common questions: ____\n`;
    template += `□ Technical issues: ____\n\n`;
    
    template += `💡 IMPROVEMENTS MADE:\n`;
    template += `□ Content updates: ____\n`;
    template += `□ User experience: ____\n`;
    template += `□ Response time: ____\n\n`;
    
    template += `🎯 NEXT WEEK GOALS:\n`;
    template += `□ Target signups: ____\n`;
    template += `□ Target completion rate: ____%\n`;
    template += `□ Focus areas: ____\n\n`;
    
    await bot.sendMessage(msg.chat.id, template);
    
  } catch (error) {
    console.error('Error generating weekly template:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការបង្កើតរបាយការណ៍');
  }
}

// Admin command: Generate user engagement checklist
async function generateEngagementChecklist(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const checklist = `📋 USER ENGAGEMENT CHECKLIST

🌅 MORNING ROUTINE (5 minutes):
□ /admin_activity - Check active users
□ /admin_stuck - Find users needing help
□ /admin_uploads - Review photo submissions
□ Send 2-3 encouragement messages

🌞 MIDDAY CHECK (3 minutes):
□ Reply to user messages
□ Check for payment confirmations needed
□ /admin_followup - Contact inactive users

🌙 EVENING REVIEW (7 minutes):
□ /admin_completion - Check day completion rates
□ /admin_analytics - Review overall metrics
□ Plan tomorrow's focus areas
□ Update tracking template

🔄 WEEKLY DEEP DIVE (15 minutes):
□ /admin_export - Download user data
□ Analyze completion bottlenecks
□ Update program content if needed
□ Plan improvement strategies

📞 COMMUNICATION PRIORITIES:
1. 🔴 Users stuck 3+ days → Personal message
2. 🟡 Users on Day 3-5 → Encouragement
3. 🟢 New users → Welcome & guidance
4. 💰 Payment issues → Quick resolution

📸 PHOTO VERIFICATION:
□ Check daily uploads
□ Confirm progress with users
□ Send verification confirmations
□ Track engagement patterns

💡 QUICK ACTIONS:
• Stuck user? → /admin_message [ID] [help]
• No payment? → /admin_confirm_payment [ID]
• Need reminder? → /admin_remind [day] [message]
• Check progress? → /admin_progress [ID]

🎯 SUCCESS METRICS:
• >80% completion rate for Days 1-3
• <2 days average stuck time
• >70% photo upload rate
• <24hr response time to user messages

This checklist helps maintain high user engagement and program success!`;

  await bot.sendMessage(msg.chat.id, checklist);
}

// Admin command: Generate user onboarding template
async function generateOnboardingTemplate(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const template = `🚀 NEW USER ONBOARDING TEMPLATE

👋 WELCOME MESSAGE TEMPLATE:
"សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

🎉 អ្នកបានចូលរួមកម្មវិធីផ្លាស់ប្ដូរជីវិតហើយ!

📅 រយៈពេល ៧ថ្ងៃ អ្នកនឹងរៀន:
• ការរកដឹង Money Leaks
• ជំនាញគ្រប់គ្រងថវិកា
• ការបង្កើតចំណូលថ្មី
• ការរៀបចំអនាគតហិរញ្ញវត្ថុ

💡 ជំនួយ 24/7 ជាភាសាខ្មែរ!
📱 ប្រើ /help សម្រាប់ការណែនាំ
💰 ប្រើ /pricing សម្រាប់ព័ត៌មានតម្លៃ

តោះចាប់ផ្តើម! 🚀"

💰 PAYMENT FOLLOW-UP TEMPLATE:
"សួស្តី [Name]! 👋

យើងកត់សម្គាល់ឃើញថា អ្នកចាប់អារម្មណ៍លើកម្មវិធី 7-Day Money Flow Reset™

🎯 ការទូទាត់ឆាប់រហ័ស = ចាប់ផ្តើមភ្លាមៗ!

💳 វិធីទូទាត់:
• ABA Pay: 000 123 456
• ACLEDA: 000 789 012
• Pi Pay: @username

✅ ក្រោយទូទាត់ រូបថត proof ផ្ញើមក
⚡ ទទួល access ភ្លាមៗ!

❓ មានសំណួរ? សរសេរមកបាន!"

🔄 ENGAGEMENT FOLLOW-UP:
"សួស្តី [Name]! 😊

យើងកត់សម្គាល់ថា អ្នកមិនបាន active ចាប់ពី [days] ថ្ងៃមកហើយ

🎯 អ្នកកំពុងនៅលើ Day [X]:
• [Brief day description]
• [Next action needed]

💪 កុំបោះបង់! យើងជួយបាន!
📞 មានបញ្ហាអ្វី? ទាក់ទងមកបាន

🚀 បន្តចាប់ពី Day [X] ឥឡូវនេះ: /day[X]"

🏆 COMPLETION CELEBRATION:
"🎉 អបអរសាទរ [Name]!

✅ អ្នកបានបញ្ចប់ 7-Day Money Flow Reset™!

🎯 សមិទ្ធិផលរបស់អ្នក:
• រៀនគ្រប់គ្រងថវិកា
• គ្រប់គ្រងចំណូល-ចំណាយ
• រៀបចំផែនការហិរញ្ញវត្ថុ
• ជំនាញសន្សំប្រកប់

🌟 ចង់បន្តកម្រិតខ្ពស់? VIP Program រង់ចាំ!
💎 ប្រើ /vip_program_info ដើម្បីស្វែងយល់

អ្នកធ្វើបានល្អណាស់! 💪"

📊 TRACKING CHECKLIST:
□ User registered → Welcome message
□ Payment pending → Follow-up day 1
□ Payment confirmed → Access granted
□ Day 3 stuck → Encouragement message
□ Day 5 stuck → Personal help offer
□ Program completed → Celebration + VIP offer
□ VIP interested → Personal consultation

Use these templates for consistent, professional user communication!`;

  await bot.sendMessage(msg.chat.id, template);
}

module.exports = {
  generateDailyTemplate,
  generateWeeklyTemplate,
  generateEngagementChecklist,
  generateOnboardingTemplate
};