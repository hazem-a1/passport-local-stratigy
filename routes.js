const bcrypt = require("bcrypt");
const passport = require("passport");

module.exports = function (app, myDataBase) {
  // middle ware to check if a user is authenticated  or redirect to home page
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }
  function profileRedirect(req, res, next) {
    if (req.isAuthenticated()) {
      res.redirect("/profile");
    }
    return next();
  }
  // main page /
  app.route("/").get(profileRedirect, (req, res) => {
    //Change the response to render the Pug template
    res.render("pug", {
      title: "Training",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    });
  });

  // main profile
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render("pug/profile", { username: req.user.username });
  });
  // logout
  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });
  //   register users
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
  // local auth route
  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  // social

  //  github auth route
  app.route("/auth/github").get(passport.authenticate("github"));

  app
    .route("/auth/github/callback")
    .get(
      passport.authenticate("github", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  // google auth rout
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["https://www.googleapis.com/auth/plus.login"],
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    function (req, res) {
      res.redirect("/");
    }
  );

  // FB  auth route
  app.route("/auth/facebook").get(passport.authenticate("facebook"));

  app
    .route("/auth/facebook/callback")
    .get(
      passport.authenticate("facebook", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );
};
