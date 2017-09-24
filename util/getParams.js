function params (string) {
  const arr = string.split('-')
  const paramList = new ParamList()

  for (var x in arr) {
    if (string.startsWith('-') && x === '0') continue;
    const param = arr[x].trim()
    const paramDetails = param.split('=')
    const paramName = paramDetails[0]
    if (paramDetails.length === 1) paramList.insert(paramName)
    else paramList.insert(paramName, paramDetails[1])
  }

  return paramList
}

function ParamList () {
  const list = {}

  this.getVal = function (name) {
    for (var pName in list) {
      if (name === pName) return list[pName]
    }
    return null
  }

  this.insert = function (name, val) {
    list[name] = val ? val : name
  }
}

module.exports = params
