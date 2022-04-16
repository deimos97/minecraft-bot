const mineflayer = require('mineflayer');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');
const { pathfinder, Movements, goals: { GoalNear, GoalGetToBlock } } = require('mineflayer-pathfinder');
const Vec3 = require('vec3').Vec3


const bot = mineflayer.createBot({
	host: '192.168.1.88', // minecraft server ip
	username: 'Lucia', // minecraft username
	// password: '12345678' // minecraft password, comment out if you want to log into online-mode=false servers
	port: 50736,                // only set if you need a port that isn't 25565
	// version: false,             // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
	// auth: 'mojang'              // only set if you need microsoft auth, then set this to 'microsoft'
});

bot.loadPlugin(pathfinder);

var mcData;
bot.once('spawn', () => {
	mineflayerViewer(bot, { port: 3007, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
	mcData = require('minecraft-data')(bot.version);
});

let commandHandler = (username, message) => {
	if (username !== 'Varela04') return;

	if (!message.includes("bot")) return;
	message = message.replace("bot", "").trim().toLowerCase();
	bot.currentCommand = message;
	switch (message) {
		case 'come':
			botGoToUser(username);
			break;
		case 'find':
			botFind();
			break;
		default:
			bot.chat('I don\'t know what you want master');
			break;
	}
}
bot.on('chat', commandHandler)

let botGoToUser = (username) => {
	const target = bot.players[username]?.entity
	if (!target) return bot.chat("I don't see you !");
	
	const defaultMove = new Movements(bot, mcData);
	defaultMove.canDig = false;
	const { x: playerX, y: playerY, z: playerZ } = target.position
	
	bot.pathfinder.setMovements(defaultMove);
	bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, 1))
	console.log("Going!");
	bot.goal_reached = () => {};
}

let botFind = () => {
	bot.chat(`Yes master`);
	const defaultMove = new Movements(bot, mcData);
	//defaultMove.canDig = false;
	defaultMove.allowParkour = false;
	
	let blocksToFind = [mcData.blocksByName['diamond_ore'].id];

	const blocks = bot.findBlocks({matching: blocksToFind,  maxDistance: 128, count: 10});
	
	const { x: blockX, y: blockY, z: blockZ } = blocks[0]
	
	bot.pathfinder.setMovements(defaultMove);
	bot.pathfinder.setGoal(new GoalGetToBlock(blockX, blockY, blockZ));
	bot.goal_reached = async () => {
		await dig(bot.blockAt(blocks[0]));
		botFind();
	};
}


async function dig (target) {
	console.log(bot.targetDigBlock);
	if (bot.targetDigBlock) {
		bot.chat(`already digging ${bot.targetDigBlock.name}`)
	} else {
		if (target && bot.canDigBlock(target)) {
			bot.chat(`starting to dig ${target.name}`)
			try {
				await bot.dig(target)
				bot.chat(`finished digging ${target.name}`)
			} catch (err) {
				console.log(err.stack)
			}
		} else {
			bot.chat('cannot dig')
		}
	}
}

bot.on('blockUpdate', async (updatedBlock) => {
	if(!updatedBlock.name.includes("lava")) return;
	return; // TEMP Cut Off
	let itemName = "cobblestone";

	let target = bot.blockAt(updatedBlock.position);

	const itemsInInventory = bot.inventory.items().filter(item => item.name.includes(itemName))
	if (itemsInInventory.length === 0) {
	  bot.chat('I dont have ' + itemName)
	  return
	}
	try {
		const rayBlock = rayTraceEntitySight(target)
		if (!rayBlock) {
			bot.chat('Block is out of reach')
			return
		}
		const face = directionToVector(rayBlock.face)
		await bot.pathfinder.goto(new GoalPlaceBlock(rayBlock.position.offset(face.x, face.y, face.z), bot.world, {
			range: 4
		}))
		await bot.equip(itemsInInventory[0], 'hand')
		await bot.lookAt(rayBlock.position.offset(face.x * 0.5 + 0.5, face.y * 0.5 + 0.5, face.z * 0.5 + 0.5))
		await bot.placeBlock(rayBlock, face)
		console.log("??");
	} catch (e) {
	  console.error(e)
	}


});

bot.on('goal_reached', () => { 
	if (bot.goal_reached) bot.goal_reached();
	console.log("Goal reached." + " --> " + bot.currentCommand);
});
bot.on('path_update', (update) => { 
	console.log("Path update ",update.status + " --> " + bot.currentCommand);
});
bot.on('path_reset', (update) => { 
	console.log("Update " + update + " --> " + bot.currentCommand);
});
bot.on('path_stop', () => { 
	console.log("Path stop " + " --> " + bot.currentCommand);
});

const rayTraceEntitySight = function (entity) {
    if (bot.world?.raycast) {
		const { height, position, yaw, pitch } = entity
		const x = -Math.sin(yaw) * Math.cos(pitch)
		const y = Math.sin(pitch)
		const z = -Math.cos(yaw) * Math.cos(pitch)
		const rayBlock = bot.world.raycast(position.offset(0, height, 0), new Vec3(x, y, z), 120)
		if (rayBlock) {
			return rayBlock
		}
    } else {
    	throw Error('bot.world.raycast does not exists. Try updating prismarine-world.')
    }
}

// Log errors and kick reasons:
bot.on('kicked', console.log);
bot.on('error', console.log);

function directionToVector (dir) {
	if (dir > 5 || dir < 0) return null
	if (dir === 0) {
		return new Vec3(0, -1, 0)
	} else if (dir === 1) {
		return new Vec3(0, 1, 0)
	} else if (dir === 2) {
		return new Vec3(0, 0, -1)
	} else if (dir === 3) {
		return new Vec3(0, 0, 1)
	} else if (dir === 4) {
		return new Vec3(-1, 0, 0)
	} else if (dir === 5) {
		return new Vec3(1, 0, 0)
	}
}