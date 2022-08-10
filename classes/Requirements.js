const GetResource = require("./goals/GetResource.js");

/**
 * 
 * A certain item or condition the bot needs to have and the collection of Goals on how to achieve it
 * 
 */
module.exports = class Requirements {

    /**
     * 
     * Gets the Goal needed to complete a requirement
     * 
     * @param {Object} requirement The item needed 
     * 
     */
    static getGoalForRequirement(requirement) {
        switch (requirement) {
            case 'sample':
                break;
            default:
                return {goal: GetResource, params: [requirement]};
                break;
        }
    }
   
    /**
     * 
     * @param {Object} bot         Bot Object
     * @param {Object} requirement Requirement object
     */
    static botMeetsRequirement(bot, requirement) {
        return false;
    }
    
}