const Task      = require("./Task.js");
const {randInt} = require("./../../js/util.js");
module.exports = class LookAround extends Task {


    async perform() {
        await this.lookToSide(0);
        await this.lookToSide(45);
        await this.lookToSide(-45);
        await this.lookToSide(180);
        return true;
    }

    lookToSide(angle = 0) {
        return new Promise(async (resolve) => {
            let randPitch = randInt(-50, 50) / 100;
            await this.bot.look(angle, randPitch);
            setTimeout(resolve, 200);
        });
    }

}