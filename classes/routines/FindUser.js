const Routine    = require("./Routine.js");
const FindPlayer = require("./../tasks/FindPlayer.js");

/**
 * 
 * Routine that will play an idle animation which could be the bot looking around or something similar
 * 
 */
module.exports = class FindUser extends Routine {


    async play(params) {
        if (!params.userToFind) return false;
        
        const findPlayer = new FindPlayer(this.bot);
        let playerPos    = await findPlayer.perform(params.userToFind);
        if (!playerPos && params.search === true) {
            // TODO: Run radial search routine
        }
        return playerPos;
    }

}