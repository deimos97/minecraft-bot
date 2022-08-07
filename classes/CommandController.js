const goals = require("./goals/GoalLoader.js");

/**
 * 
 * Will controll all the comunications with the user
 * 
 */
 module.exports = class CommandController {
    constructor(botController) {
        if (botController.constructor.name !== "BotController") throw 'The command handler needs to be initialized with the botController to "control" the bot.';
        this.botController = botController;
        // Avoid catching by encapsulating!??  
        this.bot.on("chat", (username, message)=> this.commandHandler(username, message))
        this.commandHistory = [];

        // Bind lowe case strings to the goal names
        this.commandToGoal = {};
        for (let [name, Goal] of Object.entries(goals)) {
            this.commandToGoal[name.toLowerCase()] = name;
        }
    }

    get bot() {
        return this.botController.bot;
    }

    get lastCaller() {
        let lastCommand = this.commandHistory[this.commandHistory.length - 1];
        if (!lastCommand) return "";
        return lastCommand.issuer;
    }

    get masters() {
        return [
            "Varela04",
            "FatFluffyCat",
        ]
    }
    
    get commandPrefix() {
        return "bot";
    }

    printHelp() {
        let availableCommandsString = "";
        
        let count = 0;
        for (let [name, Goal] of Object.entries(goals)) {
            count++;
            availableCommandsString += `   ${count} - ${name}:
            `;
        }
        
        this.bot.chat(`
            Hello I'm ${this.bot.entity.username}, here are my available commands:

            ${availableCommandsString} 

            Type ${this.commandPrefix} followed by the command to issue a new taks 
            If you need help figuring out a specific task just type: 
            ${this.commandPrefix} "%COMMAND%" help 
        `);
    }

    // Handle the bot commands
    async commandHandler(username, message) {
        // Only listen to your masters
        if (!this.masters.includes(username)) return;
        // Only listen when called
        if (message.indexOf(this.commandPrefix) !== 0) return;
    
        message      = message.replace(this.commandPrefix, "").trim().toLowerCase();
        let commands = message.split(' ');
        this.commandHistory.push({issuer: username, message: message});
        
        let [commandFnc] = commands.splice(0, 1);
        
        if (commandFnc === "help")
            return this.printHelp();
        
        
        if (!this.commandToGoal[commandFnc]) return this.bot.chat(`You have not provided a valid command. Type "${this.commandPrefix} help" to check out the valid commands`);

        this.bot.chat(`I will ${this.commandToGoal[commandFnc]}.`);

        let funcParams = {
            calledBy:     username,
            userCommands: commands,
        };
        this.botController.newUserTask(this.commandToGoal[commandFnc], funcParams);
    }
    
}