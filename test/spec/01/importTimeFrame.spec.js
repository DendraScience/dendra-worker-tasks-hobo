/**
 * Tests for importTimeFrame tasks
 */

const moment = require('moment')

describe('importTimeFrame tasks', function () {
  this.timeout(180000)

  const now = new Date()
  const model = {
    props: {},
    state: {
      _id: 'taskMachine-importTimeFrame-current',
      health_check_threshold: 1200,
      source_defaults: {
        endpoint: '/data/file/json/user/4475',
        some_default: 'default',
        start_date_time: '2021-10-01 00:00:00'
      },
      sources: [
        {
          increment: {
            days: 7
          },
          context: {
            org_slug: 'cdfw',
            some_value: 'value'
          },
          description: 'Test Back Bay Science Center - (S4)',
          logger: '10990817',
          pub_to_subject: 'hobo.importTimeFrame.out.' + main.ts
        },
        {
          increment: {
            days: 7
          },
          context: {
            org_slug: 'cdfw',
            some_value: 'value'
          },
          description: 'Test Burton Mesa ER - (S5)',
          logger: '10990818',
          pub_to_subject: 'hobo.importTimeFrame.out.' + main.ts
        }
      ],
      created_at: now,
      updated_at: now
    }
  }

  Object.defineProperty(model, '$app', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: main.app
  })
  Object.defineProperty(model, 'key', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: 'importTimeFrame'
  })
  Object.defineProperty(model, 'private', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: {}
  })

  let tasks
  let machine
  let bookmark

  after(function () {
    return Promise.all([
      model.private.stan
        ? new Promise((resolve, reject) => {
            model.private.stan.removeAllListeners()
            model.private.stan.once('close', resolve)
            model.private.stan.once('error', reject)
            model.private.stan.close()
          })
        : Promise.resolve()
    ])
  })

  it('should import', function () {
    tasks = require('../../../dist').importTimeFrame

    expect(tasks).to.have.property('sources')
  })

  it('should create machine', function () {
    machine = new tm.TaskMachine(model, tasks, {
      helpers: {
        logger: console
      },
      interval: 500
    })

    expect(machine).to.have.property('model')
  })

  it('should import Hobo observations 1st time (Back Bay)', function () {
    model.scratch = {}

    return machine
      .clear()
      .start()
      .then(success => {
        /* eslint-disable-next-line no-unused-expressions */
        expect(success).to.be.true

        // Verify task state
        expect(model).to.have.property('getFileAndPublishReady', true)
        expect(model).to.have.property('getFileConfigReady', true)
        expect(model).to.have.property('healthCheckReady', true)
        expect(model).to.have.property('hoboClientReady', true)
        expect(model).to.have.property('saveBookmarksReady', true)
        expect(model).to.have.property('sourceReady', true)
        expect(model).to.have.property('sourcesReady', true)
        expect(model).to.have.property('stanReady', true)
        expect(model).to.have.property('stanCheckReady', false)
        expect(model).to.have.property('versionTsReady', false)

        // Verify source
        expect(model).to.have.property('sourceKey', '10990817')

        // Check for defaults
        expect(model).to.have.nested.property(
          'sources.10990817.some_default',
          'default'
        )

        // Verify processing
        expect(model).to.have.property('sourceIndex', 0)
      })
  })

  it('should get saved bookmarks', function () {
    return main.app
      .service('/state/docs')
      .get('importTimeFrame-bookmarks')
      .then(doc => {
        expect(doc).to.have.property('_id', 'importTimeFrame-bookmarks')
        expect(doc).to.have.nested.property('bookmarks.0.key', '10990817')
        expect(doc).to.have.nested.property(
          'bookmarks.0.value',
          '2021-10-01 00:00:00'
        )

        bookmark = doc.bookmarks[0]
      })
  })

  it('should import Hobo observations 2nd time (Burton Mesa)', function () {
    model.scratch = {}

    return machine
      .clear()
      .start()
      .then(success => {
        /* eslint-disable-next-line no-unused-expressions */
        expect(success).to.be.true

        // Verify task state
        expect(model).to.have.property('getFileAndPublishReady', true)
        expect(model).to.have.property('getFileConfigReady', true)
        expect(model).to.have.property('healthCheckReady', true)
        expect(model).to.have.property('hoboClientReady', false)
        expect(model).to.have.property('saveBookmarksReady', true)
        expect(model).to.have.property('sourceReady', true)
        expect(model).to.have.property('sourcesReady', false)
        expect(model).to.have.property('stanReady', false)
        expect(model).to.have.property('stanCheckReady', false)
        expect(model).to.have.property('versionTsReady', false)

        // Verify source
        expect(model).to.have.property('sourceKey', '10990818')

        // Check for defaults
        expect(model).to.have.nested.property(
          'sources.10990818.some_default',
          'default'
        )

        // Verify processing
        expect(model).to.have.property('sourceIndex', 1)
      })
  })

  it('should import Hobo observations 3rd time (Back Bay)', function () {
    model.scratch = {}

    return machine
      .clear()
      .start()
      .then(success => {
        /* eslint-disable-next-line no-unused-expressions */
        expect(success).to.be.true

        // Verify task state
        expect(model).to.have.property('getFileAndPublishReady', true)
        expect(model).to.have.property('getFileConfigReady', true)
        expect(model).to.have.property('healthCheckReady', true)
        expect(model).to.have.property('hoboClientReady', false)
        expect(model).to.have.property(
          'saveBookmarksReady',
          !!model.responseDate
        )
        expect(model).to.have.property('sourceReady', true)
        expect(model).to.have.property('sourcesReady', false)
        expect(model).to.have.property('stanReady', false)
        expect(model).to.have.property('stanCheckReady', false)
        expect(model).to.have.property('versionTsReady', false)

        // Verify source
        expect(model).to.have.property('sourceKey', '10990817')

        // Check for defaults
        expect(model).to.have.nested.property(
          'sources.10990817.some_default',
          'default'
        )

        // Verify processing
        expect(model).to.have.property('sourceIndex', 0)
      })
  })

  it('should use bookmark to assign query time', function () {
    expect(model.getFileConfig).to.have.nested.property(
      'params.start_date_time',
      moment.utc(bookmark.value).add({ days: 7 }).format('YYYY-MM-DD HH:mm:ss')
    )
  })

  it('should import Hobo observations 4th time (Burton Mesa)', function () {
    model.scratch = {}

    model.healthCheckTs = 1 // Trigger a health check response

    return machine
      .clear()
      .start()
      .then(success => {
        /* eslint-disable-next-line no-unused-expressions */
        expect(success).to.be.true

        // Verify task state
        expect(model).to.have.property('getFileAndPublishReady', true)
        expect(model).to.have.property('getFileConfigReady', true)
        expect(model).to.have.property('healthCheckReady', true)
        expect(model).to.have.property('hoboClientReady', true)
        expect(model).to.have.property(
          'saveBookmarksReady',
          !!model.responseDate
        )
        expect(model).to.have.property('sourceReady', true)
        expect(model).to.have.property('sourcesReady', false)
        expect(model).to.have.property('stanReady', false)
        expect(model).to.have.property('stanCheckReady', false)
        expect(model).to.have.property('versionTsReady', false)

        // Verify source
        expect(model).to.have.property('sourceKey', '10990818')

        // Check for defaults
        expect(model).to.have.nested.property(
          'sources.10990818.some_default',
          'default'
        )

        // Verify processing
        expect(model).to.have.property('sourceIndex', 1)
      })
  })
})
