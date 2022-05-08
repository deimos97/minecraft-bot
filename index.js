const mineflayer = require('mineflayer');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');
const Vec3 = require('vec3').Vec3

const bot = mineflayer.createBot({
	//host: '192.168.1.88', // minecraft server ip
	host: 'localhost', // minecraft server ip
	username: 'Lucia', // minecraft username
	// password: '12345678' // minecraft password, comment out if you want to log into online-mode=false servers
	port: 51280,                // only set if you need a port that isn't 25565
	// version: false,             // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
	// auth: 'mojang'              // only set if you need microsoft auth, then set this to 'microsoft'
});

const {asyncBotWalkTo, asyncBotLookTo, botGoToUser, botRadialSearch} = require("./movement.js")(bot);
const {getBlocks} = require("./blocks.js")(bot);



var mcData;
bot.once('spawn', () => {
	mineflayerViewer(bot, { port: 3007, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
	mcData = require('minecraft-data')(bot.version);
	bot.statusData = {};
});


let commandHandler = async (username, message) => {
	if (username !== 'Varela04') return;

	if (!message.includes("bot")) return;
	message  = message.replace("bot", "").trim().toLowerCase();
	commands = message.split(' ');
	
	switch (commands[0]) {
		case 'come':
			botGoToUser(username);
			break;
		case 'find':
			
			// Identify the block we want to fech
			let blockToFind = commands[1];
			if (!blockToFind) return bot.chat(`What block do I find master?`);
			// Quantity may be specified
			let quantity    = commands[2] ?? 1;
			if (!commands[2]) bot.chat(`You did not say how much master, I'll get ${quantity} units of ${blockToFind}`);

			// Run the main function to collect or gather the block
			await botFindBlock(blockToFind, quantity);

			console.log("Going to user now!");
			// Go to the user who issued the command
			await botGoToUser(username);

			// Look at it's feet
			await bot.lookAt(bot.players[username]?.entity?.position);

			// Toss the item the user wanted
			let collectedItem = bot.inventory.findInventoryItem(blockToFind);
			
			if (collectedItem)
				bot.toss(collectedItem.type, null, Math.min(collectedItem.count, quantity));

			break;
		case 'moveforward':
			botForward();
			break;
		case 'collect':
			let blockToCollect = commands[1];
			if (!blockToCollect) return bot.chat('What block do you want me to collect master?');

			let checkerFunction = (block) => block.name === blockToCollect;
			collectBlock(checkerFunction);
			break;
		default:
			bot.chat('I don\'t know what you want master');
			break;
	}
}
bot.on('chat', commandHandler);


function botForward() {
	
	bot.setControlState('forward', true);
	setTimeout(() => {bot.setControlState('forward', false);}, 1000);
}


/**
 * 
 * @param {function} checkerFunction Function that identifies the blocks that need to be gathered
 * @returns {boolean}
 */
async function collectBlock(checkerFunction) {

	let droppedItems = findBlockEntities(checkerFunction);
	
	if (!droppedItems.length) {
		bot.chat("All tiems have been picked up!");
		return true;
	}

	await asyncBotWalkTo(droppedItems[0].position);

	await new Promise((resolve) => {
		let checkForBLock = () => {
			let _droppedItems = findBlockEntities(checkerFunction);
			if (!_droppedItems.find(_block => _block.id === droppedItems[0].id))
				resolve();

			setTimeout(checkForBLock, 400);
		};
		checkForBLock();
	});
	
	return collectBlock(checkerFunction);
}

/**
 * 
 * It will find all the entities that match your function
 * 
 * @param {function} checkerFunction 
 */
function findBlockEntities(checkerFunction) {
	let matchedEntities = [];
	for (let [index, entity] of Object.entries(bot.entities)) {
		// Only check for dropped items
		if (entity.type !== 'object' || entity.name !== 'item') continue;
		// Check if the metadata is available
		if (!entity.metadata) continue;
		// Make sure we can access the block ID
		if (!entity.metadata[entity.metadata.length - 1] || !entity.metadata[entity.metadata.length - 1].blockId) continue;
		// Make sure it's not in the air
		if (!entity.onGround) continue;
		// Check if the blockId is a valid block
		let blockId = entity.metadata[entity.metadata.length - 1].blockId;
		if (!mcData.blocks[blockId]) continue;

		// Now we succesfully identified the dropped block
		let block = mcData.blocks[blockId];

		if (checkerFunction(block)) {
			matchedEntities.push(entity);
		}
		
	}
	return matchedEntities;
}


async function botFindBlock(blockName, quantity) {

	// Make sure it's a real block
	let blockData = mcData.blocksByName[blockName];
	if (!blockData || !blockData.id) {
		return console.warn("Requested block does not exist")
	}

	// By default we will search inside nearby chest for the blocks
	/*if(await retrieveBlockFromChest(blockName, quantity)) {
		bot.chat(`I've found the item master!`);
		return true;
	}*/
	
	
	// If there are not nearby chest who have our resources we check if the block can be obtained in "nature"
	if (!blockData.diggable) {
		bot.chat(`Could not find the block master!`);
		return console.warn(`Could not find block ${blockName} on any chest. The block is not obtainable in "nature"`);
	}
	
	bot.chat(`The item is not on any nearby chest. I'll look for it on nature!`);

	// Here we will search for the block on the "outside" world (instead of nearby chests)
	await gatherBlock(blockName, quantity);
}

async function checkChestFor(chestPosition, blockName) {
	let chestBlock = bot.blockAt(chestPosition);
	if (!chestBlock) return console.error("No block at the postion", chestPosition);
	if (chestBlock.name !== "chest") return console.warn(`Specified block is not a chest type (found ${chestBlock.name})`);

	// We walk to the chest (to be able to open it)
	await asyncBotLookTo(chestPosition);


	// Bot Should be at the chest
	let chest = await bot.openChest(chestBlock);
	if (!chest) return console.error("Bot could not open the chest :(");

	// Chest should be open now, check all items
	for (let item of chest.slots) {
		if (!item || item.name != blockName) continue; // Ignore all items that do not match our search query

		// We've found it!! Return the chest object (chest would be oppened for the user)
		return chest;
	}
	return false;
}

async function retrieveBlockFromChest(blockName, quantity) {
	let surroundingChests = getBlocks('chest', 100);
	let itemsRetrieved = 0;
	for (let chestPosition of surroundingChests) {
		if (itemsRetrieved >= quantity) continue;
		
		let chest = await checkChestFor(chestPosition, blockName);
		if (!chest) continue;

		let maxCount = chest.slots.length - 36; // 36 is the lenght of the default inventory of the minecraft player
		for (let item of chest.slots) {
			if (!item || item.name != blockName) continue; // Ignore all items that do not match our search query
			if (item.slot >= maxCount) continue; // Avoid overflowing to the user's inventory
			if (itemsRetrieved >= quantity) continue; // Do not allow the bot to keep taking items from the chest


			let itemsToTake = Math.min(item.count, (quantity - itemsRetrieved));
			itemsRetrieved += itemsToTake;
			await chest.withdraw(item.type, null, itemsToTake);
		}
	}

	if (itemsRetrieved >= quantity) {
		return true;
	}
	return false;
}


// TODO: This is suposed to be a generic function for "blocks" but it's specific to trees :((
async function gatherBlock(blockName, quantity) {
	// Store blocks on variable accesible to our callback
	let blocksPos = getBlocks(blockName, 100);
	

	// If there is not a block we try to find it
	if (!blocksPos[0]) {
		return botRadialSearch([blockName], () => {gatherBlock(blockName, quantity)});
	}

	
	// Once the tree has been cut down, we check the rest of the bloks to see if they remain (they may have been cut down as part of the tree)
	while (blocksPos[0]) {

		// TODO: If the bot runs out of scaffolding blocks it should try to gather them (or it should be able to use the gathered blocks as sacaffolding?)
		// TODO: Make the bot plant the trees
		// We send the bot the block we are trying to find
		await asyncBotLookTo(blocksPos[0]);
		await cutDownTree(blocksPos[0]);

		let targetBlockQuantity = 0;
		bot.inventory.items().forEach(item => {
			if (item.name == blockName)
				targetBlockQuantity += item.count;
		});

		if (targetBlockQuantity >= quantity) {
			blocksPos[0] = undefined;
			continue;
		}


		blocksPos.splice(0, 1);
	}
	console.log("BlockPost after cutting down the tree", blocksPos[0]);

	return;
}
	

/**
 * 
 * @param {Vec3} treePos Position of a log block of the tree we want to cut down
 * @returns 
 * // TODO: Cut Down Tree must pick up entities after cutting down all the leaves
 */
async function cutDownTree(treePos) {
	// Make sure the block IS a log (tree)
	if (bot.blockAt(treePos).name !== 'log') return console.error("Block is not a log");

	// We will not start mining the tree unless we are next to it
	if (!bot.canDigBlock(bot.blockAt(treePos))) {
		return console.error("Cannot reach tree, move me closer to it!");
	}

	// We'll control de loop with this variables
	let treeRemaining    = true; // Infinite loop breaking point
	let nextLogPosToMine = treePos; // Next Vec3 to mine
	let treeLeaves       = []; // Surrounding leaves 
	let treeLogs         = []; // Surrounding logs

	// We'll keep breaking logs until the tree is fully cut down
	while (treeRemaining) {
		// Get the block of the next position
		let logToMine = bot.blockAt(nextLogPosToMine);
	
		// Get surrounding logs (the tree) and it's leaves
		let logFoundPos = bot.findBlocks({point: nextLogPosToMine, matching: [mcData.blocksByName['log'].id], maxDistance: 4, count: 100});
		for (let logPos of logFoundPos) {
			if (treeLogs.find( ({x, y, z}) => x === logPos.x && y === logPos.y && z === logPos.z)) continue;
			treeLogs.push(logPos);
		}
		
		
		// We add them to the array only if we do not already have them
		let leavesFoundPos = bot.findBlocks({point: nextLogPosToMine, matching: [mcData.blocksByName['leaves'].id, mcData.blocksByName['leaves2'].id],  maxDistance: 6, count: 100});
		for (let leavePos of leavesFoundPos) {
			if (treeLeaves.find( ({x, y, z}) => x === leavePos.x && y === leavePos.y && z === leavePos.z)) continue;
			treeLeaves.push(leavePos);
		}

		// Prevent the bot from mining anything that's not a log
		if (logToMine.name.includes("log")) {
			if (!bot.canDigBlock(logToMine)) {
				await asyncBotLookTo(logToMine.position);
			}
			await bot.dig(logToMine);
		}

		// If there are no more surrounding logs the tree is fully cut down
		if (!treeLogs[0]) {
			treeRemaining = false;
			continue;
		}
		
		// Otherwise we move onto the next log on the array
		nextLogPosToMine = treeLogs[0];
		treeLogs.splice(0, 1); // Eliminate it so we do not try to cut it down twice
	}

	// Now that the tree's logs are gone we will eliminate the leaves (so the whole tree is destroyed)
	let leavesRemaining = true;
	while (leavesRemaining) {
		// Breaking point of the leave's loop
		if (!treeLeaves[0]) {
			leavesRemaining = false;
			continue;
		}
		// Select the next block and try to destroy it
		let nextLeave = bot.blockAt(treeLeaves[0]);
		treeLeaves.splice(0, 1);
		if (!nextLeave.name.includes("leaves")) continue;
		if (!bot.canDigBlock(nextLeave)) {
			await asyncBotLookTo(nextLeave.position);
		}
		await bot.dig(nextLeave);
	}
	
	bot.chat("All leaves are done!");
	
	
	bot.chat("Gathering entities now");
	let checkerFunction = (block) => block.name === "sapling" || block.name === "log";
	await collectBlock(checkerFunction);
}

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