// Load `*.js` under current directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
require('fs').readdirSync(__dirname + '/').forEach(function(file) {
    if (file.match(/\.js$/) !== null && file !== 'GoalLoader.js' && file !== 'Goal.js') {
        var name = file.replace('.js', '');
        exports[name] = require('./' + file);
    }
});