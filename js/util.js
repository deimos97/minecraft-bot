exports.randInt = (min, max) => {
    return parseInt(Math.random() * (max - min) + min);
}