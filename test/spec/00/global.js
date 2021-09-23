const chai = require('chai')
const feathers = require('@feathersjs/feathers')
const memory = require('feathers-memory')
const app = feathers()

const tm = require('@dendra-science/task-machine')
tm.configure({
  // logger: console
})

app.logger = console

app.set('clients', {
  hobo: {
    agent: {},
    auth: {
      grant_type: 'client_credentials',
      client_id: process.env.HOBO_CLIENT_ID,
      client_secret: process.env.HOBO_CLIENT_SECRET
    },
    opts: {
      baseURL: 'https://webservice.hobolink.com/ws'
    }
  },
  stan: {
    client: 'test-hobo-{key}',
    cluster: 'stan-cluster',
    opts: {
      // uri: 'nats://192.168.1.60:31242'
      uri: 'http://localhost:4222'
    }
  }
})

// Create an in-memory Feathers service for state docs
app.use(
  '/state/docs',
  memory({
    id: '_id',
    paginate: {
      default: 200,
      max: 2000
    },
    store: {}
  })
)

global.assert = chai.assert
global.expect = chai.expect
global.main = {
  app,
  ts: Date.now()
}
global.tm = tm
