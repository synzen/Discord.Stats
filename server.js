const Discord = require('discord.js')
const client = new Discord.Client({fetchAllMembers: true})
const totalUsers = require('./methods/trackers/totalUsers.js')
const onlineUsers = require('./methods/trackers/onlineUsers.js')
const messageMinimum = require('./methods/trackers/messageMinimum.js')
const messageMinCounter = messageMinimum.messageMinCounter
const netChange = require('./methods/trackers/netChange.js')
const netChangeCounter = netChange.netChangeCounter
const totalMessages = require('./methods/trackers/totalMessages.js')
const totalMessagesCounter = totalMessages.totalMessagesCounter
const Tracker = require('./util/Tracker.js')
const resetGuilds = require('./util/reset.js')
const config = require('./config.json')
const fs = require('fs')
const trackers = []
if (!config.timezone) config.timezone = 'UTC'

const cMethods = {}
const cMethodsConfig = config.defaults.current
for (var cMethodName in cMethodsConfig) {
  try {
    cMethods[cMethodName] = {
      method: require(`./methods/current/${cMethodName}.js`),
      command: cMethodsConfig[cMethodName].command
    }
  } catch (e) {}
}

if (!fs.existsSync('./exports')) fs.mkdirSync('./exports');

client.once('ready', function () {
  console.log(`Logged in as ${client.user.tag}!`)

  trackers.push(new Tracker(client, totalUsers))
  trackers.push(new Tracker(client, onlineUsers))
  trackers.push(new Tracker(client, messageMinimum))
  trackers.push(new Tracker(client, netChange))
  trackers.push(new Tracker(client, totalMessages))
})

client.on('message', function (msg) {
  if (!msg.member || msg.author.bot) return

  for (var x in trackers) {
    if (trackers[x].checkCommand(msg)) return
  }

  for (var t in cMethods) {
    if (msg.content.startsWith(cMethods[t].command)) return cMethods[t].method(client, msg)
  }

  if (msg.content.startsWith('reset_stats')) {
    const msgArr = msg.content.split(' ')
    msgArr.shift()
    const guildIDs = []
    for (var x in msgArr) guildIDs.push(msgArr[x].trim())

    resetGuilds(client, guildIDs, function(err) {
      if (err) return console.log(err)
      msg.reply('Done.')
      for (var x in trackers) {
        trackers[x].restart()
      }
    })
  }

  totalMessagesCounter.increment(msg.guild.id)
  messageMinCounter.increment(msg.guild.id, msg.author.id)
})

client.on('guildMemberAdd', function (member) {
  netChangeCounter.increment(member.guild.id)
})

client.on('guildMemberRemove', function (member) {
  netChangeCounter.decrement(member.guild.id)
})

client.login(config.token)
