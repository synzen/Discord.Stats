const name = 'totalUsers'
const record = require('./util/record.js')
const exportExcel = require('./util/exportExcel.js')
const exportChart = require('./util/exportChart.js')
const getParams = require('../../util/getParams.js')

function exportData (msg, callback) {
  const exportSettings = {
    name: name,
    chartTitle: `${msg.guild.name}: Daily Total Members`,
    overrideMainCountName: 'Member Count'
  }

  let exportMethod = 'chart'
  const params = getParams(msg.content)
  exportSettings.maxPlots = params.getVal('maxplots')

  if (params.getVal('export') === 'excel') exportExcel(msg.guild.id, exportSettings, callback)
  else exportChart(msg.guild.id, exportSettings, callback)
}

function recordTotalMembers (client, guildsMap, options, callback) {
  const trackerSettings = {
    name: name,
    guildsMap: guildsMap,
    mainCount: {
      method: function (guild) {
        return guild.memberCount
      },
      dataType: 'MEDIUMINT UNSIGNED'
    }
  }

  record(client, trackerSettings, options, callback)
}

exports.record = recordTotalMembers
exports.exportData = exportData
exports.name = name
