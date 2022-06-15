const BotController = require("./classes/bot_controller.js");


let botParams = {
	//host: '192.168.1.88', // minecraft server ip
	host: 'localhost', // minecraft server ip
	username: 'Lucia', // minecraft username
	// password: '12345678' // minecraft password, comment out if you want to log into online-mode=false servers
	port: 49797,                // only set if you need a port that isn't 25565
	// version: false,             // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
	// auth: 'mojang'               // only set if you need microsoft auth, then set this to 'microsoft'
}

var botController = new BotController(botParams);


// const {asyncBotWalkTo, asyncBotLookTo, botGoToUser, botRadialSearch} = require("./movement.js")(bot);
// const {getBlocks} = require("./blocks.js")(bot);


function botForward() {
	
	bot.setControlState('forward', true);
	setTimeout(() => {bot.setControlState('forward', false);}, 1000);
}

