const mysql = require('mysql')
const config = require('../../../config.json')
const moment = require('moment-timezone')
const mysqlConfig = config.mysql
const ChartjsNode = require('chartjs-node')
const chartColors = require('../../../util/chartColors.js').point

function randomRGB () {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return {r: r, g: g, b: b}
}

const opts = {
  type: 'line',
  data: {
    labels: [],
    datasets: []
  },
  options: {
    title: {display: true, fontColor: 'white'},
    plugins: {
      beforeDraw: function (chartInstance) {
        const ctx = chartInstance.chart.ctx
        ctx.fillStyle = '#2C2F33'
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height)
      }
    },
    legend: {
      labels: {fontColor: 'white'}
    },
    scales: {
      yAxes: [{
        gridLines: {color: '#464b51'},
        ticks: {
          beginAtZero: true,
          fontColor: 'white'
        }
      }],
      xAxes: [{
        gridLines: {color: '#464b51'},
        ticks: {
          fontColor: 'white'
        }
      }]
    }
  }
}

function exportData (guildID, exportSettings, callback) {
  const name = exportSettings.name
  const chartTitle = exportSettings.chartTitle
  const extraLabel = exportSettings.extraLabel
  const extraCounts = exportSettings.extraCounts
  const overrideMainCountName = exportSettings.overrideMainCountName
  const overrideExtraCountsNames = exportSettings.overrideExtraCountsNames
  const maxPlots = parseInt(exportSettings.maxPlots, 10)

  const con = mysql.createConnection(mysqlConfig)

  con.connect(function (err) {
    if (err) {
      con.end()
      return callback(err)
    }
    con.query(`SELECT * FROM discordstats_${guildID}.${name}`, function (err, results) {
      con.end()
      if (err) return callback(err)
      const xLabels = []
      const mainCountName = overrideMainCountName || 'count'
      const datasets = []
      const mainCountRGB = chartColors[0]
      const mainCounterData = {label: mainCountName, data: [], borderColor: `rgb(${mainCountRGB.r}, ${mainCountRGB.g}, ${mainCountRGB.b})`, fill: false}
      const extraCounterDataTracker = {} // temporary
      let maxCount = 0

      if (typeof maxPlots === 'number') resizeArrayFromZero(results, maxPlots)

      for (var x in results) {
        const row = results[x]
        let timeMoment = moment(row.date)
        timeMoment = moment.tz(timeMoment, config.timezone)
        const date = timeMoment.format('M/D/YY')
        const time = timeMoment.format('HH:mm z')
        const extraLabelContainer = []

        if (Array.isArray(extraLabel)) {
          for (var q in extraLabel) {
            // if (row[extraLabel[q]]) extraLabelString += `${extraLabel[q]}: ${row[extraLabel[q]]})`
            if (row[extraLabel[q]]) extraLabelContainer.push(`(${extraLabel[q]}: ${row[extraLabel[q]]})`)
          }
        }
        const xLabel = [date, time].concat(extraLabelContainer.length === 0 ? [`(${row.count})`] : extraLabelContainer)// `${date}\n${time}${extraLabelString ? '\n' + extraLabelString : ''}`
        if (!xLabels.includes(date)) {
          xLabels.push(xLabel)
          mainCounterData.data.push(row.count)
          if (row.count > maxCount) maxCount = row.count
          // data[mainCountName][xLabel] = row.count
          if (Array.isArray(extraCounts)) {
            for (var p in extraCounts) {
              const extraCountName = extraCounts[p]
              const newExtraCountName = overrideExtraCountsNames[p]
              const extraCountDisplayName = newExtraCountName || extraCountName
              if (!row[extraCountName]) continue
              if (!extraCounterDataTracker[extraCountName]) extraCounterDataTracker[extraCountName] = {label: extraCountDisplayName, data: [row[extraCountName]], fill: false}
              else extraCounterDataTracker[extraCountName].data.push(row[extraCountName])
              if (row[extraCountName] > maxCount) maxCount = row[extraCountName]
            }
          }
        }
      }

      datasets.push(mainCounterData)
      let currentColorIndex = 1 // index 0 used by mainCount
      for (var i in extraCounterDataTracker) {
        const rgb = currentColorIndex >= chartColors.length ? randomRGB() : chartColors[currentColorIndex]
        extraCounterDataTracker[i].borderColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        datasets.push(extraCounterDataTracker[i])
        ++currentColorIndex
      }

      opts.data.labels = xLabels
      opts.data.datasets = datasets
      if (maxCount > 0) opts.options.scales.yAxes[0].ticks.max = maxCount * 1.25
      opts.options.title.text = chartTitle

      const chartNode = new ChartjsNode(1200, 600)
      return chartNode.drawChart(opts)
      .then(() => {
        return chartNode.getImageBuffer('image/png')
      })
      .then(buffer => {
        return chartNode.getImageStream('image/png')
      })
      .then(streamResult => {
        return chartNode.writeImageToFile('image/png', `./exports/${name}.png`)
      })
      .then(() => {
        chartNode.destroy()
        callback(null, `./exports/${name}.png`)
      }).catch(err => callback(err))
    })
  })
}

function resizeArrayFromZero(array, len) {
  while (array.length > len) {
    array.shift()
  }
}

module.exports = exportData
