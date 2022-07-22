function info(logText) {
	console.log(`${new Date()}info:::::${logText}`)
}
function debug(logText) {
	console.log(`${new Date()}debug:::::${logText}`)
}
function error(logText) {
	console.log(`${new Date()}error:::::${logText}`)
}

module.exports = {
	info,
	debug,
	error,
}
