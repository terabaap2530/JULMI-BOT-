const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "target.json");

// memory map to track running timers
const activeSpam = new Map();

module.exports = {
  config: {
    name: "target",
    aliases: [],
    version: "3.1",
    author: "Axshu",
    role: 2, // 2 = bot admin only
    shortDescription: "Loop mention with saved lines (admin only)",
    longDescription:
      "Bot will fetch saved lines from target.json and keep sending them in a loop mentioning the tagged user, with interval, until stopped. Only bot admins can use it.",
    category: "fun",
    guide: {
      en: "{p}target @mention <intervalSeconds>\n{p}target off"
    }
  },

  onStart: async function ({ api, event, args, role, messageID }) {
    const { threadID, mentions } = event;

    // ===== STOP CASE =====
    if (args[0] && args[0].toLowerCase() === "off") {
      const timer = activeSpam.get(threadID);
      if (timer) {
        clearInterval(timer);
        activeSpam.delete(threadID);
        return api.sendMessage("🛑 Target loop stopped in this chat.", threadID, messageID);
      } else {
        return api.sendMessage("ℹ️ No target loop is running in this chat.", threadID, messageID);
      }
    }

    // ===== START CASE =====
    const mentionIDs = mentions ? Object.keys(mentions) : [];
    if (mentionIDs.length === 0) {
      return api.sendMessage("❗ Please tag someone to target.", threadID, messageID);
    }
    const target = mentionIDs[0];

    if (args.length < 2) {
      return api.sendMessage(
        "❗ Format: target @user <intervalSeconds>",
        threadID,
        messageID
      );
    }

    const interval = parseInt(args[args.length - 1]);
    if (isNaN(interval) || interval < 2) {
      return api.sendMessage(
        "⚠️ Interval must be a number (>=2 seconds).",
        threadID,
        messageID
      );
    }

    // load saved lines
    let lines = [];
    try {
      lines = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch (e) {
      return api.sendMessage(
        "🚫 No saved lines found! Please add lines in target.json",
        threadID,
        messageID
      );
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return api.sendMessage(
        "🚫 target.json is empty! Add some lines first.",
        threadID,
        messageID
      );
    }

    // enforce safe limit
    if (lines.length > 20) {
      lines = lines.slice(0, 20);
    }

    api.sendMessage(
      `✅ Loop started! I will keep sending ${lines.length} saved lines to <@${target}> every ${interval}s.\nType \"target off\" to stop.`,
      threadID
    );

    let i = 0;
    const mentionTag = [{ id: target, tag: mentions[target] || "user" }];

    const timer = setInterval(() => {
      if (i >= lines.length) {
        i = 0; // reset index → start again
      }
      api.sendMessage(
        { body: `${lines[i]} <@${target}>`, mentions: mentionTag },
        threadID
      );
      i++;
    }, interval * 1000);

    // save active timer
    activeSpam.set(threadID, timer);
  }
};
