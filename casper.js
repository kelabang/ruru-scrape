phantom.casperTest = true;

var system = require('system')
var fs = require('fs')

var casper = require('casper').create({
    verbose: false,
    logLevel: 'debug',
    pageSettings: {
        loadImages: true,
        loadPlugins: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
    }
})


const url = 'https://www.goodreads.com/'

// print out all the messages in the headless browser context
casper.on('remote.message', function(msg) {
    console.log('remote message caught: ' + msg);
});

// print out all the messages in the headless browser context
casper.on("page.error", function(msg, trace) {
    console.log("Page Error: " + msg, "ERROR");
    
});

var current = 1
var context = null

context = casper.start()

normal()

context
        .thenOpen(url, function () {
            console.log('website '+ url+' is openend')
        })

    casper.then(function () {
        console.log('login using username and password')
        this.evaluate(function () {
            const USERNAME = 'imam.tauhid.dar@gmail.com'
            const PASSWORD = 'imam0tauhid'
            document.getElementById('userSignInFormEmail').value = USERNAME
            document.getElementById('user_password').value = PASSWORD
            document.querySelector('input.gr-button.gr-button--dark').click()
        })
    })

function normal () {

    console.log('lets runnn')

    // casper.then(function () {
    //     this.capture('after_login.png')
    // })

    var url2 = "https://www.goodreads.com/list/show/39490.Kumpulan_Cerpen_Indonesia_Terbaik"

    casper.then(function () {
        var title = this.evaluate(function() {
            return document.title;
        })

        console.log('Page title is: ' + title, 'INFO'); // Will be printed in green on the console
        if(current > 1) url2 = url2+'?page='+current
        this.thenOpen(url2, function () {
            console.log('website '+url2+' is opened')
            this.waitForSelector('table.tableList');
        })
        
    })

    // This part can be done nicer, but it's the way it should work ...
    var output = null
    casper.then(function() {
        output = casper.evaluate(function () {
            
            var tableRow = document.querySelectorAll('table.tableList tbody tr')
            length = tableRow.length;
            console.log("table length: " + length);
            var _output = []
            for (var i = 0; i < length; i++) {
                console.log('loop i ', i)
                var el = tableRow[i]
                var box = el.childNodes[5]
                var boxImage = el.childNodes[3]
                var title = box.querySelectorAll('a.bookTitle')[0].innerText
                var author = box.querySelectorAll('a.authorName > span')[0].innerText
                var urlimage = boxImage.querySelectorAll('img')[0].src
                var urldetail = box.querySelectorAll('a.bookTitle')[0].href

                console.log('::-- title ', title)
                console.log('::-- author ', author)
                console.log('::-- urlimage', urlimage)
                console.log('::-- urldetail', urldetail)

                _output.push({title:title, author:author, urlimage:urlimage, urldetail:urldetail})
                
            } 
            return _output
        })
        
        
    });
    // detail page
    casper.then(function () {
        this.each(output,function (self, item) {
            var urldetail = item.urldetail 
            var details = null
            self.thenOpen(urldetail, function () {
                details = {}
                details['title'] = this.evaluate(function () {
                    return document.title
                })
                details['description'] = this.evaluate(function () {
                    var $description = document.getElementById('description')
                    var $span = $description.querySelectorAll('span')
                    var text = ''
                    if($span.length > 1) 
                        text = $span[1].innerText
                    else
                        text = $span[0].innerText
                    return text
                })
                details['numberofpages'] = this.evaluate(function () {
                    var $details = document.getElementById('details')
                    var $rowdetails = $details.querySelectorAll('.row')
                    return $rowdetails[0].querySelectorAll('span[itemprop="numberOfPages"]')[0].innerText
                })
                details['detailpub'] = this.evaluate(function () {
                    var $details = document.getElementById('details')
                    var $rowdetails = $details.querySelectorAll('.row')
                    return $rowdetails[1].innerText
                })
                details['detaildatabox'] = this.evaluate(function () {
                    var $clearFloats = document.querySelectorAll('#bookDataBox > .clearFloats')
                    var out = []
                    for (var i = 0, $item; $item = $clearFloats[i]; i++) {
                        console.log('ini item', $item)
                        var $key = $item.querySelector('.infoBoxRowTitle')
                        var $value = $item.querySelector('.infoBoxRowItem')
                        out.push(
                            {
                                'key': $key.innerText,
                                'value': $value.innerText
                            }
                        )
                    }
                    return out
                })
                console.log('working with url : '+urldetail)
                // console.log('details of page : ', details.numberofpages, 'INFO')
                item['details'] = details
                // if(details.title) console.log('Page title is: ' + details.title, 'INFO'); // Will be printed in green on the console
            })

        })

    })

    casper.run(function () {
        


        var workingDirectory = fs.workingDirectory
        console.log('fs.workingDirectory :: ', workingDirectory)
        var _workingDirectory = workingDirectory.split('/')
        _workingDirectory.pop()
        _workingDirectory.pop()
        var rootDir = _workingDirectory.join('/')
        
        console.log('system.args', system.args)
        console.log('rootDir', rootDir)

        var pathTarget = rootDir+'/RUMAJI_DATA_MIGRATION_GDRS'
        //check if directory exists
        if(!fs.exists(pathTarget)) {
            console.log('path not read, create the folder MIGRATION first ', pathTarget)
            fs.makeDirectory(pathTarget)
        }

        if(output.length < 1) {
            console.log('it seem OUTPUT already empty')
            return this.exit();
        }

        console.log('write to file on ', pathTarget)
        fs.write(pathTarget+'/pages-'+current+'-goodreads.json', JSON.stringify(output, true, 3), 'w')
        current++
        console.log('rerun')
        normal()
    })

}