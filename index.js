/*
* @Author: d4r
* @Date:   2018-07-09 02:01:53
* @Last Modified by:   d4r
* @Last Modified time: 2018-07-09 22:38:42
*/

const Xray = require('x-ray')

const url = 'https://www.goodreads.com/shelf/show/buku-indonesia'

const x = Xray({
  filters: {
    trim: function (value) {
      return typeof value === 'string' ? value.trim() : value
    },
    reverse: function (value) {
      return typeof value === 'string' ? value.split('').reverse().join('') : value
    },
    slice: function (value, start , end) {
      return typeof value === 'string' ? value.slice(start, end) : value
    },
    replace: function (value, val, withval) {
    	if(!withval) withval = ''
    	return typeof value === 'string' ? value.replace(val, withval): value
    },
    extractPublish: function (value, type) {
    	if (typeof value !== 'string') return value
    	const [published, publisher] = value.split('by')
    	switch (type) {
    		case 'published': 
    			return published.replace('Published', '')
    			break;
    		case 'publisher':
    		default:
    			return publisher
    	}
    }
  }
})
.throttle(4, '1s')

x(url, '.elementList', [{
	title: x('a.bookTitle'),
	details: x('a.bookTitle@href', {
			title: '#bookTitle',
			author: '#bookAuthors a.authorName > span',
			author_link: '#bookAuthors a.authorName@href',
			cover: '#coverImage@src',
			description: '#description > span:nth-of-type(1)',
			page: '#details span[itemprop=numberOfPages] | replace:pages | trim',

			// experimental
			meta: x('#bookDataBox .clearFloats', [{
				key: '.infoBoxRowTitle',
				value: '.infoBoxRowItem'
			}]),
				
			published: '#details > .row:nth-of-type(2) | extractPublish:published | trim',
			publisher: '#details > .row:nth-of-type(2) | extractPublish:publisher | trim',

			// header: x('#details > .row', [{
			// 	key: 'span:nth-of-type(0)',
			// 	val: 'span:nth-of-type(1)'
			// }]) ,
			// data: x('#bookDataBox > .clearFloats', [{
			// 	key: '.infoBoxRowTitle',
			// 	value: 'infoBoxRowItem'
			// }])
		}
	)
}])
.then(function (res) {
	if(typeof res.reduce != 'function') return res
	const data = res
		.reduce(
			function (acc, curr) {
				const {
					details: {
						meta
					}
				} = curr
				if(!meta) return acc
				meta.map(function (x) {
					const {
						key,value
					} = x
					const newKey = createKey(key)
					curr[newKey] = value
				})
				acc.push(curr)
				return acc
			},
			[]
		)
	return res
})
// .write('buku_indonesia.json')

function createKey (str) {
	if(typeof str !== 'string') return str
	return str.toLowerCase().trim().replace(' ','_')
}
