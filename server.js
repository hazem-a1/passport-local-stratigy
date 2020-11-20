"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
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
        if (password !== user.password) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );

  // Be sure to change the title
  app.route("/").get((req, res) => {
    //Change the response to render the Pug template
    res.render("pug", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true,
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
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

app.route("/profile").get(ensureAuthenticated, (req, res) => {
  res.render("pug/profile");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
