require("dotenv").config();

const LocalStrategy = require("passport-local");
const GitHubStrategy = require("passport-github").Strategy;
const bcrypt = require("bcrypt");

const passport = require("passport");

const ObjectID = require("mongodb").ObjectID;
module.exports = function (app, myDataBase) {
  // Serialization and deserialization here...

  //  encode the user ID in the cookie
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // decode it just like JWT
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
    // done(null, null);
  });

  // social strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://passport-express.herokuapp.com/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        //Database logic here with callback containing our user object
      }
    )
  );

  //   local Strategy
  passport.use(
    new LocalStrategy(function (username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log("User " + username + " attempted to log in.");
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );
};
