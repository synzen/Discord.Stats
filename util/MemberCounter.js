const config = require('../config.json')
const mysql = require('mysql')
const mysqlConfig = config.mysql


function MemberCounter (methodName, postfix) {
  if (!methodName || !postfix) throw new Error('No method name or postfix found for a guild counter')
  const tableName = methodName + postfix
  this.counter = {}
  const counter = this.counter

  // Initialize with saved data if exists
  const con = mysql.createConnection(mysqlConfig)
  con.connect(function (err) {
    if (err) return console.log(`Unable to connect to save MemberCounter data: `, err)
    con.query(`SELECT * FROM ${config.databasePrefix}master.${tableName}`, function (err, results) {
      con.end()
      if (err) return
      for (var x in results) {
        const row = results[x]
        if (!counter[row.guildid]) counter[row.guildid] = {}
        counter[row.guildid][row.userid] = row.count
      }
    })
  })

  this.delete = function (guildID) {
    delete this.counter[guildID]
  }

  this.increment = function (guildID, userID) {
    if (typeof this.counter[guildID] !== 'object') this.counter[guildID] = {}
    if (typeof this.counter[guildID][userID] !== 'number') this.counter[guildID][userID] = 1
    else ++this.counter[guildID][userID]
  }

  this.save = function () {
    let totalMembers = 0
    for (var i in counter) {
      for (var q in counter[i]) {
        ++totalMembers
      }
    }
    if (!totalMembers) return
    const con = mysql.createConnection(mysqlConfig)
    con.connect(function (err) {
      if (err) return console.log(`Unable to connect to save MemberCounter data: `, err)
      createDb()
    })

    let finishedMembers = 0

    function createDb () {
      con.query(`CREATE DATABASE IF NOT EXISTS ${config.databasePrefix}master`, function (err, results, fields) {
        if (!err) return createTable()
        con.end()
        console.log(`Unable to create database ${config.databasePrefix}master for MemberCounter data: `, err)
      })
    }

    function createTable () {
      con.query(`CREATE TABLE IF NOT EXISTS ${config.databasePrefix}master.${tableName} (userid VARCHAR(30) PRIMARY KEY, guildid VARCHAR(30), count MEDIUMINT UNSIGNED)`, function (err, results) {
        if (!err) return updateTables()
        con.end()
        console.log(`Error creating table ${tableName} for MemberCounter data: `, err)
      })
    }

    function updateTables () {
      for (var guildID in counter) {
        const currentCounter = counter[guildID]
        for (var userID in currentCounter) {
          con.query(`REPLACE INTO ${config.databasePrefix}master.${tableName} (userid, guildid, count) VALUES (${userID}, ${guildID}, ${currentCounter[userID]})`, function (err, results) {
            finishMember()
            if (!err) return
            console.log(`Error creating table replacing for MemberCounter data: `, err)
          })
        }
      }
    }

    function finishMember () {
      if (++finishedMembers < totalMembers) return
      con.query(`DELETE FROM ${config.databasePrefix}master.${tableName} WHERE count=0`, function (err, results) {
        con.end()
        if (!err) return
        console.log(`Error creating table replacing for MemberCounter data: `, err)
      })
    }
  }

  setInterval(this.save.bind(this), 300000)
}

module.exports = MemberCounter
