/**
 * 
 * Will bind the bot to a Class
 * 
 */
module.exports = class BindBotBase {
    /**
     * 
     * Binds the bot to the Class
     * 
     * @param {Object} bot Bot object from our Minflayer module
     */
    constructor(bot) {
        if (!bot || !bot.version || !bot.mcData) throw `Invalid bot constructor provided for the Goal ${this.constructor.name}`;
        this.bot = bot;
    }
}