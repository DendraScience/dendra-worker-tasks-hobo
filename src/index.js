/**
 * Worker tasks for importing HOBOlink data.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module dendra-worker-tasks-hobo
 */

// Named exports for convenience
module.exports = {
  importManaged: require('./importManaged'),
  importTimeFrame: require('./importTimeFrame')
}
