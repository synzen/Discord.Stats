const ChartjsNode = require('chartjs-node')
const chartColors = require('../../../util/chartColors.js').fill

function randomRGB () {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return {r: r, g: g, b: b}
}

const opts = {
  type: 'doughnut',
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
        display: false,
        ticks: {
          beginAtZero: true
        }
      }],
      xAxes: []
    }
  }
}

function exportData (exportSettings, callback) {
  const name = exportSettings.name
  const chartTitle = exportSettings.chartTitle
  const data = exportSettings.data
  const labels = []
  const datasets = [{data: [], backgroundColor: [], borderColor: []}]
  let currentColorIndex = 0

  for (var dataName in data) {
    if (labels.includes(dataName)) continue
    labels.push(dataName)
    datasets[0].data.push(data[dataName])
    const color = currentColorIndex >= chartColors.length ? randomRGB() : chartColors[currentColorIndex]
    const fillColor = `rgba(${color.r}, ${color.g}, ${color.b}, .2)`
    datasets[0].backgroundColor.push(fillColor)
    datasets[0].borderColor.push(`rgb(${color.r + 25}, ${color.g + 25}, ${color.b + 25})`)
    ++currentColorIndex
  }

  opts.data.datasets = datasets
  opts.data.labels = labels
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
}

module.exports = exportData
