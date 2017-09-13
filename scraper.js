
var request = require('request'); // this node package makes http requests to which ever URL you direct it to. 
var cheerio = require('cheerio'); // this node package provides a server-side jQuery implementation.
var fs = require('fs');
var baseURI = 'http://www.shirts4mike.com/'; //the base URI of the site we are going to use
var allShirtsURL = baseURI + 'shirts.php'; //the site we are going to scrap info from


// ========= MAIN CALL ========== When the file is typed into the commandline app, this function will run, therefore displaying the data and create a directory called "data" with the data inside a file called data

getAllShirtDetailsAsync()
    .then(function(data) {
        console.log(data);
		fs.mkdir('data',function(){
	    fs.writeFile('./data/t-shirtdata.csv', JSON.stringify(data));
	})
		
    })
    .catch(function(err) {
        console.log(err);
    });
	
	





//First, we create a async call for getting all the different shirt-urls (where all the details are)

 //The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value. works on reject and resolve of the deferred object. Use key words "then" to say what to do with the result and "catch" to catch any errors

function getShirtEndpointsAsync() {
    return new Promise(function (resolve, reject) {       
        request(allShirtsURL, function (error, response, body) {

            //If no errors - we're good to move on.. checks to see if the server code is 200 which means okay
            if (!error && response.statusCode === 200) {

                //Load the entire body into cheerio
                //Now we can start searching for elements using Jquery's library...
                var $ = cheerio.load(body);

                //Storage for the urls, put these inside an array 
                /*e.g. shirt.php?id=101, use Jquery thanks to cheerio and look at the DOM and 
				find the products class and we want the li's. so for each of these li's loop around and find their ancor tag 
				and their href and push it into the storage array */
                var storage = [];
                $('.products li').each(function (i, elem) {
                    var shirt = $(this).find('a').attr('href');
                    storage.push(shirt);
                });

                //Make a complete url out of all the above
                //e.g we turn this: shirt.php?id=101
                //into this: http://www.shirts4mike.com/shirt.php?id=101
				//endpoint = shirt.php?id=101 - it's just a place holder for it called through the map method
                var specificShirtsURL = storage.map(function (endpoint) {
                    return baseURI + endpoint;
                });

                /*Resolve all the urls we made, so we can use them in our next async call. 
				This is the resolve path of the promise - so if everything's okay the resolution will be each of the 8 URLs  */
                resolve(specificShirtsURL);
            } else {
                //If somthing goes wrong however, spit out this error message 
                reject('Could not find anything about anything or anyone...');
            }
        });
    });
}

//Here we use the urls from above to extract the things we want/need from each shirt page.  

function getAllShirtDetailsAsync() {
    return getShirtEndpointsAsync().then(function (endpoints) {

        //Map every endpoint so we can make a request with each URL
        var promises = endpoints.map(function (endpoint) {
            return new Promise(function (resolve, reject) {

                request(endpoint, function (error, response, body) {

                    //Again - check for no errorr...
                    if (!error && response.statusCode === 200) {

                        //Load in our body (containing all the shirt details..)
                        var $ = cheerio.load(body);

                        //Create an object from  the info, storing the data in the relevant keys.
                        var productDetails = {
                            url: endpoint,
                            imageUrl: $('.shirt-picture span img').attr('src'),
                            price: $('.shirt-details h1 span').text(),
                            title: $('.shirt-details h1').text(),
                            time: new Date()
                        };

                        //Resolve the promise with what we are after.
                        resolve(productDetails)


                    } else {

                        // error message
                        reject('Error while getting info about all the different shirts...');
                    }
                });
            });
        });

        //Resolve ALL the promises from above (we are after all making multiple call to get all the different shirt info) throwing in the var called promises 
        return Promise.all(promises);
    })
    .then(function (data) {
        return data;
    })
    .catch(function (err) {
        return Promise.reject(err);
    });
}



