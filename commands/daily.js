const User = require("../models/User");
const Progress = require("../models/Progress");
const { sendLongMessage } = require("../utils/message-splitter");

// Configuration constants
const CONFIG = {
    MESSAGE_CHUNK_SIZE: 3500,
    TOTAL_DAYS: 7,
    DEFAULT_DELAY: 500
};

// Day metadata for beautiful interface
const dayMeta = {
    1: { 
        icon: "💰", 
        title: "រកប្រាក់ភ្លាមៗ", 
        subtitle: "$50-150 ក្នុង ៣០ នាទី", 
        color: "🟢",
        duration: "៣០ នាទី",
        difficulty: "ងាយស្រួល",
        value: "$300+",
        objectives: [
            "រកប្រាក់បាន $50-150 ភ្លាមៗ",
            "ស្វែងរកការជាវលាក់កំបាំង",
            "វិភាគទម្លាប់ចំណាយកម្ពុជា",
            "ទទួលឧបករណ៍គណនាលំហូរប្រាក់"
        ]
    },
    2: { 
        icon: "🎯", 
        title: "ស្វែងរកចំណុចលេច", 
        subtitle: "$100-400 ក្នុង ៤៥ នាទី", 
        color: "🔵",
        duration: "៤៥ នាទី",
        difficulty: "មធ្យម",
        value: "$500+",
        objectives: [
            "កំណត់ចំណុចលេចធ្លាយកម្រិតខ្ពស់",
            "ស្វែងរកអន្ទាក់បណ្តាញសង្គម",
            "ត្រួតពិនិត្យការជាវលាក់កំបាំង",
            "បង្កើតយុទ្ធសាស្ត្របិទចំណុចលេច"
        ]
    },
    3: { 
        icon: "📊", 
        title: "ពិនិត្យសុខភាពហិរញ្ញវត្ថុ", 
        subtitle: "ដឹងពីសុខភាពប្រាក់ក្នុង ១៥ នាទី", 
        color: "🟣",
        duration: "១៥ នាទី",
        difficulty: "ងាយស្រួល",
        value: "$200+",
        objectives: [
            "ទទួលពិន្ទុសុខភាពហិរញ្ញវត្ថុ",
            "វាយតម្លៃការតាមដានប្រាក់",
            "ពិនិត្យផែនការប្រាក់",
            "កែលម្អតាមលទ្ធភាព"
        ]
    },
    4: { 
        icon: "📈", 
        title: "គណនាលំហូរប្រាក់", 
        subtitle: "ដឹងលំហូរប្រាក់ពិតក្នុង ១០ នាទី", 
        color: "🟠",
        duration: "១០ នាទី",
        difficulty: "មធ្យម",
        value: "$250+",
        objectives: [
            "វិភាគគំរូលំហូរប្រាក់ពិតប្រាកដ",
            "កំណត់ទិសដៅកែលម្អ",
            "ពិនិត្យប្រភពចំណូល",
            "បង្កើនប្រសិទ្ធភាពចំណាយ"
        ]
    },
    5: { 
        icon: "⚖️", 
        title: "វិភាគតុល្យភាពចំណាយ", 
        subtitle: "ដឹងតុល្យភាពក្នុង ១៥ នាទី", 
        color: "🟦",
        duration: "១៥ នាទី",
        difficulty: "បន្តិចពិបាក",
        value: "$350+",
        objectives: [
            "វិភាគការរស់រានមានជីវិត vs ការលូតលាស់",
            "កំណត់អាទិភាពចំណាយ",
            "បង្កើតតុល្យភាពល្អ",
            "រៀបចំផែនការកែលម្អ"
        ]
    },
    6: { 
        icon: "🎬", 
        title: "ម៉ាទ្រីសអាទិភាព", 
        subtitle: "កំណត់ចំណុចសំខាន់ក្នុង ១០ នាទី", 
        color: "🔴",
        duration: "១០ នាទី",
        difficulty: "បន្តិចពិបាក",
        value: "$400+",
        objectives: [
            "ផែនការសកម្មភាព ៣ ចំណុច",
            "ផែនការ ៣០ ថ្ងៃច្បាស់លាស់",
            "កំណត់អាទិភាពផ្ទាល់ខ្លួន",
            "បង្កើតការទទួលខុសត្រូវ"
        ]
    },
    7: { 
        icon: "🎓", 
        title: "បញ្ចប់ការសិក្សា", 
        subtitle: "វាស់ជោគជ័យ និងជំហានបន្ទាប់", 
        color: "🟩",
        duration: "២០ នាទី",
        difficulty: "ងាយស្រួល",
        value: "$500+",
        objectives: [
            "វាស់វែងសមិទ្ធផលរយៈពេល ៧ ថ្ងៃ",
            "ទទួលកម្រិតបញ្ចប់ការសិក្សា",
            "បង្កើតទម្លាប់យូរអង្វែង",
            "ត្រៀមខ្លួនសម្រាប់កម្រិតបន្ទាប់"
        ]
    }
};

// Generate progress bar visualization
function generateProgressBar(completedDays, totalDays = 7) {
    const percentage = Math.round((completedDays / totalDays) * 100);
    const filledBlocks = Math.floor((completedDays / totalDays) * 10);
    const emptyBlocks = 10 - filledBlocks;
    
    const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    return `📊 **ការវឌ្ឍនភាព: ${percentage}%**\n\`${progressBar}\` (${completedDays}/${totalDays})\n`;
}

// Create beautiful day overview
function createDayOverview(dayNumber, userProgress = {}) {
    const day = dayMeta[dayNumber];
    const isCompleted = userProgress.completedDays?.includes(dayNumber) || false;
    const completionDate = userProgress[`day${dayNumber}CompletedAt`];
    const timestamp = userProgress.timestamp;
    
    let message = `🔱 **7-Day Money Flow Reset™** 🔱\n\n`;
    message += `${day.color} **ថ្ងៃទី ${dayNumber}: ${day.title}**\n`;
    message += `${day.icon} *${day.subtitle}*\n\n`;
    
    // Status with dynamic content
    if (isCompleted) {
        message += `✅ **ស្ថានភាព:** បានបញ្ចប់`;
        if (completionDate) {
            message += ` (${new Date(completionDate).toLocaleDateString('km-KH')})`;
        }
        message += '\n';
    } else {
        message += `🟡 **ស្ថានភាព:** រង់ចាំបញ្ចប់\n`;
    }
    
    // Add timestamp to make content unique
    if (timestamp) {
        message += `🕐 **បានមើល:** ${timestamp}\n`;
    }
    
    // Rest of your existing content...
    message += `⏱️ **រយៈពេល:** ${day.duration}\n`;
    message += `📊 **កម្រិតលំបាក:** ${day.difficulty}\n`;
    message += `💎 **តម្លៃ:** ${day.value}\n\n`;
    
    // Progress bar if we have completion data
    if (userProgress.completedDays) {
        message += generateProgressBar(userProgress.completedDays.length);
        message += '\n';
    }
    
    // Key objectives
    message += `**🎯 គោលដៅថ្ងៃនេះ:**\n`;
    day.objectives.forEach((objective, index) => {
        message += `${index + 1}. ${objective}\n`;
    });
    
    return message;
}

// Generate program overview
function generateProgramOverview(progress) {
    const completedDays = progress.completedDays || [];
    const currentDay = progress.currentDay || 1;
    
    let message = `🔱 **7-Day Money Flow Reset™** 🔱\n`;
    message += `*កម្មវិធីកែលម្អលំហូរប្រាក់ ៧ ថ្ងៃ*\n\n`;
    
    // Progress
    message += generateProgressBar(completedDays.length);
    message += '\n';
    
    // Current status
    if (completedDays.length === 7) {
        message += `🎓 **ស្ថានភាព:** បានបញ្ចប់កម្មវិធី!\n`;
        message += `🏆 **កម្រិត:** Cambodia Money Flow Graduate\n\n`;
    } else {
        message += `📍 **ថ្ងៃបច្ចុប្បន្ន:** ថ្ងៃទី ${currentDay}\n`;
        message += `🎯 **បន្ទាប់:** ${dayMeta[currentDay]?.title || 'បញ្ចប់កម្មវិធី'}\n\n`;
    }
    
    // Weekly overview
    message += `**📅 ទិដ្ឋភាពសប្តាហ៍:**\n`;
    for (let day = 1; day <= 7; day++) {
        const meta = dayMeta[day];
        const isCompleted = completedDays.includes(day);
        const isCurrent = day === currentDay;
        
        let status = "";
        if (isCompleted) status = "✅";
        else if (isCurrent) status = "▶️";
        else if (day <= currentDay) status = "🟡";
        else status = "🔒";
        
        message += `${status} **ថ្ងៃ ${day}:** ${meta.title}\n`;
    }
    
    return message;
}

// Generate day navigation keyboard
function createNavigationKeyboard(currentDay, completedDays, maxAccessibleDay) {
    const keyboard = [];
    
    // Day navigation row 1 (days 1-4)
    const row1 = [];
    for (let i = 1; i <= 4; i++) {
        const isAccessible = i <= maxAccessibleDay;
        const isCompleted = completedDays.includes(i);
        const isCurrent = i === currentDay;
        
        let emoji = "";
        if (isCompleted) emoji = "✅";
        else if (isCurrent) emoji = "▶️";
        else if (isAccessible) emoji = "🟡";
        else emoji = "🔒";
        
        row1.push({
            text: `${emoji} ${i}`,
            callback_data: isAccessible ? `day_${i}` : `locked_${i}`
        });
    }
    keyboard.push(row1);
    
    // Day navigation row 2 (days 5-7)
    const row2 = [];
    for (let i = 5; i <= 7; i++) {
        const isAccessible = i <= maxAccessibleDay;
        const isCompleted = completedDays.includes(i);
        const isCurrent = i === currentDay;
        
        let emoji = "";
        if (isCompleted) emoji = "✅";
        else if (isCurrent) emoji = "▶️";
        else if (isAccessible) emoji = "🟡";
        else emoji = "🔒";
        
        row2.push({
            text: `${emoji} ${i}`,
            callback_data: isAccessible ? `day_${i}` : `locked_${i}`
        });
    }
    keyboard.push(row2);
    
    // Navigation controls
    const navRow = [];
    if (currentDay > 1) {
        navRow.push({
            text: `⬅️ ថ្ងៃមុន`,
            callback_data: `day_${currentDay - 1}`
        });
    }
    
    navRow.push({
        text: "📋 ទិដ្ឋភាពទូទៅ",
        callback_data: "overview"
    });
    
    if (currentDay < 7 && currentDay < maxAccessibleDay) {
        navRow.push({
            text: `ថ្ងៃបន្ទាប់ ➡️`,
            callback_data: `day_${currentDay + 1}`
        });
    }
    
    keyboard.push(navRow);
    
    // Action buttons
    const actionRow = [];
    actionRow.push({
        text: "🎯 ចាប់ផ្តើមមេរៀន",
        callback_data: `start_lesson_${currentDay}`
    });
    
    if (completedDays.includes(currentDay)) {
        actionRow.push({
            text: "✅ បានបញ្ចប់",
            callback_data: `completed_${currentDay}`
        });
    } else {
        actionRow.push({
            text: "⭐ បញ្ចប់ថ្ងៃនេះ",
            callback_data: `complete_${currentDay}`
        });
    }
    
    keyboard.push(actionRow);
    
    return { inline_keyboard: keyboard };
}

// Daily lesson content (keeping your existing content)
const dailyMessages = {
   1: `🔱 ថ្ងៃទី ១៖ បេសកកម្មរកប្រាក់ភ្លាមៗ $50-150 + ចាប់ផ្តើមយល់ដឹងអំពីលំហូរប្រាក់! 🔱
---

🚨 ការធានាថ្ងៃនេះ៖ អ្នកនឹងរកប្រាក់បាន $50-150 ក្នុងរយៈពេល ៣០ នាទី!

🎯 តម្លៃដែលអ្នកនឹងទទួលបានថ្ងៃនេះ៖

💰 រកប្រាក់ភ្លាមៗ៖ $50-150 ដោយវិធីសាស្ត្រពិតប្រាកដ
📚 ចំណេះដឹង៖ មេរៀនហិរញ្ញវត្ថុមានតម្លៃ $200+
🛠️ ឧបករណ៍៖ កម្មវិធីគណនាលំហូរប្រាក់បម្រុងសម្រាប់កម្ពុជា
🎁 រង្វាន់បន្ថែម៖ បញ្ជីត្រួតពិនិត្យចំណុចលេចធ្លាយប្រាក់ (តម្លៃ $50)

🔥 តម្លៃសរុបថ្ងៃនេះ៖ $300+ តែអ្នកទិញកម្មវិធីត្រឹមតែ $___!

💎 បេសកកម្មរកប្រាក់ភ្លាមៗ (៣០ នាទី = $50-150)
⚡ បេសកកម្មទី១៖ ស្វែងរកការជាវលាក់កំបាំង (៨ នាទី = $15-85)
🎯 ការធានា៖ រកបាន $15+ ភ្លាមៗ!

ជំហានស្វែងរក៖
📱 បើកការកំណត់ទូរស័ព្ទ → Subscriptions/App Store (iOS) ឬ Google Play → Subscriptions (Android)
🔍 រកមើលកម្មវិធីដែលអ្នកភ្លេចថាកំពុងបង់ប្រាក់
💸 គណនាចំនួនប្រាក់ដែលកំពុងខាតបង់

🇰🇭 ចំណុចលេចធ្លាយប្រាក់ឌីជីថលទូទៅនៅកម្ពុជា + វិធីដោះស្រាយឆ្លាតវៃ៖

📺 Netflix/YouTube Premium ដែលលែងមើល៖ $12-15/ខែ = $144-180/ឆ្នាំ
• ដំណោះស្រាយឆ្លាតវៃ៖ ប្រើគណនី family sharing ជាមួយមិត្តភក្តិ (កាត់បន្ថយ 75%)

🎵 Spotify Premium ដែលលែងស្ដាប់៖ $10/ខែ = $120/ឆ្នាំ
• ដំណោះស្រាយឆ្លាតវៃ៖ YouTube Music ឥតគិតថ្លៃ + កម្មវិធី local music

🎮 កម្មវិធីហ្គេម (PUBG UC, Free Fire)៖ $8-25/ខែ = $96-300/ឆ្នាំ
• ដំណោះស្រាយឆ្លាតវៃ៖ លេង free version + កំណត់ budget ស្មារតី $5/ខែ

🔒 VPN ពីមុន ដែលភ្លេចបិទ៖ $5-12/ខែ = $60-144/ឆ្នាំ
• ដំណោះស្រាយឆ្លាតវៃ៖ VPN ឥតគិតថ្លៃ (ProtonVPN) + ប្រើតែពេលត្រូវការ

☁️ ឃ្លាំងផ្ទុកពពក ពេញ៖ $3-15/ខែ = $36-180/ឆ្នាំ
ដំណោះស្រាយឆ្លាតវៃ៖ Google Drive ឥតគិតថ្លៃ 15GB + កាត់បន្ថយរូបភាព

💡 គន្លឹះពិសេសពីអ្នកជំនាញ៖ ពិនិត្យផងដែរ Email inbox រកពាក្យ "subscription", "renewal", "បានកាត់ប្រាក់", "automatic payment"

⚡ បេសកកម្មទី២៖ វិភាគទម្លាប់ចំណាយកម្ពុជា + ការកំណត់អាទិភាព (១២ នាទី = $25-50)

🇰🇭 ការវិភាគទម្លាប់ចំណាយប្រចាំថ្ងៃនៅកម្ពុជា + ការគិតគូរយ៉ាងស្មារតី៖

🚗 ការធ្វើដំណើរ (ចំណុចសន្សំធំបំផុត)៖

• Grab ចម្ងាយខ្លី ក្រោម ២ គីឡូម៉ែត្រ៖ $3-5/ដង × 12ដង/ខែ = $36-60/ខែ
• ឆ្លាតវៃ៖ ជិះម៉ូតូដូប/កង់ ចម្ងាយ < 1km = សន្សំ $30/ខែ + ហាត់ប្រាណ
• PassApp/តាក់ស៊ី ពេលមានម៉ូតូផ្ទាល់៖ $4-8/ដង × 8ដង/ខែ = $32-64/ខែ
• ឆ្លាតវៃ៖ ឡុងម៉ូតូ $0.5/ដង = សន្សំ $28-60/ខែ
• សាំងម៉ូតូ ដែលខ្ជះខ្ជាយ៖ $10-20/ខែ
• ឆ្លាតវៃ៖ ពិនិត្យសម្ពាធកង់ + លាងម៉ាស៊ីន = សន្សំ 20% សាំង

☕ កាហ្វេ និង ភេសជ្ជៈ (កន្លែងសន្សំងាយបំផុត)៖

• កាហ្វេហាង (Brown/Amazon/Starbucks)៖ $2.5/ថ្ងៃ × 20ថ្ងៃ = $50/ខែ
• ឆ្លាតវៃ៖ កាហ្វេនៅផ្ទះ $0.5/ថ្ងៃ = សន្សំ $40/ខែ = $480/ឆ្នាំ
• ទឹកកក/កូកាកូឡា ប្រចាំថ្ងៃ៖ $1/ថ្ងៃ × 25ថ្ងៃ = $25/ខែ
• ឆ្លាតវៃ៖ ទឹកតម្រង់ + ទឹកក្រូចឆ្អិន = សន្សំ $20/ខែ

🍔 ថ្លៃដឹកជញ្ជូនអាហារ (ចំណុចលាក់សំខាន់)៖

• FoodPanda/Grab Food delivery fee + tips៖ $1-2 × 15ដង = $15-30/ខែ
• ការបញ្ជាម្ហូបបន្ថែម ដែលមិនចាំបាច់៖ $5-10/ដង × 10ដង = $50-100/ខែ
• ឆ្លាតវៃ៖ meal prep ថ្ងៃអាទិត្យ + ទុកទូកត្រជាក់ = សន្សំ $40-80/ខែ

🛒 ការទិញតាម Facebook និង TikTok (ការចំណាយដោយអារម្មណ៍)៖

• ការទិញតាម Facebook ads ពេលយប់៖ $20-80/ខែ
• TikTok Shop ការទិញភ្លាមៗ៖ $15-50/ខែ
• ឆ្លាតវៃ៖ "ច្បាប់ ២៤ ម៉ោង" - រង់ចាំ 1 ថ្ងៃមុនទិញ = កាត់បន្ថយ 80%

🏆 សរុបប្រាក់ដែលទើបរកបាន + ការយល់ដឹងថ្មី៖
• ខែនេះ៖ $____ | ឆ្នាំនេះ៖ $____
• 💎 ការយល់ដឹងថ្មី៖ "ខ្ញុំអាចគ្រប់គ្រងប្រាក់បាន!"
• 🚀 កម្លាំងចិត្ត៖ "ខ្ញុំកំពុងកែប្រែជីវិតខ្ញុំ!"

📊 ផ្នែកចូលរួមអន្តរកម្ម៖ តេស្តអារម្មណ៍ចំណាយ (២ នាទី)
🧠 សំណួរវិភាគអារម្មណ៍៖
① "ខ្ញុំតែងតែទិញអ្វីនៅពេលអារម្មណ៍យ៉ាងណា?" (សុខ/ទុក្ខ/ស្ត្រេស/ធុញថប់)
② "តើខ្ញុំទិញច្រើនជាងធម្មតានៅថ្ងៃណាខ្លះ?" (ចុងសប្តាហ៍/ល្ងាច/ថ្ងៃទទួលប្រាក់ខែ)
③ "មូលហេតុពិតប្រាកដនៃការទិញចុងក្រោយរបស់ខ្ញុំគឺ?" (ត្រូវការ/ចង់បាន/ធុញថប់/តាមមិត្ត)

💡 ការវិភាគ៖ ការយល់ដឹងអំពីគំរូចំណាយរបស់អ្នក = កាត់បន្ថយ 60% នៃការចំណាយមិនចាំបាច់!

✅ ការបញ្ចប់បេសកកម្មថ្ងៃទី១ + ការអបអរសាទរ៖
🎯 ធ្វើរួចរាល់ហើយ? អបអរសាទរយ៉ាងកក់ក្ដៅ! 🎉🎉🎉

📢 សូមសរសេរសារបញ្ចាក់៖ "DAY 1 COMPLETE - រកបាន $____/ខែ"

🔮 ការព្យាករណ៍ + ការប្រាប់ពីថ្ងៃស្អែក៖

🚨 ថ្ងៃទី២ នឹងកាន់តែពិសេស និងអស្ចារ្យជាងនេះ...

ស្អែកយើងនឹងចូលទៅក្នុង "ប្រព័ន្ធស្វែងរកចំណុចលេចធ្លាយប្រាក់កម្រិតខ្ពស់" - វិធីសាស្ត្រកម្រិតអ្នកជំនាញដែលនឹងរកឃើញចំណុចលេចធ្លាយ $100-300/ខែ ដែលលាក់នៅក្នុងជីវិតប្រចាំថ្ងៃរបស់អ្នក!

🌟 ការលើកទឹកចិត្តចុងក្រោយ៖
ថ្ងៃនេះអ្នកបានបង្ហាញថាអ្នកអាចធ្វើបាន! អ្នកបានផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុរបស់អ្នកកាលពីតែ ៣០ នាទីមុន។

🚀 ដើម្បីបន្តការស្វែងរកចំណុចលេចធ្លាយកម្រិតម៉ាស្ទ័រ! សូមចុច /day2`,

   2: `🔱 ថ្ងៃទី ២៖ បេសកកម្មស្វែងរកចំណុចលេចធ្លាយប្រាក់សម្ងាត់ - រកបាន $100-400 ក្នុង ៤៥ នាទី! 🔱

🚨 ការធានាថ្ងៃនេះ៖ អ្នកនឹងរកឃើញចំណុចលេចធ្លាយប្រាក់ $100-400 ក្នុងរយៈពេល ៤៥ នាទី!

🎯 តម្លៃដែលអ្នកនឹងទទួលបានថ្ងៃនេះ៖

💰 រកចំណុចលេចធ្លាយ៖ $100-400 ដោយប្រព័ន្ធស្វែងរកកម្រិតខ្ពស់
🕵️ ចំណេះដឹងអ្នកស៊ើបអង្កេត៖ តម្លៃ $300+ អំពីការស្វែងរកចំណុចលេចធ្លាយប្រាក់លាក់កំបាំង
🛠️ ឧបករណ៍វិភាគ៖ កម្មវិធីកំណត់អត្តសញ្ញាណចំណុចលេចធ្លាយប្រាក់កម្រិតអ្នកជំនាញ
🎁 រង្វាន់ពិសេស៖ "ឧបករណ៍ត្រួតពិនិត្យចំណុចលេចធ្លាយប្រាក់កម្រិតខ្ពស់នៅកម្ពុជា" (តម្លៃ $100)

🔥 តម្លៃសរុបថ្ងៃនេះ៖ $500+ តែអ្នកទិញកម្មវិធីត្រឹមតែ $___!

💎 ប្រព័ន្ធកំណត់អត្តសញ្ញាណចំណុចលេចធ្លាយកម្រិតខ្ពស់ (៤៥ នាទី)

⚡ បេសកកម្មទី១៖ ស្វែងរកអន្ទាក់ចំណាយតាមបណ្តាញសង្គម (១៥ នាទី = $25-80)
🎯 ការធានា៖ រកបាន $25+ ភ្លាមៗ!

ជំហានស្វែងរកចំណុចលេចធ្លាយប្រាក់បណ្តាញសង្គម៖

📱 បើក Facebook → ការកំណត់ → ការទូទាត់
📱 បើក Instagram → ការកំណត់ → ការទូទាត់ និងការជាវ
📱 បើក TikTok → ប្រវត្តិរូប → ការកំណត់ → ការទូទាត់
🔍 រកមើលការផ្សាយពាណិជ្ជកម្មដែលបានចុច និងទិញដោយមិនចាំបាច់
💸 គណនាចំនួនប្រាក់ដែលខាតបង់តាមបណ្តាញសង្គម

✅ ការបញ្ចប់បេសកកម្មថ្ងៃទី២ + ការអបអរសាទរ៖
🎯 ធ្វើរួចរាល់ហើយ? អបអរសាទរ! 🎉
សរសេរសារថា៖ "DAY 2 COMPLETE - បិទលេច $____/ខែ"

🚀 ដើម្បីបន្តការពិនិត្យសុខភាពហិរញ្ញវត្ថុ! សូមចុច /day3`,

   3: `🔱 ថ្ងៃទី ៣៖ ការពិនិត្យសុខភាពហិរញ្ញវត្ថុផ្ទាល់ខ្លួន - ដឹងពីសុខភាពប្រាក់ក្នុង ១៥ នាទី! 🔱

🔥 គោលដៅថ្ងៃនេះ៖ ទទួលបានពិន្ទុសុខភាពហិរញ្ញវត្ថុផ្ទាល់ខ្លួន + កែលម្អតាមលទ្ធភាពខ្លួនឯង!

💎 ប្រព័ន្ធត្រួតពិនិត្យសុខភាពហិរញ្ញវត្ថុ (១៥ នាទី)

⚡ ជំហានទី១ (៥ នាទី)៖ ការវាយតម្លៃការតាមដានប្រាក់
→ បើកកម្មវិធីដែលអ្នកប្រើដើម្បីតាមដានចំណាយ (សៀវភៅកត់ត្រា ឬ ទូរស័ព្ទ)
→ មើលថាអ្នកបានកត់ត្រាចំណាយអស់ប៉ុន្មានថ្ងៃក្នុង ១ សប្តាហ៍

✅ ការបញ្ចប់បេសកកម្មថ្ងៃទី៣៖
ធ្វើរួចហើយ? សរសេរថា "DAY 3 COMPLETE - Score ___% → Grade ___"

🚀 ដើម្បីបន្តការគណនាលំហូរប្រាក់! សូមចុច /day4`,

   4: `🔱 ថ្ងៃទី ៤៖ កម្មវិធីគណនាលំហូរប្រាក់ - ដឹងលំហូរប្រាក់ពិតក្នុង ១០ នាទី! 🔱

🔥 គោលដៅថ្ងៃនេះ៖ ស្គាល់គំរូលំហូរប្រាក់ពិតប្រាកដ + កំណត់ទិសដៅកែលម្អច្បាស់លាស់!

💎 កម្មវិធីគណនាលំហូរប្រាក់តាមពេលវេលាពិត (១០ នាទី)

⚡ ជំហានទី១ (៥ នាទី)៖ ពិនិត្យប្រភពចំណូលនៅកម្ពុជា
→ កត់ត្រាចំណូលរបស់អ្នកទាំងអស់ (មើលបង្កាន់ដៃខែចុងក្រោយ)
→ បែងចែកតាមប្រភេទខាងក្រោម
→ គណនាចំណូលសរុបក្នុង ១ ខែ

✅ ការបញ្ចប់បេសកកម្មថ្ងៃទី៤៖
ធ្វើរួចហើយ? សរសេរថា "DAY 4 COMPLETE - Flow៖ $___"

🚀 ដើម្បីបន្តការវិភាគតុល្យភាពចំណាយ! សូមចុច /day5`,

   5: `🔱 ថ្ងៃទី ៥៖ ឧបករណ៍វិភាគតុល្យភាពចំណាយ - ដឹងតុល្យភាពចំណាយក្នុង ១៥ នាទី! 🔱

🔥 គោលដៅថ្ងៃនេះ៖ វិភាគតុល្យភាព ការរស់រានមានជីវិតធៀបនឹងការលូតលាស់ធៀបនឹងរបៀបរស់នៅ + បង្កើតផែនការសកម្មភាពស្មោះត្រង់!

💎 ឧបករណ៍វិភាគប្រភេទចំណាយភ្លាមៗ (១៥ នាទី)

⚡ ជំហានទី១ (៥ នាទី)៖ ពិនិត្យចំណាយសម្រាប់ការរស់រានមានជីវិតនៅកម្ពុជា
→ មើល របាយការណ៍ធនាគារ/ចំណាយចុងក្រោយរបស់អ្នក
→ កត់ត្រាចំណាយដែលចាំបាច់ដើម្បីរស់រានមានជីវិត
→ គណនាភាគរយនៃចំណាយសម្រាប់ការរស់រានមានជីវិត

✅ ការបញ្ចប់បេសកកម្មថ្ងៃទី៥៖
ធ្វើរួចហើយ? សរសេរថា "DAY 5 COMPLETE - Balance៖ __/__/__%"

🚀 ដើម្បីបន្តការកំណត់អាទិភាពសកម្មភាព! សូមចុច /day6`,

   6: `🔱 ថ្ងៃទី ៦៖ ម៉ាទ្រីសអាទិភាពសកម្មភាព - កំណត់ចំណុចសំខាន់ក្នុង ១០ នាទី! 🔱

🔥 គោលដៅថ្ងៃនេះ៖ ទទួលបានផែនការសកម្មភាពផ្ទាល់ខ្លួន ៣ ចំណុច + ផែនការ ៣០ ថ្ងៃច្បាស់លាស់!

💎 ម៉ាទ្រីសអាទិភាពសកម្មភាពផ្ទាល់ខ្លួន (១០ នាទី)

⚡ ជំហានទី១ (៣ នាទី)៖ ការវិភាគផលប៉ះពាល់ទម្លាប់ប្រាក់
→ កត់ត្រាទម្លាប់ប្រាក់បច្ចុប្បន្នរបស់អ្នក
→ វាយតម្លៃផលប៉ះពាល់៖ ធំ vs តូច
→ វាយតម្លៃកម្រិតលំបាក៖ ងាយ vs ពិបាក

✅ ការបញ្ចប់បេសកកម្មថ្ងៃទី៦៖
ធ្វើរួចហើយ? សរសេរថា "DAY 6 COMPLETE - Actions៖ STOP __, START __, CONTINUE __"

🚀 ដើម្បីបន្តការបញ្ចប់កម្មវិធី! សូមចុច /day7`,

   7: `🔱 ថ្ងៃទី ៧៖ ថ្ងៃបញ្ចប់ការសិក្សា - វាស់ជោគជ័យ និងជំហានបន្ទាប់! 🔱

🎉អបអរសាទរ! អ្នកបានបញ្ចប់កម្មវិធី 7-Day Money Flow Reset™ រួចហើយ!

💎កម្មវិធីគណនាសមិទ្ធផលរយៈពេល ៧ ថ្ងៃ - វាស់ជោគជ័យភ្លាមៗ! (៥ នាទី)

⚡កត់ត្រាសមិទ្ធផលរបស់អ្នក៖
→ ថ្ងៃទី ១៖ រកបាន $____/ខែ តាមរយៈសកម្មភាពភ្លាមៗ
→ ថ្ងៃទី ២៖ បិទចំណុចលេចធ្លាយប្រាក់ $____/ខែ
→ ថ្ងៃទី ៣៖ ពិន្ទុសុខភាពហិរញ្ញវត្ថុ៖ ___% → ___%
→ ថ្ងៃទី ៤៖ លំហូរប្រាក់៖ $____ (+ វិជ្ជមាន / - អវិជ្ជមាន)
→ ថ្ងៃទី ៥៖ តុល្យភាពចំណាយ៖ __/__/__ %
→ ថ្ងៃទី ៦៖ សកម្មភាពអាទិភាព ៣ យ៉ាងត្រូវបានកំណត់រួចរាល់

🏆កម្រិតបញ្ចប់ការសិក្សារបស់អ្នក៖
• សន្សំបាន $50+/ខែ = Bronze Graduate 🥉
• សន្សំបាន $100+/ខែ = Silver Graduate 🥈
• សន្សំបាន $200+/ខែ = Gold Graduate 🥇
• សន្សំបាន $300+/ខែ = Platinum Graduate 💎

🎊ពិធីបញ្ចប់ការសិក្សា៖

🏆អ្នកបានបញ្ចប់ 7-Day Money Flow Reset™!
🎓អ្នកឥឡូវជា Cambodia Money Flow Graduate!
🚀ដំណើរទៅកាន់សេរីភាពហិរញ្ញវត្ថុរបស់អ្នកបានចាប់ផ្តើមហើយ!

✅កិច្ចការបញ្ចប់៖
ធ្វើរួចហើយ? សរសេរថា "GRADUATE COMPLETE - Saved $____/month, Ready for [Bronze/Silver/Gold/Platinum] level!"

🌐ធនធានកម្មវិធី៖ 7daymoneyflow.com

---

បញ្ចប់? ចុច /day7`
};

/**
 * Enhanced handle function with beautiful UI
 */
async function handle(msg, match, bot) {
   const dayNumber = parseInt(match[1]);
   const userId = msg.from.id;
   const chatId = msg.chat.id;
   
   console.log("=== ENHANCED DAILY HANDLER ===", { 
       user_id: userId,
       dayNumber: dayNumber,
       timestamp: new Date().toISOString()
   });

   try {
      // Validate day number
      if (dayNumber < 1 || dayNumber > CONFIG.TOTAL_DAYS) {
         await bot.sendMessage(chatId, "ថ្ងៃមិនត្រឹមត្រូវ។ សូមជ្រើសរើសពី ១ ដល់ ៧។");
         return;
      }

      // Find user and progress
      const [user, progress] = await Promise.all([
         User.findOne({ telegram_id: userId }),
         Progress.findOne({ user_id: userId })
      ]);

      if (!user) {
         await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើមកម្មវិធី។");
         return;
      }

      // Check payment status
      const isPaid = user.is_paid === true || user.is_paid === 't' || user.is_paid === 1;
      
      console.log("=== PAYMENT CHECK ===", {
         user_id: userId,
         is_paid_raw: user.is_paid,
         is_paid_converted: isPaid,
         tier: user.tier
      });
      
      if (!isPaid) {
         await bot.sendMessage(chatId, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
         return;
      }

      if (!progress) {
         await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើមកម្មវិធី។");
         return;
      }

      // Auto-fix for Day 1 access
      if (dayNumber === 1 && !progress.ready_for_day_1) {
         console.log(`🚨 Setting ready_for_day_1=true for user ${userId}`);
         await Progress.findOneAndUpdate(
            { user_id: userId },
            { ready_for_day_1: true, currentDay: 1 },
            { upsert: true }
         );
      }

      // Calculate completed days and progress
      const completedDays = [];
      for (let i = 1; i <= 7; i++) {
         if (progress[`day${i}Completed`]) {
            completedDays.push(i);
         }
      }
      
      const maxAccessibleDay = Math.max(dayNumber, progress.currentDay || 1);
      
      // Check if day is accessible
      if (dayNumber > 1 && dayNumber > progress.current_day) {
         await bot.sendMessage(chatId, "សូមបញ្ចប់ថ្ងៃមុនដើម្បីចាប់ផ្តើមថ្ងៃបន្ទាប់។");
         return;
      }

      // Generate beautiful lesson overview
      const overviewMessage = createDayOverview(dayNumber, {
         completedDays,
         currentDay: progress.currentDay,
         [`day${dayNumber}CompletedAt`]: progress[`day${dayNumber}CompletedAt`]
      });
      
      // Generate interactive navigation
      const keyboard = createNavigationKeyboard(dayNumber, completedDays, maxAccessibleDay);
      
      // Send enhanced lesson overview with beautiful formatting
      await bot.sendMessage(chatId, overviewMessage, {
         parse_mode: 'Markdown',
         reply_markup: keyboard
      });

      // Update user progress
      await Promise.all([
         Progress.findOneAndUpdate(
            { user_id: userId },
            {
               currentDay: Math.max(dayNumber, progress.currentDay || 0),
               [`day${dayNumber}AccessedAt`]: new Date(),
               lastActiveDay: dayNumber,
               updatedAt: new Date()
            },
            { upsert: true }
         ),
         User.findOneAndUpdate(
            { telegram_id: userId },
            { last_active: new Date() }
         )
      ]);

   } catch (error) {
      console.error("Error in enhanced daily command:", error);
      await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។");
   }
}

/**
 * Handle callback queries for interactive navigation
 */
// Remove or comment out the handleDayNavigation function calls
// Replace them with direct handle() calls

async function handleCallback(query, bot) {
   const { data, message, from } = query;
   const userId = from.id;
   const chatId = message.chat.id;

   try {
      const [action, param] = data.split('_');
      
      if (action === 'day') {
         const dayNum = parseInt(param);
         // Just call handle directly - no editing needed
         await handle({ from: { id: userId }, chat: { id: chatId } }, [null, dayNum.toString()], bot);
      }
      
      if (action === 'start' && param.startsWith('lesson')) {
         const lessonDay = parseInt(param.split('_')[1]);
         await startLesson(bot, chatId, userId, lessonDay);
      }
      
      if (action === 'complete') {
         const completeDay = parseInt(param);
         await markDayComplete(userId, completeDay);
         await bot.sendMessage(chatId, `🎉 បានបញ្ចប់ថ្ងៃទី ${completeDay}!`);
      }
      
      await bot.answerCallbackQuery(query.id);
      
   } catch (error) {
      console.error("Error handling callback:", error);
      await bot.answerCallbackQuery(query.id, { text: "បញ្ហាបច្ចេកទេស" });
   }
}

/**
 * Handle day navigation
 */
async function handleDayNavigation(bot, chatId, messageId, userId, dayNumber) {
   const progress = await Progress.findOne({ user_id: userId });
   if (!progress) return;
   
   const completedDays = [];
   for (let i = 1; i <= 7; i++) {
      if (progress[`day${i}Completed`]) {
         completedDays.push(i);
      }
   }
   
   const maxAccessibleDay = progress.currentDay || 1;
   
   // Add timestamp to make content unique
   const timestamp = new Date().toLocaleTimeString('km-KH', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Phnom_Penh'
   });
   
   const overviewMessage = createDayOverview(dayNumber, {
      completedDays,
      currentDay: progress.currentDay,
      [`day${dayNumber}CompletedAt`]: progress[`day${dayNumber}CompletedAt`],
      timestamp // Add this to make content unique
   });
   
   const keyboard = createNavigationKeyboard(dayNumber, completedDays, maxAccessibleDay);
   
   try {
      await bot.editMessageText(overviewMessage, {
         chat_id: chatId,
         message_id: messageId,
         parse_mode: 'Markdown',
         reply_markup: keyboard
      });
   } catch (error) {
      // If still fails, send new message
      console.log("Edit failed, sending new message:", error.message);
      await bot.sendMessage(chatId, overviewMessage, {
         parse_mode: 'Markdown',
         reply_markup: keyboard
      });
   }
}

/**
 * Start lesson content
 */
async function startLesson(bot, chatId, userId, dayNumber) {
   if (dailyMessages[dayNumber]) {
      await sendLongMessage(
         bot,
         chatId,
         dailyMessages[dayNumber],
         { parse_mode: 'Markdown' },
         CONFIG.DEFAULT_DELAY
      );
      
      // Update access timestamp
      await Progress.findOneAndUpdate(
         { user_id: userId },
         {
            [`day${dayNumber}AccessedAt`]: new Date(),
            lastActive: new Date()
         }
      );
   }
}

/**
 * Show program overview
 */
async function showProgramOverview(bot, chatId, messageId, userId) {
   const progress = await Progress.findOne({ user_id: userId });
   if (!progress) return;
   
   const completedDays = [];
   for (let i = 1; i <= 7; i++) {
      if (progress[`day${i}Completed`]) {
         completedDays.push(i);
      }
   }
   
   const overviewMessage = generateProgramOverview({ 
      completedDays, 
      currentDay: progress.currentDay || 1
   });
   
   const backKeyboard = {
      inline_keyboard: [[
         { text: "🔙 ត្រលប់ក្រោយ", callback_data: `day_${progress.currentDay || 1}` }
      ]]
   };
   
   await bot.editMessageText(overviewMessage, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: backKeyboard
   });
}

/**
 * Mark day as complete with next day unlock
 */
async function markDayComplete(userId, dayNumber) {
   try {
      const completionData = {
         [`day${dayNumber}Completed`]: true,
         [`day${dayNumber}CompletedAt`]: new Date(),
         completionPercentage: Math.floor((dayNumber / CONFIG.TOTAL_DAYS) * 100),
         lastActive: new Date()
      };

      // Unlock next day
      if (dayNumber < CONFIG.TOTAL_DAYS) {
         completionData.currentDay = dayNumber + 1;
      }

      // Mark program as complete if Day 7
      if (dayNumber === CONFIG.TOTAL_DAYS) {
         completionData.programCompleted = true;
         completionData.completionDate = new Date();
      }

      await Progress.findOneAndUpdate(
         { user_id: userId }, 
         completionData, 
         { new: true }
      );

      return true;
   } catch (error) {
      console.error("Error marking day complete:", error);
      return false;
   }
}

// Export functions
module.exports = { 
   handle, 
   handleCallback,
   dailyMessages, 
   markDayComplete,
   createDayOverview,
   createNavigationKeyboard,
   generateProgramOverview,
   generateProgressBar
};
