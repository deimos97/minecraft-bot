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
    }

    getRoutines() {
        return [
            new Idle(this.bot),
        ];
    }

    getCurrentRoutine() {
        if (this.currentRoutine === undefined)
            this.currentRoutine = 0;
        return this.getRoutines()[this.currentRoutine];
    }

    /**
     * TODO: Better name??? Basicaly we are trying to express the Goal advancing on its "goal"
     * 
     */
    async play() {
        let currentRoutine = this.getCurrentRoutine();
        await currentRoutine.play();
    }

}