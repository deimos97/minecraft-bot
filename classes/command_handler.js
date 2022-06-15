
/**
 * 
 * Default handler for commands
 * 
 */
module.exports = class CommandHandler {
    constructor(botController) {
        if (botController.constructor.name !== "BotController") throw 'The command handler needs to be initialized with the botController to "control" the bot.';
        
        this.botController = botController;

        // Avoid catching by encapsulating!??
        this.botController.bot.on("chat", (username, message)=> this.commandHandler(username, message))
        
        this.commandHistory = [];
    }

    get bot() {
        return this.botController.bot;
    }

    get lastCaller() {
        let lastCommand = this.commandHistory[this.commandHistory.length - 1];
        if (!lastCommand) return "";
        return lastCommand.issuer;
    }

    // Handle the bot commands
    async commandHandler(username, message) {
        // Only listen to your masters
        if (!this.botController.masters.includes(username)) return;
        // Only listen when called
        if (message.indexOf(this.botController.commandPrefix) !== 0) return;
    
        message  = message.replace(this.botController.commandPrefix, "").trim().toLowerCase();
        let commands = message.split(' ');
        
        this.commandHistory.push({issuer: username, message: message});

        let commandFnc = commands.splice(0, 1);
        if (!this[commandFnc]) return this.bot.chat('I don\'t know what you want master');

        this[commandFnc](...commands);

        // switch (commands[0]) {
        //     case 'moveforward':
        //         botForward();
        //         break;
        //     case 'plant':
        //         plantSaplings();
        //         break;
        //     case 'collect':
        //         let blockToCollect = commands[1];
        //         if (!blockToCollect) return bot.chat('What block do you want me to collect master?');
    
        //         let checkerFunction = (block) => block.name === blockToCollect;
        //         collectBlock(checkerFunction);
        //         break;
        // }
    }

    come() {
        console.log(this.lastCaller);
        this.botController.botGoToUser(this.lastCaller);
    }

    async find(blockToFind, quantity = undefined) {
        var commandIssuer = this.lastCaller;
        // Identify the block we want to fech
        if (!blockToFind) return this.bot.chat(`What block do I find master?`);
        // Quantity may be specified
        if (!quantity) {
            quantity = 1;
            this.bot.chat(`You did not say how much master, I'll get ${quantity} units of ${blockToFind}`);
        }


        // Run the main function to collect or gather the block
        await this.botController.botFindBlock(blockToFind, quantity);

        console.log("Going to user now!");
        // Go to the user who issued the command
        await this.botController.botGoToUser(commandIssuer);

        // Look at it's feet
        await this.bot.lookAt(this.bot.players[commandIssuer]?.entity?.position);

        // Toss the item the user wanted
        let collectedItem = this.bot.inventory.findInventoryItem(blockToFind);
        
        if (collectedItem)
            this.bot.toss(collectedItem.type, null, Math.min(collectedItem.count, quantity));

    }
    
}