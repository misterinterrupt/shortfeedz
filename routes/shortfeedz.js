module.exports = function (app) {
  // home page route
  app.get('/', function (req, res) {
    // serve something simple for the first course
    res.render("index");
  });

  // stream url pickup
  app.get('/stream/:id', function (req, res) {
    // let em know what they asked for
    res.send(req.params['id']);
    // verify this url, redirect to error if needed
    // start streaming into redis or find an in progress channel
    // subscribe to the published redis channel
  });
}