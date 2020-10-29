const { Client } = require('pg')
const _ = require('lodash')
const fs = require('fs')
require('dotenv').config()

module.exports = async ({user, host, database, password, port, schemaName, tableIgnore}) => {

    let client
  
    try {
  
      client = new Client({ user, host, database, password, port })
      client.connect()
  
      const sql = `
      select * 
      from information_schema."columns"
      where table_schema = '${schemaName}' 
      order by table_name;
      `
  
      console.error(`Getting metadata`)
      const res = await client.query(sql)
  
      const tables = _.uniq(res.rows.map(it => it.table_name))
        .map(tableName => ({
          name: tableName,
          fields: res.rows.filter(row => row.table_name === tableName)
        }))
        .filter(it => tableIgnore ? !it.name.match(tableIgnore) : true)
        // .filter(table=>table.fields.some(field=>field.column_default === "now()"))
        // .slice(0, 3)
      // console.error(tables)
  
      for (const table of tables) {
        console.error(`Sampling: ${table.name}`)
        
        const sample = await client.query(`select * from ${schemaName}."${table.name}" limit 3;`)
        table.samples = sample.rows

        const count = await client.query(`select count(*) from ${schemaName}."${table.name}";`)
        table.count = count.rows.length ? count.rows[0].count : 0

        const dateField = table.fields.find(field=>field.column_default === "now()")
        if (dateField) {
          const lastUpdated = await client.query(`select max("${dateField.column_name}") from ${schemaName}."${table.name}";`)
          table.lastUpdated = lastUpdated.rows.length ? lastUpdated.rows[0].max : ''  
        }
      }
  
      const data = { tables, schemaName }
  
      fs.writeFileSync('out.json', JSON.stringify(data, null, 4))
  
      return data
  
    } finally {
      if (client) client.end()
    }
  
  }