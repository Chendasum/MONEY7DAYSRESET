/**
 * Fixed Admin Commands for Telegram Bot
 * Compatible with Drizzle ORM and your current setup
 */

// Get admin IDs from environment variable
const PRIMARY_ADMIN_ID = parseInt(process.env.ADMIN_CHAT_ID) || 176039;
const SECONDARY_ADMIN_ID = 484389665; // Your ID

// Check if user is admin
function isAdmin(userId) {
  console.log(`[ADMIN DEBUG] Checking admin access for user ${userId}`);
  console.log(`[ADMIN DEBUG] Expected admin IDs: ${PRIMARY_ADMIN_ID}, ${SECONDARY_ADMIN_ID}`);
  const isAdminUser = userId === PRIMARY_ADMIN_ID || userId === SECONDARY_ADMIN_ID;
  console.log(`[ADMIN DEBUG] Admin check result: ${isAdminUser}`);
  return isAdminUser;
}

// Admin command: Show all users using direct database query
async function showUsers(msg, bot, dbContext) {
  console.log(`[ADMIN DEBUG] showUsers called by user ${msg.from.id}`);
  
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។

🔒 Admin access required: ${PRIMARY_ADMIN_ID}, ${SECONDARY_ADMIN_ID}
💡 Your ID: ${msg.from.id}

Use /whoami to see your information.`);
    return;
  }

  try {
    console.log("[ADMIN DEBUG] Getting users from database...");
    
    // Use direct database query with the pool from dbContext
    const { pool } = dbContext;
    
    // Get total stats
    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const paidUsersResult = await pool.query('SELECT COUNT(*) as paid FROM users WHERE is_paid = true');
    const vipUsersResult = await pool.query('SELECT COUNT(*) as vip FROM users WHERE is_vip = true');
    
    // Get recent users
    const recentUsersResult = await pool.query(`
      SELECT telegram_id, username, first_name, last_name, is_paid, is_vip, tier, tier_price, joined_at, last_active 
      FROM users 
      ORDER BY joined_at DESC 
      LIMIT 15
    `);
    
    const totalUsers = totalUsersResult.rows[0].total;
    const paidUsers = paidUsersResult.rows[0].paid;
    const vipUsers = vipUsersResult.rows[0].vip;
    const recentUsers = recentUsersResult.rows;
    
    let usersList = "👥 USER LIST & STATS\n\n";
    usersList += `📊 OVERVIEW:\n`;
    usersList += `• Total Users: ${totalUsers}\n`;
    usersList += `• Paid Users: ${paidUsers}\n`;
    usersList += `• VIP Users: ${vipUsers}\n`;
    usersList += `• Free Users: ${totalUsers - paidUsers}\n\n`;
    
    // Calculate revenue stats
    const essentialResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE tier = 'essential' AND is_paid = true");
    const premiumResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE tier = 'premium' AND is_paid = true");
    const vipResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE tier = 'vip' AND is_paid = true");
    
    const essentialCount = essentialResult.rows[0].count;
    const premiumCount = premiumResult.rows[0].count;
    const vipCount = vipResult.rows[0].count;
    
    usersList += `💰 TIER BREAKDOWN:\n`;
    usersList += `• Essential ($24): ${essentialCount} users = $${essentialCount * 24}\n`;
    usersList += `• Premium ($97): ${premiumCount} users = $${premiumCount * 97}\n`;
    usersList += `• VIP ($197): ${vipCount} users = $${vipCount * 197}\n`;
    usersList += `• Total Revenue: $${(essentialCount * 24) + (premiumCount * 97) + (vipCount * 197)}\n\n`;
    
    usersList += `👤 RECENT USERS:\n`;
    
    for (const user of recentUsers) {
      const status = user.is_paid ? "✅ PAID" : "❌ UNPAID";
      const vipStatus = user.is_vip ? " 🌟 VIP" : "";
      const tier = user.tier || 'free';
      
      usersList += `• ID: ${user.telegram_id} | ${status}${vipStatus}\n`;
      usersList += `  Name: ${user.first_name || 'N/A'} ${user.last_name || ''}\n`;
      usersList += `  Tier: ${tier} ($${user.tier_price || 0})\n`;
      usersList += `  Joined: ${user.joined_at ? new Date(user.joined_at).toDateString() : 'Unknown'}\n\n`;
    }
    
    console.log("[ADMIN DEBUG] Users data retrieved successfully");
    await bot.sendMessage(msg.chat.id, usersList);
    
  } catch (error) {
    console.error('[ADMIN ERROR] Error in showUsers:', error);
    await bot.sendMessage(msg.chat.id, `❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យអ្នកប្រើប្រាស់។

🔧 Error details: ${error.message}

💬 Contact: @Chendasum`);
  }
}

// Admin command: Show analytics dashboard
async function showAnalytics(msg, bot, dbContext) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const { pool } = dbContext;
    
    // Get comprehensive analytics
    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const paidUsersResult = await pool.query('SELECT COUNT(*) as paid FROM users WHERE is_paid = true');
    const activeUsersResult = await pool.query(`
      SELECT COUNT(*) as active 
      FROM users 
      WHERE last_active >= NOW() - INTERVAL '7 days'
    `);
    
    // Get tier breakdown
    const tierStats = await pool.query(`
      SELECT 
        tier,
        COUNT(*) as count,
        SUM(tier_price) as revenue
      FROM users 
      WHERE is_paid = true 
      GROUP BY tier
    `);
    
    // Get daily activity (today)
    const todayActivity = await pool.query(`
      SELECT COUNT(*) as today_active 
      FROM users 
      WHERE last_active >= CURRENT_DATE
    `);
    
    // Get progress statistics
    const progressStats = await pool.query(`
      SELECT 
        current_day,
        COUNT(*) as count
      FROM progress 
      GROUP BY current_day 
      ORDER BY current_day
    `);
    
    const totalUsers = totalUsersResult.rows[0].total;
    const paidUsers = paidUsersResult.rows[0].paid;
    const activeUsers = activeUsersResult.rows[0].active;
    const todayActive = todayActivity.rows[0].today_active;
    
    let dashboard = `📊 ANALYTICS DASHBOARD\n\n`;
    dashboard += `👥 USER METRICS:\n`;
    dashboard += `• Total Users: ${totalUsers}\n`;
    dashboard += `• Paid Users: ${paidUsers}\n`;
    dashboard += `• Active (7 days): ${activeUsers}\n`;
    dashboard += `• Active Today: ${todayActive}\n`;
    dashboard += `• Conversion Rate: ${totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0}%\n\n`;
    
    dashboard += `💰 REVENUE BREAKDOWN:\n`;
    let totalRevenue = 0;
    for (const tier of tierStats.rows) {
      const revenue = parseInt(tier.revenue) || 0;
      totalRevenue += revenue;
      dashboard += `• ${tier.tier}: ${tier.count} users = $${revenue}\n`;
    }
    dashboard += `• Total Revenue: $${totalRevenue}\n`;
    dashboard += `• Average Revenue/User: $${paidUsers > 0 ? Math.round(totalRevenue / paidUsers) : 0}\n\n`;
    
    dashboard += `📈 PROGRESS BREAKDOWN:\n`;
    for (const progress of progressStats.rows) {
      dashboard += `• Day ${progress.current_day}: ${progress.count} users\n`;
    }
    
    dashboard += `\n🔧 ADMIN TOOLS:\n`;
    dashboard += `• /admin_users - View all users\n`;
    dashboard += `• /admin_activity - Today's activity\n`;
    dashboard += `• /admin_progress [userID] - Check user progress\n`;
    dashboard += `• /admin_confirm_payment [userID] - Confirm payment\n`;
    dashboard += `• /admin_help - Full command list\n`;
    
    await bot.sendMessage(msg.chat.id, dashboard);
    
  } catch (error) {
    console.error('Error in admin analytics:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យវិភាគ។');
  }
}

// Admin command: Check specific user progress
async function checkProgress(msg, match, bot, dbContext) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const userId = parseInt(match[1]);
  
  try {
    const { pool } = dbContext;
    
    // Get user info
    const userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    const progressResult = await pool.query('SELECT * FROM progress WHERE user_id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${userId}`);
      return;
    }
    
    const user = userResult.rows[0];
    const progress = progressResult.rows[0];
    
    let progressReport = `📊 USER PROGRESS REPORT\n\n`;
    progressReport += `👤 USER INFO:\n`;
    progressReport += `• ID: ${user.telegram_id}\n`;
    progressReport += `• Name: ${user.first_name || 'N/A'} ${user.last_name || ''}\n`;
    progressReport += `• Username: @${user.username || 'none'}\n`;
    progressReport += `• Payment: ${user.is_paid ? '✅ PAID' : '❌ UNPAID'}\n`;
    progressReport += `• Tier: ${user.tier || 'free'} ($${user.tier_price || 0})\n`;
    progressReport += `• VIP: ${user.is_vip ? '🌟 YES' : '❌ NO'}\n`;
    progressReport += `• Joined: ${new Date(user.joined_at).toDateString()}\n`;
    progressReport += `• Last Active: ${user.last_active ? new Date(user.last_active).toDateString() : 'Never'}\n\n`;
    
    if (progress) {
      progressReport += `📈 PROGRAM PROGRESS:\n`;
      progressReport += `• Current Day: ${progress.current_day}\n`;
      progressReport += `• Ready for Day 1: ${progress.ready_for_day_1 ? '✅ YES' : '❌ NO'}\n`;
      
      // Count completed days
      let completedDays = 0;
      for (let i = 0; i <= 7; i++) {
        if (progress[`day_${i}_completed`]) completedDays++;
      }
      
      progressReport += `• Days Completed: ${completedDays}/8\n`;
      progressReport += `• Program Complete: ${progress.program_completed ? '✅ YES' : '❌ NO'}\n`;
      
      // Show which specific days are completed
      let completedList = [];
      for (let i = 0; i <= 7; i++) {
        if (progress[`day_${i}_completed`]) {
          completedList.push(i);
        }
      }
      if (completedList.length > 0) {
        progressReport += `• Completed Days: ${completedList.join(', ')}\n`;
      }
    } else {
      progressReport += `📈 PROGRAM PROGRESS:\n`;
      progressReport += `• No progress data found\n`;
      progressReport += `• User has not started the program\n`;
    }
    
    await bot.sendMessage(msg.chat.id, progressReport);
    
  } catch (error) {
    console.error('Error in admin progress command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យដំណើរការ។');
  }
}

// Admin command: Confirm payment
async function confirmPayment(msg, match, bot, dbContext) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }
  
  const targetUserId = parseInt(match[1]);
  
  try {
    const { pool } = dbContext;
    
    // Parse tier and amount from command
    const fullCommand = msg.text.split(' ');
    const tier = fullCommand[2] || 'essential';
    const amount = parseInt(fullCommand[3]) || 24;
    
    // Update user payment status
    const updateResult = await pool.query(`
      UPDATE users 
      SET is_paid = true, 
          payment_date = NOW(), 
          transaction_id = $1,
          tier = $2,
          tier_price = $3,
          is_vip = $4
      WHERE telegram_id = $5
      RETURNING first_name, last_name
    `, [
      `ADMIN_CONFIRM_${Date.now()}`,
      tier,
      amount,
      tier === 'vip',
      targetUserId
    ]);
    
    if (updateResult.rows.length === 0) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${targetUserId}`);
      return;
    }
    
    const user = updateResult.rows[0];
    
    // Also set ready_for_day_1 = true for the user
    await pool.query(`
      INSERT INTO progress (user_id, ready_for_day_1, current_day) 
      VALUES ($1, true, 0)
      ON CONFLICT (user_id) 
      DO UPDATE SET ready_for_day_1 = true
    `, [targetUserId]);
    
    await bot.sendMessage(msg.chat.id, `✅ បានបញ្ជាក់ការទូទាត់សម្រាប់ ${user.first_name || 'User'} (ID: ${targetUserId})
🎯 Tier: ${tier.toUpperCase()}
💰 Amount: $${amount}
🚀 User can now access tier-specific features and start Day 1`);
    
    // Notify the user
    try {
      await bot.sendMessage(targetUserId, `🎉 ការទូទាត់របស់អ្នកត្រូវបានបញ្ជាក់!

✅ អ្នកអាចចាប់ផ្តើមកម្មវិធីបានហើយ!
📚 ប្រើ /day1 ដើម្បីចាប់ផ្តើម

🔥 សូមអបអរសាទរ! ការផ្លាស់ប្តូរទាំងអស់ចាប់ផ្តើមពីថ្ងៃនេះ! 💪`);
    } catch (notifyError) {
      console.log('Could not notify user about payment confirmation:', notifyError);
    }
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការបញ្ជាក់ការទូទាត់។');
  }
}

// Admin command: Show today's activity
async function showActivity(msg, bot, dbContext) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const { pool } = dbContext;
    
    // Get today's active users
    const activeUsersResult = await pool.query(`
      SELECT telegram_id, first_name, last_name, is_paid, is_vip, tier, last_active
      FROM users 
      WHERE last_active >= CURRENT_DATE
      ORDER BY last_active DESC
    `);
    
    const activeUsers = activeUsersResult.rows;
    
    let activityReport = `📱 TODAY'S ACTIVITY\n\n`;
    activityReport += `🟢 ACTIVE USERS: ${activeUsers.length}\n\n`;
    
    if (activeUsers.length > 0) {
      activityReport += `👥 ACTIVE USER LIST:\n`;
      for (const user of activeUsers) {
        const status = user.is_paid ? "✅" : "❌";
        const vipStatus = user.is_vip ? " 🌟" : "";
        activityReport += `• ${status} ID: ${user.telegram_id}${vipStatus}\n`;
        activityReport += `  ${user.first_name || 'N/A'} ${user.last_name || ''}\n`;
        activityReport += `  Tier: ${user.tier || 'free'}\n`;
        activityReport += `  Last: ${new Date(user.last_active).toLocaleTimeString()}\n\n`;
      }
    } else {
      activityReport += `😴 No active users today\n`;
    }
    
    await bot.sendMessage(msg.chat.id, activityReport);
    
  } catch (error) {
    console.error('Error in admin activity command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យសកម្មភាព។');
  }
}

// Admin command: Show help menu
async function showHelp(msg, bot, dbContext) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។

🔒 Admin access required: ${PRIMARY_ADMIN_ID}, ${SECONDARY_ADMIN_ID}
💡 Your ID: ${msg.from.id}`);
    return;
  }

  const helpText = `🔧 ADMIN COMMAND MENU

📊 ANALYTICS & REPORTS:
• /admin_users - View all users & revenue stats
• /admin_analytics - Full analytics dashboard  
• /admin_activity - Today's active users

👤 USER MANAGEMENT:
• /admin_progress [userID] - Check user progress
• /admin_confirm_payment [userID] [tier] [amount] - Confirm payment
• /admin_message [userID] [message] - Send message to user

💰 PAYMENT & TIERS:
• Tiers: essential ($24), premium ($97), vip ($197)
• Example: /admin_confirm_payment 123456 essential 24

🔧 SYSTEM:
• /admin_help - This help menu
• /whoami - Check your admin status

🔒 Admin Access: IDs ${PRIMARY_ADMIN_ID}, ${SECONDARY_ADMIN_ID}

💬 Support: @Chendasum`;

  await bot.sendMessage(msg.chat.id, helpText);
}

// Admin main menu (for /admin command)
async function mainMenu(msg, bot, dbContext) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `🔒 អ្នកមិនមានសិទ្ធិ Admin។

Admin IDs: ${PRIMARY_ADMIN_ID}, ${SECONDARY_ADMIN_ID}
Your ID: ${msg.from.id}`);
    return;
  }

  const mainMenuText = `👨‍💼 ADMIN PANEL

🚀 Quick Actions:
• /admin_users - View all users
• /admin_analytics - Analytics dashboard
• /admin_activity - Today's activity
• /admin_help - Full command list

💰 User Management:
• /admin_progress [userID] - User details
• /admin_confirm_payment [userID] - Confirm payment

🔧 System Status: ✅ Online
💬 Support: @Chendasum

Type any command to execute!`;

  await bot.sendMessage(msg.chat.id, mainMenuText);
}

module.exports = {
  showUsers,
  showAnalytics,
  checkProgress,
  confirmPayment,
  showActivity,
  showHelp,
  mainMenu,
  isAdmin
};
