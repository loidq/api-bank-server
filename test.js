const axios = require('axios')
const Error = require('../models/Error')
const postAxios = async (url, data, headers, proxy = null) => {
	let response = await axios.post(url, data, {
		headers,
		validateStatus: () => true,
		httpsAgent: proxy,
	})
	if (response.status != 200) {
		await Error.find
	}
}
postAxios('http://localhost:3000')
