const User = require("../models/User");
const Progress = require("../models/Progress");
const celebrations = require("../services/celebrations");

async function info(msg, bot) {
  const vipMessage = `🏆 VIP Capital Strategy - $197

🎯 Capital Foundation Development:
✅ ពិនិត្យស្ថានភាពមូលធនបច្ចុប្បន្ន
✅ វាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគកម្រិតខ្ពស់
✅ បង្កើតមូលដ្ឋានសម្រាប់ការវិនិយោគឯកជន
✅ ត្រៀមខ្លួនសម្រាប់ការអភិវឌ្ឍន៍ពាណិជ្ជកម្ម
✅ រៀបចំផែនការទាក់ទាញវិនិយោគិន
✅ ការណែនាំបណ្តាញវិនិយោគិន

🏛️ Capital Clarity Session (៩០ នាទី):
• Opening Frame - ការកំណត់យុទ្ធសាស្ត្រ
• Capital X-Ray - ការវិភាគរចនាសម្ព័ន្ធមូលធន
• Trust Mapping - ការវាយតម្លៃទំនុកចិត្ត
• System Readiness Score - ការវាយតម្លៃភាពត្រៀមខ្លួន
• Clarity Prescription - ផែនការយុទ្ធសាស្ត្រ

✅ រួមបញ្ចូល:
• មានទាំងអស់ពី Premium Program
• 30-Day Implementation Support
• Private Capital Network Access
• VIP Priority Support

💼 សមសម្រាប់:
- អ្នកគ្រប់គ្រងដែលមានមូលធនធំ
- ម្ចាស់អាជីវកម្មចង់ស្វែងរកមូលនិធិ
- ពាណិជ្ជករដែលកំពុងអភិវឌ្ឍន៍ប្រព័ន្ធ
- អ្នកអាជីវកម្មចង់គ្រប់គ្រងមូលធនប្រកបដោយប្រសិទ្ធភាព

🎯 VIP Network Benefits:
• Access to exclusive opportunities
• Private capital network connections
• Invitation-only programs
• Advanced strategy access (by qualification)

🎯 ត្រៀមរួចសម្រាប់ VIP Capital Strategy?
ចង់ចូលរួម? សរសេរ "VIP APPLY"`;

  await bot.sendMessage(msg.chat.id, vipMessage);
}

async function apply(msg, bot) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  try {
    // Check if user completed main program
    const progress = await Progress.findOne({ userId: userId });
    if (!progress || !progress.programCompleted) {
      await bot.sendMessage(
        chatId,
        "សូមបញ្ចប់កម្មវិធី 7-Day Reset មុននឹងចូលរួម VIP Program",
      );
      return;
    }
    
    const applicationMessage = `🏆 VIP Capital Strategy Application

សូមផ្តល់ព័ត៌មានខាងក្រោម:

1. Business Information:
   • ឈ្មោះក្រុមហ៊ុន និងតួនាទី
   • ស្ថានភាពចំណូល/មូលធនបច្ចុប្បន្ន
   
2. Capital Goals:
   • តើអ្នកចង់សម្រេចនូវអ្វីក្នុងរយៈពេល 30 ថ្ងៃ?
   • បញ្ហាប្រឈម Capital Management ដែលអ្នកកំពុងប្រឈម
   
3. Investment Readiness:
   • តើតម្លៃ $197 សមស្របនឹងការវិនិយោគដើម្បីអនាគតរបស់អ្នក?
   • ត្រៀមខ្លួនសម្រាប់ Advanced Capital Strategy?
   
4. Commitment Level:
   • តើអ្នកមានពេលវេលាប្រចាំសប្តាហ៍ 5-7 ម៉ោងសម្រាប់កម្មវិធីនេះ?
   
5. Qualification:
   • មូលហេតុអ្វីដែលធ្វើឱ្យអ្នកស័ក្តិសមសម្រាប់ VIP Capital Strategy?
   • តើអ្នកកំពុងគ្រប់គ្រង Business Capital ឬស្វែងរកមូលនិធិលូតលាស់?

សូមឆ្លើយទាំងអស់ក្នុង message តែមួយ។

🔍 Next Steps:
- Application Review (24 ម៉ោង)
- Qualification Call (បើអនុម័ត)
- VIP Program Access

👥 VIP Limit: 20 នាក់/ខែ
⏰ Application Deadline: 5 ថ្ងៃ

⚠️ សម្គាល់: នេះជា Advanced Capital Strategy មិនមែន Basic Financial Planning។`;

    await bot.sendMessage(chatId, applicationMessage);
    
    // Notify admin about VIP application
    const adminId = process.env.ADMIN_CHAT_ID;
    await bot.sendMessage(adminId, `🏆 NEW VIP APPLICATION:
    
User: ${msg.from.first_name || 'Unknown'} (${userId})
Time: ${new Date().toLocaleString()}
Program: VIP Capital Strategy ($197)

User is filling out application form.`);
    
  } catch (error) {
    console.error("Error in VIP apply:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

async function offer(msg, bot) {
  const vipCelebration = `🏆 Special Opportunity - VIP Capital Strategy

💎 VIP Capital Strategy Program
- Regular Price: $297
- Your Price: $197 (-33%)
- Limited Time: 48 ម៉ោង!

🚀 Why Join VIP Capital Strategy:
✅ Strategic Foundation Session 1-on-1 (៩០ នាទី)
✅ Capital Readiness Assessment
✅ 30-Day Tracking + Implementation Support
✅ Capital Optimization Strategy
✅ Path to Capital Clarity Sessions
✅ Private Capital Network Access

🏛️ Perfect For:
- Founders ស្វែងរកការធ្វើអោយមូលធនប្រសើរ
- Business Operators រៀបចំផែនការរកមូលនិធិលូតលាស់
- Entrepreneurs កសាងប្រព័ន្ធអាចពង្រីកបាន

⏰ Offer Expires: 48 ម៉ោង (${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString("km-KH")})
👥 Limited Spots: 20 នាក់/ខែ
🔥 Remaining: 17 នាក់

Want to know more? /vip_program_info
Ready to apply? សរសេរ "VIP APPLY"`;

  await bot.sendMessage(msg.chat.id, vipCelebration);
}

async function capitalClarity(msg, bot) {
  const firstName = msg.from.first_name || 'Friend';
  
  const clarityResponse = `🏛️ Capital Clarity Session - Private Capital Strategy

Hello ${firstName}!

🎯 What is a Capital Clarity Session?

A structured, private strategy session designed to:
• Diagnose where your capital system is blocked or leaking
• Clarify how your deals and investor relationships operate  
• Identify trust gaps and deployment risks
• Prescribe clear upgrade path with structured methodology

💰 Investment: $197 (Regular: $497) - Limited 5 spots/month

🔍 Core Analysis Framework:
1️⃣ Opening Frame - ការកំណត់យុទ្ធសាស្ត្រ
2️⃣ Capital X-Ray - ការវិភាគរចនាសម្ព័ន្ធមូលធន
3️⃣ Trust Mapping - ការវាយតម្លៃទំនុកចិត្ត
4️⃣ System Readiness Score - ការវាយតម្លៃភាពត្រៀមខ្លួន
5️⃣ Clarity Prescription - ផែនការយុទ្ធសាស្ត្រ

🎯 Perfect for:
- Founders managing private capital ($100K+ annually)
- Operators with fund structures
- Business owners planning growth funding
- Investors needing structured deployment
- Entrepreneurs seeking capital optimization

📋 To Qualify, Please Provide:
1. Your role (Founder/Operator/Investor)
2. Company name and revenue range
3. Current capital/fund situation
4. Main structural challenge
5. Investment timeline
6. Contact details (email/phone)

🇰🇭 Cambodia Focus: យើងយល់ដឹងអំពី local business structures, banking systems, និង growth opportunities។

⚠️ Important: This is advanced capital strategy for serious business owners managing significant capital.

Ready to optimize your capital system? Please provide qualification details above.

Questions? Contact @Chendasum directly.`;

  await bot.sendMessage(msg.chat.id, clarityResponse);
  
  // Notify admin
  const adminId = process.env.ADMIN_CHAT_ID;
  if (adminId) {
    await bot.sendMessage(adminId, `🏛️ NEW CAPITAL CLARITY INTEREST:
    
User: ${firstName} (${msg.from.id})
Time: ${new Date().toLocaleString()}
Type: Private Capital Strategy Session ($197)

Advanced prospect interested in capital structure optimization.

User needs to provide qualification information.`);
  }
}

module.exports = { info, apply, offer, capitalClarity };
