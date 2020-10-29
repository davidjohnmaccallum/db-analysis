const pug = require('pug')
const moment = require('moment')
const numeral = require('numeral')

module.exports = analysis => {
    const template = pug.compileFile('report.pug', { pretty: true })
    return template({moment, numeral, ...analysis})
}
