const mineflayer                       = require('mineflayer');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');
const Vec3 = require('vec3').Vec3
const CommandHandler                   = require("./command_handler.js");
const McDataController                 = require("./classes/mcData_controller.js");
const {pathfinder, Movements, goals: { GoalXZ, GoalNear, GoalLookAtBlock, GoalBlock } } = require('mineflayer-pathfinder');

const SEARCH_DISTANCE = 100;

/**
 * 
 * Our bot controller to handle the tasks and all bot related activities
 * 
 */
module.exports = class BotController {
    /**
     * 
     * @param {dictionary} botParams The parameters that initialize our bot (See MineFlayer DOCS for info)
     */
    constructor(botParams) {
        this.bot = mineflayer.createBot(botParams);

        this.bot.loadPlugin(pathfinder);

        // Handle the spawn event
        this.bot.once('spawn', () => {
            // In case you want to check in real time what the bot is doing
            // mineflayerViewer(this.bot, { port: 3007, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
            this.mcData = require('minecraft-data')(this.bot.version);
            this.mcDataController = new McDataController(this.mcData);
        });

        // We use the commandhandler to handle all user input
        this.commandHandler = new CommandHandler(this);

        this.botDebug();
    }

    async botFindBlock(blockName, quantity) {

        // Make sure it's a real block
        let blockData = this.mcData.blocksByName[blockName];
        if (!blockData || !blockData.id) {
            return console.warn("Requested block does not exist")
        }
    
        // By default we will search inside nearby chest for the blocks
        /*if(await this.retrieveBlockFromChest(blockName, quantity)) {
            this.bot.chat(`I've found the item master!`);
            return true;
        }*/
        
        
        // If there are not nearby chest who have our resources we check if the block can be obtained in "nature"
        if (!blockData.diggable) {
            this.bot.chat(`Could not find the block master!`);
            return console.warn(`Could not find block ${blockName} on any chest. The block is not obtainable in "nature"`);
        }
        
        this.bot.chat(`The item is not on any nearby chest. I'll look for it on nature!`);
    
        // Here we will search for the block on the "outside" world (instead of nearby chests)
        await this.gatherBlock(blockName, quantity);
    }

    // TODO: This is suposed to be a generic function for "blocks" but it's specific to trees :((
    async gatherBlock(blockName, quantity) {
        // Store blocks on variable accesible to our callback
        let blocksPos = this.getBlocks(blockName, 100);
        

        // If there is not a block we try to find it
        if (!blocksPos[0]) {
            return this.botRadialSearch([blockName], () => {this.gatherBlock(blockName, quantity)});
        }

        
        // Once the tree has been cut down, we check the rest of the bloks to see if they remain (they may have been cut down as part of the tree)
        while (blocksPos[0]) {

            // TODO: If the bot runs out of scaffolding blocks it should try to gather them (or it should be able to use the gathered blocks as sacaffolding?)
            // TODO: Make the bot plant the trees
            // We send the bot the block we are trying to find
            await this.asyncBotLookTo(blocksPos[0]);
            await this.cutDownTree(blocksPos[0]);

            let targetBlockQuantity = 0;
            this.bot.inventory.items().forEach(item => {
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
     * Makes the bot go in circles (a spiral) until the desired blocks are found
     * 
     * @param {array} blockArray Array of block names we're searching for
     * @param {function} onFound Callback function for when we find the blocks
     * 
     */
    async botRadialSearch(blockArray, onFound) {
        
        
        var startingPoint = this.bot.entity.position;
        
        let i = 0;
        // The smaller the angle the smoother the circle
        let rearchAngle = 5;
        // The smaller the with the smaller the spilar shape 
        let searchWidth = 2;
        // Infite loop breaking point
        var foundBlock = false;
        
        // While the bot moves we want to check periodicaly if we can detect the new block
        let lookForBlock = () => {
            // Here the bot is already at the new position, we check for the blocks that we are searching for
            blockArray.map(targetBlockName => {
                let block = this.getBlocks(targetBlockName, 1);
                if (block.length === 1) {
                    foundBlock = true;
                }
            });
        };
        // Check the blocks periodicaly
        let searchInterval = setInterval(lookForBlock, 500);
        do {
            // Taken straight of: https://codepen.io/Twinbee/pen/gvMNJY
            // This will make an spiral that increments with each loop
            newAngle = (rearchAngle/10) * i;
            x = (startingPoint.x) + (searchWidth * newAngle) * Math.sin(newAngle);
            z = (startingPoint.z) + (searchWidth * newAngle) * Math.cos(newAngle);

            // We create a new movement goal that does not care about what's in the middle
            let defaultMove              = new Movements(this.bot, this.mcData);
                defaultMove.canDig       = true;
                defaultMove.allowParkour = true;
            this.bot.pathfinder.setMovements(defaultMove);
            // The goal does not care about the height of the path taken
            this.bot.pathfinder.setGoal(new GoalXZ(x, z));


            // This promise will allow us to iteare again once the bot reaches it's destination
            let botIsReadyForNewMovement = () => {
                return new Promise((resolve, reject)=>{
                    this.bot.once('goal_reached', resolve);
                });
            }
            await botIsReadyForNewMovement();
            
            i++;
        } while(!foundBlock);
        // Stop checking for the blocks
        clearInterval(searchInterval);
        // Execute the callback function so the reason for the search to begin can start
        onFound();
    }

    async asyncBotWalkTo ( blockToWalkTo ) {
        if (!blockToWalkTo) return console.warn("No coordinates to walk to");
        
        if (!blockToWalkTo.x || !blockToWalkTo.y || !blockToWalkTo.z) return console.warn("Invalid Vec3: ", blockToWalkTo);
    
        let defaultMove              = new Movements(this.bot, this.mcData);
            defaultMove.canDig       = true;
            defaultMove.allowParkour = true;
        this.bot.pathfinder.setMovements(defaultMove);
        this.bot.pathfinder.setGoal(new GoalBlock(blockToWalkTo.x, blockToWalkTo.y, blockToWalkTo.z));
        return new Promise((resolve, reject) => {
            this.bot.once("goal_reached", resolve);
        });
    }
    
    async asyncBotLookTo ( blockToWalkTo ) {
        if (!blockToWalkTo) return console.warn("No coordinates to walk to");
    
    
        let defaultMove              = new Movements(this.bot, this.mcData);
            defaultMove.canDig       = true;
            defaultMove.allowParkour = true;
        this.bot.pathfinder.setMovements(defaultMove);
        this.bot.pathfinder.setGoal(new GoalLookAtBlock(blockToWalkTo, this.bot.world, {reach: 6, entityHeight: 1}));
        return new Promise((resolve, reject) => {
            this.bot.once("goal_reached", resolve);
        });
    }
    

    async checkChestFor(chestPosition, blockName) {
        let chestBlock = this.bot.blockAt(chestPosition);
        if (!chestBlock) return console.error("No block at the postion", chestPosition);
        if (chestBlock.name !== "chest") return console.warn(`Specified block is not a chest type (found ${chestBlock.name})`);
    
        // We walk to the chest (to be able to open it)
        await this.asyncBotLookTo(chestPosition);
    
    
        // Bot Should be at the chest
        let chest = await this.bot.openChest(chestBlock);
        if (!chest) return console.error("Bot could not open the chest :(");
    
        // Chest should be open now, check all items
        for (let item of chest.slots) {
            if (!item || item.name != blockName) continue; // Ignore all items that do not match our search query
    
            // We've found it!! Return the chest object (chest would be oppened for the user)
            return chest;
        }
        return false;
    }
    
    async retrieveBlockFromChest(blockName, quantity) {
        let surroundingChests = this.getBlocks('chest', 100);
        let itemsRetrieved = 0;
        for (let chestPosition of surroundingChests) {
            if (itemsRetrieved >= quantity) continue;
            
            let chest = await this.checkChestFor(chestPosition, blockName);
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
    
        
    
    /**
     * 
     * @param {Vec3} treePos Position of a log block of the tree we want to cut down
     * @returns 
     * // TODO: Cut Down Tree must pick up entities after cutting down all the leaves
     */
    async cutDownTree(treePos) {
        // Make sure the block IS a log (tree)
        if (this.bot.blockAt(treePos).name !== 'log') return console.error("Block is not a log");
    
        // We will not start mining the tree unless we are next to it
        if (!this.bot.canDigBlock(this.bot.blockAt(treePos))) {
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
            let logToMine = this.bot.blockAt(nextLogPosToMine);
        
            // Get surrounding logs (the tree) and it's leaves
            let logFoundPos = this.bot.findBlocks({point: nextLogPosToMine, matching: [this.mcData.blocksByName['log'].id], maxDistance: 4, count: 100});
            for (let logPos of logFoundPos) {
                if (treeLogs.find( ({x, y, z}) => x === logPos.x && y === logPos.y && z === logPos.z)) continue;
                treeLogs.push(logPos);
            }
            
            
            // We add them to the array only if we do not already have them
            let leavesFoundPos = this.bot.findBlocks({point: nextLogPosToMine, matching: [this.mcData.blocksByName['leaves'].id, this.mcData.blocksByName['leaves2'].id],  maxDistance: 6, count: 100});
            for (let leavePos of leavesFoundPos) {
                if (treeLeaves.find( ({x, y, z}) => x === leavePos.x && y === leavePos.y && z === leavePos.z)) continue;
                treeLeaves.push(leavePos);
            }
    
            // Prevent the bot from mining anything that's not a log
            if (logToMine.name.includes("log")) {
                if (!this.bot.canDigBlock(logToMine)) {
                    await this.asyncBotLookTo(logToMine.position);
                }
                await this.bot.dig(logToMine);
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
            let nextLeave = this.bot.blockAt(treeLeaves[0]);
            treeLeaves.splice(0, 1);
            if (!nextLeave.name.includes("leaves")) continue;
            if (!this.bot.canDigBlock(nextLeave)) {
                await this.asyncBotLookTo(nextLeave.position);
            }
            await this.bot.dig(nextLeave);
        }
        
        this.bot.chat("All leaves are done!");
        
        
        this.bot.chat("Gathering entities now");
        let checkerFunction = (block) => block.name === "sapling" || block.name === "log";
        await this.collectBlock(checkerFunction);
    
        await this.plantSaplings();
    }
    
    
    async plantSaplings() {
        
        // This helps us find suitable positions to plant our saplings (apart from each other)
        let findSuitableGroundPost = () => {
            // We find the base for our saplings
            let blocksToFind      = [this.mcData.blocksByName["grass"].id, this.mcData.blocksByName["dirt"].id];
            let potententialBlock = this.bot.findBlocks({matching: blocksToFind,  maxDistance: 1000, count: 999999 });
            // We find unavailable positions (saplings are already there)
            let takenPositions    = this.bot.findBlocks({matching: [this.mcData.blocksByName["sapling"].id],  maxDistance: 100, count: 500 });
            let suitableBlocks    = [];
    
            // Por each potential position we must check if it's viable
            potententialBlock.forEach(potententialBlock => {
                let newPost = potententialBlock;
                newPost.y   = newPost.y + 1;
                
                let blockAbove = this.bot.blockAt(newPost);
                // Only blocks accesible to the bot
                if (!this.bot.canSeeBlock(blockAbove)) return;
                // Only blocks that can be filled in by the bot (are air)
                if (blockAbove.name !== "air") return; 
                // Make sure it's not nearby any sapling
                if (takenPositions.find(saplingPos => {
                    var a = saplingPos.x - newPost.x;
                    var b = saplingPos.z - newPost.z;
                    var c = Math.sqrt( a*a + b*b );
                    if (c <= 3) {
                        return true;
                    }
                    return false;
                })) {
                    return;
                }
                
                // The block is valid for us to plant there
                suitableBlocks.push(potententialBlock);
                // Each potential position needs to be taken into account as if a sapling was there
                takenPositions.push(potententialBlock);
    
            });
            return suitableBlocks;
        }
        let suitablePos = findSuitableGroundPost();
        
        
        let lastPos = 0;
        
        
        while (this.botHas('sapling')) {
            if (!suitablePos[lastPos]) break;
            await this.asyncBotWalkTo(suitablePos[lastPos]);
            
            await this.botEquip('sapling');
            // Check if there is a sapling nearby (3 blocks near)
            if (this.bot.findBlock({matching: this.mcData.blocksByName["sapling"].id, maxDistance: 3, count: 1})) {
                // If there are find the next best position to plant it
                lastPos++;
                continue;
            }
            let blockAtPos = this.bot.blockAt(suitablePos[lastPos].offset(0, -1, 0));
            
            // One last check (to avoid slow updates from breaking the code)
            if(!this.botHas('sapling')) break;
            try {
                await this.bot.placeBlock(blockAtPos, new Vec3(0, 1, 0));
            } catch (error) {
                console.error(`Unable to plan sapling!`, error);
                break;
            }
            lastPos++;
        }
    }
    
    botHas(item) {
        return this.bot.inventory.findInventoryItem(item);
    }
    
    async botEquip(item) {
        if (!this.botHas(item)) return false;
    
        let inventoryItem  = this.bot.inventory.findInventoryItem(item);
    
        // if it's already on the hotbar we just equip it
        if (inventoryItem.slot >= this.bot.inventory.hotbarStart) {
            return await this.bot.equip(inventoryItem);
        }
    
        let freeHotBarSlot = null;
        for (let index = this.bot.inventory.hotbarStart; index < this.bot.inventory.inventoryEnd; index++) {
            if (this.bot.inventory.slots[index] === null && freeHotBarSlot === null) {
                freeHotBarSlot = index;
                break;
            }
        }
    
        // If there are no free slots this means that the hotbar is full
        if (!freeHotBarSlot) {
            // We try to find a free inventory place to clear up an spot on the hotbar
            let freeSlot = null;
            this.bot.inventory.slots.forEach((slot, slotIndex) => {
                if (slotIndex < this.bot.inventory.inventoryStart) return;
                if (slot === null && freeSlot === null) {
                    freeSlot = slotIndex;
                }
            });
    
            // If we find a free slot we move the first position of the hotbar to it
            if (freeSlot !== null) {
                await bot.moveSlotItem(this.bot.inventory.hotbarStart, freeSlot);
                freeHotBarSlot = this.bot.inventory.hotbarStart;
            }
        }
        
        // If we sill do not have any free slots this means that the inventory is full
        if (!freeHotBarSlot) {
            // Inventory is full
            console.log("Inventory is full!");
            return false;
        }
    
        // Now we know for sure that we have a free hot bar slot. We move our inventory to it
        await this.bot.moveSlotItem(inventoryItem.slot, freeHotBarSlot);
        await this.bot.equip(inventoryItem);
    }
    
    getBlocks(blockNames, count) {
        if (!blockNames) throw 'We need a block name to function';
        if (!count) count = 1;

        let blocksToFind = [];
        if ( Array.isArray(blockNames) ) {
            blockNames.map(blockName => blocksToFind.push(this.mcData.blocksByName[blockName].id));
        } else {
            blocksToFind = [this.mcData.blocksByName[blockNames].id];
        }
        return this.bot.findBlocks({matching: blocksToFind,  maxDistance: SEARCH_DISTANCE, count: count});	
    }

    /**
     * 
     * @param {function} checkerFunction Function that identifies the blocks that need to be gathered
     * @returns {boolean}
     */
    async collectBlock(checkerFunction) {

        let droppedItems = this.findBlockEntities(checkerFunction);
        
        if (!droppedItems.length) {
            this.bot.chat("All tiems have been picked up!");
            return true;
        }

        await this.asyncBotWalkTo(droppedItems[0].position);

        await new Promise((resolve) => {
            let checkForBLock = () => {
                let _droppedItems = this.findBlockEntities(checkerFunction);
                if (!_droppedItems.find(_block => _block.id === droppedItems[0].id))
                    resolve();

                setTimeout(checkForBLock, 400);
            };
            checkForBLock();
        });
        
        return this.collectBlock(checkerFunction);
    }

    /**
     * 
     * It will find all the entities that match your function
     * 
     * @param {function} checkerFunction 
     */
    findBlockEntities(checkerFunction) {
        let matchedEntities = [];
        for (let [index, entity] of Object.entries(this.bot.entities)) {
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
            if (!this.mcData.blocks[blockId]) continue;

            // Now we succesfully identified the dropped block
            let block = this.mcData.blocks[blockId];

            if (checkerFunction(block)) {
                matchedEntities.push(entity);
            }
            
        }
        return matchedEntities;
    }


    botDebug() {
        this.bot.on('goal_reached', () => { 
            console.log("Goal reached." + " --> " + this.bot.currentCommand);
        });
        this.bot.on('path_update', (update) => { 
            console.log("Path update ",update.status + " --> " + this.bot.currentCommand);
        });
        this.bot.on('path_reset', (update) => { 
            console.log("Update " + update + " --> " + this.bot.currentCommand);
        });
        this.bot.on('path_stop', () => { 
            console.log("Path stop " + " --> " + this.bot.currentCommand);
        });
    }
}