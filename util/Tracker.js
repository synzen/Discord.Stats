const config = require('../config.json')

function Tracker (client, method, options) {
  const intervalHrs = typeof options === 'object' && typeof options.intervalHrs === 'number' ? options.intervalHrs : config.defaults.trackers[method.name].intervalHrs
  const intervalMs = intervalHrs / 10 * 3600000
  const configDefaults = config.defaults.trackers[method.name]

  let lastUpdated = {}
  this.exportData = method.exportData

  this.checkCommand = function (msg) {
    if (msg.content.startsWith(configDefaults.command)) {
      method.exportData(msg, function (err, fileName) {
        if (err) return console.log(err)
        msg.channel.send('', {file: fileName})
      })
      return true
    }
  }

  this.run = function (callback) {
    method.record(client, client.guilds, options, function (err, updatedGuilds) {
      if (err) console.log(`Error executing method ${method.name}: `, err)
      if (updatedGuilds) {
        for (var x in updatedGuilds) {
          lastUpdated[updatedGuilds[x]] = new Date()
        }
      }
      if (typeof callback === 'function') callback()
    })
  }

  function cycle () {
    const now = new Date()
    let passedInterval = true
    client.guilds.forEach(function (guild, guildID) {
      const diff = Math.abs(lastUpdated[guildID] - now)
      if (diff < intervalHrs * 0.95 * 3600000) passedInterval = false
    })
    if (!passedInterval) return
    this.run(function () {
    })
  }

  this.restart = function () {
    clearInterval(repeat)
    lastUpdated = {}
    setInterval(cycle.bind(this), intervalMs)
    console.log(`Tracker ${method.name} has been restarted`)
  }

  const repeat = setInterval(cycle.bind(this), intervalMs)
  this.run(function () {
    console.log(`Finished initial method ${method.name}`)
  })

  console.log(`Tracker ${method.name} has been initialized`)
}

module.exports = Tracker
