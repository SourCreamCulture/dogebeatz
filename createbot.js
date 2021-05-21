
const config = require("./config.js");
const Moonstone = require("moonstone-wrapper");

var bot = Moonstone({
  accessToken: config.accessToken,
  refreshToken: config.refreshToken,
});

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const botUsername = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  console.log("Your bot username is:", botUsername);
  const botAccountData = await bot.createBotAccount(botUsername);
  console.log("====SAVE THE apiKey AND PUT IT IN config.js under botToken====")
  console.log(botAccountData);
});

bot.connect(); // Connect the bot to Dogehouse