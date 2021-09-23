"use strict";

/**
 * Check for missing data, force a disconnect if detected.
 */
module.exports = {
  guard(m) {
    return !m.healthCheckError && !m.healthCheckReady && m.private.hoboClient;
  },

  execute(m, {
    logger
  }) {
    const ts = new Date().getTime();
    const threshold = m.state.health_check_threshold;
    logger.info('Health check started');

    if (threshold && m.healthCheckTs && ts - m.healthCheckTs > threshold * 1000) {
      logger.error('Health check threshold exceeded');
      delete m.private.hoboClient;
      logger.info('Hobo client deleted');
    } else {
      logger.info('Health check passed');
    }

    return true;
  }

};