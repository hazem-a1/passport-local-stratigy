"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local");
const ObjectID = require("mongodb").ObjectID;

const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// set view engine  pug
app.set("view engine", "pug");
// use session to store the user

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// init passport with session
app.use(passport.initialize());
app.use(passport.session());

// middle ware to check if a user is authenticated  or redirect to home page
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

//  not sending any thing until connecting to DB
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");

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
  app.route("/register").post(
    (req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, function (err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect("/");
        } else {
          var hash = bcrypt.hashSync(req.body.password, 12);

          myDataBase.insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            }
          );
        }
      });
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/profile");
    }
  );
  // Be sure to change the title
  app.route("/").get((req, res) => {
    //Change the response to render the Pug template
    res.render("pug", {
      title: "Training",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
    });
  });

  // Serialization and deserialization here...

  //  encode the user ID in the cookie
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // decode it just like JWT
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      // console.log(doc);
      // console.log(err);
      done(null, doc);
    });
    // done(null, null);
  });
  // Be sure to add this...
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

//  send variables to the pug engine
app
  .route("/login")
  .post(
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/profile");
    }
  );

app.route("/profile").get(ensureAuthenticated, (req, res) => {
  res.render("pug/profile", { username: req.user.username });
});

app.route("/logout").get((req, res) => {
  req.logout();
  res.redirect("/");
});

// app.use((req, res) => {
//   res.status(404).type("text").send("Not Found");
// });

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
