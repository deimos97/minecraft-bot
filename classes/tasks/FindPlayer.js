const Task = require("./Task.js");

module.exports = class FindPlayer extends Task {

    async perform(username) {
        const target = this.bot.players[username]?.entity
        if (!target) return false;
        return target.position;
    }

}