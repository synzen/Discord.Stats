const name = 'onlineUsers'
const record = require('./util/record.js')
const exportExcel = require('./util/exportExcel.js')
const exportChart = require('./util/exportChart.js')
const getParams = require('../../util/getParams.js')

function exportData (msg, callback) {
  const exportSettings = {
    name: name,
    chartTitle: `${msg.guild.name}: Daily Online Members`,
    overrideMainCountName: 'Online Members'
  }

  let exportMethod = 'chart'
  const params = getParams(msg.content)
  exportSettings.maxPlots = params.getVal('maxplots')

  if (params.getVal('full')) {
    exportSettings.extraCounts = ['totalMembers']
    exportSettings.overrideExtraCountsNames = ['Total Members']
  }

  if (params.getVal('excel') === 'excel') exportExcel(msg.guild.id, exportSettings, callback)
  else exportChart(msg.guild.id, exportSettings, callback)
}

function recordOnlineMembers (client, guildsMap, options, callback) {
  const trackerSettings = {
    name: name,
    guildsMap: guildsMap,
    mainCount: {
      method: function (guild) {
        let c = 0
        guild.members.forEach(function (guildMember, userID) {
          if (guildMember.presence.status !== 'offline') ++c
        })
        return c
      },
      dataType: 'SMALLINT UNSIGNED'
    },
    otherCounts: {
      totalMembers: {
        method: function (guild) {
          return guild.memberCount
        },
        dataType: 'MEDIUMINT UNSIGNED'
      }
    }
  }

  record(client, trackerSettings, options, callback)
}

exports.record = recordOnlineMembers
exports.exportData = exportData
exports.name = name
