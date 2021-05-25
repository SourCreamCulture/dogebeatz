module.exports = {
  // accessToken & refreshToken of your user account
  // [How to get your tokens](http://moonstone.folf.party/#/main/main/general/tokens).
  accessToken: '',
  refreshToken: '',
  // botToken is the token for your bot that you get by running createbot.js
  botToken: '',
  // commands prefix
  prefix: '-',
  // your user id
  ownerId: 'a307faa0-c573-4fd8-8229-6194fab201e0',
  // mods id
  trusted: [
    'a307faa0-c573-4fd8-8229-6194fab201e0',
    '06442a55-761c-4391-94cd-47f2ead4ca16',
  ],
  // uuid for textdb.dev
  dbId: '',
  // if you wanna create a room set to true or set to false to join a specific room
  create: true,
  // fill in this data for creating a room if the above option is set to true
  roomconfig: {
    name: 'Music to Chill to',
    description: 'Powered by Code and Made by @SourCream, Contribute here: https://github.com/SourCreamCulture/dogebeatz',
    privacy: 'public',
  },
  // if the above option is set to true ignore this
  // if the above option is set to false add the room id you wanna join here
  roomID: ''
};
