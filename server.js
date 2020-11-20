"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");

const routes = require("./routes.js");
const auth = require("./auth.js");

const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

// free code camp test enter
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

//  not sending any thing until connecting to DB
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  routes(app, myDataBase);
  auth(app, myDataBase);
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

//  send variables to the pug engine

// app.use((req, res) => {
//   res.status(404).type("text").send("Not Found");
// });

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
