const Routine    = require("./Routine.js");
const FindUser   = require("./FindUser.js");
const MoveTo     = require("./../tasks/MoveTo.js");

/**
 *
 * 
 * 
 */
module.exports = class GoToUser extends Routine {


    async play(params) {
        
        const findUserRoutine = new FindUser(this.bot);
        params.search         = false;
        const playerPosition  = await findUserRoutine.play(params);
        if (!playerPosition) return false;
        const moveTo          = new MoveTo(this.bot);
        return moveTo.perform(playerPosition);
    }

}