/**
 * Get data from HOBOlink webservice and publish to NATS.
 */

module.exports = {
  clear(m) {
    delete m.publishCount
    delete m.responseDate
  },

  guard(m) {
    return (
      !m.getFileAndPublishError &&
      !m.getFileAndPublishReady &&
      m.private.stan &&
      m.stanConnected &&
      m.private.hoboClient &&
      m.source &&
      m.healthCheckReady &&
      m.getFileConfig
    )
  },

  async execute(m, { logger }) {
    const { getFileConfig, source } = m
    const { hoboClient, stan } = m.private
    const { context, pub_to_subject: pubSubject } = source

    const getFile = t =>
      hoboClient.ws(
        Object.assign(
          {
            headers: {
              Authorization: `Bearer ${t}`
            }
          },
          getFileConfig
        )
      )

    let observationCount = 0
    let publishCount = 0
    let response
    let responseDate
    let { token } = m.private

    if (token) {
      // If we have a token, give it a try
      logger.info('Hobo client sending get file request 1')
      try {
        response = await getFile(token)
      } catch (err) {
        const resp = err.response
        if (
          resp &&
          resp.status === 401 &&
          resp.data &&
          resp.data.error === 'invalid_token'
        ) {
          logger.info('Hobo client token expired')
        } else {
          logger.error('Hobo client get file request 1 error', err)
          throw err
        }
      }
    }

    if (!response) {
      // First try failed, auth and try again
      logger.info('Hobo client authenticating')
      try {
        const resp = await hoboClient.auth()
        token = resp.data && resp.data.access_token
      } catch (err) {
        logger.error('Hobo client auth error', err)
        throw err
      }

      logger.info('Hobo client sending get file request 2')
      try {
        response = await getFile(token)
      } catch (err) {
        logger.error('Hobo client get file request 2 error', err)
        throw err
      }
    }

    if (
      response &&
      response.data &&
      response.data.observation_list &&
      response.data.observation_list.length
    ) {
      const list = response.data.observation_list
      let observations = []

      observationCount = list.length
      responseDate = new Date(response.headers.date)

      for (let i = 0; i < observationCount; i++) {
        const curr = list[i]
        const next = list[i + 1]
        const { timestamp } = curr

        observations.push(curr)

        // Publish by timestamp
        if (timestamp !== (next && next.timestamp)) {
          logger.info('Publishing message', { timestamp })
          try {
            const msgStr = JSON.stringify({
              context: Object.assign({}, context, {
                imported_at: new Date()
              }),
              payload: {
                observations,
                timestamp
              }
            })

            const guid = await new Promise((resolve, reject) => {
              stan.publish(pubSubject, msgStr, (err, guid) =>
                err ? reject(err) : resolve(guid)
              )
            })
            publishCount++

            logger.info('Published message', { timestamp, pubSubject, guid })
          } catch (err) {
            logger.error('Publish error', err)
            throw err
          }

          observations = []
        }
      }
    }

    return {
      observationCount,
      publishCount,
      responseDate,
      token
    }
  },

  assign(m, res, { logger }) {
    logger.info(
      `Got (${res.observationCount}) observations(s), published (${res.publishCount})`
    )

    m.private.token = res.token
    m.healthCheckTs = new Date().getTime()
    m.publishCount = res.publishCount
    m.responseDate = res.responseDate
  }
}
