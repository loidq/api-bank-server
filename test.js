const sanitize = require('mongo-sanitize')
console.log(sanitize('{"$gt":""}'))
console.log('{"$gt":""}')
