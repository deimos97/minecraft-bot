

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