const mineflayer        = require('mineflayer');
const {pathfinder}      = require('mineflayer-pathfinder');
const PlayIdleAnimation = require("./goals/PlayIdleAnimation.js");


module.exports = class BotController {
    
    constructor(botParams) {
        this.bot = mineflayer.createBot(botParams);
        this.bot.loadPlugin(pathfinder);
        // Handle the spawn event
        this.bot.once('spawn', () => {
            // In case you want to check in real time what the bot is doing
            // mineflayerViewer(this.bot, { port: 3007, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
            this.bot.mcData = require('minecraft-data')(this.bot.version);
            this.beginLoop();
        });

        this.goals = [];

    }

    /**
     * 
     * Our main loop that will handle all the task assigned to the bot
     * 
     */
    beginLoop() {
        this.loop();
    }

    async loop() {
        // Bot is thinking of the next task
        // TODO: Finding the next taks to perform may be a little bit more complex
        if (this.goals.length === 0) {
            this.botNewGoal();
            return this.loop();
        }

        await this.goals[0].play();

        this.loop();
    }

    // TODO: This will be assumed by our "role" Class (miners and builders will have different objetives)
    botNewGoal() {
        this.goals.push(new PlayIdleAnimation(this.bot));
    }



}