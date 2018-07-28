'use strict';

const express     = require('express');
const mongo       = require('mongodb');
const mongoose    = require('mongoose');
const bodyParser  = require('body-parser');
const dns         = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here



app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));


const options = {
  all: true
};


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//Mongoose in app setup
let mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('Connected to database...');
});

//Mongoose Schema
var Schema = mongoose.Schema;

var urlShortenerSchema =new Schema({
    urlString: String,
    count: Number
});

var urlShortenerModel = mongoose.model('urlShortenerModel', urlShortenerSchema);



//Post request for 'shorturl'
app.post('/api/shorturl/new', (req, res)=>{

  let url = req.body.url;
  url = url.split('//');
  var urlString = url[url.length-1]
  
  dns.lookup(urlString, (err, address)=>{
    if (err){ 
        console.error(err);
        res.json({error:'invalid url'});
    } 
      
  urlShortenerModel.find({urlString: urlString},(err, urls)=>{
      if(err) return console.log(err);
      if(!urls.length)
      {
        
        urlShortenerModel.countDocuments(function(err, count){
          if(err) return err;
          new urlShortenerModel({ urlString: urlString, count: count+1 }).save(); 
          res.json({original_url:urlString, short_url: count+1});
          
          });     
      } else {
        res.json({original_url:urls[0].urlString, short_url: urls[0].count});
      }
    });
  });
});
  
app.get('/api/shorturl/:short_url',(req, res)=>{
  urlShortenerModel.find({count:req.params.short_url}, (err, urls)=>{
    if(err) return console.log(err);
    if(!urls.length){
      res.json({error:'invalid url'});
    } else {
      res.json({original_url:urls[0].urlString, short_url: urls[0].count});
    }
    
  });  
}); 


app.listen(port, function () {
  console.log('Node.js listening ...');
});  