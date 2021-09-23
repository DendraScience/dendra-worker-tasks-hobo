/**
 * Determine and assign source properties in model after the sources are ready.
 */

module.exports = {
  clear(m) {
    delete m.source
    delete m.sourceKey
  },

  guard(m) {
    return !m.sourceError && !m.source && m.sourcesTs === m.versionTs
  },

  execute() {
    return true
  },

  assign(m, res, { logger }) {
    m.sourceIndex =
      typeof m.sourceIndex === 'number'
        ? (m.sourceIndex + 1) % m.sourceKeys.length
        : 0
    m.sourceKey = m.sourceKeys[m.sourceIndex]
    m.source = m.sources[m.sourceKey]

    logger.info('Source ready', { sourceKey: m.sourceKey })
  }
}
