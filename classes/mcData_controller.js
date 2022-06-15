

module.exports = class McDataController {
    constructor(mcData) {
        if (!mcData) throw `The ${this.contructor.name} needs the mcData in order to function`;
        this.mcData = mcData;
    }
}