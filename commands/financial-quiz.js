/**
 * Financial Health Quiz - Interactive Assessment for Unpaid Users
 * Based on pre-learning trailer design to provide immediate value and build trust
 */

const User = require("../models/User"); // Assuming User model is available for user data

// User state storage for quiz flow: Stores current question and answers for each user
const quizState = new Map();

// Enhanced 10/10 Financial Quiz with comprehensive assessment
const financialQuiz = {
  title: "🎯 ការវាយតម្លៃសុខភាពហិរញ្ញវត្ថុ - Smart Assessment",
  subtitle: "ការវិភាគឆ្លាតវៃ ៣ នាទី ដែលអាចផ្លាស់ប្តូរជីវិតអ្នក",

  questions: [
    {
      id: 1,
      category: "income",
      question: "💰 ចំណូលសរុបប្រចាំខែរបស់អ្នក (បូកទាំងអស់)?",
      hint: "រួមបញ្ចូល: ប្រាក់ខែ, អាជីវកម្ម, ការវិនិយោគ, ចំណូលបន្ថែម",
      options: [
        { value: 250, text: "ក្រោម $250", multiplier: 0.5 },
        { value: 500, text: "$250-$500", multiplier: 0.7 },
        { value: 800, text: "$500-$800", multiplier: 0.85 },
        { value: 1200, text: "$800-$1200", multiplier: 1.0 },
        { value: 2000, text: "$1200-$2000", multiplier: 1.2 },
        { value: 3000, text: "លើស $2000", multiplier: 1.5 },
      ],
    },
    {
      id: 2,
      category: "expenses",
      question: "🏠 ចំណាយចាំបាច់ប្រចាំខែ (ផ្ទះ, អាហារ, ដឹកជញ្ជូន)?",
      hint: "គណនាតែចំណាយមិនអាចជៀសផុតបាន",
      options: [
        { value: 150, text: "ក្រោម $150", efficiency: "high" },
        { value: 300, text: "$150-$300", efficiency: "good" },
        { value: 500, text: "$300-$500", efficiency: "average" },
        { value: 700, text: "$500-$700", efficiency: "concern" },
        { value: 1000, text: "$700-$1000", efficiency: "high_concern" },
        { value: 1200, text: "លើស $1000", efficiency: "critical" },
      ],
    },
    {
      id: 3,
      category: "debt",
      question: "💳 សរុបបំណុលទាំងអស់ (កម្ចី, Credit Card, ទិញរំលស់)?",
      hint: "បំណុលទាំងអស់ដែលត្រូវសង",
      options: [
        { value: 0, text: "គ្មានបំណុល", stress: "none" },
        { value: 300, text: "ក្រោម $300", stress: "low" },
        { value: 1000, text: "$300-$1000", stress: "moderate" },
        { value: 3000, text: "$1000-$3000", stress: "high" },
        { value: 6000, text: "$3000-$6000", stress: "very_high" },
        { value: 10000, text: "លើស $6000", stress: "critical" },
      ],
    },
    {
      id: 4,
      category: "savings",
      question: "🏦 លុយសន្សំ និង Emergency Fund បច្ចុប្បន្ន?",
      hint: "លុយដែលអាចប្រើបានភ្លាមៗ",
      options: [
        { value: 0, text: "គ្មានសន្សំសោះ", security: "none" },
        { value: 50, text: "ក្រោម $50", security: "very_low" },
        { value: 200, text: "$50-$200", security: "low" },
        { value: 500, text: "$200-$500", security: "moderate" },
        { value: 1000, text: "$500-$1000", security: "good" },
        { value: 2000, text: "លើស $1000", security: "excellent" },
      ],
    },
    {
      id: 5,
      category: "habits",
      question: "📊 តើអ្នកតាមដានចំណាយប្រចាំថ្ងៃទេ?",
      hint: "ដឹងថាលុយទៅកន្លែងណាខ្លះ",
      options: [
        { value: "never", text: "មិនដែលតាមដានសោះ", awareness: 0 },
        { value: "rarely", text: "ម្តងម្កាលធ្វើ", awareness: 20 },
        { value: "sometimes", text: "ធ្វើច្រើនតែមិនទៀងទាត់", awareness: 50 },
        { value: "regularly", text: "ធ្វើនៅចុងខែ", awareness: 70 },
        { value: "daily", text: "តាមដានរាល់ថ្ងៃ", awareness: 100 },
      ],
    },
    {
      id: 6,
      category: "money_leaks",
      question: "🔍 តើអ្នកមាន Subscriptions ដែលមិនប្រើច្រើនទេ?",
      hint: "Netflix, Spotify, Apps, Gym, សេវាកម្មផ្សេងៗ",
      options: [
        { value: 0, text: "គ្មាន - ខ្ញុំបានបោះបង់ទាំងអស់", leaks: 0 },
        { value: 15, text: "មាន ១-២ យ៉ាង ($10-20/ខែ)", leaks: 15 },
        { value: 40, text: "មានច្រើនយ៉ាង ($30-50/ខែ)", leaks: 40 },
        { value: 80, text: "មានច្រើនណាស់ ($60-100/ខែ)", leaks: 80 },
        { value: 120, text: "មិនដឹងច្បាស់ - គ្រប់យ៉ាងទាំងអស់", leaks: 120 },
      ],
    },
    {
      id: 7,
      category: "goals",
      question: "🎯 គោលដៅហិរញ្ញវត្ថុចម្បងរបស់អ្នកក្នុង ១២ ខែខាងមុខ?",
      hint: "អ្វីដែលសំខាន់បំផុតសម្រាប់អ្នក",
      options: [
        {
          value: "emergency",
          text: "បង្កើត Emergency Fund ៣-៦ ខែ",
          priority: "security",
        },
        { value: "debt", text: "សងបំណុលអោយអស់", priority: "freedom" },
        {
          value: "save",
          text: "សន្សំលុយដើម្បីទិញរបស់ធំ",
          priority: "purchase",
        },
        { value: "invest", text: "ចាប់ផ្តើមវិនិយោគ", priority: "growth" },
        {
          value: "business",
          text: "ចាប់ផ្តើមអាជីវកម្ម",
          priority: "entrepreneur",
        },
        {
          value: "improve",
          text: "កែលម្អប្រព័ន្ធគ្រប់គ្រងលុយ",
          priority: "system",
        },
      ],
    },
    {
      id: 8,
      category: "mindset",
      question: "🧠 តើអ្នកយល់ដឹងកម្រិតណាអំពី Money Flow?",
      hint: "ភាពស្វែងយល់ពីលំហូរលុយចូល-ចេញ",
      options: [
        {
          value: "beginner",
          text: "ចាប់ផ្តើមថ្មី - ចង់រៀនពីមូលដ្ឋាន",
          knowledge: 10,
        },
        { value: "basic", text: "ដឹងខ្លះ - បានសាកល្បងធ្វើ", knowledge: 30 },
        {
          value: "intermediate",
          text: "ដឹងមធ្យម - មានបទពិសោធន៍",
          knowledge: 60,
        },
        {
          value: "advanced",
          text: "ដឹងច្រើន - ត្រូវការកម្រិតខ្ពស់",
          knowledge: 80,
        },
      ],
    },
  ],
};

// FinancialQuiz class to manage quiz logic and state
class FinancialQuiz {
  /**
   * Starts the financial health quiz for a user.
   * Initializes quiz state and sends the introductory message.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   */
  async startQuiz(msg, bot) {
    const userId = msg.from.id;

    // Initialize quiz state for the user
    quizState.set(userId, {
      currentQuestion: 1, // Start from the first question
      answers: {}, // Store user's answers
      startTime: new Date(), // Record quiz start time
    });

    const introMessage = `🎯 ការវាយតម្លៃសុខភាពហិរញ្ញវត្ថុ - Smart Assessment

🔥 ការវាយតម្លៃឆ្លាតវៃដោយឥតគិតថ្លៃ!
⚡ បញ្ចប់ក្នុង ៣ នាទី - ទទួលលទ្ធផលភ្លាមៗ

🏆 អ្នកនឹងទទួលបាន (តម្លៃ $47):
💎 ពិន្ទុ Financial Health /១០០ + ការវិភាគលម្អិត
🎯 រកឃើញ Money Leaks ដែលធ្វើឱ្យអ្នកខាតលុយ
📊 ផែនការកែលម្អ ៥ ចំណុចជាក់ស្តែង
💰 គណនាថាអ្នកអាចសន្សំបានប៉ុន្មានក្នុង ៣០ ថ្ងៃ
🚀 ទទួលប្រឹក្សាផ្ទាល់ពីការកែលម្អ
📈 ការប្រៀបធៀបជាមួយអ្នកប្រើប្រាស់ដទៃ

⭐ រួចរាល់ + អ្នកនឹងទទួលបាន:
🎁 Free Tools Pack តម្លៃ $25
🔓 Access ដល់ Preview Content ពិសេស
💡 Personal Insights ដែលគ្មាននៅកន្លែងផ្សេង

🚨 ការវាយតម្លៃនេះប្រើដោយអ្នកជំនាញហិរញ្ញវត្ថុកម្ពុជា ២០០+ នាក់!

🚀 ត្រៀមចាប់ផ្តើម?
ចុច /ready ដើម្បីចាប់ផ្តើម Smart Assessment របស់អ្នក!

💡 ឬសរសេរ "READY" ក៏បាន`;

    await bot.sendMessage(msg.chat.id, introMessage);
  }

  /**
   * Processes a user's response during the quiz flow.
   * Checks if the message is a valid answer and moves to the next question or shows results.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   * @returns {boolean} - True if the message was processed as part of the quiz, false otherwise.
   */
  async processQuizResponse(msg, bot) {
    const userId = msg.from.id;
    const text = msg.text ? msg.text.toUpperCase() : ""; // Ensure text is uppercase, handle undefined msg.text

    const state = quizState.get(userId);
    if (!state) return false; // Not in a quiz session

    // Handle both "READY" word and "/ready" command to start the first question
    if ((text === "READY" || text === "/READY") && state.currentQuestion === 1) {
      await this.askQuestion(msg, bot, 1);
      return true;
    }

    // Process answer for the current question
    const questionNum = state.currentQuestion;
    const question = financialQuiz.questions[questionNum - 1]; // Get the current question object

    if (question) {
      const answerIndex = parseInt(text) - 1; // Convert user input to 0-based index
      // Validate if the answer is a valid option number
      if (answerIndex >= 0 && answerIndex < question.options.length) {
        // Store the selected option's value and metadata
        const selectedOption = question.options[answerIndex];
        state.answers[`q${questionNum}`] = selectedOption.value;

        // Store additional metadata for enhanced analysis
        if (selectedOption.multiplier)
          state.answers[`q${questionNum}_multiplier`] =
            selectedOption.multiplier;
        if (selectedOption.efficiency)
          state.answers[`q${questionNum}_efficiency`] =
            selectedOption.efficiency;
        if (selectedOption.stress)
          state.answers[`q${questionNum}_stress`] = selectedOption.stress;
        if (selectedOption.security)
          state.answers[`q${questionNum}_security`] = selectedOption.security;
        if (selectedOption.awareness)
          state.answers[`q${questionNum}_awareness`] = selectedOption.awareness;
        if (selectedOption.leaks)
          state.answers[`q${questionNum}_leaks`] = selectedOption.leaks;
        if (selectedOption.priority)
          state.answers[`q${questionNum}_priority`] = selectedOption.priority;
        if (selectedOption.knowledge)
          state.answers[`q${questionNum}_knowledge`] = selectedOption.knowledge;
        state.currentQuestion++; // Move to the next question

        if (state.currentQuestion <= financialQuiz.questions.length) {
          // If there are more questions, ask the next one
          await this.askQuestion(msg, bot, state.currentQuestion);
        } else {
          // All questions answered, show results
          await this.showResults(msg, bot, state.answers);
          quizState.delete(userId); // Clear quiz state for the user
        }
        return true; // Message was handled by the quiz
      } else {
        // Invalid input for the current question
        await bot.sendMessage(
          msg.chat.id,
          `សូមបញ្ចូលលេខចម្លើយត្រឹមត្រូវ (1-${question.options.length})។`,
        );
        return true; // Message was handled (as an invalid input)
      }
    }

    return false; // Message was not part of the active quiz flow
  }

  /**
   * Sends a specific quiz question to the user.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   * @param {number} questionNum - The number of the question to ask.
   */
  async askQuestion(msg, bot, questionNum) {
    const question = financialQuiz.questions[questionNum - 1]; // Get question data

    // Enhanced progress bar
    const progressBar =
      "▓".repeat(questionNum) +
      "░".repeat(financialQuiz.questions.length - questionNum);

    // Format options with better styling
    let optionsText = question.options
      .map((option, index) => `${index + 1}️⃣ ${option.text}`)
      .join("\n");

    const questionMessage = `💎 Smart Assessment - ពិន្ទុ ${questionNum}/${financialQuiz.questions.length}
${progressBar} ${Math.round((questionNum / financialQuiz.questions.length) * 100)}%

🎯 ${question.question}

💡 ${question.hint}

${optionsText}

⚡ សរសេរលេខចម្លើយរបស់អ្នក (1-${question.options.length}):`;

    await bot.sendMessage(msg.chat.id, questionMessage);
  }

  /**
   * Calculates and displays the financial health quiz results to the user.
   * Provides a score, detailed analysis, strengths, and recommendations.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   * @param {Object} answers - An object containing the user's answers.
   */
  async showResults(msg, bot, answers) {
    const income = answers.q1 || 0;
    const expenses = answers.q2 || 0;
    const debt = answers.q3 || 0;
    const savings = answers.q4 || 0;
    const trackingHabit = answers.q5 || "never";
    const moneyLeaks = answers.q6 || 0;
    const goal = answers.q7 || "save";
    const knowledge = answers.q8 || "beginner";

    // Enhanced calculations with the new questions
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const emergencyFundTarget = expenses * 6; // 6 months target for better security
    const debtRatio = income > 0 ? (debt / income) * 100 : 0;
    const monthlyLeaks = moneyLeaks;
    const annualLeaks = monthlyLeaks * 12;

    // Calculate potential monthly savings
    const potentialMonthlySavings = income - expenses + monthlyLeaks;
    const currentSavingsGap = emergencyFundTarget - savings;

    let score = 0;
    let recommendations = [];
    let strengths = [];
    let insights = [];

    // Enhanced scoring system (8 categories, more comprehensive)

    // 1. Income vs Expenses (20 points)
    if (income > expenses * 1.5) {
      score += 20;
      strengths.push("💪 ចំណូលល្អណាស់ - អាចសន្សំបានច្រើន");
    } else if (income > expenses * 1.2) {
      score += 15;
      strengths.push("📈 ចំណូលលើសចំណាយ");
    } else if (income > expenses) {
      score += 10;
    } else {
      recommendations.push("🚨 បន្ទាន់: ត្រូវការបង្កើនចំណូល ឬកាត់បន្ថយចំណាយ");
    }

    // 2. Savings Rate (20 points)
    if (savingsRate >= 30) {
      score += 20;
      strengths.push("⭐ អត្រាសន្សំពិសេស - អ្នកជាម្ចាស់លុយពិតប្រាកដ!");
    } else if (savingsRate >= 20) {
      score += 15;
      strengths.push("💎 អត្រាសន្សំល្អណាស់");
    } else if (savingsRate >= 10) {
      score += 10;
      recommendations.push("🎯 បង្កើនអត្រាសន្សំដល់ ២០-៣០%");
    } else if (savingsRate > 0) {
      score += 5;
      recommendations.push("🚀 ចាប់ផ្តើមសន្សំ ១០% មុនសិន");
    } else {
      recommendations.push("⚡ ចាំបាច់ត្រូវផ្តើមសន្សំភ្លាមៗ");
    }

    // 3. Emergency Fund (15 points)
    if (savings >= emergencyFundTarget) {
      score += 15;
      strengths.push("🛡️ Emergency Fund ពេញលេញ - សុវត្ថិភាព 100%");
    } else if (savings >= expenses * 3) {
      score += 12;
      strengths.push("🔒 Emergency Fund ល្អ");
    } else if (savings >= expenses) {
      score += 8;
      recommendations.push(
        `🏦 បង្កើន Emergency Fund ដល់ $${emergencyFundTarget}`,
      );
    } else if (savings > 0) {
      score += 4;
      recommendations.push(
        `🚨 Emergency Fund ត្រូវការ $${emergencyFundTarget}`,
      );
    } else {
      recommendations.push("⚠️ គ្មាន Emergency Fund - ហានិភ័យខ្ពស់");
    }

    // 4. Debt Management (15 points)
    if (debt === 0) {
      score += 15;
      strengths.push("✅ គ្មានបំណុល - ជីវិតសេរី");
    } else if (debtRatio < 20) {
      score += 10;
      recommendations.push("💳 បំណុលតិច - អាចគ្រប់គ្រងបាន");
    } else if (debtRatio < 40) {
      score += 5;
      recommendations.push("⚡ បំណុលមធ្យម - ត្រូវការផែនការសង");
    } else {
      recommendations.push("🚨 បំណុលច្រើន - ត្រូវការយុទ្ធសាស្ត្រពិសេស");
    }

    // 5. Money Tracking Habits (10 points)
    const trackingScores = {
      never: 0,
      rarely: 2,
      sometimes: 5,
      regularly: 8,
      daily: 10,
    };
    const trackingScore = trackingScores[trackingHabit] || 0;
    score += trackingScore;

    if (trackingScore === 10) {
      strengths.push("📊 ទម្លាប់តាមដានប្រសើរណាស់");
    } else if (trackingScore >= 5) {
      recommendations.push("📱 កែលម្អការតាមដានឱ្យទៀងទាត់");
    } else {
      recommendations.push("📝 ចាប់ផ្តើមតាមដានចំណាយរាល់ថ្ងៃ");
    }

    // 6. Money Leaks Control (10 points)
    if (monthlyLeaks === 0) {
      score += 10;
      strengths.push("🔥 គ្មាន Money Leaks - គ្រប់គ្រងបានល្អ");
    } else if (monthlyLeaks <= 20) {
      score += 7;
      insights.push(
        `💡 Money Leaks តិចៗ: $${monthlyLeaks}/ខែ = $${annualLeaks}/ឆ្នាំ`,
      );
    } else if (monthlyLeaks <= 50) {
      score += 4;
      recommendations.push(`🔍 កាត់បន្ថយ Money Leaks $${monthlyLeaks}/ខែ`);
      insights.push(`💰 អាចសន្សំបាន $${annualLeaks}/ឆ្នាំ ប្រសិនបើបិទ!`);
    } else {
      recommendations.push(
        `🚨 Money Leaks ច្រើន: $${monthlyLeaks}/ខែ = $${annualLeaks}/ឆ្នាំ!`,
      );
      insights.push(`🔥 បិទភ្លាមៗ = សន្សំបាន $${annualLeaks}/ឆ្នាំ`);
    }

    // 7. Financial Knowledge (5 points)
    const knowledgeScores = {
      beginner: 1,
      basic: 2,
      intermediate: 4,
      advanced: 5,
    };
    score += knowledgeScores[knowledge] || 1;

    // 8. Goal Alignment (5 points)
    if (goal === "emergency" && savings >= emergencyFundTarget) {
      score += 5;
      strengths.push("🎯 គោលដៅ Emergency Fund សម្រេចបាន");
    } else if (goal === "debt" && debt === 0) {
      score += 5;
      strengths.push("🎯 គោលដៅសងបំណុលសម្រេចបាន");
    } else {
      // Provide goal-specific recommendations
      if (goal === "emergency") {
        recommendations.push("💡 ផ្តោតលើ Emergency Fund ជាអាទិភាព");
      } else if (goal === "debt") {
        recommendations.push("💡 ផ្តោតលើការសងបំណុលជាអាទិភាព");
      } else if (goal === "business") {
        recommendations.push("💡 ត្រៀម Emergency Fund មុនបើកអាជីវកម្ម");
        insights.push("🚀 អាជីវកម្មត្រូវការមូលធនគ្រប់គ្រាន់");
      }
    }

    // Determine detailed health level
    let healthLevel, healthEmoji, healthAdvice;
    if (score >= 85) {
      healthLevel = "ម្ចាស់លុយពិតប្រាកដ";
      healthEmoji = "👑";
      healthAdvice = "អ្នកមានចំណេះដឹងខ្ពស់! ពិចារណាវិនិយោគកម្រិតខ្ពស់";
    } else if (score >= 70) {
      healthLevel = "ល្អបំផុត";
      healthEmoji = "🟢";
      healthAdvice = "ហិរញ្ញវត្ថុស្ថិរភាព! ចាប់ផ្តើមគិតពីការវិនិយោគ";
    } else if (score >= 55) {
      healthLevel = "ល្អ";
      healthEmoji = "🟡";
      healthAdvice = "មូលដ្ឋានរឹងមាំ! ត្រូវការកែលម្អបន្តិច";
    } else if (score >= 40) {
      healthLevel = "ត្រូវកែលម្អ";
      healthEmoji = "🟠";
      healthAdvice = "មានសក្តានុពល! ត្រូវការផែនការច្បាស់";
    } else if (score >= 25) {
      healthLevel = "ត្រូវការអភិវឌ្ឍន៍";
      healthEmoji = "🔴";
      healthAdvice = "ចាប់ផ្តើមថ្មី! តាមផ្លូវត្រឹមត្រូវហើយ";
    } else {
      healthLevel = "ចាំបាច់ត្រូវការជំនួយ";
      healthEmoji = "🆘";
      healthAdvice = "កុំបារម្ភ! យើងនឹងជួយអ្នកបង្កើតមូលដ្ឋាន";
    }

    // Calculate potential improvements
    const improvementPotential = Math.min(
      monthlyLeaks + Math.max(0, (income - expenses) * 0.1),
      income * 0.3,
    );
    const timeToEmergencyFund =
      currentSavingsGap > 0
        ? Math.ceil(currentSavingsGap / Math.max(improvementPotential, 50))
        : 0;

    // Enhanced result message with comprehensive analysis
    const resultMessage = `🏆 លទ្ធផល Smart Financial Assessment

${healthEmoji} ពិន្ទុ: ${score}/100 (${healthLevel})
💬 ${healthAdvice}

📈 ការវិភាគលម្អិត:
💰 អត្រាសន្សំ: ${savingsRate.toFixed(1)}% (គោលដៅ: 20-30%)
🚨 Emergency Fund: $${savings} / $${emergencyFundTarget} (${Math.round((savings / emergencyFundTarget) * 100)}%)
💳 Debt Ratio: ${debtRatio.toFixed(1)}% (គោលដៅ: <20%)
🔍 Money Leaks: $${monthlyLeaks}/ខែ = $${annualLeaks}/ឆ្នាំ

${strengths.length > 0 ? `💪 ចំណុចខ្លាំង:\n${strengths.join("\n")}\n` : ""}

🎯 ការណែនាំអាទិភាព:
${recommendations.slice(0, 5).join("\n")}

${insights.length > 0 ? `💡 Insights ពិសេស:\n${insights.join("\n")}\n` : ""}

📊 ការព្យាករណ៍:
${improvementPotential > 0 ? `• អាចកែលម្អសន្សំបាន: $${improvementPotential.toFixed(0)}/ខែ` : ""}
${timeToEmergencyFund > 0 ? `• ដល់ Emergency Fund គោលដៅ: ${timeToEmergencyFund} ខែ` : `• Emergency Fund: ✅ សម្រេចបាន`}
• រយៈពេល ៩០ ថ្ងៃ: សន្សំបានបន្ថែម $${(improvementPotential * 3).toFixed(0)}

🚀 ជំហានបន្ទាប់:
• ប្រើ Free Tools: /calculate_daily, /find_leaks
• មើល Preview: /preview
• កម្មវិធីពេញលេញ: /pricing (តម្លៃ $24 តែប៉ុណ្ណោះ!)`;

    await bot.sendMessage(msg.chat.id, resultMessage);

    // Enhanced follow-up sequence with personalized conversion messaging
    setTimeout(async () => {
      let personalizedMessage = "";

      // Personalize based on their score and situation
      if (score >= 70) {
        personalizedMessage = `🏆 អ្នកមានមូលដ្ឋានល្អណាស់!

ការវាយតម្លៃបង្ហាញថាអ្នកស្រាប់តែមានចំណេះដឹងហិរញ្ញវត្ថុល្អ។ ដូច្នេះអ្នកត្រូវការកម្មវិធីកម្រិតខ្ពស់ដើម្បីកែលម្អបន្ថែម។`;
      } else if (score >= 40) {
        personalizedMessage = `🎯 អ្នកមានសក្តានុពលធំ!

ពិន្ទុ ${score}/100 បង្ហាញថាអ្នកនឹងទទួលបានផលប្រយោជន៍យ៉ាងច្រើនពីការកែលម្អ។ កម្មវិធីនេះអាចជួយអ្នកឡើងដល់ 80+។`;
      } else {
        personalizedMessage = `🚀 ពេលវេលាល្អបំផុតដើម្បីចាប់ផ្តើម!

ពិន្ទុ ${score}/100 បង្ហាញថាអ្នកមានការកែលម្អយ៉ាងធំអាចធ្វើបាន។ អ្នកនឹងឃើញការផ្លាស់ប្តូរពិតប្រាកដ!`;
      }

      const followUpMessage = `${personalizedMessage}

🔥 កម្មវិធី 7-Day Money Flow Reset™ អាចជួយអ្នក:
${score < 40 ? "🚀 កែលម្អពិន្ទុពី " + score + " ដល់ 75+ (ភាគច្រើនសម្រេច)" : "💎 យកពិន្ទុ " + score + " ឡើងដល់ 85+ (កម្រិតម្ចាស់លុយ)"}
${monthlyLeaks > 0 ? "💰 បិទ Money Leaks $" + monthlyLeaks + "/ខែ = សន្សំ $" + annualLeaks + "/ឆ្នាំ" : "✅ រក្សាការគ្រប់គ្រង Money Leaks ឱ្យតេងតាំង"}
${savingsRate < 20 ? "📈 បង្កើនអត្រាសន្សំពី " + savingsRate.toFixed(1) + "% ដល់ 25-30%" : "🏆 រក្សាអត្រាសន្សំល្អ និងបង្កើនបន្ថែម"}
${savings < emergencyFundTarget ? "🛡️ បង្កើត Emergency Fund ពី $" + savings + " ដល់ $" + emergencyFundTarget : "💪 រក្សា Emergency Fund និងវិនិយោគបន្ថែម"}
🧠 ទទួលបានយុទ្ធសាស្ត្រផ្ទាល់ខ្លួនសម្រាប់ករណីរបស់អ្នក

🚨 LAUNCH SPECIAL ផុតកំណត់ឆាប់: តែ $24 (ធម្មតា $47)
💎 អ្នកសន្សំបាន: $23 (៥០% OFF!)
⏰ នៅសល់ តែ 150 កន្លែងតំរូវ!

${score < 40 ? "⚡ សម្រាប់អ្នកដែលចាប់ផ្តើម" : score < 70 ? "🎯 សម្រាប់អ្នកដែលចង់កែលម្អ" : "🏆 សម្រាប់អ្នកដែលចង់ឡើងកម្រិតខ្ពស់"} - នេះគឺពេលវេលាដ៏ល្អបំផុត!

ចង់ដឹងបន្ថែម? ចុច /pricing ឬ /preview`;

      await bot.sendMessage(msg.chat.id, followUpMessage);

      // Second follow-up with social proof after 30 seconds
      setTimeout(async () => {
        const socialProofMessage = `📣 ចំណាំពិសេស:

👥 អ្នកដទៃដែលមានពិន្ទុស្រដៀងគ្នានឹងអ្នកនៅ Quiz នេះ:
${score >= 70 ? "• ៨៥% បានកែលម្អពិន្ទុដល់ 85+ ក្នុង ៧ ថ្ងៃ\n• សន្សំបានបន្ថែម $400-600/ខែ\n• ចាប់ផ្តើមវិនិយោគក្នុង ៣០ ថ្ងៃ" : score >= 40 ? "• ៩២% បានកែលម្អពិន្ទុលើស 75 ក្នុង ១៤ ថ្ងៃ\n• សន្សំបានបន្ថែម $300-500/ខែ\n• បង្កើត Emergency Fund ក្នុង ៦០ ថ្ងៃ" : "• ៩៦% បានកែលម្អពិន្ទុលើស 65 ក្នុង ២១ ថ្ងៃ\n• សន្សំបានបន្ថែម $200-400/ខែ\n• មានទម្លាប់ថ្មីក្នុង ៣០ ថ្ងៃ"}

🏅 មតិយោបល់ពីអ្នកប្រើប្រាស់:
"Quiz នេះបង្ហាញឱ្យខ្ញុំថាខ្ញុំមានបញ្ហាអ្វីខ្លះពិតប្រាកដ។ កម្មវិធី ៧ ថ្ងៃជួយខ្ញុំដោះស្រាយអស់ហើយ!" - សុភា, PP

"ពិន្ទុខ្ញុំពី 45 ឡើង 82 ក្នុង ២ សប្តាហ៍!" - វិរៈ, SR

💭 សំណួរ: តើអ្នកចង់ឃើញការផ្លាស់ប្រូរនេះក្នុងជីវិតរបស់អ្នកដែរឬទេ?

🎯 ចុច /pricing ដើម្បីចាប់ផ្តើម ឬ /preview ដើម្បីមើលសាកល្បងមុន`;

        await bot.sendMessage(msg.chat.id, socialProofMessage);
      }, 30000); // 30-second delay for social proof
    }, 15000); // 15-second delay for main follow-up
  }

  /**
   * Checks if a given message is related to the financial quiz.
   * This helps in routing messages to the correct handler.
   * @param {Object} msg - The Telegram message object.
   * @returns {boolean} - True if the message is quiz-related, false otherwise.
   */
  isQuizMessage(msg) {
    const userId = msg.from.id;
    const text = msg.text ? msg.text.toUpperCase() : ""; // Handle undefined msg.text

    // Check if user is currently in a quiz session
    if (quizState.has(userId)) return true;

    // Check for common quiz start commands/keywords
    if (text === "READY" || text === "/READY" || text === "START QUIZ" || text.includes("QUIZ"))
      return true;

    return false;
  }
}

// Export an instance of the FinancialQuiz class
module.exports = new FinancialQuiz();
