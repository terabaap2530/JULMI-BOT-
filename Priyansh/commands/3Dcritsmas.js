const API = "https://api.botcahx.biz.id/api/textpro/3dchristmas?TioXd&apikey=d9e9eb44&text="
module.exports.config = {
	name: "3dchrismas",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "M AMIR",
	description: " logo",
	commandCategory: "text maker",
	usages: "thunder<text>",
	cooldowns: 10
};
module.exports.run = async function ({ api, event, args,}) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const qs = require("querystring");
    anup = args.join(" ");
    (event.type == "message_reply") ? anup = event.messageReply.attachments[0].url: anup = args.join(" ");
    const pathsave = __dirname + `/cache/banner2.png`;
    let imageBuffer;
    api.sendMessage("✨Please Wait My Love ✨🧡 ", event.threadID, event.messageID);
    axios.get(`${API}${encodeURI(anup)}`, {responseType: "arraybuffer"}) .then(data => {const imageBuffer = data.data;
    fs.writeFileSync(pathsave, Buffer.from(imageBuffer));
    api.sendMessage({body: `💙🍒Ye Lo Meri Jaan✨🧡\n\nCoded By:\n               ✯─━━◉❖🅰🆇🆂🅷🆄❖◉━━─✯ `, attachment: fs.createReadStream(pathsave)}, event.threadID, () => fs.unlinkSync(pathsave), event.messageID);}).catch(error => {

          
            let err;
            if (error.response) err = JSON.parse(error.response.data.toString());
            else err = error;
            return api.sendMessage(`An error has occurred ${err.error} ${err.message}`, event.threadID, event.messageID);
        })
};
