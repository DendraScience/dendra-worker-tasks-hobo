module.exports = {
  getFileAndPublish: require('./tasks/getFileAndPublish'),
  getFileConfig: require('./tasks/managed/getFileConfig'),
  healthCheck: require('./tasks/healthCheck'),
  hoboClient: require('./tasks/hoboClient'),
  saveBookmarks: require('./tasks/managed/saveBookmarks'),
  source: require('./tasks/source'),
  sources: require('./tasks/sources'),
  stan: require('./tasks/stan'),
  stanCheck: require('./tasks/stanCheck'),
  versionTs: require('./tasks/versionTs')
}
