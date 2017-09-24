const exportChart = require('./util/exportChart.js')
const Discord = require('discord.js')
const name = 'roles'

function gameData (client, msg) {
  const roleCounts = {}
  const sortedRoleCounts = {}
  const guildMembers = msg.guild.members
  let noRoles = 0
  let bots = 0
  guildMembers.forEach(function (member, userID) {
    if (member.user.bot) return ++bots
    const roles = member.roles
    if (roles.size === 1 && roles.find('name', '@everyone')) return ++noRoles
    roles.forEach(function (role, roleID) {
      if (role.name === '@everyone') return
      if (!roleCounts[roleID]) roleCounts[roleID] = {name: role.name, count: 1}
      else ++roleCounts[roleID].count
    })
  })

  let otherRoles = 0
  const sortableRoleCounts = []
  for (var x in roleCounts) {
    sortableRoleCounts.push(roleCounts[x])
  }

  sortableRoleCounts.sort(function (a, b) { return b.count - a.count })

  while (sortableRoleCounts.length > 10) {
    const lastIndex = sortableRoleCounts.length - 1
    otherRoles += sortableRoleCounts[lastIndex].count
    sortableRoleCounts.splice(lastIndex, 1)
  }

  for (var y in sortableRoleCounts) {
    const role = sortableRoleCounts[y]
    sortedRoleCounts[role.name + ` (${role.count})`] = role.count
  }

  if (otherRoles > 0) sortedRoleCounts[`Other (${otherRoles})`] = otherRoles
  if (noRoles > 0) sortedRoleCounts[`No Role (${noRoles})`] = noRoles
  const exportSettings = {
    name: name,
    data: sortedRoleCounts,
    chartTitle: `${msg.guild.name}: Role Frequency`
  }

  const memberCount = msg.guild.memberCount - bots
  exportChart(exportSettings, function (err, fileName) {
    if (err) return console.log(err)
    const embed = new Discord.RichEmbed()
    embed.setAuthor(`Role Frequency`, client.user.avatarURL)
    .setColor('#2C2F33')
    .setTimestamp()
    .setDescription(`Out of ${memberCount} total members (excluding bots), ${memberCount - noRoles} (${((memberCount - noRoles) / memberCount * 100).toFixed(2)}%) has at least one custom role.\n\u200b\n`)
    .attachFile(fileName)
    .setImage(`attachment://${fileName.replace('./exports/', '')}`)

    for (var roleName in sortedRoleCounts) {
      embed.addField(roleName, (sortedRoleCounts[roleName] / memberCount * 100).toFixed(2) + '%', true)
    }
    
    msg.channel.send('', {embed})
  })
}
module.exports = gameData
