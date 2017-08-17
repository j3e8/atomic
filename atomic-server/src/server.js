let express = require('express');
let app = express();
let bodyParser = require('body-parser')
let Component = require('./api/Component.js');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json({
  limit: '5mb'
}));

app.get('/components', function(req, res) {
  if (!req.query.ids) {
    return res.status(400).send();
  }
  Component.buildComponentResponse(req.query.ids.split('|'))
  .then((response) => res.send(response))
  .catch((err) => {
    console.error(err);
    res.status(parseInt(err.status) || 500).send(err);
  });
});

app.listen(3010, function () {
  console.log('Example app listening on port 3010!')
});
