const mysql = require('mysql')
const config = require('../../../config.json')
const XLSXChart = require('xlsx-chart')
const moment = require('moment-timezone')
const fs = require('fs')
const mysqlConfig = config.mysql

function exportData (guildID, exportSettings, callback) {
  const name = exportSettings.name
  const chartTitle = exportSettings.chartTitle
  const extraLabel = exportSettings.extraLabel
  const extraCounts = exportSettings.extraCounts
  const overrideMainCountName = exportSettings.overrideMainCountName
  const overrideExtraCountsNames = exportSettings.overrideExtraCountsNames

  const con = mysql.createConnection(mysqlConfig)

  con.connect(function (err) {
    if (err) {
      con.end()
      return callback(err)
    }
    con.query(`SELECT * FROM ${config.databasePrefix}${guildID}.${name}`, function (err, results) {
      con.end()
      if (err) return callback(err)
      const fields = []
      const mainCountName = overrideMainCountName || 'count'
      const data = {}
      const titles = [mainCountName]
      data[mainCountName] = {chart: 'line'}

      for (var x in results) {
        const row = results[x]
        let timeMoment = moment(row.date)
        timeMoment = moment.tz(timeMoment, config.timezone)
        const date = timeMoment.format('M/D/YY')
        const time = timeMoment.format('HH:mm z')
        let addedData = '('
        if (Array.isArray(extraLabel)) {
          for (var q in extraLabel) if (row[extraLabel[q]]) addedData += `${extraLabel[q]}: ${row[extraLabel[q]]}\n`
        }
        addedData = addedData !== '(' ? addedData.trim() + ')' : ''
        const xLabel = `${date}\n${time}${addedData ? '\n' + addedData : ''}`
        if (fields.includes(date)) continue

        fields.push(xLabel)
        data[mainCountName][xLabel] = row.count
        if (Array.isArray(extraCounts)) {
          for (var p in extraCounts) {
            const extraCountName = extraCounts[p]
            const newExtraCountName = overrideExtraCountsNames[p]
            const extraCountDisplayName = newExtraCountName || extraCountName
            if (!row[extraCountName]) continue
            if (!data[extraCountDisplayName]) data[extraCountDisplayName] = {}
            data[extraCountDisplayName][xLabel] = row[extraCountName]
            data[extraCountDisplayName].chart = 'line'
            if (!titles.includes(extraCountDisplayName)) titles.push(extraCountDisplayName)
          }
        }

      }

      const opts = {
        titles: titles,
        fields: fields,
        data: data,
        chartTitle: chartTitle
      }

      const xlsxChart = new XLSXChart()

      xlsxChart.generate(opts, function (err, data) {
        if (err) return callback(err)
        try {
          fs.writeFileSync(`./exports/${name}.xlsx`, data)
        } catch (e) { return callback(e) }
        callback(null, `./exports/${name}.xlsx`)
      })
    })
  })
}

module.exports = exportData
