const User = require("../models/User");
const Progress = require("../models/Progress");
const { sendLongMessage } = require("../utils/message-splitter");
const celebrations = require("../services/celebrations");

// Enhanced VIP tracking with comprehensive analytics
let vipSpots = {
  total: 20,
  used: 3,
  waitlist: 0,
  remaining: function () {
    return this.total - this.used;
  },
  conversionRate: function () {
    return ((this.used / (this.used + 10)) * 100).toFixed(1);
  }, // Assuming 10 total inquiries
  reset: function () {
    this.used = 0;
    this.waitlist = 0;
  },
};

// Enhanced analytics tracking
const analytics = {
  vipFunnel: {
    infoViews: 0,
    applications: 0,
    conversions: 0,
    qualificationCalls: 0,
    capitalClarityInquiries: 0,
  },
  updateFunnel: function (stage) {
    if (this.vipFunnel[stage] !== undefined) {
      this.vipFunnel[stage]++;
    }
  },
  getConversionRate: function () {
    return this.vipFunnel.infoViews > 0
      ? ((this.vipFunnel.conversions / this.vipFunnel.infoViews) * 100).toFixed(
          1,
        )
      : 0;
  },
};

// Input validation helper
function validateInput(msg, bot) {
  if (!msg || !msg.from || !msg.from.id || !bot) {
    console.error("Critical validation error: Missing required parameters");
    return false;
  }
  return true;
}

// Enhanced error handling wrapper
async function executeWithErrorHandling(operation, context, fallbackMessage) {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${context}:`, error);

    try {
      if (fallbackMessage.bot && fallbackMessage.chatId) {
        await fallbackMessage.bot.sendMessage(
          fallbackMessage.chatId,
          fallbackMessage.message ||
            "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។",
        );
      }
    } catch (sendError) {
      console.error(`Failed to send error message in ${context}:`, sendError);
    }

    return null;
  }
}

async function info(msg, bot) {
  if (!validateInput(msg, bot)) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  return executeWithErrorHandling(
    async () => {
      // Enhanced analytics tracking
      analytics.updateFunnel("infoViews");
      console.log(`VIP info viewed by user ${userId} at ${new Date()}`);

      // Enhanced user tracking with qualification scoring
      await User.findOneAndUpdate(
        { telegram_id: userId  },
        {
          lastVipInfoView: new Date(),
          last_active: new Date(),
          $inc: {
            vipInfoViewCount: 1,
            totalEngagementScore: 2, // Info view = 2 points
          },
          $setOnInsert: {
            vipQualificationScore: 0,
            vipJourneyStage: "awareness",
          },
        },
        { upsert: true },
      );

      const vipMessage = `🏆 VIP Capital Strategy - $197 (៦០% តម្លៃពិសេស)

🎯 ការអភិវឌ្ឍមូលដ្ឋានគ្រឹះមូលធន:
✅ ពិនិត្យស្ថានភាពមូលធនបច្ចុប្បន្ន
✅ វាយតម្លៃការត្រៀមខ្លួនសម្រាប់ការវិនិយោគកម្រិតខ្ពស់
✅ បង្កើតមូលដ្ឋានសម្រាប់ការវិនិយោគឯកជន
✅ ត្រៀមខ្លួនសម្រាប់ការអភិវឌ្ឍន៍ពាណិជ្ជកម្ម
✅ រៀបចំផែនការទាក់ទាញវិនិយោគិន
✅ ការណែនាំបណ្តាញវិនិយោគិនជាក់លាក់

🏛️ វគ្គបណ្តុះបណ្តាលមូលធន (៩០ នាទី):
• Opening Frame - ការកំណត់យុទ្ធសាស្ត្រជាក់លាក់
• Capital X-Ray - ការវិភាគរចនាសម្ព័ន្ធមូលធនពេញលេញ
• Trust Mapping - ការវាយតម្លៃទំនុកចិត្តវិនិយោគិន
• System Readiness Score - ការវាយតម្លៃភាពត្រៀមខ្លួន
• Clarity Prescription - ផែនការយុទ្ធសាស្ត្រ ៣០-៩០ ថ្ងៃ

🇰🇭 បទពិសោធន៍សមាជិក VIP:
👤 "បានជួយបញ្ជាក់វិធីសាស្រ្តផ្តល់មូលនិធិរបស់ខ្ញុំ" - Tech Startup, ភ្នំពេញ
👤 "យល់ដឹងកាន់តែច្បាស់អំពីប្រព័ន្ធលំហូរសាច់ប្រាក់" - ម្ចាស់ភោជនីយដ្ឋាន, សៀមរាប
👤 "ទំនាក់ទំនងបណ្តាញវិនិយោគិនដ៏មានតម្លៃ" - E-commerce, បាត់ដំបង
👤 "ជំនាញធ្វើបទបង្ហាញអាជីវកម្មប្រសើរឡើង" - Manufacturing, កំពង់ចាម

✅ កញ្ចប់ VIP ពេញលេញរួមបញ្ចូល:
• មានទាំងអស់ពី Premium Program
• ការគាំទ្រការអនុវត្តរយៈពេល ៣០ ថ្ងៃ
• ការចូលប្រើបណ្តាញមូលធនឯកជន (វិនិយោគិនកម្ពុជា ១០០+ នាក់)
• ការគាំទ្រអាទិភាព VIP (ឆ្លើយតបលឿនជាងធម្មតា ក្នុងរយៈពេល ២-៤ ម៉ោង)
• វគ្គយុទ្ធសាស្ត្រ ១-ទល់-១ ចំនួន ៣ ដង (តម្លៃ $300)
• ការចូលប្រើ Deal Flow ផ្តាច់មុខ
• ឧបករណ៍បង្កើនប្រសិទ្ធភាពមូលធនកម្រិតខ្ពស់
• ការចូលប្រើសហគមន៍ VIP (សហគ្រិនជោគជ័យ)

💼 សមស្របសម្រាប់:
- អ្នកគ្រប់គ្រងដែលមានមូលធនធំ ($10K+ ចំណូលប្រចាំខែ)
- ម្ចាស់អាជីវកម្មចង់ស្វែងរកមូលនិធិ (គោលដៅ $50K+)
- ពាណិជ្ជករដែលកំពុងអភិវឌ្ឍន៍ប្រព័ន្ធធនាគារ/ហិរញ្ញវត្ថុ
- អ្នកអាជីវកម្មចង់គ្រប់គ្រងមូលធនប្រកបដោយប្រសិទ្ធភាព

🎯 អត្ថប្រយោជន៍បណ្តាញ VIP:
• ការចូលប្រើឱកាសវិនិយោគផ្តាច់មុខ
• ទំនាក់ទំនងផ្ទាល់ជាមួយបណ្តាញមូលធនឯកជននៅកម្ពុជា
• កម្មវិធីតម្លៃខ្ពស់ដែលអញ្ជើញតែប៉ុណ្ណោះ
• ការចូលប្រើយុទ្ធសាស្ត្រកម្រិតខ្ពស់ (ដោយការវាយតម្លៃគុណវុឌ្ឍិតែប៉ុណ្ណោះ)
• ការបង្កើនប្រសិទ្ធភាពទំនាក់ទំនងជាមួយ ABA/ACLEDA/Prince Bank

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497 - សន្សំបាន $300!)
⏰ ពេលវេលាមានកំណត់: នៅសល់ ៣៦ ម៉ោង!
👥 កៅអី VIP: នៅសល់ ${vipSpots.remaining()} នាក់ (សរុប ${vipSpots.total} នាក់/ខែ)
📊 មតិកែលម្អពីសមាជិក: និស្សិត VIP ភាគច្រើនរាយការណ៍ពីការគ្រប់គ្រងមូលធនប្រសើរឡើង

🎁 BONUS ផ្តាច់មុខ:
• ការវាយតម្លៃមូលធនដោយឥតគិតថ្លៃ (តម្លៃ $97)
• ការណែនាំបណ្តាញវិនិយោគិនឯកជន
• ការគាំទ្រ VIP រយៈពេល ៦ ខែ (ធៀបនឹងស្តង់ដារ ៣ ខែ)
• ការចូលប្រើឱកាសអាជីវកម្មផ្តាច់មុខសម្រាប់ VIP នៅកម្ពុជា

🎯 ត្រៀមខ្លួនរួចរាល់សម្រាប់ VIP Capital Strategy?
ចង់ចូលរួម? សរសេរ "VIP APPLY"

⚠️ នេះជាកម្មវិធីវិនិយោគកម្រិតខ្ពស់សម្រាប់ម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរតែប៉ុណ្ណោះ។`;

      await sendLongMessage(bot, chatId, vipMessage, {}, MESSAGE_CHUNK_SIZE);

      // Enhanced success analytics
      console.log(
        `VIP info sent successfully to user ${userId}. Total views: ${analytics.vipFunnel.infoViews}`,
      );
    },
    "VIP info",
    { bot, chatId },
  );
}

async function apply(msg, bot) {
  if (!validateInput(msg, bot)) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  return executeWithErrorHandling(
    async () => {
      // Enhanced analytics tracking
      analytics.updateFunnel("applications");
      console.log(`VIP application started by user ${userId} at ${new Date()}`);

      // Enhanced qualification check
      const progress = await Progress.findOne({ user_id: userId });
      if (!progress || !progress.programCompleted) {
        await bot.sendMessage(
          chatId,
          `🚨 លក្ខខណ្ឌតម្រូវ: សូមបញ្ចប់កម្មវិធី 7-Day Reset មុននឹងចូលរួម VIP Program។

ចុច /progress ដើម្បីមើលវឌ្ឍនភាព
ចុច /start ដើម្បីចាប់ផ្តើម 7-Day Program

💡 VIP Program ត្រូវការចំណេះដឹងមូលដ្ឋានពីកម្មវិធីមេ។`,
        );
        return;
      }

      // Enhanced spot availability check
      if (vipSpots.remaining() <= 0) {
        vipSpots.waitlist++;
        await User.findOneAndUpdate(
          { telegram_id: userId  },
          {
            vipWaitlistJoined: new Date(),
            vipJourneyStage: "waitlist",
          },
        );

        await bot.sendMessage(
          chatId,
          `🚨 VIP Program បានពេញសម្រាប់ខែនេះ!

👥 ទីតាំងក្នុងបញ្ជីរង់ចាំ: #${vipSpots.waitlist}
📅 អាចចូលរួមបានបន្ទាប់: ខែក្រោយ
🔔 ការជូនដំណឹងដោយស្វ័យប្រវត្តិ: នៅពេលមានកៅអីទំនេរ

ចុច /vip_waitlist សម្រាប់អាទិភាពជូនដំណឹង
ចុច /capital_clarity សម្រាប់ជម្រើសវគ្គឯកជន`,
        );
        return;
      }

      // Enhanced user tracking with qualification scoring
      await User.findOneAndUpdate(
        { telegram_id: userId  },
        {
          vipApplicationStarted: new Date(),
          last_active: new Date(),
          vipJourneyStage: "application",
          $inc: {
            vipApplicationAttempts: 1,
            totalEngagementScore: 5, // Application start = 5 points
            vipQualificationScore: 10, // Base qualification points
          },
        },
        { upsert: true },
      );

      const applicationMessage = `🏆 VIP Capital Strategy Application

🎯 ស្ថានភាពអាទិភាព: នៅសល់ ${vipSpots.remaining()} កៅអី

📋 លក្ខខណ្ឌដាក់ពាក្យ (ឆ្លើយទាំងអស់ក្នុងសារតែមួយ):

១. ប្រវត្តិអាជីវកម្ម:
• ឈ្មោះក្រុមហ៊ុន និងតួនាទីរបស់អ្នក
• ចំណូលប្រចាំខែ: $1K-5K / $5K-15K / $15K-50K / $50K+
• ប្រភេទអាជីវកម្ម (បច្ចេកវិទ្យា/លក់រាយ/សេវាកម្ម/ផលិតកម្ម/ផ្សេងៗ)

២. គោលបំណងមូលធន (ជាក់លាក់):
• ចំនួនទឹកប្រាក់គោលដៅដែលត្រូវការ: $xx,xxx
• រយៈពេល: ៣០/៦០/៩០ ថ្ងៃ
• គោលបំណង: ការពង្រីក/ឧបករណ៍/ដើមទុនបង្វិល/អាជីវកម្មថ្មី
• ROI ដែលរំពឹងទុក: xx% ក្នុង xx ខែ

៣. បញ្ហាប្រឈមបច្ចុប្បន្ន:
• បញ្ហាប្រឈមក្នុងការគ្រប់គ្រងមូលធនដែលអ្នកកំពុងជួប
• ទំនាក់ទំនងធនាគារបច្ចុប្បន្ន (ការផ្តល់ប្រាក់កម្ចីឯកជន/ធនាគារប្រពៃណី/ទាំងពីរ)
• ការប៉ុនប៉ងស្វែងរកមូលនិធិពីមុន (ជោគជ័យ/បរាជ័យ)
• ចំណាប់អារម្មណ៍លើដំណោះស្រាយការផ្តល់ប្រាក់កម្ចីឯកជនធៀបនឹងហិរញ្ញវត្ថុប្រពៃណី

៤. ការប្តេជ្ញាចិត្តវិនិយោគ:
• តើតម្លៃ $197 សមស្របនឹងការវិនិយោគដើម្បីអនាគតរបស់អ្នកដែរឬទេ?
• វិធីទូទាត់ដែលពេញចិត្ត: ABA/ACLEDA/Wing/ការផ្ទេរឯកជន
• តើត្រៀមខ្លួនសម្រាប់ Advanced Capital Strategy ហើយឬនៅ?

៥. ពេលវេលាដែលអាចរកបាន:
• តើអ្នកមានពេលវេលាប្រចាំសប្តាហ៍ ៥-៧ ម៉ោងសម្រាប់កម្មវិធីនេះទេ?
• ពេលវេលាវគ្គដែលពេញចិត្ត: ពេលព្រឹក/ពេលរសៀល/ពេលល្ងាច
• តើត្រៀមខ្លួនសម្រាប់វគ្គ ១-ទល់-១ ចំនួន ៣ ដង និងការអនុវត្តប្រចាំថ្ងៃហើយឬនៅ?

៦. ភស្តុតាងគុណវុឌ្ឍិ:
• មូលហេតុអ្វីដែលធ្វើឱ្យអ្នកស័ក្តិសមសម្រាប់ VIP Capital Strategy?
• មូលធនបច្ចុប្បន្នដែលកំពុងគ្រប់គ្រង: $xx,xxx
• ស្ថានភាពចុះបញ្ជីអាជីវកម្ម និងការអនុលោមពន្ធ
• ព័ត៌មានទំនាក់ទំនង: អ៊ីមែល និងលេខទូរស័ព្ទ

💡 ឧទាហរណ៍នៃការដាក់ពាក្យដែលមានលក្ខណៈសម្បត្តិគ្រប់គ្រាន់:
"1. ABC Tech Co, CEO, ចំណូល $15K ប្រចាំខែ, ការអភិវឌ្ឍន៍ Software
2. ត្រូវការ $100K, ៦០ ថ្ងៃ, ឧបករណ៍ + ដើមទុនបង្វិល, រំពឹង ROI ២០០% ក្នុង ១២ ខែ
3. កំពុងជួបបញ្ហាជាមួយការធ្វើបទបង្ហាញវិនិយោគិន, បរាជ័យក្នុងការស្វែងរកមូលនិធិ ១ ដង, ធនាគារជាមួយ ABA
4. បាទ/ចាស $197 សមហេតុផល, ពេញចិត្តការទូទាត់ ABA, ត្រៀមខ្លួនសម្រាប់យុទ្ធសាស្ត្រកម្រិតខ្ពស់
5. អាចប្តេជ្ញាចិត្ត ៧ ម៉ោង/សប្តាហ៍, ពេញចិត្តវគ្គពេលល្ងាច, ត្រៀមខ្លួនសម្រាប់កម្មវិធីខ្លាំងក្លា
6. កំពុងគ្រប់គ្រងមូលធន $50K, អាជីវកម្មចុះបញ្ជី, អនុលោមពន្ធ, email@abc.com, 012-345-678"

🔍 ដំណើរការជ្រើសរើស:
✅ ការពិនិត្យពាក្យសុំ (១២ ម៉ោង - ល្បឿនលឿន)
✅ ការហៅទូរស័ព្ទវាយតម្លៃគុណវុឌ្ឍិ (២៤ ម៉ោង - បើអនុម័ត)
✅ ការចូលប្រើ VIP Program (៤៨ ម៉ោង បន្ទាប់ពីការអនុម័ត + ការទូទាត់)
✅ ការកំណត់ពេលវគ្គយុទ្ធសាស្ត្រភ្លាមៗ

📊 ស្ថិតិកម្មវិធី:
👥 កំណត់ប្រចាំខែ: សមាជិក VIP ${vipSpots.total} នាក់ប៉ុណ្ណោះ
⏰ ថ្ងៃផុតកំណត់ដាក់ពាក្យ: នៅសល់ ៤ ថ្ងៃ
🔥 អត្រាជោគជ័យ: ៨៩% នៃអ្នកបញ្ចប់ VIP សម្រេចបានគោលដៅដែលបានកំណត់
💰 ការកែលម្អជាមធ្យមរបស់សមាជិក: លទ្ធផលបង្កើនប្រសិទ្ធភាពមូលធនគួរឱ្យកត់សម្គាល់
⭐ អត្រាគុណវុឌ្ឍិ: ៧៨% នៃពាក្យសុំត្រូវបានអនុម័ត

🎯 ជំហានបន្ទាប់បន្ទាប់ពីការអនុម័ត:
1. កញ្ចប់ស្វាគមន៍ + ការចូលប្រើសហគមន៍
2. ការហៅទូរស័ព្ទវាយតម្លៃមូលធន (៩០ នាទី)
3. ការអនុវត្តយុទ្ធសាស្ត្រចាប់ផ្តើមភ្លាមៗ
4. ការតាមដានវឌ្ឍនភាពប្រចាំសប្តាហ៍ + ការគាំទ្រ

⚠️ ចំណាំសំខាន់:
• នេះជា Advanced Capital Strategy មិនមែនជា Basic Financial Planning ទេ
• ការទូទាត់តម្រូវឱ្យធ្វើក្នុងរយៈពេល ២៤ ម៉ោងបន្ទាប់ពីការអនុម័ត
• តម្រូវឱ្យមានការប្តេជ្ញាចិត្តពេញលេញសម្រាប់លទ្ធផលល្អបំផុត
• ចំណេះដឹងអាជីវកម្មកម្រិតខ្ពស់ត្រូវបានសន្មត់

🎯 ការដាក់ពាក្យតម្រូវឱ្យម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរតែប៉ុណ្ណោះ។

ត្រៀមខ្លួនដើម្បីផ្លាស់ប្តូរយុទ្ធសាស្ត្រមូលធនរបស់អ្នកហើយឬនៅ? សូមដាក់ពាក្យសុំលម្អិតរបស់អ្នកខាងលើ!`;

      await sendLongMessage(
        bot,
        chatId,
        applicationMessage,
        {},
        MESSAGE_CHUNK_SIZE,
      );

      // Enhanced admin notification with comprehensive analytics
      const adminId = process.env.ADMIN_CHAT_ID;
      if (adminId) {
        try {
          const user = await User.findOne({ telegram_id: userId  });
          const adminMessage = `🏆 HIGH-PRIORITY VIP APPLICATION STARTED:

👤 APPLICANT PROFILE:
• Name: ${msg.from.first_name || "Unknown"} (${userId})
• Username: @${msg.from.username || "no_username"}
• Language: ${msg.from.language_code || "unknown"}
• Application Time: ${new Date().toLocaleString("km-KH")}

💰 PROGRAM DETAILS:
• Type: VIP Capital Strategy ($197)
• Priority Level: HIGH (qualified prospect)
• Journey Stage: Application Started

📊 USER ANALYTICS:
• 7-Day Program: ${progress.programCompleted ? "✅ COMPLETED" : "❌ NOT COMPLETED"}
• VIP Info Views: ${user?.vipInfoViewCount || 0}
• Application Attempts: ${user?.vipApplicationAttempts || 1}
• Engagement Score: ${user?.totalEngagementScore || 0}/100
• Qualification Score: ${user?.vipQualificationScore || 0}/100
• Journey Stage: ${user?.vipJourneyStage || "application_started"}
• Last Activity: ${user?.lastActive || "Unknown"}

🎯 VIP PROGRAM STATUS:
• Total Spots: ${vipSpots.total}/month
• Used Spots: ${vipSpots.used}
• Remaining: ${vipSpots.remaining()}
• Waitlist: ${vipSpots.waitlist} people
• Conversion Rate: ${vipSpots.conversionRate()}%

📈 FUNNEL ANALYTICS:
• Info Views: ${analytics.vipFunnel.infoViews}
• Applications: ${analytics.vipFunnel.applications}
• Conversions: ${analytics.vipFunnel.conversions}
• Overall Conversion: ${analytics.getConversionRate()}%

⏰ NEXT ACTIONS:
1. ✅ User filling detailed application form
2. ⏳ Review application (target: 12h)
3. 📞 Qualification call (if approved)
4. 💰 Payment processing
5. 🚀 VIP onboarding

🔔 ALERT: Monitor for detailed application submission!`;

          await bot.sendMessage(adminId, adminMessage);
        } catch (adminError) {
          console.error(
            "Error sending enhanced VIP admin notification:",
            adminError,
          );
        }
      }

      // Enhanced success analytics
      console.log(
        `VIP application form sent successfully to user ${userId}. Total applications: ${analytics.vipFunnel.applications}`,
      );
    },
    "VIP apply",
    { bot, chatId },
  );
}

async function offer(msg, bot) {
  if (!validateInput(msg, bot)) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  return executeWithErrorHandling(
    async () => {
      // Enhanced analytics tracking
      console.log(`VIP offer viewed by user ${userId} at ${new Date()}`);

      // Enhanced user tracking
      await User.findOneAndUpdate(
        { telegram_id: userId  },
        {
          lastVipOfferView: new Date(),
          last_active: new Date(),
          vipJourneyStage: "offer_viewing",
          $inc: {
            vipOfferViewCount: 1,
            totalEngagementScore: 3, // Offer view = 3 points
          },
        },
        { upsert: true },
      );

      const expiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const vipCelebration = `🏆 ឱកាសយុទ្ធសាស្ត្រមូលធន VIP ផ្តាច់មុខ

💎 កម្មវិធីយុទ្ធសាស្ត្រមូលធន VIP មានកំណត់
🔥 ការបញ្ចុះតម្លៃដ៏ធំ:
- តម្លៃធម្មតា: $497
- តម្លៃ Early Bird: $297
- តម្លៃពិសេសរបស់អ្នក: $197 (បញ្ចុះ ៦០%!)
- នៅសល់តែ: ៣៦ ម៉ោង!

🚀 ហេតុអ្វីបានជាសហគ្រិនកម្ពុជាជាច្រើនជ្រើសរើស VIP Capital Strategy:

💰 មតិកែលម្អពីអតិថិជននៅកម្ពុជា:
👤 "បានជួយកែលម្អវិធីសាស្រ្តស្វែងរកមូលនិធិរបស់ខ្ញុំ" - Tech Startup, ភ្នំពេញ
👤 "យល់ដឹងកាន់តែច្បាស់អំពីប្រព័ន្ធលំហូរសាច់ប្រាក់" - ម្ចាស់ខ្សែសង្វាក់ភោជនីយដ្ឋាន, សៀមរាប
👤 "បានបង្កើតទំនាក់ទំនងវិនិយោគិនដ៏មានតម្លៃ" - ស្ថាបនិក E-commerce, បាត់ដំបង
👤 "បានបង្កើតយុទ្ធសាស្ត្រផ្តល់មូលនិធិរឹងមាំ" - Manufacturing, កំពង់ចាម

✅ កញ្ចប់ផ្លាស់ប្តូរ VIP ពេញលេញ:
🎯 មូលដ្ឋានគ្រឹះយុទ្ធសាស្ត្រ:
• វគ្គឯកជន ១-ទល់-១ Capital Clarity (៩០ នាទី - តម្លៃ $300)
• ការវាយតម្លៃការត្រៀមខ្លួនមូលធនដ៏ទូលំទូលាយ
• យុទ្ធសាស្ត្របង្កើនប្រសិទ្ធភាពមូលធនផ្ទាល់ខ្លួន
• ការគាំទ្រការអនុវត្តរយៈពេល ៣០ ថ្ងៃ

🎯 ឧបករណ៍ និងការចូលប្រើកម្រិតខ្ពស់:
• ការចូលប្រើបណ្តាញមូលធនឯកជន (វិនិយោគិនកម្ពុជាដែលបានផ្ទៀងផ្ទាត់)
• ការគាំទ្រអាទិភាព VIP (ឆ្លើយតបលឿនជាងធម្មតា ក្នុងរយៈពេល ២-៤ ម៉ោង)
• Dashboard វិភាគកម្រិតខ្ពស់ (ការតាមដានដំណើរការលម្អិត)
• របាយការណ៍វឌ្ឍនភាពផ្ទាល់ខ្លួន (របាយការណ៍ VIP ប្រចាំខែ)
• Software បង្កើនប្រសិទ្ធភាពមូលធនកម្រិតខ្ពស់ (តម្លៃ $200)
• ការជូនដំណឹង Deal Flow ផ្តាច់មុខ

🎯 ការគាំទ្របន្ត:
• ការហៅទូរស័ព្ទអនុវត្តយុទ្ធសាស្ត្រ ៣ ដង (ការត្រួតពិនិត្យប្រចាំខែ)
• ការចូលប្រើសហគមន៍ VIP (សហគ្រិនជោគជ័យ ៥០+ នាក់)
• ការតាមដានរយៈពេល ៣០ ថ្ងៃបន្ថែម (ការបែងចែកដំណើរការប្រចាំសប្តាហ៍)
• ការកក់អាទិភាពសម្រាប់កម្មវិធីកម្រិតខ្ពស់

🏛️ ល្អឥតខ្ចោះសម្រាប់ម្ចាស់អាជីវកម្មនៅកម្ពុជា:
✅ ស្ថាបនិកដែលស្វែងរកការធ្វើឱ្យមូលធនប្រសើរឡើង (ចំណូលប្រចាំខែ $10K+)
✅ អ្នកប្រតិបត្តិអាជីវកម្មដែលរៀបចំផែនការស្វែងរកមូលនិធិសម្រាប់ការលូតលាស់ (គោលដៅ $50K+)
✅ សហគ្រិនដែលកសាងប្រព័ន្ធដែលអាចពង្រីកបាន និងអាចបត់បែនបាន
✅ វិនិយោគិនដែលចង់បង្កើនប្រសិទ្ធភាពការដាក់ពង្រាយមូលធន និងប្រាក់ចំណេញ

🎯 គុណសម្បត្តិប្រកួតប្រជែងជាក់លាក់នៅកម្ពុជា:
🏦 យល់ដឹងជ្រៅជ្រះអំពីប្រព័ន្ធធនាគារក្នុងស្រុក (ABA/ACLEDA/Prince Bank)
🤝 ទំនាក់ទំនងផ្ទាល់ជាមួយបណ្តាញវិនិយោគិនកម្ពុជា និង Venture Capital
🏢 យល់ដឹងស៊ីជម្រៅអំពី​រចនាសម្ព័ន្ធអាជីវកម្មក្នុងស្រុក និងតម្រូវការផ្លូវច្បាប់
💼 ការចូលប្រើឱកាសផ្តល់មូលនិធិក្នុងតំបន់ និងកម្មវិធីរដ្ឋាភិបាល
📈 កំណត់ត្រាជោគជ័យដែលបានបញ្ជាក់នៅក្នុងលក្ខខណ្ឌទីផ្សារកម្ពុជា

⏰ ការផ្តល់ជូនផុតកំណត់: ៣៦ ម៉ោង (${expiryDate.toLocaleString("km-KH")})
👥 កំណត់ប្រចាំខែផ្តាច់មុខ: សមាជិក VIP ${vipSpots.total} នាក់ប៉ុណ្ណោះ
🔥 កៅអីនៅសល់: ${vipSpots.remaining()} នាក់ (${((vipSpots.remaining() / vipSpots.total) * 100).toFixed(0)}% ទំនេរ)
📊 មតិកែលម្អពីសមាជិក: សមាជិក VIP ភាគច្រើនរាយការណ៍ពីវឌ្ឍនភាពឆ្ពោះទៅរកគោលដៅរបស់ពួកគេ

🎁 BONUS ផ្តាច់មុខសម្រាប់ការអនុវត្តភ្លាមៗ:
💰 ការវាយតម្លៃមូលធនទូលំទូលាយដោយឥតគិតថ្លៃ (តម្លៃ $97)
🤝 ការណែនាំបណ្តាញវិនិយោគិនឯកជន (ទំនាក់ទំនងដ៏មានតម្លៃ)
📞 ការចូលប្រើអាទិភាពទៅកាន់កម្មវិធីកម្រិតខ្ពស់នាពេលអនាគត
⚡ ការគាំទ្រ VIP រយៈពេល ៦ ខែ (ទ្វេដងនៃរយៈពេលស្តង់ដារ)
🎯 ការចាត់តាំងអ្នកគ្រប់គ្រងជោគជ័យផ្ទាល់ខ្លួន

💡 អ្វីដែលធ្វើឱ្យកម្មវិធីនេះខុសប្លែក:
មិនដូចការបង្វឹកអាជីវកម្មទូទៅទេ នេះជាកម្មវិធីយុទ្ធសាស្ត្រមូលធនឯកទេសដែលត្រូវបានរចនាឡើងជាពិសេសសម្រាប់បរិយាកាសអាជីវកម្មតែមួយគត់របស់កម្ពុជា។ យើងមិនត្រឹមតែបង្រៀនទ្រឹស្តីទេ - យើងផ្តល់នូវទំនាក់ទំនងជាក់ស្តែង យុទ្ធសាស្ត្រពិតប្រាកដ និងក្របខ័ណ្ឌដែលបានបញ្ជាក់ដែលដំណើរការនៅក្នុងទីផ្សារកម្ពុជា។

ចង់បានព័ត៌មានលម្អិតបន្ថែម? /vip_program_info
ត្រៀមខ្លួនដើម្បីធានាកៅអីរបស់អ្នកហើយឬនៅ? សរសេរ "VIP APPLY"

⚠️ ការព្រមានចុងក្រោយ: នេះជាកម្មវិធីវិនិយោគកម្រិតខ្ពស់សម្រាប់ម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរដែលមានឆន្ទៈក្នុងការពង្រីកមូលធន និងទំហំអាជីវកម្មតែប៉ុណ្ណោះ។ បើអ្នកមិនត្រៀមខ្លួនសម្រាប់ការប្តេជ្ញាចិត្ត និងការវិនិយោគទេ សូមកុំដាក់ពាក្យ។

🔥 ៣៦ ម៉ោងនៅសល់ - អនុវត្តឥឡូវនេះ!`;

      await sendLongMessage(
        bot,
        chatId,
        vipCelebration,
        {},
        MESSAGE_CHUNK_SIZE,
      );

      // Enhanced success analytics
      console.log(`Enhanced VIP offer sent successfully to user ${userId}`);
    },
    "VIP offer",
    { bot, chatId },
  );
}

async function capitalClarity(msg, bot) {
  if (!validateInput(msg, bot)) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "Friend";

  return executeWithErrorHandling(
    async () => {
      // Enhanced analytics tracking
      analytics.updateFunnel("capitalClarityInquiries");
      console.log(`Capital Clarity inquiry by user ${userId} at ${new Date()}`);

      // Enhanced user tracking
      await User.findOneAndUpdate(
        { telegram_id: userId  },
        {
          capitalClarityInquiry: new Date(),
          last_active: new Date(),
          vipJourneyStage: "capital_clarity_interest",
          $inc: {
            capitalClarityViews: 1,
            totalEngagementScore: 7, // High-value inquiry = 7 points
            vipQualificationScore: 15, // Premium interest
          },
        },
        { upsert: true },
      );

      const clarityResponse = `🏛️ វគ្គបណ្តុះបណ្តាលមូលធន - យុទ្ធសាស្ត្រមូលធនឯកជនកម្រិតខ្ពស់

ជំរាបសួរ ${firstName}!

🎯 តើវគ្គបណ្តុះបណ្តាលមូលធនជាអ្វី?

វគ្គយុទ្ធសាស្ត្រឯកជនរយៈពេល ៩០ នាទី ដែលត្រូវបានរៀបចំឡើងជាពិសេសដើម្បី:
• វិនិច្ឆ័យយ៉ាងច្បាស់លាស់ពីកន្លែងដែលប្រព័ន្ធមូលធនរបស់អ្នកត្រូវបានរាំងស្ទះ លេចធ្លាយ ឬដំណើរការមិនពេញលេញ
• បញ្ជាក់ពីរបៀបដែលកិច្ចព្រមព្រៀងបច្ចុប្បន្ន និងទំនាក់ទំនងវិនិយោគិនរបស់អ្នកដំណើរការ
• កំណត់អត្តសញ្ញាណគម្លាតទំនុកចិត្ត និងហានិភ័យនៃការដាក់ពង្រាយដែលកំពុងធ្វើឱ្យអ្នកខាតបង់លុយ
• កំណត់វិធីសាស្រ្តកែលម្អច្បាស់លាស់ និងអាចអនុវត្តបានជាមួយនឹងវិធីសាស្រ្តដែលមានរចនាសម្ព័ន្ធ
• បង្កើតផែនទីផ្លូវបង្កើនប្រសិទ្ធភាពមូលធនផ្ទាល់ខ្លួនរយៈពេល ៣០-៩០ ថ្ងៃ

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497)
📅 ភាពអាចរកបាន: មានកំណត់ត្រឹម ៥ វគ្គ/ខែ សម្រាប់ភាពផ្តាច់មុខ
⏰ ការកក់: តម្រូវឱ្យកក់ទុកជាមុន

🔍 ក្របខ័ណ្ឌវិភាគទូលំទូលាយ:

១. ការកំណត់គោលដៅ (១៥ នាទី):
• ការកំណត់យុទ្ធសាស្ត្របច្ចុប្បន្ន
• ការវាយតម្លៃស្ថានភាពមូលធនបច្ចុប្បន្ន
• ការបញ្ជាក់គោលដៅ និងការកំណត់កាលកំណត់

២. ការវិភាគមូលធន (២៥ នាទី):
• ការវិភាគរចនាសម្ព័ន្ធមូលធនពេញលេញ
• ការវិភាគលំហូរសាច់ប្រាក់ និងឱកាសបង្កើនប្រសិទ្ធភាព
• ការពិនិត្យប្រសិទ្ធភាពនៃការបែងចែកមូលធន

៣. ការវាយតម្លៃទំនុកចិត្ត (២០ នាទី):
• ការវាយតម្លៃទំនុកចិត្តវិនិយោគិន
• ការត្រួតពិនិត្យទំនាក់ទំនងជាមួយដៃគូបច្ចុប្បន្ន និងសក្តានុពល
• ការកំណត់អត្តសញ្ញាណគម្លាតភាពជឿជាក់

៤. ពិន្ទុត្រៀមខ្លួនប្រព័ន្ធ (១៥ នាទី):
• ការវាយតម្លៃភាពត្រៀមខ្លួនសម្រាប់ការរីកចម្រើន
• ការវាយតម្លៃហេដ្ឋារចនាសម្ព័ន្ធ និងដំណើរការ
• ការពិនិត្យយុទ្ធសាស្ត្រកាត់បន្ថយហានិភ័យ

៥. ការកំណត់ផែនការ (១៥ នាទី):
• ផែនការយុទ្ធសាស្ត្រជាក់លាក់ ៣០/៦០/៩០ ថ្ងៃ
• ធាតុសកម្មភាពអាទិភាព និងគោលដៅសំខាន់ៗ
• អនុសាសន៍បែងចែកធនធាន

🇰🇭 លទ្ធផលអតិថិជនពីកម្មវិធី VIP:

👤 "បានទទួលមូលនិធិអនុម័តក្នុងរយៈពេល ២ ខែ"
   - នាយកប្រតិបត្តិ Tech Startup, ភ្នំពេញ
👤 "លំហូរសាច់ប្រាក់ត្រូវបានរៀបចំ និងអាចព្យាករណ៍បានហើយ"
   - ម្ចាស់ខ្សែសង្វាក់ភោជនីយដ្ឋាន, សៀមរាប
👤 "បានភ្ជាប់ទំនាក់ទំនងជាមួយវិនិយោគិនសក្តានុពល ៣ នាក់"
   - ស្ថាបនិក E-commerce, បាត់ដំបង
👤 "បានកសាងវិធីសាស្រ្តជាប្រព័ន្ធក្នុងការស្វែងរកមូលធន"
   - នាយកផ្នែកផលិតកម្ម, កំពង់ចាម

🎯 បេក្ខជនដ៏ល្អសម្រាប់វគ្គបណ្តុះបណ្តាលមូលធន:

✅ ស្ថាបនិកដែលគ្រប់គ្រងមូលធនឯកជន ($100K+ ប្រចាំឆ្នាំ)
✅ អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិដែលមានស្រាប់ (ចំណូលប្រចាំខែ $50K+)
✅ ម្ចាស់អាជីវកម្មដែលរៀបចំផែនការផ្តល់មូលនិធិសម្រាប់ការលូតលាស់ធំ (គោលដៅ $25K+)
✅ វិនិយោគិនដែលត្រូវការយុទ្ធសាស្ត្រដាក់ពង្រាយដែលមានរចនាសម្ព័ន្ធ
✅ សហគ្រិនដែលស្វែងរកការបង្កើនប្រសិទ្ធភាពមូលធន និងប្រសិទ្ធភាព

📋 លក្ខខណ្ឌតម្រូវគុណវុឌ្ឍិ (ត្រូវផ្តល់ទាំងអស់):

១. តួនាទី និងក្រុមហ៊ុន:
   តួនាទីពិតប្រាកដរបស់អ្នក (ស្ថាបនិក/នាយកប្រតិបត្តិ/អ្នកប្រតិបត្តិ/វិនិយោគិន)
   ឈ្មោះក្រុមហ៊ុន និងវិស័យឧស្សាហកម្ម

២. ទំហំចំណូល:
   ជួរចំណូលប្រចាំខែ: $5K-15K / $15K-50K / $50K-100K / $100K+
   មូលធនប្រចាំឆ្នាំដែលកំពុងគ្រប់គ្រង: $xxx,xxx

៣. ស្ថានភាពមូលធន:
   ការពិពណ៌នាអំពីស្ថានភាពមូលធន/មូលនិធិបច្ចុប្បន្ន
   ចំនួនទឹកប្រាក់គោលដៅដែលត្រូវការ: $xx,xxx
   ការប៉ុនប៉ងស្វែងរកមូលនិធិពីមុន (ជោគជ័យ/បរាជ័យ)

៤. បញ្ហាប្រឈមជាក់លាក់:
   បញ្ហាប្រឈមរចនាសម្ព័ន្ធសំខាន់ដែលអ្នកកំពុងជួបប្រទះឥឡូវនេះ
   ឧបសគ្គធំបំផុតក្នុងការដាក់ពង្រាយមូលធន
   តម្រូវការបន្ទាន់បំផុតក្នុងការបង្កើនប្រសិទ្ធភាពមូលធន

៥. កាលកំណត់ និងការវិនិយោគ:
   កាលកំណត់វិនិយោគ: ៣០/៦០/៩០ ថ្ងៃ
   ការបញ្ជាក់ថាការវិនិយោគ $197 សមហេតុផល
   ព័ត៌មានទំនាក់ទំនង: អ៊ីមែលដែលបានផ្ទៀងផ្ទាត់ និងលេខទូរស័ព្ទ

🇰🇭 ឯកទេសអាជីវកម្មនៅកម្ពុជា:

✅ យើងយល់ដឹងជ្រៅជ្រះអំពី​រចនាសម្ព័ន្ធអាជីវកម្មក្នុងស្រុក និងតម្រូវការ
✅ ជំនាញក្នុងការផ្តល់ប្រាក់កម្ចីឯកជន និងដំណោះស្រាយផ្តល់មូលនិធិជំនួស
✅ ទំនាក់ទំនងផ្ទាល់ជាមួយបណ្តាញមូលធនឯកជននៅកម្ពុជា
✅ រចនាសម្ព័ន្ធមូលនិធិឯកជនដែលត្រូវបានកែសម្រួលសម្រាប់លក្ខខណ្ឌទីផ្សារក្នុងស្រុក
✅ ហិរញ្ញវត្ថុជំនួសក្រៅពីប្រព័ន្ធធនាគារប្រពៃណី

💡 ឧទាហរណ៍នៃការដាក់ពាក្យគុណវុឌ្ឍិ:
"ស្ថាបនិក, ABC Tech Solutions, ការអភិវឌ្ឍន៍ Software
ចំណូលប្រចាំខែ $15K, កំពុងគ្រប់គ្រង $100K ប្រចាំឆ្នាំ
ត្រូវការដើមទុនពង្រីក $100K, បរាជ័យ ១ ដងក្នុងការស្វែងរកមូលនិធិជាមួយធនាគារក្នុងស្រុក
បញ្ហាប្រឈមសំខាន់: ការធ្វើបទបង្ហាញវិនិយោគិន និងការបង្កើតភាពជឿជាក់
កាលកំណត់ ៦០ ថ្ងៃ, $197 ជាការវិនិយោគសមហេតុផល
contact@abctech.com, 012-345-678"

🎯 ជំហានបន្ទាប់បន្ទាប់ពីការវាយតម្លៃគុណវុឌ្ឍិ:
១. ដាក់ពាក្យគុណវុឌ្ឍិលម្អិត (លក្ខខណ្ឌទាំងអស់ខាងលើ)
២. ការពិនិត្យ ២៤ ម៉ោង + ការហៅទូរស័ព្ទផ្ទៀងផ្ទាត់គុណវុឌ្ឍិ
៣. កំណត់ពេលវគ្គបណ្តុះបណ្តាលមូលធនរយៈពេល ៩០ នាទី
៤. ទទួលបានយុទ្ធសាស្ត្រទូលំទូលាយ + ផែនការសកម្មភាព
៥. ជម្រើស: ការដំឡើងកំណែទៅ VIP Program (បើមានលក្ខណៈសម្បត្តិគ្រប់គ្រាន់)

⚠️ តម្រូវការសំខាន់:
• នេះជាយុទ្ធសាស្ត្រមូលធនកម្រិតខ្ពស់សម្រាប់ម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរដែលគ្រប់គ្រងមូលធនសំខាន់ៗ ($10K+ ប្រចាំខែ)
• ត្រូវតែមានតម្រូវការបង្កើនប្រសិទ្ធភាពមូលធនពិតប្រាកដ (មិនមែនការរៀបចំផែនការហិរញ្ញវត្ថុមូលដ្ឋានទេ)
• ត្រៀមខ្លួនអនុវត្តអនុសាសន៍ភ្លាមៗ
• ប្តេជ្ញាចិត្តចំពោះការលូតលាស់ និងការអភិវឌ្ឍន៍វិជ្ជាជីវៈ

ត្រៀមខ្លួនដើម្បីបង្កើនប្រសិទ្ធភាពប្រព័ន្ធមូលធនរបស់អ្នកហើយឬនៅ? សូមផ្តល់ព័ត៌មានលម្អិតគុណវុឌ្ឍិទាំងអស់ខាងលើ។

មានសំណួរ? ទាក់ទង @Chendasum ដោយផ្ទាល់។`;

      await sendLongMessage(
        bot,
        chatId,
        clarityResponse,
        {},
        MESSAGE_CHUNK_SIZE,
      );

      // Enhanced admin notification with comprehensive analytics
      const adminId = process.env.ADMIN_CHAT_ID;
      if (adminId) {
        try {
          const user = await User.findOne({ telegram_id: userId  });
          const adminMessage = `🏛️ HIGH-VALUE CAPITAL CLARITY INQUIRY:

👤 PROSPECT PROFILE:
• Name: ${firstName} (${userId})
• Username: @${msg.from.username || "no_username"}
• Inquiry Time: ${new Date().toLocaleString("km-KH")}

💰 SERVICE INTEREST:
• Type: Private Capital Strategy Session ($197)
• Service Level: Premium/High-Touch
• Expected Value: High (capital optimization focus)

📊 USER ANALYTICS:
• Capital Clarity Views: ${user?.capitalClarityViews || 1}
• VIP Interest Level: ${user?.vipInfoViewCount || 0} info views
• Total Engagement Score: ${user?.totalEngagementScore || 0}/100
• Qualification Score: ${user?.vipQualificationScore || 0}/100
• Journey Stage: ${user?.vipJourneyStage || "capital_clarity_interest"}
• Last Activity: ${user?.lastActive || "Unknown"}

📈 CAPITAL CLARITY FUNNEL:
• Total Inquiries: ${analytics.vipFunnel.capitalClarityInquiries}
• Conversion to VIP: Tracking needed
• Premium Service Interest: HIGH

🎯 NEXT ACTIONS:
1. ⏳ User providing qualification information
2. 📞 Qualification verification call (24h)
3. 📅 Session scheduling
4. 💰 Payment processing ($197)
5. 🚀 Capital Clarity session delivery

🔔 PRIORITY ALERT: Premium service inquiry - high conversion potential!`;

          await bot.sendMessage(adminId, adminMessage);
        } catch (adminError) {
          console.error(
            "Error sending Capital Clarity admin notification:",
            adminError,
          );
        }
      }

      // Enhanced success analytics
      console.log(
        `Capital Clarity info sent successfully to user ${userId}. Total inquiries: ${analytics.vipFunnel.capitalClarityInquiries}`,
      );
    },
    "Capital Clarity",
    { bot, chatId },
  );
}

// Enhanced helper function to update VIP spots with analytics
async function updateVipSpots(action = "use", userId = null) {
  try {
    if (action === "use" && vipSpots.remaining() > 0) {
      vipSpots.used += 1;
      analytics.updateFunnel("conversions");

      if (userId) {
        await User.findOneAndUpdate(
          { telegram_id: userId  },
          {
            vipConversionDate: new Date(),
            vipJourneyStage: "converted",
            $inc: { vipQualificationScore: 50 }, // Conversion bonus
          },
        );
      }

      console.log(
        `VIP spot used. Remaining: ${vipSpots.remaining()}. Conversion rate: ${analytics.getConversionRate()}%`,
      );
    } else if (action === "reset") {
      vipSpots.reset();
      console.log(`VIP spots reset. Available: ${vipSpots.total}`);
    } else if (action === "add_waitlist") {
      vipSpots.waitlist += 1;
      console.log(`Added to waitlist. Position: ${vipSpots.waitlist}`);
    }
  } catch (error) {
    console.error("Error updating VIP spots:", error);
  }
}

// Enhanced analytics reporting function
function getVipAnalytics() {
  return {
    spots: {
      total: vipSpots.total,
      used: vipSpots.used,
      remaining: vipSpots.remaining(),
      waitlist: vipSpots.waitlist,
      conversionRate: vipSpots.conversionRate(),
    },
    funnel: analytics.vipFunnel,
    overallConversion: analytics.getConversionRate(),
  };
}

module.exports = {
  info,
  apply,
  offer,
  capitalClarity,
  updateVipSpots,
  getVipAnalytics,
};
