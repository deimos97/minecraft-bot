const BindBotBase = require("./../BindBotBase.js");
const Idle = require("./../routines/Idle.js");
/**
 * 
 * Base for all of the Goal basic functionalities
 * 
 */
module.exports = class Goal extends BindBotBase {
    constructor(bot) {
        super(bot);
        this.currentRoutine = 0;
    }

    getRoutines() {
        return [
            new Idle(this.bot),
        ];
    }

    get description() {
        return `No description provided. Try calling it to see what it does!`;
    }

    getCurrentRoutine() {
        return this.getRoutines()[this.currentRoutine];
    }
    
    advanceToNextRoutine() {
        let allRoutines = this.getRoutines();
        if (this.currentRoutine >= (allRoutines.length - 1)) {
            return false;
        }
        this.currentRoutine++; 
        return true;
    }

    getHelp() {
        return `No help provided for the command ${this.constructor.name}`;
    }

    getProcessParams(params) {
        return params;
    }


    /**
     * TODO: Better name??? Basicaly we are trying to express the Goal advancing on its "goal"
     * 
     */
    async play(params) {
        let currentRoutine = this.getCurrentRoutine();
        
        if (params.userCommands && params.userCommands[0] && params.userCommands[0].toLowerCase() === "help" )
            return this.bot.chat(this.getHelp());

        if (!await currentRoutine.play(this.getProcessParams(params))) {
            // TODO: Figure out what to do if our routine fails!
        }
        
        if (!this.advanceToNextRoutine()) {
            return true;
        }
        return await this.play(params);
    }

}