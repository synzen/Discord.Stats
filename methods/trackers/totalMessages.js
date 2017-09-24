const name = 'totalMessages'
const record = require('./util/record.js')
const exportExcel = require('./util/exportExcel.js')
const exportChart = require('./util/exportChart.js')
const GuildCounter = require('../../util/GuildCounter.js')
const totalMessagesCounter = new GuildCounter(name, '1')  // (methodName, postfix) parameters are to specify the table name for the counter, which is name + postfix
const getParams = require('../../util/getParams.js')

function exportData (msg, callback) {
  const exportSettings = {
    name: name,
    chartTitle: `${msg.guild.name}: Total Messages`,
    overrideMainCountName: 'Message Count'
  }

  let exportMethod = 'chart'
  const params = getParams(msg.content)
  exportSettings.maxPlots = params.getVal('maxplots')

  if (params.getVal('excel') === 'excel') exportExcel(msg.guild.id, exportSettings, callback)
  else exportChart(msg.guild.id, exportSettings, callback)
}

function recordtotalMessages (client, guildsMap, options, callback) {
  const trackerSettings = {
    name: name,
    guildsMap: guildsMap,
    mainCount: {
      method: function (guild) {
        return totalMessagesCounter.counter[guild.id] ? totalMessagesCounter.counter[guild.id] : 0
      },
      dataType: 'INT UNSIGNED'
    }
  }

  record(client, trackerSettings, options, function (updatedGuilds) {
    if (updatedGuilds) {
      for (var x in updatedGuilds) {
        const guildID = updatedGuilds[x]
        totalMessagesCounter.delete(guildID)
      }
    }
    callback(updatedGuilds)
  })
}

exports.record = recordtotalMessages
exports.exportData = exportData
exports.name = name

exports.totalMessagesCounter = totalMessagesCounter
