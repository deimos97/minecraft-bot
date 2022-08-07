const Task      = require("./Task.js");
const {pathfinder, Movements, goals: { GoalXZ, GoalNear, GoalLookAtBlock, GoalBlock } } = require('mineflayer-pathfinder');

// TODO: This will need A LOT more work to use different goals and what not
module.exports = class MoveTo extends Task {


    async perform(position) {
        const defaultMove = new Movements(this.bot, this.bot.mcData);
        defaultMove.canDig = false;
        this.bot.pathfinder.setMovements(defaultMove);
        
        let {x: X, y: Y, z: Z} = position;
        this.bot.pathfinder.setGoal(new GoalNear(X, Y, Z, 1))
        
        // This promise will allow us to iteare again once the bot reaches it's destination
        let botReachedTheUser = () => {
            return new Promise((resolve, reject)=>{
                this.bot.once('goal_reached', resolve);
            });
        }
        await botReachedTheUser();
        // TODO: Check if the bot is realy close to or at the required position
        return true;
    }

}

