const User = require("../models/User");
const Progress = require("../models/Progress");

// Admin command: Show users stuck on specific days
async function showStuckUsers(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const users = await User.findAll({ where: { isPaid: true } });
    let stuckReport = `🚨 USERS STUCK ON SPECIFIC DAYS\n\n`;

    for (let day = 1; day <= 7; day++) {
      const stuckUsers = [];
      
      for (const user of users) {
        const progress = await Progress.findOne({ userId: user.telegramId });
        if (!progress) continue;

        const daysSinceLastActive = (new Date() - user.lastActive) / (1000 * 60 * 60 * 24);
        
        // Check if user is stuck on this day for more than 2 days
        if (progress.currentDay === day && daysSinceLastActive > 2) {
          stuckUsers.push({
            name: `${user.firstName || 'N/A'} ${user.lastName || ''}`,
            id: user.telegramId,
            daysStuck: Math.floor(daysSinceLastActive)
          });
        }
      }

      if (stuckUsers.length > 0) {
        stuckReport += `📅 DAY ${day} (${stuckUsers.length} users stuck):\n`;
        stuckUsers.forEach(user => {
          stuckReport += `• ${user.name} (ID: ${user.id}) - ${user.daysStuck} days\n`;
        });
        stuckReport += `\n`;
      }
    }

    if (stuckReport === `🚨 USERS STUCK ON SPECIFIC DAYS\n\n`) {
      stuckReport += `✅ No users are stuck! Everyone is progressing well.\n`;
    }

    await bot.sendMessage(msg.chat.id, stuckReport);
  } catch (error) {
    console.error('Error in showStuckUsers:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យអ្នកប្រើស្ទះ');
  }
}

// Admin command: Show completion rates for each day
async function showCompletionRates(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const paidUsers = await User.findAll({ where: { isPaid: true } });
    const totalPaidUsers = paidUsers.length;
    
    let completionReport = `📊 COMPLETION RATES BY DAY\n\n`;
    completionReport += `👥 Total Paid Users: ${totalPaidUsers}\n\n`;

    for (let day = 1; day <= 7; day++) {
      let completed = 0;
      let current = 0;
      
      for (const user of paidUsers) {
        const progress = await Progress.findOne({ userId: user.telegramId });
        if (!progress) continue;

        if (progress.daysCompleted.includes(day)) {
          completed++;
        } else if (progress.currentDay === day) {
          current++;
        }
      }

      const completionRate = totalPaidUsers > 0 ? Math.round((completed / totalPaidUsers) * 100) : 0;
      
      completionReport += `📅 DAY ${day}:\n`;
      completionReport += `• ✅ Completed: ${completed} (${completionRate}%)\n`;
      completionReport += `• 🔄 Current: ${current}\n`;
      completionReport += `• ❌ Not Started: ${totalPaidUsers - completed - current}\n\n`;
    }

    await bot.sendMessage(msg.chat.id, completionReport);
  } catch (error) {
    console.error('Error in showCompletionRates:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យអត្រាបញ្ចប់');
  }
}

// Admin command: Send manual reminder to stuck users
async function sendManualReminder(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const parts = match[1].split(' ');
  const day = parseInt(parts[0]);
  const customMessage = parts.slice(1).join(' ');

  if (!day || day < 1 || day > 7) {
    await bot.sendMessage(msg.chat.id, '❌ Format: /admin_remind [day] [optional custom message]');
    return;
  }

  try {
    const users = await User.findAll({ where: { isPaid: true } });
    let remindersSent = 0;

    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      if (!progress) continue;

      const daysSinceLastActive = (new Date() - user.lastActive) / (1000 * 60 * 60 * 24);
      
      // Send reminder to users stuck on this day for more than 1 day
      if (progress.currentDay === day && daysSinceLastActive > 1) {
        const reminderMessage = customMessage || `🔔 រំលឹក: 7-Day Money Flow Reset™

សួស្តី ${user.firstName || 'Friend'}! 👋

អ្នកកំពុងនៅលើ Day ${day} ហើយ! 📅
យើងកត់សម្គាល់ឃើញថា អ្នកមិនទាន់បញ្ចប់ Day ${day} នៅឡើយទេ។

🎯 ចាំបាច់ធ្វើថ្ងៃនេះ:
• បើកមើល Day ${day} lesson
• ធ្វើតាម instructions
• Type "DAY ${day} COMPLETE" នៅពេលបញ្ចប់

💪 កុំបោះបង់! អ្នកនៅជិតដល់គោលដៅហើយ!

❓ ត្រូវការជំនួយ? សរសេរមក @Chendasum`;

        try {
          await bot.sendMessage(user.telegramId, reminderMessage);
          remindersSent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${user.telegramId}:`, error);
        }
      }
    }

    await bot.sendMessage(msg.chat.id, `✅ បានផ្ញើរំលឹកទៅអ្នកប្រើ ${remindersSent} នាក់ (Day ${day})`);
  } catch (error) {
    console.error('Error in sendManualReminder:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការផ្ញើរំលឹក');
  }
}

// Admin command: Show users who completed program
async function showCompletedUsers(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const users = await User.findAll({ where: { isPaid: true } });
    const completedUsers = [];

    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      if (progress && progress.programComplete) {
        completedUsers.push({
          name: `${user.firstName || 'N/A'} ${user.lastName || ''}`,
          id: user.telegramId,
          completedAt: progress.programCompletedAt || 'Unknown',
          isVip: user.isVip
        });
      }
    }

    let completedReport = `🎉 PROGRAM COMPLETED USERS\n\n`;
    completedReport += `✅ Total Completed: ${completedUsers.length}\n\n`;

    if (completedUsers.length > 0) {
      completedUsers.forEach(user => {
        const vipStatus = user.isVip ? ' 🌟 VIP' : '';
        completedReport += `• ${user.name} (ID: ${user.id})${vipStatus}\n`;
        completedReport += `  Completed: ${user.completedAt instanceof Date ? user.completedAt.toDateString() : user.completedAt}\n\n`;
      });
    } else {
      completedReport += `😔 No users have completed the program yet.\n`;
    }

    await bot.sendMessage(msg.chat.id, completedReport);
  } catch (error) {
    console.error('Error in showCompletedUsers:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យអ្នកប្រើបញ្ចប់');
  }
}

// Admin command: Show upload tracking for all users
async function showUploadTracking(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const users = await User.findAll({ where: { isPaid: true } });
    let uploadReport = `📸 UPLOAD TRACKING REPORT\n\n`;
    
    let totalUploads = 0;
    let usersWithUploads = 0;

    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      if (!progress) continue;

      let userUploads = 0;
      let uploadDetails = '';

      for (let day = 1; day <= 7; day++) {
        const photoUploadField = `day${day}PhotoUploaded`;
        const photoUploadTimeField = `day${day}PhotoUploadedAt`;
        
        if (progress[photoUploadField]) {
          userUploads++;
          totalUploads++;
          const uploadTime = progress[photoUploadTimeField];
          uploadDetails += `• Day ${day}: ✅ ${uploadTime ? uploadTime.toDateString() : 'Unknown'}\n`;
        }
      }

      if (userUploads > 0) {
        usersWithUploads++;
        uploadReport += `👤 ${user.firstName || 'N/A'} (ID: ${user.telegramId}) - ${userUploads} uploads\n`;
        uploadReport += uploadDetails + '\n';
      }
    }

    if (usersWithUploads === 0) {
      uploadReport += `😔 No users have uploaded photos/documents yet.\n`;
    } else {
      uploadReport = `📸 UPLOAD TRACKING REPORT\n\n📊 SUMMARY:\n• Users with uploads: ${usersWithUploads}\n• Total uploads: ${totalUploads}\n\n` + uploadReport;
    }

    await bot.sendMessage(msg.chat.id, uploadReport);
  } catch (error) {
    console.error('Error in showUploadTracking:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យការផ្ទុក');
  }
}

// Admin command: Show specific user's photo uploads
async function showUserPhotos(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const userId = parseInt(match[1]);
  
  try {
    const user = await User.findOne({ telegramId: userId });
    const progress = await Progress.findOne({ userId: userId });
    
    if (!user) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${userId}`);
      return;
    }

    let photosReport = `📸 PHOTO UPLOAD REPORT\n\n`;
    photosReport += `👤 USER: ${user.firstName || 'N/A'} ${user.lastName || ''} (ID: ${userId})\n\n`;

    if (!progress) {
      photosReport += `❌ No progress data found\n`;
      await bot.sendMessage(msg.chat.id, photosReport);
      return;
    }

    let hasUploads = false;
    
    for (let day = 1; day <= 7; day++) {
      const photoUploadField = `day${day}PhotoUploaded`;
      const photoUploadTimeField = `day${day}PhotoUploadedAt`;
      
      if (progress[photoUploadField]) {
        hasUploads = true;
        const uploadTime = progress[photoUploadTimeField];
        photosReport += `📅 DAY ${day}: ✅ UPLOADED\n`;
        photosReport += `• Time: ${uploadTime ? uploadTime.toLocaleString() : 'Unknown'}\n`;
        
        // Show upload details if available
        if (progress.uploadData && progress.uploadData[`day${day}`]) {
          const uploadInfo = progress.uploadData[`day${day}`];
          if (uploadInfo.caption) {
            photosReport += `• Caption: ${uploadInfo.caption}\n`;
          }
          if (uploadInfo.fileName) {
            photosReport += `• File: ${uploadInfo.fileName}\n`;
          }
        }
        photosReport += '\n';
      } else {
        photosReport += `📅 DAY ${day}: ❌ NO UPLOAD\n\n`;
      }
    }

    if (!hasUploads) {
      photosReport += `😔 No photos or documents uploaded yet.\n`;
    }

    await bot.sendMessage(msg.chat.id, photosReport);
  } catch (error) {
    console.error('Error in showUserPhotos:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យរូបភាពអ្នកប្រើ');
  }
}

// Helper function to check admin
function isAdmin(userId) {
  const adminIds = [176039, 484389665]; // Your admin IDs
  return adminIds.includes(userId);
}

module.exports = {
  showStuckUsers,
  showCompletionRates,
  sendManualReminder,
  showCompletedUsers,
  showUploadTracking,
  showUserPhotos
};