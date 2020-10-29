const analyse = require('./lib/analyse')
const render = require('./lib/render')
require('dotenv').config()

analyse({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  schemaName: process.env.DB_SCHEMA,
  tableIgnore: /(?:_\d|_bak|_old|_pre|backup_|temp_|cache|api|hubs_suburbs)/
})
  .then(render)
  .then(console.log)
  .catch(console.error)

