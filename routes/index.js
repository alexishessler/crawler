var express = require('express');
var router = express.Router();
var Crawler = require("crawler");


const crawlingFunction = (req, res, next, protocol, subdomain, domain, extension, keywords, strength) => {
    
  console.log('-------------- FUNCTION START ----------------')

  let allWebsiteLinks = [{link:protocol+subdomain+domain+extension, crawled: false}]
  let CrawlTurns = 0;
  let Crawlinks = 0;
  if(strength == 0){
    CrawlTurns = 2
    Crawlinks = 20
  }
  if(strength == 1){
    CrawlTurns = 10
    Crawlinks = 100
  }
  if(strength == 2){
    CrawlTurns = 20
    Crawlinks = 200
  }
  if(strength == 3){
    CrawlTurns = 30
    Crawlinks = 300
  }

  const execCrawler = (count) => {
    console.log("execCrawler - ", count)
    if(count < CrawlTurns && allWebsiteLinks.length < Crawlinks){
      try {
        var c = new Crawler({
          rateLimit: 1000, // `maxConnections` will be forced to 1
          // This will be called for each crawled page
          callback : async function (error, response, done) {
              if(error){
                  console.log(error);
                  execCrawler(count+1)
              }else{
                try {
                  const $ = response.$;

                  allWebsiteLinks[count].body = $("body").toString()
                  allWebsiteLinks[count].crawled = true;


                  for(let i = 0 ; i < $("a").length ; i++){
      
                    // console.log($("a")[i].attribs.href)
                    let link = $("a")[i].attribs.href
                    if(!link.includes('http') || !link.includes('https')){
                      let newlink = protocol+subdomain+domain+extension+link
                      link = newlink
                    }
                    
                    let needToPush = true;
                    for(let y = 0 ; y < allWebsiteLinks.length ; y++){
                        if(allWebsiteLinks[y].link == link || !link.includes(domain) || link.includes('twitter') || link.includes('facebook') || link.includes('instagram') || link.includes('linkedin') || link.includes('mailto')){
                          needToPush = false;
                          break;
                        }  
                    }
                    if(needToPush){
                      // console.log(count + " --- " + link)
                      allWebsiteLinks.push({link, crawled: false})
                      // console.log("allWebsiteLinks.length", allWebsiteLinks.length)
                    }
                  }
                // done();
    
                  execCrawler(count+1)
                } catch {
                  console.log('error catch 1')
                  execCrawler(count+1)
                }
                  
                        
              }
              
          }
        })
        c.queue(allWebsiteLinks[count].link)
      }
      catch {
        console.log("error catch 2")
        execCrawler(count+1)
      }
      
    } else {
      console.log('end of execCrawler')
      console.log('numbers of links saved :', allWebsiteLinks.length)

      const getAllBodies = (count2) => {
        console.log(`getAllBodies -  ${((count2/allWebsiteLinks.length*100)).toFixed(2)}%`)
        if(count2 < allWebsiteLinks.length){
          if(!allWebsiteLinks[count2].crawled){
            try {
              var d = new Crawler({
                rateLimit: 1000, // `maxConnections` will be forced to 1
                // This will be called for each crawled page
                callback : async function (error2, response2, done2) {
                    if(error2){
                        console.log(error2);
                        getAllBodies(count2+1)
                    }else{
                      try {
                        const $$ = response2.$;

                        allWebsiteLinks[count2].body = $$("body").toString()
                        allWebsiteLinks[count2].crawled = true;

                        getAllBodies(count2+1)
                      } catch {
                        console.log("error catch 3")
                        getAllBodies(count2+1)
                      }
                    }
                  }
                })
                d.queue(allWebsiteLinks[count2].link)
              } catch {
                console.log("error catch 4")
                getAllBodies(count2+1)
              }
          } else {
            getAllBodies(count2+1)
          }
          
        } else {
          // console.log(allWebsiteLinks)

          let occurences = {}
          for(let i = 0 ; i < keywords.length ; i++){
            console.log(keywords[i])
            occurences[keywords[i]] = []
          }

          for(let i = 0 ; i < allWebsiteLinks.length ; i++){
            for(let y = 0 ; y < keywords.length; y++){
              if(allWebsiteLinks[i]){
                if(allWebsiteLinks[i].body){
                    if(allWebsiteLinks[i].body.toLowerCase().includes(keywords[y])){
                      occurences[keywords[y]].push({
                        url: allWebsiteLinks[i].link,
                        match: true,
                      })
                    }
                }  
              }       
            }
          }
              

          console.log('-------------- FUNCTION DONE ----------------')
          res.json({occurences})
        }
      }

      getAllBodies(0)
    
    }
  }

  execCrawler(0)
}

// crawlingFunction(res, req, next)



/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render("index")
});

/* GET home page. */
router.post('/crawler', async function(req, res, next) {

  try {
    let {protocol, subdomain, domain, extension, keywords, strength} = req.body; 
    keywords = keywords.split(',')
    req.setTimeout(0)
    crawlingFunction(req, res, next, protocol, subdomain, domain, extension, keywords, strength)
  } catch {
    console.log('Something went wrong...')
    res.render("index")
  }

});



module.exports = router;
