"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
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

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  // myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
  //   done(null, null);
  // });
  done(null, null);
});

//  send variables to the pug engine
app.route("/").get((req, res) => {
  res.render(process.cwd() + "/views/pug/index", {
    title: "Hello",
    message: "Please login",
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
