const Goal            = require("./Goal.js");
const GoToUserRoutine = require("./../routines/GoToUser.js");

module.exports = class GoToUser extends Goal {
    get description() {
        return `Parameter: \r
                    1 (optional) - %username% Name of the user you want to move the bot to. \r
                Once you call it the bot will come to you or the specified user.`;
    }

    get requirements() {
        return [
            {value: "dirt", quantity: "64"},
        ];
    }

    getHelp() {
        return `Call "bot ${this.constructor.name}" followed by the username you want to send the bot to. Example: "bot ${this.constructor.name} Deimos97"`;
    }

    getProcessParams(params) {
        params.userToFind = params.userCommands[0] ?? params.calledBy;
        return params;
    }

    getRoutines() {
        return [
            ...super.getRoutines(),
            new GoToUserRoutine(this.bot),
        ];
    }

}