const LocalStrategy = require("passport-local");
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
