const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

const downloadDir = __dirname + "/cache"; // make sure 'cache' folder exists

module.exports.config = {
  name: "music",
  version: "1.0",
  hasPermssion: 0,
  credits: "Ajeet",
  description: "Download music from YouTube",
  commandCategory: "media",
  usages: "music <song name>",
  cooldowns: 2,
};

module.exports.handleEvent = async function ({ api, event }) {
  const message = event.body.trim();
  const prefix = "music ";

  // only respond to 'music <query>'
  if (!message.toLowerCase().startsWith(prefix)) return;

  const query = message.slice(prefix.length).trim();
  const threadID = event.threadID;

  if (!query) {
    return api.sendMessage("❗ Gana ka naam likho na bhai 😅", threadID);
  }

  // Notify user
  await api.sendMessage(`🔎 "${query}" dhoondh rahe hain... zara ruk jao.`, threadID);

  try {
    // search YouTube
    const searchRes = await axios.get(`https://mirrykal.onrender.com/search?query=${encodeURIComponent(query)}`);
    const selectedVideo = searchRes.data[0]; // first result

    if (!selectedVideo || !selectedVideo.videoId) {
      throw new Error("Kuch bhi nahi mila 😔");
    }

    const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.videoId}`;
    const apiUrl = `https://mirrykal.onrender.com/download?url=${encodeURIComponent(videoUrl)}&type=audio`;

    await api.sendMessage(`🎶 "${selectedVideo.title}" mil gaya! Ab download kar rahe hain...`, threadID);

    const downloadResponse = await axios.get(apiUrl);

    if (!downloadResponse.data.file_url) {
      throw new Error("Download fail ho gaya. 😭");
    }

    const downloadUrl = downloadResponse.data.file_url.replace("http:", "https:");
    const safeTitle = selectedVideo.title.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${safeTitle}.mp3`;
    const downloadPath = path.join(downloadDir, filename);

    const file = fs.createWriteStream(downloadPath);

    await new Promise((resolve, reject) => {
      https.get(downloadUrl, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close(resolve);
          });
        } else {
          reject(new Error(`Download fail ho gaya. Status: ${response.statusCode}`));
        }
      }).on("error", (error) => {
        if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
        reject(new Error(`Download error: ${error.message}`));
      });
    });

    await api.sendMessage(
      {
        body: `🎵 **Title:** ${selectedVideo.title}\nLijiye! Aapka gaana mil gaya 😍`,
        attachment: fs.createReadStream(downloadPath),
      },
      threadID,
      () => {
        setTimeout(() => {
          if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
        }, 5000);
      }
    );
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    api.sendMessage(`❌ Error: ${error.message} 😢`, threadID);
  }
};
