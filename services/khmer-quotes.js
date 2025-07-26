/**
 * Localized Motivational Quote Generator
 * Authentic Cambodian wisdom and financial mindset quotes in Khmer
 * Designed for deep emotional connection and customer engagement
 */

class KhmerQuoteGenerator {
  constructor() {
    this.quotes = {
      // Traditional Cambodian wisdom about money and success
      traditional: [
        {
          quote: "ទឹកអស់ពេលក្តៅ លុយអស់ពេលត្រជាក់",
          meaning: "Water runs out when it's hot, money runs out when it's cold",
          context: "The importance of saving for difficult times"
        },
        {
          quote: "ចេះគិតលុយ ចេះសន្សំលុយ ចេះប្រើលុយ",
          meaning: "Know how to think about money, save money, use money",
          context: "The three pillars of financial wisdom"
        },
        {
          quote: "អ្នកតិចតួចជួយគ្នា អ្នកមានទ្រព្យចែករំលែក",
          meaning: "Those with little help each other, those with wealth share",
          context: "Community support in financial growth"
        },
        {
          quote: "ព្រះអាទិត្យរះក្នុងចិត្ត ទ្រព្យសម្បត្តិរុះក្នុងដៃ",
          meaning: "The sun shines in the heart, wealth flows in the hands",
          context: "Positive mindset creates prosperity"
        },
        {
          quote: "កូនក្មេងសង់ស្រុក មនុស្សចាស់សង់ផ្ទះ",
          meaning: "Young people build the village, elders build the home",
          context: "Different life stages require different financial priorities"
        },
        {
          quote: "ដំបូងលំបាក ចុងក្រោយសុខសាន្ត",
          meaning: "Difficult at the beginning, peaceful at the end",
          context: "Financial discipline leads to future comfort"
        },
        {
          quote: "ដាំដើមចាំផ្លែ ធ្វើការចាំលុយ",
          meaning: "Plant a tree and wait for fruit, work and wait for money",
          context: "Patience and persistence in wealth building"
        },
        {
          quote: "ពូជចុងក្រោយ ប្រាក់ចុងក្រោយ",
          meaning: "Good offspring come last, good money comes last",
          context: "Quality and patience in financial decisions"
        },
        {
          quote: "ឆ្នាំផ្អែម ឆ្នាំជូរ",
          meaning: "Sweet years and sour years",
          context: "Life has both prosperous and difficult times"
        },
        {
          quote: "ស្រូវចុះតាមដី ទ្រព្យចុះតាមឆ្នាំ",
          meaning: "Rice follows the earth, wealth follows the years",
          context: "Wealth accumulation takes time and patience"
        },
        {
          quote: "លុយមិនមានជើង តែមានស្លាប់",
          meaning: "Money has no legs but it can disappear",
          context: "Money can be lost if not managed properly"
        },
        {
          quote: "ចេះបន្ថោកចេះសន្សំ ចេះខ្ជះចេះប្រើ",
          meaning: "Know when to be frugal and save, know when to spend and use",
          context: "Wisdom in financial timing"
        },
        {
          quote: "ចំណេះជាទ្រព្យ ទ្រព្យមិនចាស់",
          meaning: "Knowledge is wealth, wealth doesn't age",
          context: "Intellectual capital is lasting wealth"
        },
        {
          quote: "ឆ្នាំងដាក់បាយ ឆ្នាំងដាក់លុយ",
          meaning: "Pot for rice, pot for money",
          context: "Separate resources for necessities and savings"
        },
        {
          quote: "ដង្ហើមទាំងពីរ ផ្អែមទាំងពីរ",
          meaning: "Breathe with both lungs, sweet with both sides",
          context: "Balance in life and financial management"
        },
        {
          quote: "ខ្លួនធ្វើ ខ្លួនទទួល",
          meaning: "What you do, you receive",
          context: "Personal responsibility in financial outcomes"
        },
        {
          quote: "ទូកតូច ចរទឹកតូច",
          meaning: "Small boat, navigate small waters",
          context: "Living within your means"
        },
        {
          quote: "ប្រាក់គ្រួសារ ប្រាក់ផ្ទាល់ខ្លួន",
          meaning: "Family money, personal money",
          context: "Understanding different financial responsibilities"
        },
        {
          quote: "ធ្វើបាន ធ្វើទៅ អត់បាន អត់ធ្វើ",
          meaning: "If you can do it, do it; if you can't, don't",
          context: "Realistic financial planning"
        },
        {
          quote: "ត្រីតូច ស៊ីត្រីធំ",
          meaning: "Small fish eats big fish",
          context: "Smart financial strategies can overcome size disadvantages"
        },
        {
          quote: "ធ្វើបាន មិនឲ្យឆ្ងាយ ធ្វើអត់បាន មិនឲ្យជិត",
          meaning: "If you can do it, don't go far; if you can't, don't stay close",
          context: "Knowing your financial capabilities"
        },
        {
          quote: "ប្រាក់ស្អាត ចិត្តស្អាត",
          meaning: "Clean money, clean heart",
          context: "Honest wealth brings peace of mind"
        },
        {
          quote: "ចំណេះជាប្រាក់ ប្រាក់ជាកម្លាំង",
          meaning: "Knowledge is money, money is power",
          context: "The cycle of education and wealth"
        },
        {
          quote: "ប្រុសខ្លាំងរកស៊ី ស្រីខ្លាំងរក្សាទ្រព្យ",
          meaning: "Strong men earn, strong women preserve wealth",
          context: "Complementary roles in financial management"
        },
        {
          quote: "ចូលកំពង់ធំ ធ្វើការធំ",
          meaning: "Enter big port, do big business",
          context: "Scale your financial ambitions appropriately"
        },
        {
          quote: "ក្បាលដាក់ខ្នង ដៃដាក់ការ",
          meaning: "Head on back, hands on work",
          context: "Hard work and smart thinking create wealth"
        },
        {
          quote: "ឆ្នាំសត្វ ឆ្នាំមនុស្ស",
          meaning: "Animal years and human years",
          context: "Different life phases require different financial strategies"
        },
        {
          quote: "ចំណេះឆ្លាត ប្រាក់ឆ្លាត",
          meaning: "Smart knowledge, smart money",
          context: "Intelligence in learning and earning"
        },
        {
          quote: "ចិត្តសាមគ្គី ប្រាក់សាមគ្គី",
          meaning: "United heart, united money",
          context: "Community cooperation in wealth building"
        },
        {
          quote: "ភ្នេកមើលឆ្ងាយ ប្រាក់គិតឆ្ងាយ",
          meaning: "Eyes look far, money thinks far",
          context: "Long-term financial vision"
        },
        {
          quote: "ធ្វើដឹង ទទួលបាន",
          meaning: "Do knowingly, receive accordingly",
          context: "Conscious financial decisions yield expected results"
        },
        {
          quote: "ចិត្តស្អាត ប្រាក់ស្អាត",
          meaning: "Clean heart, clean money",
          context: "Ethical wealth creation"
        },
        {
          quote: "ធ្វើតាមគ្រូ ប្រាក់តាមខ្លួន",
          meaning: "Follow the teacher, money follows yourself",
          context: "Learn from others but create your own wealth"
        },
        {
          quote: "ប្រាក់ថ្ងៃមុខ ថ្ងៃស្អែក",
          meaning: "Money today, money tomorrow",
          context: "Consistent financial habits"
        },
        {
          quote: "ដៃចេះធ្វើ ចិត្តចេះគិត",
          meaning: "Hands know how to work, mind knows how to think",
          context: "Combining manual work with strategic thinking"
        }
      ],

      // Financial mindset and success quotes
      financial: [
        {
          quote: "លុយទិញសុភមង្គលមិនបាន តែទិញសេរីភាពបាន",
          meaning: "Money cannot buy happiness, but it can buy freedom",
          context: "Understanding money's true value"
        },
        {
          quote: "វិនិយោគល្អបំផុតគឺវិនិយោគលើខ្លួនឯង",
          meaning: "The best investment is investing in yourself",
          context: "Personal development creates lasting wealth"
        },
        {
          quote: "ចំណូលធំ មិនមានន័យថាសន្សំបានច្រើន",
          meaning: "Big income doesn't mean big savings",
          context: "Managing expenses is more important than earning more"
        },
        {
          quote: "រៀនមិនចប់ ទ្រព្យសម្បត្តិក៏មិនចប់",
          meaning: "Learning never ends, wealth never ends",
          context: "Continuous learning creates continuous wealth"
        },
        {
          quote: "ឥឡូវដាក់លុយធ្វើការ ក្រោយលុយធ្វើការឲ្យ",
          meaning: "Now put money to work, later money works for you",
          context: "The power of compound interest and investment"
        },
        {
          quote: "ផែនការហិរញ្ញវត្ថុល្អ ជីវិតអនាគតល្អ",
          meaning: "Good financial plan, good future life",
          context: "Planning creates prosperity"
        },
        {
          quote: "ចំណាយដាក់ប្រាក់ជាមុន សន្សំដាក់ខ្លួនជាមុន",
          meaning: "Put money before spending, put saving before yourself",
          context: "Prioritizing savings in financial planning"
        },
        {
          quote: "ថវិកាជាផ្នែកខ្លួន ចំណាយជាផ្នែកបម្រុង",
          meaning: "Budget is personal, spending is preparation",
          context: "Understanding budgeting as personal preparation"
        },
        {
          quote: "ទិញចាំបាច់ មិនទិញបំណង",
          meaning: "Buy necessities, don't buy wants",
          context: "Distinguishing needs from wants in spending"
        },
        {
          quote: "ទ្រព្យសម្បត្តិមិនឃើញ ចំណេះឃើញ",
          meaning: "Invisible wealth, visible knowledge",
          context: "Knowledge is more valuable than visible wealth"
        },
        {
          quote: "ធ្វើកាលសន្សំកាល",
          meaning: "Do in time, save in time",
          context: "Timing in earning and saving"
        },
        {
          quote: "ប្រាក់ដូចទឹក ត្រូវតែមានទីស្ទុក",
          meaning: "Money is like water, it needs a container",
          context: "Financial structure and systems"
        },
        {
          quote: "ការកាត់បន្ថយមិនដូចការបន្ថែម",
          meaning: "Reducing is not like adding",
          context: "Difficulty of cutting expenses vs increasing income"
        },
        {
          quote: "ចំណាយឆ្លាតជាងចំណូលឆ្លាត",
          meaning: "Smart spending is better than smart earning",
          context: "Expense management is more important than income"
        },
        {
          quote: "ផ្ទះខ្ពស់ទីកន្លែងស្អាត",
          meaning: "High house, clean place",
          context: "Quality investments in good locations"
        },
        {
          quote: "ចំណេះដាក់ក្បាល ប្រាក់ដាក់ដៃ",
          meaning: "Knowledge in head, money in hand",
          context: "Balance of intellectual and financial capital"
        },
        {
          quote: "វិនិយោគឆ្លាត ទ្រព្យសម្បត្តិឆ្លាត",
          meaning: "Smart investment, smart wealth",
          context: "Intelligence in investment decisions"
        },
        {
          quote: "ចំណូលពីរប្រភេទ ចំណាយមួយប្រភេទ",
          meaning: "Two types of income, one type of expense",
          context: "Diversifying income while controlling expenses"
        },
        {
          quote: "ប្រាក់សាមគ្គី ចំណាយផ្ទាល់ខ្លួន",
          meaning: "Collective money, individual expenses",
          context: "Collective savings, personal spending discipline"
        },
        {
          quote: "ធ្វើការសន្សំ ទុកសេចក្តីសុខ",
          meaning: "Do saving work, keep happiness",
          context: "Building both financial and emotional security"
        },
        {
          quote: "ថវិកាអាចកែប្រែ ចំណាយអាចគ្រប់គ្រង",
          meaning: "Budget can be changed, expenses can be controlled",
          context: "Flexibility and control in financial management"
        },
        {
          quote: "ចំណេះធ្វើចំណូល ប្រាក់ធ្វើប្រាក់",
          meaning: "Knowledge creates income, money creates money",
          context: "Using knowledge and capital multiplication"
        },
        {
          quote: "ពេលវេលាគឺលុយ លុយមិនទិញពេលវេលា",
          meaning: "Time is money, money can't buy time",
          context: "Value of time in financial decisions"
        },
        {
          quote: "ចាប់ផ្តើមតូច ចុងក្រោយធំ",
          meaning: "Start small, end big",
          context: "Growing wealth through consistent small actions"
        },
        {
          quote: "ប្រាក់ចាស់ មិនខូចឆាប់",
          meaning: "Old money doesn't spoil quickly",
          context: "Established wealth tends to be more stable"
        },
        {
          quote: "ធ្វើសន្សំ ដើម្បីលក់",
          meaning: "Save to spend",
          context: "Strategic saving for future opportunities"
        },
        {
          quote: "ចំណូលកើនឡើង ចំណាយកើនកាន់តែលឿន",
          meaning: "Income increases, expenses increase faster",
          context: "Lifestyle inflation awareness"
        },
        {
          quote: "ប្រាក់សាមគ្គី ចំណេះសាមគ្គី",
          meaning: "Collective money, collective knowledge",
          context: "Community wealth building"
        },
        {
          quote: "ចេះទិញ ចេះលក់ ចេះទុក",
          meaning: "Know how to buy, sell, and save",
          context: "Complete financial literacy"
        },
        {
          quote: "ការវិនិយោគគឺការរៀន",
          meaning: "Investing is learning",
          context: "Education aspect of investment"
        },
        {
          quote: "ប្រាក់ធ្វើការពីកន្លែងឆ្ងាយ",
          meaning: "Money works from far away",
          context: "Passive income and remote investments"
        },
        {
          quote: "ធ្វើប្រាក់ដាក់ប្រាក់ ទុកប្រាក់ចាំប្រាក់",
          meaning: "Make money, put money, save money, wait for money",
          context: "Complete cycle of wealth building"
        },
        {
          quote: "ឆ្នាំងពីរ ប្រាក់ពីរ",
          meaning: "Two pots, two funds",
          context: "Separating different funds for different purposes"
        },
        {
          quote: "ចេះកាន់ ចេះបន្ត",
          meaning: "Know when to hold, know when to continue",
          context: "Timing in financial decisions"
        },
        {
          quote: "ប្រាក់ធ្វើឆ្នាំង ចិត្តធ្វើចាន",
          meaning: "Money makes the pot, heart makes the bowl",
          context: "Balance between wealth accumulation and emotional well-being"
        }
      ],

      // Daily motivation and encouragement
      motivation: [
        {
          quote: "ថ្ងៃនេះកែប្រែ ស្អែកផ្លាស់ប្តូរ",
          meaning: "Today improve, tomorrow transform",
          context: "Small daily changes create big results"
        },
        {
          quote: "ជំហានតូចៗ នាំទៅជោគជ័យធំ",
          meaning: "Small steps lead to big success",
          context: "Progress over perfection"
        },
        {
          quote: "ចាប់ផ្តើមគឺជាការបញ្ចប់នៃភាពខ្វះខាត",
          meaning: "Starting is the end of lacking",
          context: "Taking action overcomes scarcity"
        },
        {
          quote: "អតីតប្រែប្រួលមិនបាន អនាគតបង្កើតបាន",
          meaning: "The past cannot be changed, the future can be created",
          context: "Focus on what you can control"
        },
        {
          quote: "វិន័យហិរញ្ញវត្ថុ នាំមកសុភមង្គល",
          meaning: "Financial discipline brings happiness",
          context: "Self-control creates abundance"
        },
        {
          quote: "ដំបូងលំបាក កណ្តាលល្អ ចុងក្រោយជោគជ័យ",
          meaning: "Beginning is hard, middle is good, end is successful",
          context: "The journey of financial transformation"
        },
        {
          quote: "ចិត្តខ្លាំង ដៃខ្លាំង ជីវិតខ្លាំង",
          meaning: "Strong mind, strong hands, strong life",
          context: "Mental and physical strength create success"
        },
        {
          quote: "ព្រលឹមមួយរុះ ព្រៃមួយឡើង",
          meaning: "One seed sprouts, one forest grows",
          context: "Small actions have big consequences"
        },
        {
          quote: "ធ្វើថ្ងៃនេះ ចាំថ្ងៃស្អែក",
          meaning: "Do today, wait for tomorrow",
          context: "Action today creates results tomorrow"
        },
        {
          quote: "ព្រលឹមល្អ ផ្លែល្អ",
          meaning: "Good seed, good fruit",
          context: "Quality inputs create quality outputs"
        },
        {
          quote: "ថ្ងៃទី១០០ ចាប់ពីថ្ងៃទី១",
          meaning: "Day 100 starts from day 1",
          context: "Long-term success begins with first step"
        },
        {
          quote: "ចិត្តធ្វើខ្លួន ខ្លួនធ្វើចិត្ត",
          meaning: "Mind makes the person, person makes the mind",
          context: "Mental and physical discipline reinforce each other"
        },
        {
          quote: "រៀនថ្ងៃនេះ ប្រើថ្ងៃស្អែក",
          meaning: "Learn today, use tomorrow",
          context: "Continuous learning for future application"
        },
        {
          quote: "ខ្វះខាតនាំឱ្យច្នៃប្រឌិត",
          meaning: "Scarcity leads to creativity",
          context: "Limitations force innovation"
        },
        {
          quote: "ប៉ុន្មានដងជម្រុះ ប៉ុន្មានដងឡើង",
          meaning: "How many times you fall, how many times you rise",
          context: "Resilience through repeated effort"
        },
        {
          quote: "ថ្ងៃដំបូងជោគជ័យ ថ្ងៃចុងក្រោយសុខ",
          meaning: "First day of success, last day of happiness",
          context: "Success is a journey, not a destination"
        },
        {
          quote: "ក្តីសង្ឃឹមជាអាហារចិត្ត",
          meaning: "Hope is food for the soul",
          context: "Optimism sustains motivation"
        },
        {
          quote: "ចាប់ផ្តើមតាំងពីឥឡូវ ផ្លាស់ប្តូរចាប់ពីថ្ងៃនេះ",
          meaning: "Start from now, change from today",
          context: "Immediate action creates immediate change"
        },
        {
          quote: "ទឹកដាក់បន្តិចៗ ទឹកអស់ទាំងឆ្នាំង",
          meaning: "Drop by drop, the whole pot empties",
          context: "Small consistent actions have big cumulative effects"
        },
        {
          quote: "ការព្យាយាមរបស់ថ្ងៃនេះ ជាសុភមង្គលនៃថ្ងៃស្អែក",
          meaning: "Today's effort is tomorrow's happiness",
          context: "Present action creates future joy"
        },
        {
          quote: "ចិត្តស្អាតដូចដែក ដៃស្អាតដូចប្រាក់",
          meaning: "Mind clean like steel, hands clean like silver",
          context: "Mental clarity and honest work"
        },
        {
          quote: "ក្តីលំបាកធ្វើឲ្យខ្លាំង",
          meaning: "Difficulty makes us strong",
          context: "Challenges build resilience"
        },
        {
          quote: "ពេលវេលាល្អគ្រប់គ្រាន់ ពេលវេលាអាក្រក់មិនអស់",
          meaning: "Good times are enough, bad times don't last",
          context: "Temporal nature of difficulties"
        },
        {
          quote: "ចិត្តក្តៅ ការងារត្រជាក់",
          meaning: "Hot heart, cool work",
          context: "Balance passion with systematic approach"
        },
        {
          quote: "ប្រាក់តូច ចិត្តធំ",
          meaning: "Small money, big heart",
          context: "Generosity is independent of wealth"
        },
        {
          quote: "ជីវិតជាសាលារៀន បទពិសោធជាគ្រូ",
          meaning: "Life is school, experience is teacher",
          context: "Learning from daily experiences"
        },
        {
          quote: "ចាប់ផ្តើមខ្លួនឯង ចុងក្រោយជួយគេ",
          meaning: "Start with yourself, end helping others",
          context: "Self-improvement enables helping others"
        },
        {
          quote: "ថ្ងៃល្អថ្ងៃអាក្រក់ ទាំងអស់បង្រៀនយើង",
          meaning: "Good days and bad days all teach us",
          context: "Every day offers learning opportunities"
        },
        {
          quote: "ដៃដាក់ការ ចិត្តដាក់ការ",
          meaning: "Hands on work, mind on work",
          context: "Complete engagement in tasks"
        },
        {
          quote: "ប្រាក់តូច ក្តីសង្ឃឹមធំ",
          meaning: "Small money, big hope",
          context: "Optimism regardless of current circumstances"
        },
        {
          quote: "ធ្វើយ៉ាងណាក៏បាន គ្រាន់តែធ្វើ",
          meaning: "Do it somehow, just do it",
          context: "Taking action despite imperfect conditions"
        },
        {
          quote: "ចំណេះដែលធ្វើបាន ប្រាក់ដែលរកបាន",
          meaning: "Knowledge you can apply, money you can earn",
          context: "Practical knowledge creates earning potential"
        },
        {
          quote: "ថ្ងៃល្អឥឡូវ ជីវិតល្អអនាគត",
          meaning: "Good day now, good life future",
          context: "Daily quality creates lifetime quality"
        },
        {
          quote: "ជម្រុះគ្រប់ដង លើកឡើងគ្រប់ដង",
          meaning: "Fall every time, rise every time",
          context: "Resilience through consistent recovery"
        },
        {
          quote: "ចិត្តមិនអាចបាត់ ដៃមិនអាចឈប់",
          meaning: "Spirit cannot be lost, hands cannot stop",
          context: "Persistence in both attitude and action"
        }
      ],

      // Success and achievement quotes
      success: [
        {
          quote: "ជោគជ័យមកពីការព្យាយាម មិនមែនពីសំណាង",
          meaning: "Success comes from effort, not from luck",
          context: "Hard work creates lasting results"
        },
        {
          quote: "ទទួលបានអ្វីដែលបានផ្តល់ក្នុងជីវិត",
          meaning: "You receive what you give in life",
          context: "Value creation leads to wealth creation"
        },
        {
          quote: "បរាជ័យជាគ្រូបង្រៀនល្អបំផុត",
          meaning: "Failure is the best teacher",
          context: "Learning from mistakes accelerates growth"
        },
        {
          quote: "ជំនាញលុយគឺជំនាញជីវិត",
          meaning: "Money skills are life skills",
          context: "Financial literacy is essential for success"
        },
        {
          quote: "ខ្ជិលមួយថ្ងៃ ខាតមួយជីវិត",
          meaning: "One day of laziness, one lifetime of loss",
          context: "Consistency compounds over time"
        },
        {
          quote: "ភ្ញាក់ដោយក្តីសង្ឃឹម ដេកដោយសុភមង្គល",
          meaning: "Wake up with hope, sleep with contentment",
          context: "Positive mindset creates positive results"
        },
        {
          quote: "ជោគជ័យធំ មកពីសម្រេចតូចៗ",
          meaning: "Big success comes from small achievements",
          context: "Incremental progress builds major results"
        },
        {
          quote: "ជំនាញគ្រប់យ៉ាង ចាប់ពីជំនាញមួយ",
          meaning: "All skills start from one skill",
          context: "Mastery begins with single competency"
        },
        {
          quote: "ទ្រព្យធំបំផុត គឺសុខភាពល្អ",
          meaning: "The greatest wealth is good health",
          context: "Health is the foundation of all success"
        },
        {
          quote: "ក្តីសុខជាផ្លែ កិច្ចការជាគល់",
          meaning: "Happiness is fruit, work is root",
          context: "Joy comes from purposeful work"
        },
        {
          quote: "ខ្ពស់ព័ត៌មាន ខ្ពស់ប្រាក់ចំណូល",
          meaning: "Higher information, higher income",
          context: "Knowledge elevation increases earning potential"
        },
        {
          quote: "ជោគជ័យក្នុងដៃ កំហុសក្នុងចិត្ត",
          meaning: "Success in hands, mistakes in mind",
          context: "Learn from errors while creating results"
        },
        {
          quote: "ជំនាញរឹង សុខភាពខ្លាំង",
          meaning: "Strong skills, strong health",
          context: "Competence and wellness support each other"
        },
        {
          quote: "ធ្វើដោយអត់ធ្មត់ ទទួលដោយសុភមង្គល",
          meaning: "Do with patience, receive with joy",
          context: "Patient effort yields joyful results"
        },
        {
          quote: "គំលាតចំណេះដឹង គំលាតជោគជ័យ",
          meaning: "Knowledge gap, success gap",
          context: "Learning gaps create achievement gaps"
        },
        {
          quote: "ចេះធ្វើឯកដើម្បីក្រុម ចេះធ្វើក្រុមដើម្បីឯក",
          meaning: "Know how to work alone for group, work in group for self",
          context: "Balance individual effort with teamwork"
        },
        {
          quote: "ជោគជ័យផ្ទាល់ខ្លួន ចាប់ពីការរៀន",
          meaning: "Personal success starts from learning",
          context: "Self-improvement is the foundation"
        },
        {
          quote: "រៀនសុវត្ថិភាព ធ្វើដោយប្រុងប្រយ័ត្ន",
          meaning: "Learn safety, work with care",
          context: "Knowledge and caution prevent problems"
        },
        {
          quote: "ថ្ងៃជោគជ័យ ថ្ងៃមិនបន្តបន្ទាប់",
          meaning: "Success day, not consecutive days",
          context: "Celebrate achievements while staying humble"
        },
        {
          quote: "ប្រាក់ធ្វើខ្លួន ខ្លួនធ្វើប្រាក់",
          meaning: "Money makes person, person makes money",
          context: "Mutual relationship between wealth and character"
        },
        {
          quote: "ភ្នេកមើលឡើង ជើងដើរទៅមុខ",
          meaning: "Eyes look up, feet walk forward",
          context: "Vision and action together create progress"
        },
        {
          quote: "ជីវិតជោគជ័យ ចាប់ពីចិត្តជោគជ័យ",
          meaning: "Successful life starts from successful mind",
          context: "Mental success precedes external success"
        },
        {
          quote: "ទទួលសម្គាល់ដោយការធ្វើ មិនដោយការនិយាយ",
          meaning: "Recognized by doing, not by talking",
          context: "Actions speak louder than words"
        },
        {
          quote: "ក្រុមខ្លាំង គ្រួសារខ្លាំង",
          meaning: "Strong team, strong family",
          context: "Group strength supports individual success"
        },
        {
          quote: "ជោគជ័យមួយ នាំមកជោគជ័យច្រើន",
          meaning: "One success brings many successes",
          context: "Success momentum builds upon itself"
        },
        {
          quote: "ចេះដោះស្រាយ ចេះបង្កើត",
          meaning: "Know how to solve, know how to create",
          context: "Problem-solving and innovation skills"
        },
        {
          quote: "ពេលវេលាដាក់ខ្លួន ខ្លួនដាក់ពេលវេលា",
          meaning: "Time invests in person, person invests time",
          context: "Mutual investment of time and self-development"
        },
        {
          quote: "ចំណេះចាស់ ទ្រព្យថ្មី",
          meaning: "Old knowledge, new wealth",
          context: "Applying established wisdom to create fresh value"
        },
        {
          quote: "ប្រាក់ធ្វើឲ្យនៅ ការធ្វើឲ្យទៅ",
          meaning: "Money makes you stay, work makes you go",
          context: "Balance security with growth opportunities"
        },
        {
          quote: "ចំណេះដឹងជាជំនាញ ប្រសិនបើធ្វើជាការ",
          meaning: "Knowledge becomes skill when applied to work",
          context: "Practical application transforms learning"
        },
        {
          quote: "ជីវិតជោគជ័យ ព្រោះតែធ្វើឲ្យបាន",
          meaning: "Successful life because of making it happen",
          context: "Active creation of desired outcomes"
        },
        {
          quote: "ដៃធ្វើចិត្តស្រួល ចិត្តស្រួលដៃធ្វើ",
          meaning: "Working hands make peaceful mind, peaceful mind makes working hands",
          context: "Productive work and mental peace reinforce each other"
        },
        {
          quote: "ជោគជ័យពិត ជាជោគជ័យរួម",
          meaning: "True success is shared success",
          context: "Authentic achievement benefits others too"
        },
        {
          quote: "ឧត្តមភាពផ្ទាល់ខ្លួន ក្នុងសហគមន៍",
          meaning: "Personal excellence within community",
          context: "Individual excellence within community"
        },
        {
          quote: "ចំណេះដឹងធ្វើដំណើរ ប្រាក់ធ្វើសិទ្ធិ",
          meaning: "Knowledge creates journey, money creates rights",
          context: "Learning opens paths, wealth provides options"
        }
      ]
    };

    this.dailyThemes = {
      monday: { category: 'motivation', theme: 'new_beginnings' },
      tuesday: { category: 'financial', theme: 'discipline' },
      wednesday: { category: 'traditional', theme: 'wisdom' },
      thursday: { category: 'success', theme: 'perseverance' },
      friday: { category: 'financial', theme: 'planning' },
      saturday: { category: 'motivation', theme: 'progress' },
      sunday: { category: 'traditional', theme: 'reflection' }
    };
  }

  /**
   * Get quote based on current day of week
   * @returns {Object} Quote object with Khmer text and context
   */
  getDailyQuote() {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayTheme = this.dailyThemes[dayName];
    
    const categoryQuotes = this.quotes[dayTheme.category];
    const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
    
    return {
      ...categoryQuotes[randomIndex],
      category: dayTheme.category,
      theme: dayTheme.theme,
      day: dayName
    };
  }

  /**
   * Get specific quote by category
   * @param {string} category - Quote category (traditional, financial, motivation, success)
   * @returns {Object} Quote object
   */
  getQuoteByCategory(category) {
    if (!this.quotes[category]) {
      return this.getDailyQuote();
    }
    
    const categoryQuotes = this.quotes[category];
    const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
    
    return {
      ...categoryQuotes[randomIndex],
      category: category
    };
  }

  /**
   * Get quote for specific day progress
   * @param {number} dayNumber - Day number (1-7)
   * @returns {Object} Quote object relevant to day content
   */
  getQuoteForDay(dayNumber) {
    const dayQuotes = {
      1: this.getQuoteByCategory('motivation'), // Money Flow understanding
      2: this.getQuoteByCategory('traditional'), // Money Leaks awareness
      3: this.getQuoteByCategory('financial'), // System evaluation
      4: this.getQuoteByCategory('success'), // Income/Cost mapping
      5: this.getQuoteByCategory('traditional'), // Survival vs Growth
      6: this.getQuoteByCategory('financial'), // Action planning
      7: this.getQuoteByCategory('success') // Integration and success
    };
    
    return dayQuotes[dayNumber] || this.getDailyQuote();
  }

  /**
   * Format quote for Telegram display
   * @param {Object} quoteData - Quote data object
   * @returns {string} Formatted message for Telegram
   */
  formatQuote(quoteData) {
    const { quote, meaning, context, category } = quoteData;
    
    const categoryEmojis = {
      traditional: '🏛️',
      financial: '💰',
      motivation: '🌟',
      success: '🏆'
    };
    
    const emoji = categoryEmojis[category] || '💭';
    
    return `${emoji} សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ ${emoji}

"${quote}"

💡 អត្ថន័យ: ${meaning}

🎯 ការយល់ដឹង: ${context}

✨ សម្រាប់ការរីកចម្រើនហិរញ្ញវត្ថុរបស់អ្នក`;
  }

  /**
   * Get motivational quote for specific user milestone
   * @param {string} milestone - Milestone type (day_complete, payment_confirmed, etc.)
   * @returns {Object} Appropriate quote for milestone
   */
  getMilestoneQuote(milestone) {
    const milestoneQuotes = {
      day_complete: this.getQuoteByCategory('success'),
      payment_confirmed: this.getQuoteByCategory('motivation'),
      program_complete: this.getQuoteByCategory('success'),
      streak_achieved: this.getQuoteByCategory('traditional'),
      vip_upgrade: this.getQuoteByCategory('financial')
    };
    
    return milestoneQuotes[milestone] || this.getDailyQuote();
  }

  /**
   * Get all quotes for a specific category
   * @param {string} category - Category name
   * @returns {Array} Array of all quotes in category
   */
  getAllQuotesByCategory(category) {
    return this.quotes[category] || [];
  }

  /**
   * Get random wisdom quote for general motivation
   * @returns {Object} Random quote from all categories
   */
  getRandomWisdom() {
    const allCategories = Object.keys(this.quotes);
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    return this.getQuoteByCategory(randomCategory);
  }

  /**
   * Get quote statistics
   * @returns {Object} Statistics about available quotes
   */
  getQuoteStats() {
    const stats = {};
    let totalQuotes = 0;
    
    Object.keys(this.quotes).forEach(category => {
      const count = this.quotes[category].length;
      stats[category] = count;
      totalQuotes += count;
    });
    
    return {
      ...stats,
      total: totalQuotes,
      categories: Object.keys(this.quotes).length
    };
  }
}

module.exports = KhmerQuoteGenerator;