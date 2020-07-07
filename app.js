require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportlocalmongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

// http://www.passportjs.org/packages/passport-google-oauth20/
//bcrypt
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
//md5
//const md5 = require('md5');
//encrption
//const encrypt = require("mongoose-encryption");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');


//passport code here

app.use(session({
    secret: "Hello World",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// end


mongoose.connect("mongodb://localhost:27017/secretsDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String
})

//passport local mongoose
userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);

// encrypteion
//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
})

app.get("/auth/google",

    passport.authenticate("google", { scope: ["profile"] })
);



app.get("/auth/google/secrets",

    passport.authenticate('google', { failureRedirect: "/login" }),

    function (req, res) {

        // Successful authentication, redirect secrets.

        res.redirect("/secrets");

    }
);

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/")
    }
})

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })
})

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);

        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }
    })
})
//bcrpyt md5 encrption
// app.post("/register", function (req, res) {

//     //bcrpyt
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         let newUser = new User({
//             email: req.body.username,
//             password: hash
//         })

//         newUser.save(function (err) {
//             if (err) {
//                 console.log(err)
//             } else {
//                 res.render('secrets')
//             }
//         })
//     })


//bcrpyt
// app.post("/register", function (req, res) {

//     //bcrpyt
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         let newUser = new User({
//             email: req.body.username,
//             password: hash
//         })

//         newUser.save(function (err) {
//             if (err) {
//                 console.log(err)
//             } else {
//                 res.render('secrets')
//             }
//         })
//     })


// })

// app.post("/login", function (req, res) {
//     const username = req.body.username;
//     const password = req.body.password;
//     //const password = md5(req.body.password);

//     User.findOne({ email: username }, function (err, founduser) {
//         if (err) {
//             console.log(err);
//         } else {
//             if (founduser) {
//                 bcrypt.compare(password, founduser.password, function(err, results){
//                     if(results === true) {
//                         res.render('secrets');
//                     }
//                 })
//             }
//         }
//     })
// })

app.listen(3000, function () {
    console.log("port 3000")
})