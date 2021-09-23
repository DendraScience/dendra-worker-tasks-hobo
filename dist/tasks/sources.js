"use strict";

/**
 * Prepare model sources if not defined, or when new state is detected.
 */
module.exports = {
  guard(m) {
    return !m.sourcesError && m.state.sources && m.state.sources.length > 0 && m.sourcesTs !== m.versionTs;
  },

  execute(m) {
    return m.state.sources.reduce((sources, src) => {
      if (src.logger) {
        const sourceKey = `${src.logger.replace(/\W/g, '_')}`;
        const source = Object.assign({}, m.state.source_defaults, src);
        if (source.pub_to_subject) sources[sourceKey] = source;
      }

      return sources;
    }, {});
  },

  assign(m, res, {
    logger
  }) {
    delete m.sourceIndex;
    m.sourceKeys = Object.keys(res);
    m.sources = res;
    m.sourcesTs = m.versionTs;
    logger.info('Sources ready', {
      sourceKeys: m.sourceKeys
    });
  }

};