const SEARCH_DISTANCE = 100;

module.exports = (bot) => {
    var mcData;
    bot.once('spawn', () => {
        mcData = require('minecraft-data')(bot.version);
    });


    module.getBlocks = (blockNames, count) => {
        let blocksToFind = [];
        if ( Array.isArray(blockNames) ) {
            blockNames.map(blockName => blocksToFind.push(mcData.blocksByName[blockName].id));
        } else {
            blocksToFind = [mcData.blocksByName[blockNames].id];
        }
        return bot.findBlocks({matching: blocksToFind,  maxDistance: SEARCH_DISTANCE, count: count});	
    }

    return module;
}
