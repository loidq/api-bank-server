const isIpV4 = (ip) => {
	let ipv4_regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm

	return ipv4_regex.test(ip)
}

module.exports = {
	isIpV4,
}
