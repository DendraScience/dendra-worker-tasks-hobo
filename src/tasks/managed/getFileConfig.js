/**
 * Determine and assign client config after the source is ready.
 */

const moment = require('moment')

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

module.exports = {
  clear(m) {
    delete m.getFileConfig
  },

  guard(m) {
    return (
      !m.getFileConfigError &&
      !m.getFileConfig &&
      m.source &&
      m.source.endpoint &&
      m.source.endpoint.startsWith('/data/file/json/user/')
    )
  },

  async execute(m, { logger }) {
    const docId = `${m.key}-bookmarks`
    let doc

    try {
      doc = await m.$app.service('/state/docs').get(docId)
    } catch (err) {
      if (err.code === 404) {
        logger.info(`No state doc found for '${docId}'`)
      } else {
        logger.error('Get bookmarks error', err)
      }
    }

    let lastSuccessfulQueryTime
    if (doc && doc.bookmarks) {
      const bookmark = doc.bookmarks.find(bm => bm.key === m.sourceKey)

      if (bookmark) lastSuccessfulQueryTime = moment.utc(bookmark.value)
    }

    let startDateTime
    if (typeof m.source.backfill === 'object')
      startDateTime = moment.utc().subtract(m.source.backfill)

    return {
      method: 'GET',
      params: Object.assign(
        {},
        m.source.query_params,
        {
          last_successful_query_time: '2021-01-01 00:00:00',
          loggers: m.source.logger,
          only_new_data: 'true'
        },
        lastSuccessfulQueryTime
          ? {
              last_successful_query_time:
                lastSuccessfulQueryTime.format(DATE_FORMAT)
            }
          : undefined,
        startDateTime
          ? { start_date_time: startDateTime.format(DATE_FORMAT) }
          : undefined
      ),
      url: m.source.endpoint
    }
  },

  assign(m, res, { logger }) {
    m.getFileConfig = res

    logger.info('Get file config ready', res)
  }
}
