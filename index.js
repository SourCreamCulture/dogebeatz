const config = require('./config.js');
const Moonstone = require('moonstone-wrapper');
const ytdld = require('ytdl-core-discord');
const ytdl = require('ytdl-core');
const bot = Moonstone(config.botToken);
const yts = require('yt-search');
const fetch = require('node-fetch');
const axios = require('axios');
const { trusted } = require('./config.js');
const Constants = Moonstone.Constants;
const sourcebin = require('sourcebin');
const lyricsFinder = require("lyrics-finder");

const dbURL = 'https://textdb.dev/api/data/';

const playlist = {
  lofiNew: 'https://www.youtube.com/watch?v=DWcJFNfaw9c',
  lofi: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
  walk: 'https://www.youtube.com/watch?v=SXMhL_UoVWw',
};

var prefix = config.prefix;
var queue = [];
var timer = null;

bot.on('ready', async (user) => {
  console.log('Ready! Logged in as ' + user.username);
  const topRooms = await bot.getTopRooms();
  console.log('There are ' + topRooms.length + ' available rooms.');

  bot.editSelf({
    avatarUrl:
      'https://avatars.githubusercontent.com/u/83242673?s=400&u=78e0a77d196784ca33e981364fda0129b884ec85&v=4',
  });

  queue = await getQueue();
  if (!queue.length) queue.push({ url: playlist.lofiNew, title: 'Lofi msuic' });

  const foundRooms = topRooms.filter(
    (room) => room.creatorId == config.ownerId // Filter for rooms created by a specific user
  );

if (config.create === true) {
  // If the filter found a room, join it, otherwise create one.
  const room =
    foundRooms.length > 0
      ? foundRooms[0]
      : await bot.createRoom({
          name: config.roomconfig.name,
          description: config.roomconfig.description,
          privacy: config.roomconfig.privacy,
        });
  await bot.joinRoom(room); // Join room
} else if (config.create === false) {
  await bot.joinRoom(config.roomID); //use if you dont know your user id and want to join a specific room
}
});

// Send a message when first joining a room.
bot.on('joinedRoom', async (room) => {
  await room.sendChatMessage("Hi, I'm dogebeatz :D");
  await room.sendChatMessage(`Type ${prefix}help to see all my commands.`);
});

// Send message to users who join the room
bot.on('userJoinRoom', async (user, room) => {
  await user.sendWhisper(
    `Hi, welcome to the room! Type ${prefix}help to see all my commands.`
  );
  if (dj) user.sendWhisper('Dj mode is on! only mods can control the music.');
  else if (loop) user.sendWhisper('Looping is turned on; song will replay. You can use -loop <on | off> to toggle it.');
  // If the user is the bot owner, set them as moderator
  if (user.id == config.ownerId)
    await user.setAuthLevel(Constants.AuthLevel.MOD);
});

const isPlayingMusic = (room) => {
  return (
    room.audioConnection &&
    room.audioConnection.player &&
    room.audioConnection.player.dispatcher
  );
};

const commandList = bot.buildChatMessage((b) =>
  b
    .text("Here's a list of commands:")
	.link('https://git.io/JsDKR')
);

var dj = false;
var loop = false;

// Listen for chat messages
bot.on('newChatMsg', async (msg) => {
  // Command parser

  if (msg.user.id === bot.user.id) return;

  if (dj === true){
	//if the users id is not in trusted when in dj mode they cannot use the bot
	if (msg.content.startsWith(prefix)) return msg.user.sendWhisper('Dj mode is on! only mods can control music.');
    if (!trusted.includes(msg.user.id)) return;
  }

  const command = msg.content.includes(' ')
    ? msg.content.split(' ')[0]
    : msg.content;
  const args = msg.content.includes(' ') ? msg.content.split(' ').slice(1) : [];

  if (msg.content.startsWith(`${prefix}dj`)) {
    if (!trusted.includes(msg.user.id)) return;
	
    if (args[0] === 'on'){
        dj = !dj;  //if dj is set to false set it to true
		return msg.room.sendChatMessage('Dj mode turned on! only mods can control the music.');
    } else if (args[0] === 'off'){
        dj = !dj;  //is dj is set to true set it to false
		return msg.room.sendChatMessage('Dj mode turned off! everyone can control the music.');
    }

    return;
  }

  if (msg.content.startsWith(`${prefix}loop`)) {
    if (args[0] === 'on'){
        loop = true;
		return msg.room.sendChatMessage('Looping turned on! the current song will loop.');
    } else if (args[0] === 'off'){
        loop = false;
		return msg.room.sendChatMessage('Looping turned off! the current song won\'t loop.');
    }

    return;
  }

  if (msg.content.startsWith(`${prefix}banner`)) {
    if (msg.user.id != config.ownerId) return;

    //let message = args.join(" ");
    //if (!message) return msg.user.sendWhisper('You did not supply a new pfp!');

    await bot.editSelf({
      bannerUrl:
        'https://pbs.twimg.com/profile_banners/840626569743912960/1601562221/1500x500',
    });

    return;
  }
  if (msg.content.startsWith(`${prefix}d`)) {
    if (msg.user.id != config.ownerId) return;

    let message = args.join(' ');
    if (!message) return msg.user.sendWhisper('You did not supply a new bio!');

    await bot.editSelf({ bio: message });

    return;
  }
  if (msg.content.startsWith(`${prefix}mod`)) {
    if (!trusted.includes(msg.user.id)) return;

    await msg.user.setAuthLevel(Constants.AuthLevel.MOD);

    return;
  }
  if (msg.content.startsWith(`${prefix}lyrics`)) {

    var searchString = args.join(' ');

    if (searchString) {

      var lyrics = await lyricsFinder(searchString, "");
      if (!lyrics) msg.room.sendChatMessage(`No lyrics found for ${searchString}.`);

      await sourcebin.create([
        {
        name: (searchString),
            content: (lyrics),
            languageId: ('txt')
        }
      ]).then(bin => msg.room.sendChatMessage((b) => b.text('The url to the lyrics is ').url(bin.url)))
      return
    } else if (!searchString) {

      var lyrics = await lyricsFinder(queue[0].title, "");
      if (!lyrics) msg.room.sendChatMessage(`No lyrics found for ${queue[0].title}.`);

      await sourcebin.create([
        {
        name: (queue[0].title),
            content: (lyrics),
            languageId: ('txt')
        }
      ]).then(bin => msg.room.sendChatMessage((b) => b.text('The url to the lyrics is ').url(bin.url)))
      return
    }
    
    return;
  }
  if (msg.content.startsWith(`${prefix}stats`)) {
    axios
      .get('https://api.dogegarden.net/v1/statistics')
      .then(function (response) {
        let stats = response.data;

        const statlist = bot.buildChatMessage((b) =>
          b
            .text("Here's some dogehouse stats:")
            .text(`|| Rooms: ${stats.totalRooms}`)
            .text(`|| Scheduled Rooms: ${stats.totalScheduledRooms}`)
            .text(`|| Registered Users: ${stats.totalRegistered}`)
            .text(`|| Online: ${stats.totalOnline}`)
            .text(`|| Bots Online: ${stats.totalBotsOnline}`)
        );
        msg.user.sendWhisper(statlist);
      })
      .catch(function (error) {
        msg.user.sendWhisper(
          `Sorry, I had trouble finding the doges! \`${error}\``
        );
      });

    return;
  }
  if (msg.content.startsWith(`${prefix}chat`)) {
    var searchString = args.join(' ');
    if (!searchString)
      return await msg.room.sendChatMessage(
        'You didnt provide anything to say!'
      );

    fetch(
      `https://api.monkedev.com/fun/chat?msg=${encodeURIComponent(
        searchString
      )}&uid=0101`
    )
      .then((res) => res.json())
      .then(async (json) => {
        return await msg.room.sendChatMessage(json.response);
      });
    return;
  }
  if (msg.content === `${prefix}walk`) {
    let url = playlist.walk;
    await msg.room.sendChatMessage((b) =>
      b.text('Playing Plug Walk').url(url).text('...')
    );
    addToQueueStart(url, 'Plug Walk');
    playFromUrl(msg.room, url);
    return;
  }
  if (msg.content.startsWith(`${prefix}lofi`)) {
    if (args[0] === 'new') {
      let url = playlist.lofiNew;
      await msg.room.sendChatMessage((b) =>
        b.text('Playing Lofi').url(url).text('...')
      );
      addToQueueStart(url, 'Lofi New');
      playFromUrl(msg.room, url);
    } else {
      let url = playlist.lofi;
      await msg.room.sendChatMessage((b) =>
        b.text('Playing Lofi').url(url).text('...')
      );
      addToQueueStart(url, 'Lofi');
      playFromUrl(msg.room, url);
    }
    return;
  }
  if (msg.content.startsWith(`${prefix}play`)) {
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;

    if (videoPattern.test(args[0])) {
      var url = args[0];
      await msg.room.sendChatMessage((b) =>
        b.text('Playing').url(url).text('...')
      );
      addToQueueStart(url, (await yts.search(searchString)).videos[0].title);
      playFromUrl(msg.room, url);
    } else {
      var searchString = args.join(' ');
      if (!searchString) {
        if (!queue.length)
          return await msg.room.sendChatMessage(
            'You didnt provide a song to play!'
          );
        await msg.room.sendChatMessage((b) =>
          b
            .text('Playing ' + queue[0].title)
            .url(queue[0].url)
            .text('...')
        );
        return playFromUrl(msg.room, queue[0].url);
      }

      var searched = await yts.search(searchString);
      //if(searched.videos.length === 0)return await msg.room.sendChatMessage('Looks like I wasnt able to find this video on youtube!')
      var songInfo = searched.videos[0];
      var url = songInfo.url;
      await msg.room.sendChatMessage((b) =>
        b
          .text(`Added ${songInfo.title}`)
          .url(url)
          .text(' to the start of the queue.')
      );
      addToQueueStart(url, songInfo.title);
      playFromUrl(msg.room, url);
    }
    return;
  }
  if (msg.content == `${prefix}skip`) {
    if (queue.length <= 1)
      await msg.room.sendChatMessage('Nothing in queue to skip to!');
    else {
      await msg.room.sendChatMessage('Skipping to the next song in queue...');
      nextInQueue(msg.room);
    }
  }

  if (msg.content.startsWith(`${prefix}current`)) {
    if (!queue.length) await msg.room.sendChatMessage('Nothing in queue');
    else {
      let title = queue[0].title;
      if (
        !msg.room.audioConnection ||
        msg.room.audioConnection.player.dispatcher.paused
      )
        title = '[paused] ' + title;
      await msg.room.sendChatMessage((b) => b.text(title).url(queue[0].url));
    }
  }

  if (msg.content.startsWith(`${prefix}add`)) {
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;

    if (videoPattern.test(args[0])) {
      var url = args[0];
      await msg.room.sendChatMessage((b) =>
        b.text('Added').url(url).text(' to queue.')
      );

      addToQueue(url, (await yts.search(searchString)).videos[0].title);
    } else {
      var searchString = args.join(' ');
      if (!searchString)
        return await msg.room.sendChatMessage(
          'You didnt provide a song to add!'
        );

      var searched = await yts.search(searchString);
      //if(searched.videos.length === 0)return await msg.room.sendChatMessage('Looks like I wasnt able to find this video on youtube!')
      var songInfo = searched.videos[0];
      var url = songInfo.url;
      await msg.room.sendChatMessage((b) =>
        b.text(`Added ${songInfo.title} `).url(url).text('to queue.')
      );

      addToQueue(url, songInfo.title);
    }
    if (queue.length == 1) playFromUrl(msg.room, queue[0].url);
    return;
  }

  if (msg.content === (`${prefix}help`)){
    return await msg.user.sendWhisper(commandList);
  }
  if (msg.content === `${prefix}queue`) {
    let queueList = [{ type: 'text', value: 'Queue:' }];
    for (let index = 0; index < queue.length; index++) {
      const song = queue[index];
      queueList.push({ type: 'text', value: `${index}: ${song.title} ` });
      if (queue.length != index + 1)
        queueList.push({ type: 'text', value: `|| ` });
    }

    return await msg.user.sendWhisper(queueList);
  }
  if (msg.content == `${prefix}pause`) {
    if (!isPlayingMusic(msg.room))
      return msg.room.sendChatMessage('Not playing anything.');

    if (msg.room.audioConnection.player.dispatcher.paused)
      return msg.room.sendChatMessage('Music is already paused!');
    if (timer != null) timer.pause();
    msg.room.audioConnection.player.dispatcher.pause();
    return;
  }
  if (msg.content.startsWith(`${prefix}resume`)) {
    if (!isPlayingMusic(msg.room)) {
      if (queue.length) {
        await msg.room.sendChatMessage((b) =>
          b
            .text('Playing ' + queue[0].title)
            .url(queue[0].url)
            .text('...')
        );
        return await playFromUrl(msg.room, queue[0].url);
      }
      return msg.room.sendChatMessage('Not playing anything.');
    }
    if (msg.room.audioConnection.player.dispatcher.paused) {
      if (timer != null) timer.resume();
      msg.room.audioConnection.player.dispatcher.resume();
    } else {
      msg.room.sendChatMessage('The Music is not paused!');
    }
    return;
  }
  if (msg.content.startsWith(`${prefix}volume`)) {
    if (!isPlayingMusic(msg.room))
      return msg.room.sendChatMessage('Not playing anything.');

    if (args.length < 1)
      return await msg.room.sendChatMessage('Invalid volume');
    const volume = parseInt(args[0] / 100);
    if (volume > 2 * 100 || volume < 0)
      return await msg.room.sendChatMessage('Invalid volume');

    msg.room.audioConnection.player.dispatcher.setVolume(volume); // Set music volume
    return;
  }
  if (msg.content.startsWith(`${prefix}myid`)) {
    return msg.room.sendChatMessage(`Your id is ${msg.user.id} `);
  }
  if (msg.content.startsWith(`${prefix}`)) {
    return await msg.room.sendChatMessage('Unknown command.');
  }
});

bot.on('handRaised', async (user, room) => {
  if (trusted.includes(user.id)) user.setAsSpeaker();
  else user.setAsListener();
});

const playFromUrl = async (room, url) => {
  if (!!timer) {
    timer.reset();
    timer = null;
  }
  if (!room.selfUser.isSpeaker) {
    await room.sendChatMessage(
      'I need to be a speaker in order to play music.'
    );
    if (!room.selfUser.roomPermissions.askedToSpeak) await room.askToSpeak();
    return;
  }
  let stream;
  try {
    stream = await ytdld(url, { filter: 'audioonly' });
    var info = await ytdl.getBasicInfo(url);
  } catch (e) {
    await room.sendChatMessage('Failed to get video: ' + e.message);
  }
  if (!stream) return;
  timer = startTimer(info.videoDetails.lengthSeconds, function () {
	if (loop) {
		playFromUrl(room, queue[0].url);
		return room.sendChatMessage('Looping is on! Replaying the previous song.');
	}
    if (!queue.length) {
      queue.push({ url: playlist.lofiNew, title: 'Lofi msuic' });
      playFromUrl(room, queue[0].url);
      room.sendChatMessage('Playing Lofi songs');
    } else nextInQueue(room);
  });
  const audioConnection = await room.connect(); // Connect to the room voice server (or grab it, if already connected.)
  audioConnection.play(stream, { type: 'opus' }); // Play opus stream from youtube.
};

const getQueue = async () => {
  let a = await axios.get(dbURL + config.dbId);
  if (a.data == '') a.data = [];
  return a.data;
};

const addToQueue = (songurl, title) => {
  queue.push({ url: songurl, title: title });
  updateDb();
};

const addToQueueStart = (songurl, title) => {
  queue = [{ url: songurl, title: title }].concat(queue);
  updateDb();
};

const updateDb = () => {
  axios.post(dbURL + config.dbId, JSON.stringify(queue));
};

const nextInQueue = (room) => {
  queue.shift();
  updateDb();
  if (queue.length) {
    playFromUrl(room, queue[0].url);
    room.sendChatMessage((b) =>
      b
        .text('Playing ' + queue[0].title)
        .url(queue[0].url)
        .text('...')
    );
    return true;
  } else return false;
};

function startTimer(seconds, oncomplete) {
  var startTime,
    timer,
    obj,
    ms = seconds * 1000,
    obj = {};
  obj.resume = function () {
    startTime = new Date().getTime();
    timer = setInterval(obj.step, 250); // adjust this number to affect granularity
    // lower numbers are more accurate, but more CPU-expensive
  };
  obj.pause = function () {
    ms = obj.step();
    clearInterval(timer);
  };
  obj.step = function () {
    var now = Math.max(0, ms - (new Date().getTime() - startTime)),
      m = Math.floor(now / 60000),
      s = Math.floor(now / 1000) % 60;
    s = (s < 10 ? '0' : '') + s;
    if (now == 0) {
      clearInterval(timer);
      obj.resume = function () {};
      if (oncomplete) oncomplete();
    }
    return now;
  };
  obj.reset = function () {
    ms = seconds * 1000;
    oncomplete = null;
  };
  obj.resume();
  return obj;
}

bot.connect();