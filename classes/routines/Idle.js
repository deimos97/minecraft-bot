const Routine    = require("./Routine.js");
const LookAround = require("./../tasks/LookAround.js");

/**
 * 
 * Routine that will play an idle animation which could be the bot looking around or something similar
 * 
 */
module.exports = class Idle extends Routine {


    async play() {
        const lookAround = new LookAround(this.bot);
        await lookAround.perform();
    }

}