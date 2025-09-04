\
"use strict";

/**
 * Minimal Telegram bot singleton.
 * Uses polling by default; switches to webhook if TELEGRAM_WEBHOOK_URL is set.
 * Requires: npm i node-telegram-bot-api
 */

let TelegramBot;
try {
  TelegramBot = require("node-telegram-bot-api");
} catch (e) {
  console.error("node-telegram-bot-api not installed. Install with: npm i node-telegram-bot-api");
}

const token = process.env.TELEGRAM_BOT_TOKEN || "";
let bot = null;

function getBot() {
  if (bot) return bot;
  if (!TelegramBot || !token) {
    console.warn("Telegram bot not initialized (missing module or token).");
    return null;
  }
  // Default to polling; webhook set in initBotWebhook()
  bot = new TelegramBot(token, { polling: true });
  return bot;
}

async function initBotWebhook() {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const b = getBot();
  if (!b) return;

  if (webhookUrl) {
    try {
      await b.deleteWebHook({ drop_pending_updates: true });
      await b.setWebHook(webhookUrl);
      console.log("Telegram webhook set:", webhookUrl);
    } catch (err) {
      console.error("Failed to set Telegram webhook:", err?.message || err);
    }
  } else {
    console.log("Telegram bot running in polling mode.");
  }
}

module.exports = { bot: getBot(), initBotWebhook };
