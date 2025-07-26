/**
 * VIP Booking System Commands
 * 1-on-1 session booking for VIP tier users
 */

const User = require('../models/User');
const AccessControl = require('../services/access-control');

const accessControl = new AccessControl();

/**
 * Show available booking slots for VIP users
 */
async function showBookingSlots(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, 'booking_system');
  
  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const bookingMessage = `👑 VIP 1-on-1 Session Booking

🎯 Capital Clarity Sessions Available:
• Strategic Capital Assessment (90 mins) - $197
• Business Financial Structure Review (60 mins) - $197
• Investment Readiness Evaluation (60 mins) - $197
• Custom Capital Strategy Session (90 mins) - $197

📅 Available Time Slots:
• Monday - Friday: 9:00 AM - 5:00 PM (Cambodia Time)
• Saturday: 9:00 AM - 12:00 PM (Cambodia Time)
• Sunday: By special request only

💰 Capital Clarity Session Framework:
1️⃣ Opening Frame - Set trust and strategic context
2️⃣ Capital X-Ray - Review fund/deal structure and flow
3️⃣ Trust Mapping - Identify relationship breakdowns
4️⃣ System Readiness Score - Grade deployment capabilities
5️⃣ Clarity Prescription - Strategic upgrade roadmap

🎯 Perfect for:
• Founders managing private capital ($100K+ annually)
• Operators with fund structures
• Business owners planning growth funding
• Investors needing structured deployment
• Entrepreneurs seeking capital optimization

📞 How to Book:
1. Choose your preferred session type
2. Select available time slot
3. Process $197 payment
4. Receive calendar invitation and preparation materials

🔥 Popular Sessions:
• Strategic Capital Assessment - Most comprehensive
• Business Financial Structure Review - For business owners
• Investment Readiness Evaluation - For investors

Commands:
• /book_capital_clarity - Strategic Capital Assessment
• /book_business_review - Business Financial Structure Review
• /book_investment_evaluation - Investment Readiness Evaluation
• /book_custom_session - Custom Capital Strategy Session

📧 Direct Contact:
For immediate booking: @Chendasum
Advanced Capital Strategy: Private consultation available`;

  await bot.sendMessage(msg.chat.id, bookingMessage);
}

/**
 * Book Capital Clarity Session (Main)
 */
async function bookCapitalClarity(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, 'booking_system');
  
  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `🏛️ Capital Clarity Session Booking

Session Details:
• Duration: 90 minutes
• Investment: $197
• Focus: Complete capital system diagnosis and optimization
• Outcome: Strategic capital upgrade roadmap

What You'll Get:
✅ Capital Flow and Structure Analysis
✅ Trust Architecture Mapping
✅ System Readiness Scoring
✅ Clarity Prescription with specific recommendations
✅ 30-day implementation support
✅ Strategic upgrade roadmap

Your Information:
• Name: ${user.firstName} ${user.lastName || ''}
• VIP Member since: ${user.paymentDate?.toLocaleDateString() || 'Recently'}
• Telegram: @${user.username || 'N/A'}

Capital Clarity Framework:
1. Opening Frame (10 min) - Set trust and strategic context
2. Capital X-Ray (25 min) - Review fund/deal structure and flow
3. Trust Mapping (20 min) - Identify relationship breakdowns
4. System Readiness Score (20 min) - Grade deployment capabilities
5. Clarity Prescription (15 min) - Strategic upgrade roadmap

📞 To Complete Booking:
Please send the following information:

CAPITAL CLARITY BOOKING
1. Role: [Founder/Operator/Investor]
2. Company: [Name and annual revenue range]
3. Capital Situation: [Brief description of current setup]
4. Main Challenge: [What you need help with]
5. Timeline: [Your investment goals and timeline]
6. Preferred Date & Time: [3 options - example: "Monday 2 PM, Tuesday 10 AM, Wednesday 3 PM"]
7. Contact: [Email and phone number]

Send this information as a message and you'll receive confirmation within 24 hours!

⚠️ Important: This is advanced capital strategy for serious business owners managing significant capital.

🚀 Ready to transform your capital strategy?`;

  await bot.sendMessage(msg.chat.id, bookingMessage);
}

/**
 * Book Business Review Session
 */
async function bookBusinessReview(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, 'booking_system');
  
  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `🏢 Business Financial Structure Review Booking

Session Details:
• Duration: 60 minutes
• Investment: $197
• Focus: Business financial structure optimization
• Outcome: Streamlined business financial systems

What You'll Get:
✅ Business cash flow analysis
✅ Cost structure optimization
✅ Revenue stream evaluation
✅ Financial system recommendations
✅ Implementation timeline
✅ Capital readiness assessment

Your Information:
• Name: ${user.firstName} ${user.lastName || ''}
• VIP Member since: ${user.paymentDate?.toLocaleDateString() || 'Recently'}
• Telegram: @${user.username || 'N/A'}

📞 To Complete Booking:
Please send the following information:

BUSINESS REVIEW BOOKING
1. Business Type: [Industry and business model]
2. Revenue Range: [Monthly/annual revenue]
3. Team Size: [Number of employees]
4. Main Challenge: [Current financial challenges]
5. Goals: [What you want to achieve]
6. Preferred Date & Time: [3 options]
7. Contact: [Email and phone number]

Send this information as a message and you'll receive confirmation within 24 hours!

📈 Ready to optimize your business financial structure?`;

  await bot.sendMessage(msg.chat.id, bookingMessage);
}

/**
 * Book Investment Evaluation Session
 */
async function bookInvestmentEvaluation(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, 'booking_system');
  
  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `💎 Investment Readiness Evaluation Booking

Session Details:
• Duration: 60 minutes
• Investment: $197
• Focus: Investment readiness and capital deployment
• Outcome: Investment strategy roadmap

What You'll Get:
✅ Investment readiness assessment
✅ Risk tolerance evaluation
✅ Capital deployment opportunities
✅ Portfolio recommendations
✅ LP (Limited Partner) readiness evaluation
✅ Next steps guidance

Your Information:
• Name: ${user.firstName} ${user.lastName || ''}
• VIP Member since: ${user.paymentDate?.toLocaleDateString() || 'Recently'}
• Telegram: @${user.username || 'N/A'}

📞 To Complete Booking:
Please send the following information:

INVESTMENT EVALUATION BOOKING
1. Investment Experience: [Current level and background]
2. Capital Available: [Investment amount range]
3. Risk Tolerance: [Conservative/Moderate/Aggressive]
4. Investment Goals: [What you want to achieve]
5. Timeline: [Investment timeline and objectives]
6. Preferred Date & Time: [3 options]
7. Contact: [Email and phone number]

Send this information as a message and you'll receive confirmation within 24 hours!

🚀 Ready to start your strategic investment journey?`;

  await bot.sendMessage(msg.chat.id, bookingMessage);
}

/**
 * Book Custom Session
 */
async function bookCustomSession(msg, bot) {
  const access = await accessControl.checkAccess(msg.from.id, 'booking_system');
  
  if (!access.hasAccess) {
    await bot.sendMessage(msg.chat.id, access.message);
    return;
  }

  const user = access.user;
  const bookingMessage = `🎨 Custom Capital Strategy Session Booking

Session Details:
• Duration: 90 minutes
• Investment: $197
• Focus: Customized to your specific capital needs
• Outcome: Personalized capital strategy

What You'll Get:
✅ Customized session agenda
✅ Focused capital problem-solving
✅ Specific strategic recommendations
✅ Actionable implementation steps
✅ Follow-up support
✅ Network introductions (if applicable)

Your Information:
• Name: ${user.firstName} ${user.lastName || ''}
• VIP Member since: ${user.paymentDate?.toLocaleDateString() || 'Recently'}
• Telegram: @${user.username || 'N/A'}

📞 To Complete Booking:
Please send the following information:

CUSTOM SESSION BOOKING
1. Specific Focus: [What capital topic you want to focus on]
2. Current Situation: [Your current capital/business situation]
3. Main Challenge: [Specific problem you're facing]
4. Expected Outcome: [What you want to achieve]
5. Timeline: [When you need results]
6. Preferred Date & Time: [3 options]
7. Contact: [Email and phone number]

Send this information as a message and you'll receive confirmation within 24 hours!

🎯 Ready for a personalized capital strategy session?`;

  await bot.sendMessage(msg.chat.id, bookingMessage);
}

module.exports = {
  showBookingSlots,
  bookCapitalClarity,
  bookBusinessReview,
  bookInvestmentEvaluation,
  bookCustomSession
};