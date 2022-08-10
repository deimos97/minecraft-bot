const mineflayer        = require('mineflayer');
const {pathfinder}      = require('mineflayer-pathfinder');
const PlayIdleAnimation = require("./goals/PlayIdleAnimation.js");
const CommandController = require("./CommandController.js");
const goals             = require("./goals/GoalLoader.js");
const Requirements      = require('./Requirements.js');

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

        this.goalsQueue = [
        ];

    }

    /**
     * 
     * Our main loop that will handle all the task assigned to the bot
     * 
     */
    beginLoop() {
        // We use the commandhandler to handle all user input
        this.commandController = new CommandController(this);
        // TODO: Test goal queue and figure out a way to prioritize taks and what not
        // this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
        // this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
        // this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
        // this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
        // this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
        // this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
        this.loop();
    }

    newUserGoal(goal, params) {
        this.goalsQueue.push({goal: new goals[goal](this.bot), params: params});
    }

    async loop() {
        // Bot is thinking of the next task
        // TODO: Finding the next taks to perform may be a little bit more complex
        if (this.goalsQueue.length === 0) {
            this.botNewGoal();
            return this.loop();
        }

        let goalToPerform = 0;

        // First we'll check the requirements for said goal
        for (let requirement of this.goalsQueue[goalToPerform].goal.requirements) {
            // If the bot meets the requirement we move on to the next one
            if (Requirements.botMeetsRequirement(this.bot, requirement)) continue;
    
            // Otherwise we call the Goal for the requirement so the the bot meets it
            let goalAndParams = Requirements.getGoalForRequirement(requirement);
            let requirementGoal = new goalAndParams.goal(this.bot);
            if (!await requirementGoal.play(goalAndParams.params ?? [])) {
                // TODO: What happens if a requirement fails?
            }
        }

        if(!await this.goalsQueue[goalToPerform].goal.play(this.goalsQueue[goalToPerform].params ?? [])) {
            // TODO: What to do when a goal fails? Move on to the next one?
        }
        this.goalsQueue.splice(goalToPerform, 1);

        this.loop();
    }

    // TODO: This will be assumed by our "role" Class (miners and builders will have different objetives)
    botNewGoal() {
        this.goalsQueue.push({goal: new PlayIdleAnimation(this.bot)});
    }

}