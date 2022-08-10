const Routine    = require("./Routine.js");
// const FindPlayer = require("./../tasks/FindPlayer.js");

/**
 * 
 * Routine that will play an idle animation which could be the bot looking around or something similar
 * 
 */
module.exports = class FindUser extends Routine {

    async play(params) {
        console.log(`The bot needs `, params, ` to go to the user`);
        return true;
    }

}