const {pathfinder, Movements, goals: { GoalXZ, GoalNear, GoalLookAtBlock, GoalBlock } } = require('mineflayer-pathfinder');

module.exports = (bot) => {
    const {getBlocks} = require("./blocks.js")(bot);
    
    var mcData;
    bot.loadPlugin(pathfinder);
    bot.once('spawn', () => {
        mcData = require('minecraft-data')(bot.version);
    });
    
    

    module.asyncBotWalkTo = async ( blockToWalkTo ) => {
        if (!blockToWalkTo) return console.warn("No coordinates to walk to");
        
        if (!blockToWalkTo.x || !blockToWalkTo.y || !blockToWalkTo.z) return console.warn("Invalid Vec3: ", blockToWalkTo);
    
        let defaultMove              = new Movements(bot, mcData);
            defaultMove.canDig       = true;
            defaultMove.allowParkour = true;
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalBlock(blockToWalkTo.x, blockToWalkTo.y, blockToWalkTo.z));
        return new Promise((resolve, reject) => {
            bot.once("goal_reached", resolve);
        });
    }
    
    module.asyncBotLookTo = async ( blockToWalkTo ) => {
        if (!blockToWalkTo) return console.warn("No coordinates to walk to");
    
    
        let defaultMove              = new Movements(bot, mcData);
            defaultMove.canDig       = true;
            defaultMove.allowParkour = true;
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalLookAtBlock(blockToWalkTo, bot.world, {reach: 6, entityHeight: 1}));
        return new Promise((resolve, reject) => {
            bot.once("goal_reached", resolve);
        });
    }
    
    module.botGoToUser = async (username) => {

        const target = bot.players[username]?.entity
        if (!target) return bot.chat("I don't see you !");
        
        const defaultMove = new Movements(bot, mcData);
        defaultMove.canDig = false;
        const { x: playerX, y: playerY, z: playerZ } = target.position
        
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, 1))
        
        // This promise will allow us to iteare again once the bot reaches it's destination
        let botReachedTheUser = () => {
            return new Promise((resolve, reject)=>{
                bot.once('goal_reached', resolve);
            });
        }
        await botReachedTheUser();
    }


    /**
     * 
     * Makes the bot go in circles (a spiral) until the desired blocks are found
     * 
     * @param {array} blockArray Array of block names we're searching for
     * @param {function} onFound Callback function for when we find the blocks
     * 
     */
    module.botRadialSearch = async (blockArray, onFound) => {
        
        bot.currentStatus    = 'radialSearch';
        bot.statusData.radialSearch = {
            startingPoint: bot.entity.position,
            searchingFor: blockArray,
            onSuccess: onFound,
        };
        
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
            bot.statusData.radialSearch.searchingFor.map(targetBlockName => {
                let block = getBlocks(targetBlockName, 1);
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
            x = (bot.statusData.radialSearch.startingPoint.x) + (searchWidth * newAngle) * Math.sin(newAngle);
            z = (bot.statusData.radialSearch.startingPoint.z) + (searchWidth * newAngle) * Math.cos(newAngle);

            // We create a new movement goal that does not care about what's in the middle
            let defaultMove          = new Movements(bot, mcData);
                defaultMove.canDig       = true;
                defaultMove.allowParkour = true;
            bot.pathfinder.setMovements(defaultMove);
            // The goal does not care about the height of the path taken
            bot.pathfinder.setGoal(new GoalXZ(x, z));


            // This promise will allow us to iteare again once the bot reaches it's destination
            let botIsReadyForNewMovement = () => {
                return new Promise((resolve, reject)=>{
                    bot.once('goal_reached', resolve);
                });
            }
            await botIsReadyForNewMovement();
            
            i++;
        } while(!foundBlock);
        // Stop checking for the blocks
        clearInterval(searchInterval);
        // Execute the callback function so the reason for the search to begin can start
        bot.statusData.radialSearch.onSuccess();
    }

    return module;
}
