const name = 'messageMinimum'
const config = require('../../config.json')
const minimum = config.defaults.trackers[name].minimum
const record = require('./util/record.js')
const exportExcel = require('./util/exportExcel.js')
const exportChart = require('./util/exportChart.js')
const MemberCounter = require('../../util/MemberCounter.js')
const messageMinCounter = new MemberCounter(name, '1') // (methodName, postfix) parameters are to specify the table name for the counter, which is name + postfix
const getParams = require('../../util/getParams.js')

function exportData (msg, callback) {
  const exportSettings = {
    name: name,
    chartTitle: `${msg.guild.name}: Daily Members with Minimum of ${minimum} Messages Posted`,
    overrideMainCountName: 'Member Count',
    extraLabel: ['min']
  }

  let exportMethod = 'chart'
  const params = getParams(msg.content)
  exportSettings.maxPlots = params.getVal('maxplots')

  if (params.getVal('excel') === 'excel') exportExcel(msg.guild.id, exportSettings, callback)
  else exportChart(msg.guild.id, exportSettings, callback)
}

function recordTotalMembers (client, guildsMap, options, callback) {
  const trackerSettings = {
    name: name,
    guildsMap: guildsMap,
    mainCount: {
      method: function (guild) {
        let count = 0
        const msgTrackerData = messageMinCounter.counter
        for (var gID in msgTrackerData) {
          if (gID !== guild.id) continue
          const userCounts = msgTrackerData[gID]
          for (var uID in userCounts) if (userCounts[uID] >= minimum) ++count
        }
        return count
      },
      dataType: 'SMALLINT UNSIGNED'
    },
    miscDataColumns: ['min SMALLINT UNSIGNED'],
    miscData: function (guild) {
      return [minimum]
    }
  }

  record(client, trackerSettings, options, function (updatedGuilds) {
    if (updatedGuilds) { // Only update guilds who have passed the timeframe to be updated
      for (var x in updatedGuilds) {
        const guildID = updatedGuilds[x]
        if (messageMinCounter.counter[guildID]) messageMinCounter.delete(guildID)
      }
    }
    callback(updatedGuilds)
  })
}

exports.record = recordTotalMembers
exports.exportData = exportData
exports.name = name

exports.messageMinCounter = messageMinCounter
