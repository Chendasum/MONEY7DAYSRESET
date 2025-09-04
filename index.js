#!/usr/bin/env node
"use strict";

/**
 * MONEY7DAYSRESET – Clean Bootstrap Entrypoint
 * Wires: server/ (db, storage, bot), commands/, services/, models/
 */

require("dotenv").config();
const express = require("express");
const http = require("http");

// Core modules (aggregators)
const { db, storage, bot, initBotWebhook } = require("./server");
const registerCommands = require("./commands");
const services = require("./services");
const models = require("./models");

// ──────────────────────────────────────────────
// Express App
// ──────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use(express.static("public"));

// Health Endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "MONEY7DAYSRESET",
    version: process.env.APP_VERSION || "1.0.0",
    ts: new Date().toISOString()
  });
});

app.get("/status", (req, res) => {
  const aiStatus = services.aiIntegration?.getStatus
    ? services.aiIntegration.getStatus()
    : { ai_available: false };
  res.json({
    status: "running",
    ai: aiStatus,
    db: db ? "connected" : "not_connected"
  });
});

// ──────────────────────────────────────────────
// Bootstrap
// ──────────────────────────────────────────────
(async () => {
  console.log("🚀 Booting MONEY7DAYSRESET...");

  try {
    await db?.testConnection?.();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err?.message || err);
  }

  try {
    if (storage?.init) {
      await storage.init();
      console.log("✅ Storage initialized");
    }
  } catch (err) {
    console.error("❌ Storage init failed:", err?.message || err);
  }

  try {
    await initBotWebhook?.();
    console.log("✅ Telegram bot initialized");
  } catch (err) {
    console.error("❌ Bot init failed:", err?.message || err);
  }

  try {
    registerCommands(bot, services, models);
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Command registration failed:", err?.message || err);
  }

  const PORT = process.env.PORT || 8080;
  http.createServer(app).listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();
