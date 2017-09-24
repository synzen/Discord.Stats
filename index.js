const totalUsers = require('./methods/trackers/totalUsers.js')
const onlineUsers = require('./methods/trackers/onlineUsers.js')
const messageMinimum = require('./methods/trackers/messageMinimum.js')
const Tracker = require('./util/Tracker.js')
const resetGuilds = require('./util/reset.js')
const config = require('./config.json')
const trackers = []

module.exports = function (client, options) {
  if (!client.options.fetchAllMembers) throw 'Did not fetch all members'
  config.timezone = options.timezone ? options.timezone : config.timezone
  config.mysql = options.mysql

  trackers.push(new Tracker(client, totalUsers))
  trackers.push(new Tracker(client, onlineUsers))
  trackers.push(new Tracker(client, messageMinimum))

  client.on('message', function (msg) {
    if (!msg.member || msg.author.bot) return
    if (msg.content === 'onlineusers_stats') {
      onlineUsers.export(msg.guild.id, function (err, fileName) {
        if (err) return console.log(err)
        msg.channel.send('', {file: fileName})
      })
    } else if (msg.content === 'totalusers_stats') {
      totalUsers.export(msg.guild.id, function (err, fileName) {
        if (err) return console.log(err)
        msg.channel.send('', {file: fileName})
      })
    } else if (msg.content === 'msgmin_stats') {
      messageMinimum.export(msg.guild.id, function (err, fileName) {
        if (err) return console.log(err)
        msg.channel.send('', {file: fileName})
      })
    } else if (msg.content === 'reset_stats') {
      resetGuilds(client, null, function () {
        msg.reply('Done.')
        for (var x in trackers) {
          trackers[x].restart()
        }
      })
    } else messageMinimum.messageTracker.increment(msg.guild.id, msg.author.id)
  })
}
