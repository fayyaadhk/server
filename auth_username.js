function setupAuth(User, app){

  var email   = require("emailjs/email");
  var server  = email.server.connect({
   user:  "Hangerstores@gmail.com", 
   password:"Hanger123", 
   host:  "smtp.gmail.com", 
   ssl:   true
});
 

  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
   

  //passport.use(new LocalStrategy(User.authenticate()));
  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
 

  //Express middlewares
  app.use(require('express-session')({
    secret: 'this is a secret',
    resave: true,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/register', function(req, res){
    User.register(new User({
      username : req.body.username,
      profile:{
        name: req.body.name,
        surname: req.body.surname,
        mobile: req.body.surname
      }  
    }),
    req.body.password, function(err, myuser){
      if (err){
        return res.json(err)
      }
      var message = {
        text:  "Welcome to the Hanger online shopping experience", 
        from:  "Hanger <Hangerstores@gmail.com>", 
        to:    myuser.name+" <"+myuser.username+">",
        subject: "Welcome to Hanger"
      };
      // send the message and get a callback with an error or details of the message that was sent
      server.send(message, function(err, message) {
        console.log(err || message); 
        res.json(myuser);
      });
    })
  });

  app.post('/testlogin', function(req, res){
    console.log(req.body);
    res.json({name:"Mbongeni", surname:"Maikeasdadsftso"});
  });

  app.post('/login', passport.authenticate('local'), function(req, res){
    console.log('request to login client received');
    res.json(req.user);
  });

  app.get('/logout', function(req, res){
    console.log(req.user);
    req.logout();
    console.log(req.user);
    res.json({message:'logged out'});
  });

  app.get('/', function(req, res){
    res.send('success');
  });
}

module.exports = setupAuth;