/**
 * Create an HTTP client if not defined.
 */

const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const axios = require('axios')
const qs = require('qs')

module.exports = {
  guard(m) {
    return !m.hoboClientError && !m.private.hoboClient
  },

  execute(m) {
    const cfg = Object.assign({}, m.$app.get('clients').hobo, m.props.hobo)
    const ws = axios.create(
      Object.assign(
        {
          baseURL: 'https://webservice.hobolink.com/ws',
          maxRedirects: 0,
          timeout: 180000
        },
        cfg.opts,
        {
          httpAgent: new Agent(
            Object.assign(
              {
                timeout: 60000,
                freeSocketTimeout: 30000
              },
              cfg.agent
            )
          ),
          httpsAgent: new HttpsAgent(
            Object.assign(
              {
                timeout: 60000,
                freeSocketTimeout: 30000
              },
              cfg.agent
            )
          ),
          paramsSerializer: function (params) {
            return qs.stringify(params)
          }
        }
      )
    )

    return {
      auth() {
        return ws({
          method: 'POST',
          url: '/auth/token',
          params: cfg.auth,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: {}
        })
      },
      ws
    }
  },

  assign(m, res, { logger }) {
    m.private.hoboClient = res

    logger.info('Hobo client ready')
  }
}
