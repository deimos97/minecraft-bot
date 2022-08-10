const Goal            = require("./Goal.js");
const GatherResource  = require("./../routines/GatherResource.js");

module.exports = class GetResource extends Goal {
    
    get description() {
        return `Parameters: \r
                    1 (required) - %resource% Name of the resource you want the bot to collect. \r
                    2 (required) - %quantity% Quantity of the resource to collect. \r
                The resource needs to be naturaly available on the world (¿no complex resources that require crafting?).`;
    }

    getHelp() {
        return `Call "bot ${this.constructor.name}" followed by the resource you want the bot to collect followed by the amount. Example: "bot ${this.constructor.name} wood 12"`;
    }


    getRoutines() {
        return [
            ...super.getRoutines(),
            new GatherResource(this.bot),
        ];
    }

}