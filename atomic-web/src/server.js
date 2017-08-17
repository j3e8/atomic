let express = require('express');
let app = express();

app.get('/*.js', function(req, res) {
  res.sendFile(req.url, { root: process.cwd() + '/www' });
});

app.get('/*', function(req, res) {
  res.sendFile('./index.html', { root: __dirname });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
