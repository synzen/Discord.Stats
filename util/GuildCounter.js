const config = require('../config.json')
const mysql = require('mysql')
const mysqlConfig = config.mysql

function GuildCounter (methodName, postfix) {
  if (!methodName || !postfix) throw new Error('No method name or postfix found for a guild counter')
  const tableName = methodName + postfix
  this.counter = {}
  const counter = this.counter

  this.delete = function (guildID) {
    delete this.counter[guildID]
  }

  this.increment = function (guildID) {
    if (typeof this.counter[guildID] !== 'number') this.counter[guildID] = 1
    else ++this.counter[guildID]
  }

  this.decrement = function (guildID) {
    if (this.counter[guildID] <= 0) delete this.counter[guildID]
    else if (typeof this.counter[guildID] === 'number') --this.counter[guildID]
  }

  this.save = function () {
    let totalGuilds = 0
    for (var i in counter) {
      ++totalGuilds
    }
    if (!totalGuilds) return

    const con = mysql.createConnection(mysqlConfig)
    con.connect(function (err) {
      if (err) return console.log(`Unable to connect to save GuildCounter data: `, err)
      createDb()
    })

    let finishedGuilds = 0

    function createDb () {
      con.query(`CREATE DATABASE IF NOT EXISTS ${config.databasePrefix}master`, function (err, results, fields) {
        if (!err) return createTable()
        con.end()
        console.log(`Unable to create database ${config.databasePrefix}master for GuildCounter data: `, err)
      })
    }

    function createTable () {
      con.query(`CREATE TABLE IF NOT EXISTS ${config.databasePrefix}master.${tableName} (guildid VARCHAR(30) PRIMARY KEY, count MEDIUMINT UNSIGNED)`, function (err, results) {
        if (!err) return updateTables()
        con.end()
        console.log(`Error creating table ${tableName} for GuildCounter data: `, err)
      })
    }

    function updateTables () {
      for (var guildID in counter) {
        con.query(`REPLACE INTO ${config.databasePrefix}master.${tableName} (guildid, count) VALUES (${guildID}, ${counter[guildID]})`, function (err, results) {
          finishGuild()
          if (!err) return
          console.log(`Error creating table replacing for GuildCounter data: `, err)
        })
      }
    }

    function finishGuild () {
      if (++finishedGuilds < totalGuilds) return
      con.query(`DELETE FROM ${config.databasePrefix}master.${tableName} WHERE count=0`, function (err, results) {
        con.end()
        if (!err) return
        console.log(`Error creating table replacing for GuildCounter data: `, err)
      })
    }
  }

  const con = mysql.createConnection(mysqlConfig)

  con.connect(function (err) {
    if (err) return console.log(`Unable to connect to save GuildCounter data: `, err)
    con.query(`SELECT * FROM ${config.databasePrefix}master.${tableName}`, function (err, results) {
      con.end()
      if (err) return
      for (var x in results) {
        const row = results[x]
        counter[row.guildid] = row.count
      }
    })
  })

  setInterval(this.save.bind(this), 300000)
}

module.exports = GuildCounter
