const { Client } = require('pg')
const pug = require('pug')
const _ = require('lodash')
const fs = require('fs')
require('dotenv').config()

;(async function() {

  let client

  try {

    client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    })
    
    client.connect()
    
    const sql = `select * from information_schema."columns" c 
    where table_schema = 'mrdexpress' 
    order by table_name;`
    
    const template = pug.compileFile('report.pug', { pretty: true })
    
    console.error(`Getting metadata`)
    const res = await client.query(sql)
     
    const schemaName = res.rows[0].table_schema
    const tables = _.uniq(res.rows.map(it=>it.table_name))
      .map(tableName=>({
        name: tableName,
        fields: res.rows.filter(row=>row.table_name === tableName)
      }))
      .filter(it=>!it.name.match(/(?:_\d|_bak|_old|_pre|backup_|temp_|cache|api)/))
      .slice(0, 3)
    // console.error(tables)

    for (const it of tables) {
      console.error(`Sampling: ${it.name}`)
      const sample = await client.query(`select * from ${schemaName}."${it.name}" limit 3;`)
      const count = await client.query(`SELECT reltuples FROM pg_class WHERE relname = '${it.name}' limit 1;`)
      it.samples = sample.rows
      it.count = count.rows.length ? count.rows[0].reltuples : 0
    }
    
    const data = { tables, schemaName }    
    const html = template(data)

    fs.writeFileSync('out.json', JSON.stringify(data, null, 4))
    
    console.log(html)

  
  } catch(err) {
    console.error(err)
  } finally {
    if (client) client.end()
  }

})()

