const axios = require('axios')

axios
	.post(
		'http://localhost:3000',
		{ data: 12 },
		{
			validateStatus: () => true,

			timeout: 4000,
		}
	)
	.then((res) => {
		console.log(res)
	})
	.catch()
