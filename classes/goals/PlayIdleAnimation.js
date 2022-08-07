const Goal = require("./Goal.js");

module.exports = class PlayIdleAnimation extends Goal {
    
    get description() {
        return `No commands. Once you call it the bot will play an Idle animation.`;
    }
}