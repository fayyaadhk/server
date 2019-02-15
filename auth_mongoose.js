function setupAuth(User, app){

  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });  


  passport.deserializeUser(function(id, done){
    User.findOne({_id:id}).exec(done);
  });

  passport.use(new LocalStrategy(
    function(username, password, done){
      wagner.invoke(function(User){
        User.findOne({username: username}, function(err, user){
          if (err) { console.log(err); return done(err); }
          if (!user) {
            console.log('not a users');
            return done(null, false, { message: 'Incorrect username.' });
          }
          if ((user.password != password)) {
            console.log('wrong password');
            return done(null, false, { message: 'Incorrect password.' });
          }
        return done(null, user);
        });
      })
    }
  ));

  

  app.post('/login', passport.authenticate('local'), function(req, res){
    console.log(res);
    res.send(res);
  });


  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/', function(req, res){
    res.send('success');
  });
}

module.exports = setupAuth;