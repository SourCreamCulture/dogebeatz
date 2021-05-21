const config = require("./config.js");
const Moonstone = require("moonstone-wrapper");
const ytdld = require("ytdl-core-discord");
const ytdl = require('ytdl-core');
const bot = Moonstone(config.botToken);
const yts = require("yt-search");
const fetch = require("node-fetch");
const axios = require('axios');
const Constants = Moonstone.Constants;
const dbURL = 'https://textdb.dev/api/data/';

var prefix = config.prefix;
var queue = [];
var timer = null;

bot.on("ready", async (user) => {
	console.log("Ready! Logged in as " + user.username);
	const topRooms = await bot.getTopRooms();
	console.log("There are " + topRooms.length + " available rooms.");

	bot.editSelf({ avatarUrl: 'https://avatars.githubusercontent.com/u/83242673?s=400&u=78e0a77d196784ca33e981364fda0129b884ec85&v=4' })

	queue = await getQueue();
	if (queue.length) playFromUrl(queue[0]);

	const foundRooms = topRooms.filter(
		(room) => room.creatorId == config.ownerid // Filter for rooms created by a specific user
	);

	//await bot.joinRoom('7bf0dede-b6e7-4fe9-b5a6-6e19f72ce8a3'); //use if you dont know your user id and want to join a specific room

	// If the filter found a room, join it, otherwise create one.
	const room =
		foundRooms.length > 0
			? foundRooms[0]
			: await bot.createRoom({
				name: "[BOT TESTING]",
				description:
					"testing",
				privacy: "public",
			});
	await bot.joinRoom(room); // Join room
});

// Send a message when first joining a room.
bot.on("joinedRoom", async (room) => {
	await room.sendChatMessage("Hi, I'm dogebeatz :D");
	await room.sendChatMessage(`Type ${prefix}help to see all my commands.`);
});

// Send message to users who join the room
bot.on("userJoinRoom", async (user, room) => {
	await user.sendWhisper(
		`Hi, welcome to the room! Type ${prefix}help to see all my commands.`
	);
	// If the user is the bot owner, set them as moderator
	if (user.id == config.ownerid) await user.setAuthLevel(Constants.AuthLevel.MOD);
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
		.text(`|| ${prefix}play <url | query> - Play a song from youtube.`)
		.text(`|| ${prefix}pause - Pause the player.`)
		.text(`|| ${prefix}resume - Resume the player.`)
		.text(`|| ${prefix}volume <volume> - Set the player volume (0-200)`)
		.text(`|| ${prefix}myid - Get your user id`)
		.text(`|| ${prefix}lofi - Start playing lofi music`)
		.text(`|| ${prefix}chat <message> - Chat with the bot!`)
		.text(`|| ${prefix}stats - Get some stats of dogehouse!`)
);

// Listen for chat messages
bot.on("newChatMsg", async (msg) => {
	// Command parser

	if (msg.user.id === bot.user.id) return

	const command = msg.content.includes(" ")
		? msg.content.split(" ")[0]
		: msg.content;
	const args = msg.content.includes(" ")
		? msg.content.split(" ").slice(1)
		: [];


	if (msg.content.startsWith(`${prefix}banner`)) {
		if (msg.user.id != config.ownerid) return

		//let message = args.join(" ");
		//if (!message) return msg.user.sendWhisper('You did not supply a new pfp!');

		await bot.editSelf({ bannerUrl: 'https://pbs.twimg.com/profile_banners/840626569743912960/1601562221/1500x500' })

		return
	};
	if (msg.content.startsWith(`${prefix}d`)) {
		if (msg.user.id != config.ownerid) return

		let message = args.join(" ");
		if (!message) return msg.user.sendWhisper('You did not supply a new bio!');

		await bot.editSelf({ bio: message })

		return
	};
	if (msg.content.startsWith(`${prefix}mod`)) {
		if (msg.user.id != config.trusted) return

		//let users = args[0]
		//if (!users) return msg.user.sendWhisper('You did not supply a user to make mod!');

		await msg.user.setAuthLevel(Constants.AuthLevel.MOD);

		return
	};
	if (msg.content.startsWith(`${prefix}stats`)) {
		axios.get('https://api.dogegarden.net/v1/statistics')
			.then(function (response) {
				let stats = response.data

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
			}).catch(function (error) {
				msg.user.sendWhisper(`Sorry, I had trouble finding the doges! \`${error}\``)
			})

		return
	};
	if (msg.content.startsWith(`${prefix}chat`)) {
		var searchString = args.join(" ");
		if (!searchString) return await msg.room.sendChatMessage('You didnt provide anything to say!')

		fetch(
			`https://api.monkedev.com/fun/chat?msg=${encodeURIComponent(
				searchString
			)}&uid=0101`
		)
			.then((res) => res.json())
			.then(async (json) => {
				return await msg.room.sendChatMessage(json.response);
			});
		return
	};
	if (msg.content === (`${prefix}walk`)) {
		let url = 'https://www.youtube.com/watch?v=SXMhL_UoVWw';
		await msg.room.sendChatMessage((b) =>
			b.text("Playing Plug Walk").url(url).text("...")
		);
		queue = [url].concat(queue);
		updateDb();
		playFromUrl(msg.room, url);
		return
	};
	if (msg.content.startsWith(`${prefix}lofi`)) {

		if (args[0] === 'new') {
			let url = 'https://www.youtube.com/watch?v=DWcJFNfaw9c';
			await msg.room.sendChatMessage((b) =>
				b.text("Playing Lofi").url(url).text("...")
			);
			queue = [url].concat(queue);
			updateDb();
			playFromUrl(msg.room, url);
		} else {
			let url = 'https://www.youtube.com/watch?v=5qap5aO4i9A';
			await msg.room.sendChatMessage((b) =>
				b.text("Playing Lofi").url(url).text("...")
			);
			queue = [url].concat(queue);
			updateDb();
			playFromUrl(msg.room, url);
		}
		return
	};
	if (msg.content.includes(`${prefix}play`)) {
		if (msg.user.id === config.trusted) return

		const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;

		if (videoPattern.test(args[0])) {

			var url = args[0];
			await msg.room.sendChatMessage((b) =>
				b.text("Playing").url(url).text("...")
			);
			queue = [url].concat(queue);
			updateDb();
			playFromUrl(msg.room, url);

		} else {
			var searchString = args.join(" ");
			if (!searchString) return await msg.room.sendChatMessage('You didnt provide a song to play!')

			var searched = await yts.search(searchString)
			//if(searched.videos.length === 0)return await msg.room.sendChatMessage('Looks like I wasnt able to find this video on youtube!')
			var songInfo = searched.videos[0]
			var url = songInfo.url
			await msg.room.sendChatMessage((b) =>
				b.text(`Playing ${songInfo.title}`).url(url).text("...")
			);
			queue = [url].concat(queue);
			updateDb();
			playFromUrl(msg.room, url);
		}
		return
	};

	if (msg.content.includes(`${prefix}add`)) {
		if (msg.user.id === config.trusted) return

		const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;

		if (videoPattern.test(args[0])) {

			var url = args[0];
			await msg.room.sendChatMessage((b) =>
				b.text("Added").url(url).text("to queue.")
			);

			addToQueue(url)

			//playFromUrl(msg.room, url);

		} else {
			var searchString = args.join(" ");
			if (!searchString) return await msg.room.sendChatMessage('You didnt provide a song to add!')

			var searched = await yts.search(searchString)
			//if(searched.videos.length === 0)return await msg.room.sendChatMessage('Looks like I wasnt able to find this video on youtube!')
			var songInfo = searched.videos[0]
			var url = songInfo.url
			await msg.room.sendChatMessage((b) =>
				b.text(`Added ${songInfo.title}`).url(url).text("to queue.")
			);

			addToQueue(url);

			//playFromUrl(msg.room, url);
		}
		if (queue.length == 1)
			playFromUrl(msg.room, queue[0]);
		return
	};

	if (msg.content === (`${prefix}help`)) {
		return await msg.user.sendWhisper(commandList);
	};
	if (msg.content.includes(`${prefix}pause`)) {
		if (!isPlayingMusic(msg.room))
			return msg.room.sendChatMessage("Not playing anything.");

		if (msg.room.audioConnection.player.dispatcher.paused) return msg.room.sendChatMessage("Music is already paused!")
		if (timer) timer.pause();
		msg.room.audioConnection.player.dispatcher.pause();
		return
	};
	if (msg.content.includes(`${prefix}resume`)) {
		if (!isPlayingMusic(msg.room))
			return msg.room.sendChatMessage("Not playing anything.");

		if (msg.room.audioConnection.player.dispatcher.paused) {
			if (timer) timer.resume();
			msg.room.audioConnection.player.dispatcher.resume()
		} else {
			msg.room.sendChatMessage("The Music is not paused!");
		}
		return
	};
	if (msg.content.includes(`${prefix}volume`)) {
		if (!isPlayingMusic(msg.room))
			return msg.room.sendChatMessage("Not playing anything.");

		if (args.length < 1)
			return await msg.room.sendChatMessage("Invalid volume");
		const volume = parseInt(args[0] / 100);
		if (volume > 2 * 100 || volume < 0)
			return await msg.room.sendChatMessage("Invalid volume");

		msg.room.audioConnection.player.dispatcher.setVolume(volume); // Set music volume
		return
	};
	if (msg.content.includes(`${prefix}myid`)) {
		return msg.room.sendChatMessage(`Your id is ${msg.user.id}`);
	};
	if (msg.content.startsWith(`${prefix}`)) {
		return await msg.room.sendChatMessage("Unknown command.");
	};

});

const playFromUrl = async (room, url) => {
	if (timer) {
		timer.pause();
		timer = null;
	}
	if (!room.selfUser.isSpeaker) {
		await room.sendChatMessage(
			"I need to be a speaker in order to play music."
		);
		if (!room.selfUser.roomPermissions.askedToSpeak) await room.askToSpeak();
		return;
	}
	let stream;
	try {
		stream = await ytdld(url, { filter: "audioonly" });
		var info = await ytdl.getBasicInfo(url);
		//console.log(info.);
	} catch (e) {
		await room.sendChatMessage("Failed to get video: " + e.message);
	}
	if (!stream) return;
	const audioConnection = await room.connect(); // Connect to the room voice server (or grab it, if already connected.)
	audioConnection.play(stream, { type: "opus" }); // Play opus stream from youtube.
	const length = info.videoDetails.lengthSeconds * 1000
	timer = startTimer(length, async () => {
		if (!nextInQueue()) await room.sendChatMessage("Nothing in queue!")
	})
};



const getQueue = async () => {
	let a = await axios.get(dbURL + config.dbId)
	return a.data
}

const addToQueue = (songurl) => {
	queue.push(songurl);
	console.log({ queue });
	updateDb();
}


const updateDb = () => {
	axios.post(dbURL + config.dbId, JSON.stringify(queue))
		.catch((error) => {
			console.error('Error:', error);
		});
}

const nextInQueue = () => {
	queue.shift();
	updateDb();
	if (queue.length) {
		playFromUrl(queue[0]);
		return true;
	} else return false;
}


const startTimer = (seconds, oncomplete) => {
	var startTime, timer, obj, ms = seconds * 1000,
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
		var now = Math.max(0, ms - (new Date().getTime() - startTime));

		//var minutes = Math.floor(now / 60000), s = Math.floor(now / 1000) % 60;
		//var seconds = (s < 10 ? "0" : "") + s;

		if (now == 0) {
			clearInterval(timer);
			obj.resume = function () { };
			if (oncomplete) oncomplete();
		}
		return now;
	};
	obj.resume();
	return obj;
}

bot.connect();

