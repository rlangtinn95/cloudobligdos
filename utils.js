function randomDecimals(min, max, decimals) {
    var rand = Math.random()*(max-min) + min; // Generate random number between desired range
    var power = Math.pow(10, decimals); // 10 = 1 decimal, 100 = 2, 1000 = 3 ...
    return Math.floor(rand*power) / power;
}

module.exports = {
    randomDecimals
};