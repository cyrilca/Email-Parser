'use strict'

var fs = require('fs')

var raw = fs.readFileSync(__dirname + '/mail.txt', 'utf-8')

var findBoundary = function(input, start, stop) {
  // finds boundary key
  var pattern = new RegExp(`${start}(.*)${stop}`, `ig`)
  var match = pattern.exec(input)
  if(match) return match[1]
  throw new Error('failed at find boundary step')
}

var boundary = findBoundary(raw, `boundary="`, `"`)

var removeAttachments = function(input, boundary) {
  // safe the RegExp
  boundary = boundary.replace('?', '\\?')
  var pattern = new RegExp(`--${boundary}([\\s\\S]*)`, 'ig')
  var match = input.match(pattern)
  if(match) {
    input = input.replace(match[0], '')
  }
  // remove This is ... message
  input = input.replace(/This is a multi(.*)/, '')
  return input
}

var splitIntoLines = function(input) {
  return input.split(/\r?\n/)
}

var mergeExceptFirst = function(arr, symbol) {
  arr = arr.slice(0)
  arr.shift()
  return arr.join(symbol)
}

var parseObject = function(lines) {
  var separator = ':'
  var latestKey
  var ensure = {}
  lines.forEach(function(cur, index) {
      var firstChar = cur.charCodeAt(0)
      if (cur.indexOf(separator) !== -1) {
          var split_line = cur.split(separator)
          if (split_line.length <= 2) {
              if (firstChar !== 32 && firstChar !== 9) {
                  ensure[split_line[0]] = split_line[1]
                  latestKey = split_line[0]
              } else {
                  ensure[latestKey] += cur
              }
          } else {
              if (firstChar !== 32 && firstChar !== 9) {
                  ensure[split_line[0]] = split_line[1]
                  latestKey = split_line[0]
              } else {
                  ensure[latestKey] += cur
              }
          }
      } else {
          ensure[latestKey] += cur
      }
  })

  return ensure

}

var findSubject = function(lines) {
  var keepRecording
  return lines.reduce(function(prev, cur) {
    var pair = cur.split(':')
    if(pair && pair.length > 1) {
      if(pair[0] === 'Subject') {
        keepRecording = true
        prev = pair[1]
      } else {
        keepRecording = false
      }
    } else {
      prev += cur
    }
    return prev
  }, '')
}

var cleanFromAttachments = removeAttachments(raw, boundary)

var lines = splitIntoLines(cleanFromAttachments)

var subject = findSubject(lines)

//
var out = subject.split(' ').reduce(function(prev, cur) {
  var pattern = new RegExp('=\\?UTF-8\\?B\\?(.*)\\?=', 'i')
  var match = pattern.exec(cur)
  var part = ''
  if(match) {
    part = new Buffer(match[1], 'base64').toString("utf-8")
  }
  return prev += part
}, '')


console.log("========Result===========")
console.log(out)
console.log("\n\n\n\n\n")

console.log("========Parsed headers===========")
var parsedObject = parseObject(lines)
console.log(parsedObject)
