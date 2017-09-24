const mysql = require('mysql')
const config = require('../../../config.json')
const databasePrefix = config.databasePrefix
const mysqlConfig = config.mysql

function recordMembers (client, trackerSettings, options, callback) {
  const guildsMap = trackerSettings.guildsMap
  const mainCount = trackerSettings.mainCount.method
  const otherCounts = trackerSettings.otherCounts
  const trackerName = trackerSettings.name
  const countDataType = trackerSettings.mainCount.dataType ? trackerSettings.mainCount.dataType : 'INT UNSIGNED'

  if (typeof options === 'object' && typeof options.intervalHrs === 'number') config.defaults.trackers[trackerName].intervalHrs = options.intervalHrs
  let intervalHrs = config.defaults.trackers[trackerName].intervalHrs
  if (!intervalHrs) intervalHrs = 24
  const maxPlots = typeof config.defaults.trackers[trackerName].maxPlots === 'number' ? config.defaults.trackers[trackerName].maxPlots : 30

  const con = mysql.createConnection(mysqlConfig)

  con.connect(function (err) {
    if (err) return typeof callback === 'function' ? callback(err) : null
    processGuilds()
  })

  con.on('error', function (err) {
    console.info(`CONNECTION ERRROR! `, err)
  })

  let guildsFinished = 0
  const updatedGuilds = []

  function finishGuild (guildID, updated) {
    if (updated) updatedGuilds.push(guildID)
    if (++guildsFinished === client.guilds.size) {
      if (typeof callback === 'function') callback(null, updatedGuilds)
      con.end()
    }
  }

  function processGuilds () {
    guildsMap.forEach(function (guild, guildID) {
      let count = 0
      if (typeof mainCount === 'function') count = mainCount(guild)
      else count = mainCount

      const additionalColumns = trackerSettings.miscDataColumns
      let additionalColumnData = []
      if (typeof trackerSettings.miscData === 'function') additionalColumnData = trackerSettings.miscData(guild)
      let additionalColumnsNames = ''
      let additionalColumnsQuery = ''
      if (Array.isArray(additionalColumns)) {
        for (var y in additionalColumns) {
          additionalColumnsQuery += `, ${additionalColumns[y]}`
          additionalColumnsNames += `, ${additionalColumns[y].split(' ')[0]}` // The data type of the column is unneeded
        }
      }
      let additionalInsertQuery = ''
      for (var t in additionalColumnData) additionalInsertQuery += `, ${additionalColumnData[t]}`

      if (otherCounts) {
        for (var otherCountName in otherCounts) {
          const otherCount = otherCounts[otherCountName].method(guild)
          additionalColumnsQuery += `, ${otherCountName} ${otherCounts[otherCountName].dataType}`
          additionalColumnsNames += `, ${otherCountName}`
          additionalInsertQuery += `, ${otherCount}`
        }
      }

      const table = `${databasePrefix}${guildID}.${trackerName}`

      con.query(`CREATE DATABASE IF NOT EXISTS ${databasePrefix}${guildID}`, function (err, results, fields) {
        if (err) {
          console.log(`Error creating database ${databasePrefix}${guildID} for ${trackerName}: `, err)
          return finishGuild(guildID, false)
        }
        createTable()
      })

      function createTable () {
        con.query(`CREATE TABLE IF NOT EXISTS ${table} (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, date DATETIME, count ${countDataType} ${additionalColumnsQuery})`, function (err, results) {
          if (err) {
            console.log(`Error creating ${table} for ${trackerName}: `, err)
            return finishGuild(guildID, false)
          }
          select()
        })
      }

      function select () {
        con.query(`SELECT * FROM ${table} WHERE id = (SELECT MAX(id) from ${table}) UNION SELECT * FROM ${table} WHERE id = (SELECT MIN(id) from ${table})`, function (err, results) {
          if (err) {
            console.log(`Error creating ${table} for ${trackerName}: `, err)
            return finishGuild(guildID, false)
          }
          if (results.length === 0) insert()
          else {
            const newestRecord = results[0]
            const oldestRecord = results[1]

            if (results.length === 1 || newestRecord.id - oldestRecord.id < maxPlots) {
              const diff = Math.abs((new Date()) - newestRecord.date)
              if (diff < intervalHrs * 0.95 * 3600000) return finishGuild(guildID, false)
              insert()
            } else cleanup(oldestRecord, newestRecord)
          }
        })
      }

      function insert () {
        con.query(`INSERT INTO ${table} (date, count${additionalColumnsNames}) values (NOW(), ${count}${additionalInsertQuery})`, function (err, results) {
          finishGuild(guildID, !err)
          if (err) console.log(`Error inserting into ${table} for ${trackerName}: `, err)
        })
      }

      function cleanup (oldestRecord, newestRecord) {
        con.query(`DELETE FROM ${table} WHERE id BETWEEN ${oldestRecord.id} AND ${newestRecord.id - maxPlots - 1}`, function (err, results) { // minus an additional one for new insert
          if (err) console.log(`Error deleting from ${table} for ${trackerName}: `, err)
          insert()
        })
      }
    })
  }
}

module.exports = recordMembers
