const exportChart = require('./util/exportChart.js')
const Discord = require('discord.js')
const getParams = require('../../util/getParams.js')
const name = 'game'

function gameData (client, msg) {
  let showNoGame = false
  const params = getParams(msg.content)
  if (params.getVal('full')) showNoGame = true

  const guildMembers = msg.guild.members

  let online = 0
  let totalPlaying = 0
  let nonePlaying = 0
  const gameCounts = {}
  const sortableGameCounts = []
  const sortedGameCounts = {}

  guildMembers.forEach(function (member, id) {
    if (member.user.bot) return
    const presence = member.presence
    if (presence.status !== 'offline') ++online
    const game = presence.game
    if (!game) return ++nonePlaying
    ++totalPlaying
    if (!gameCounts[game.name]) gameCounts[game.name] = {name: game.name, count: 1}
    else ++gameCounts[game.name].count
  })

  for (var n in gameCounts) {
    sortableGameCounts.push(gameCounts[n])
  }

  let miscGames = 0
  sortableGameCounts.sort(function (a, b) { return b.count - a.count })

  while (sortableGameCounts.length > 10) {
    const lastIndex = sortableGameCounts.length - 1
    miscGames += sortableGameCounts[lastIndex].count
    sortableGameCounts.splice(lastIndex, 1)
  }

  for (var u in sortableGameCounts) {
    const game = sortableGameCounts[u]
    sortedGameCounts[game.name + ` (${game.count})`] = game.count
  }

  if (miscGames > 0) sortedGameCounts[`Other (${miscGames})`] = miscGames
  if (showNoGame && nonePlaying > 0) sortedGameCounts[`Nothing (${nonePlaying})`] = nonePlaying

  const exportSettings = {
    name: name,
    data: sortedGameCounts,
    chartTitle: `${msg.guild.name}: Games Being Played`
  }

  exportChart(exportSettings, function (err, fileName) {
    if (err) return console.log(err)
    const embed = new Discord.RichEmbed()
    embed.setAuthor(`Games Being Played`, client.user.avatarURL)
    .setColor('#2C2F33')
    .setTimestamp()
    .setDescription(`Out of ${online} online members (excluding bots), ${totalPlaying} (${(totalPlaying / online * 100).toFixed(2)}%) are currently playing a game.\n\u200b\n`)
    .attachFile(fileName)
    .setImage(`attachment://${fileName.replace('./exports/', '')}`)

    for (var gameName in sortedGameCounts) {
      embed.addField(gameName, (sortedGameCounts[gameName] / totalPlaying * 100).toFixed(2) + '%', true)
    }

    msg.channel.send('', {embed})
  })
}
module.exports = gameData
