const name = 'netChange'
const record = require('./util/record.js')
const exportExcel = require('./util/exportExcel.js')
const exportChart = require('./util/exportChart.js')
const GuildCounter = require('../../util/GuildCounter.js')
const netChangeCounter = new GuildCounter(name, '1')  // (methodName, postfix) parameters are to specify the table name for the counter, which is name + postfix
const getParams = require('../../util/getParams.js')

function exportData (msg, callback) {
  const exportSettings = {
    name: name,
    chartTitle: `${msg.guild.name}: Net Change in Members`,
    overrideMainCountName: 'Net Change'
  }

  let exportMethod = 'chart'
  const params = getParams(msg.content)
  exportSettings.maxPlots = params.getVal('maxplots')

  if (params.getVal('excel') === 'excel') exportExcel(msg.guild.id, exportSettings, callback)
  else exportChart(msg.guild.id, exportSettings, callback)
}

function recordNetChange (client, guildsMap, options, callback) {
  const trackerSettings = {
    name: name,
    guildsMap: guildsMap,
    mainCount: {
      method: function (guild) {
        return netChangeCounter.counter[guild.id] ? netChangeCounter.counter[guild.id] : 0
      },
      dataType: 'TINYINT UNSIGNED'
    }
  }

  record(client, trackerSettings, options, function (updatedGuilds) {
    if (updatedGuilds) {
      for (var x in updatedGuilds) {
        const guildID = updatedGuilds[x]
        netChangeCounter.delete(guildID)
      }
    }
    callback(updatedGuilds)
  })
}

exports.record = recordNetChange
exports.exportData = exportData
exports.name = name

exports.netChangeCounter = netChangeCounter
