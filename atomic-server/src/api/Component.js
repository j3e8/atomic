let Component = {};
let atomic = require('../pkg/atomic.js');

Component.buildComponentResponse = function(ids) {
  return atomic.get(ids, process.cwd() + '/src/components');
}

module.exports = Component;
