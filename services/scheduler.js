const { db } = require('../server/storage');
const { users, progress } = require('../shared/schema');
const { eq } = require('drizzle-orm');
const { dailyMessages } = require('../commands/daily');

async function sendDailyMessages(bot) {
  try {
    // Get all users who should receive daily messages
    const paidUsers = await db.select().from(users).where(eq(users.is_paid, true));
    
    for (const user of paidUsers) {
      const userProgress = await db.select().from(progress).where(eq(progress.user_id, user.telegram_id));
      
      if (!userProgress || userProgress.length === 0) continue;
      
      const prog = userProgress[0];
      
      // Determine which day message to send (starting from day 1)
      let dayToSend = null;
      
      if (prog.ready_for_day_1 && !prog.day1Completed) {
        dayToSend = 1;
      } else if (prog.day1Completed && !prog.day2Completed) {
        dayToSend = 2;
      } else if (prog.day2Completed && !prog.day3Completed) {
        dayToSend = 3;
      } else if (prog.day3Completed && !prog.day4Completed) {
        dayToSend = 4;
      } else if (prog.day4Completed && !prog.day5Completed) {
        dayToSend = 5;
      } else if (prog.day5Completed && !prog.day6Completed) {
        dayToSend = 6;
      } else if (prog.day6Completed && !prog.day7Completed) {
        dayToSend = 7;
      }
      
      if (dayToSend && dailyMessages[dayToSend]) {
        try {
          await bot.sendMessage(user.telegram_id, dailyMessages[dayToSend]);
          console.log(`✅ Sent day ${dayToSend} message to user ${user.telegram_id}`);
          
          // Update last active
          await db.update(users)
            .set({ last_active: new Date() })
            .where(eq(users.telegramId, user.telegram_id));
          
        } catch (error) {
          console.error(`❌ Failed to send message to user ${user.telegram_id}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in sendDailyMessages:', error);
  }
}

async function sendReminders(bot) {
  try {
    // Get users who haven't completed yesterday's task
    const paidUsers = await db.select().from(users).where(eq(users.is_paid, true));
    
    for (const user of paidUsers) {
      const userProgress = await db.select().from(progress).where(eq(progress.user_id, user.telegram_id));
      
      if (!userProgress || userProgress.length === 0) continue;
      
      const prog = userProgress[0];
      
      // Check if user is stuck on a day for more than 24 hours
      const now = new Date();
      const daysSinceLastActivity = (now - user.last_active) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastActivity > 1) {
        const reminderMessage = `🔔 រំលឹក: 7-Day Money Flow Reset™

${user.first_name ? `សួស្តី ${user.first_name}!` : 'សួស្តី!'}

អ្នកមិនទាន់បានបន្តកម្មវិធីទេ។ កុំបាត់បង់ momentum!

ចុចនេះដើម្បីបន្ត: /day${prog.currentDay}

យើងនៅទីនេះជួយអ្នក! 💪`;

        try {
          await bot.sendMessage(user.telegram_id, reminderMessage);
          console.log(`✅ Sent reminder to user ${user.telegram_id}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder to user ${user.telegram_id}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in sendReminders:', error);
  }
}

module.exports = { sendDailyMessages, sendReminders };
