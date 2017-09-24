const mysql = require('mysql')
const config = require('../config.json')
const mysqlConfig = config.mysql

function reset (client, guildID, callback) {
  const con = mysql.createConnection(mysqlConfig)

  con.connect(function (err) {
    if (err) {
      console.info(`Reset Error: Unable to connect to database: `, err)
      return
    }
    if (guildID) {
      if (!Array.isArray(guildID)) {
        return con.query(`DROP DATABASE IF EXISTS ${config.databasePrefix}${guildID}`, function (err, results) {
          con.end()
          if (typeof callback === 'function') {
            if (err) callback(err)
            else callback()
          }
        })
      } else {
        let completed = 0
        for (var q in guildID) {
          con.query(`DROP DATABASE IF EXISTS ${config.databasePrefix}${guildID[q]}`, function (err, results) {
            if (err) console.log(`Reset Error: Unable to drop guild database '${guildID[q]}': `, err)
            if (++completed !== guildID.length) return
            con.end()
            if (typeof callback === 'function') {
              if (err) callback(err)
              else callback()
            }
          })
        }
        return
      }
    }
    const escapedDbPrefix = config.databasePrefix.replace('%', '\\%').replace('_', '\\_')
    con.query(`SELECT CONCAT('DROP DATABASE ',schema_name,' ;') AS stmt FROM information_schema.schemata WHERE schema_name LIKE '${escapedDbPrefix}%' ORDER BY schema_name`, function (err, results) {
      if (err) {
        if (typeof callback === 'function') callback(err)
        return con.end()
      }
      const totalQueries = results.length
      let completed = 0
      if (totalQueries === 0) {
        con.end()
        return callback()
      }
      for (var x in results) {
        con.query(results[x].stmt, function (err, results) {
          if (err) console.log(`Reset Error: Unable to execute query '${results[x].stmt}': `, err)
          if (++completed !== totalQueries) return
          con.end()
          callback()
        })
      }
    })


  })
  let guildsFinished = 0
}

module.exports = reset
