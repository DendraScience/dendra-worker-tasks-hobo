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

    const increment =
      typeof m.source.increment === 'object'
        ? m.source.increment
        : {
            days: 30
          }

    let startDateTime = moment.utc(
      m.source.start_date_time || '2021-01-01 00:00:00'
    )
    if (typeof m.source.backfill === 'object')
      startDateTime = moment.utc().subtract(m.source.backfill)

    if (doc && doc.bookmarks) {
      const bookmark = doc.bookmarks.find(bm => bm.key === m.sourceKey)

      if (bookmark) {
        const lastDateTime = moment.utc(bookmark.value)
        const nextDateTime = lastDateTime.clone().add(increment)

        startDateTime = nextDateTime.isAfter() ? lastDateTime : nextDateTime
      }
    }

    const endDateTime = startDateTime
      .clone()
      .add(increment)
      .subtract({ seconds: 1 })

    return {
      method: 'GET',
      params: Object.assign({}, m.source.query_params, {
        start_date_time: startDateTime.format(DATE_FORMAT),
        end_date_time: endDateTime.format(DATE_FORMAT),
        loggers: m.source.logger
      }),
      url: m.source.endpoint
    }
  },

  assign(m, res, { logger }) {
    m.getFileConfig = res

    logger.info('Get file config ready', res)
  }
}
