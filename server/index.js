require("dotenv").config();
require("./config/database.js").connect().then(() => console.log("connected to MongoDB"))
    .catch((err) => console.log(err));
const express = require("express")
const app = express()
const path = require("path")
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate")
const methodOverride = require("method-override");
const request = require('request');
const Item = require("./models/items.js")
const User = require("./models/users.js");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const wrapAsync = require("./utils/wrapAsync.js");
const passport = require("passport")
const localStrategy = require("passport-local")
const flash = require("connect-flash");
const session = require("express-session")
const { isLoggedIn } = require("./middlewares.js")
// const flash = require("connect-flash")

app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.engine("ejs", ejsMate);


app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", (req, res) => {
    res.send("Welcome to Startup API");
})

//home

app.get("/home", (req, res) => {
    const userid = req.user;
    console.log(userid);
    res.render("home/home.ejs", { userid });
})

//signup
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
})

app.post("/signup", wrapAsync(async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, function (err) {
            if (err) { return next(err); }
            req.flash("success", "User Login successfully")
            res.redirect("/home");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }



}))
//login
app.get("/login", (req, res) => {
    res.render("users/login.ejs");
})

app.post("/login",
    passport.authenticate('local',
        {
            failureRedirect: '/login',
            failureFlash: true
        })
    , wrapAsync(async (req, res) => {
        let { username } = req.body;
        let user = await User.findOne({ username });
        req.flash("success", "Welcome back to Your Inventory");
        res.redirect(`/home`);
    }))


app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are successfully logout")
        res.redirect("/home");
    });
})

//dashboard route
app.get('/dashboard', isLoggedIn, wrapAsync(async (req, res) => {
    let user = await User.findById(res.locals.currUser._id).populate("items._item")
    console.log(user);
    res.render("home/dashboard.ejs", { user });

}));

// Define the delete route
app.delete('/dashboard/:itemId', async (req, res) => {
    try {
      const userId = req.user._id; // Assuming you have user information in the request
      const itemId = req.params.itemId;
  
      // Find the user and update the items array by removing the item
      await User.updateOne(
        { _id: userId },
        { $pull: { items: { _item: itemId } } }
      );
  
      res.redirect('/dashboard');
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  });


//search routes

app.post("/search", wrapAsync(async (req, res) => {
    let { code } = req.body;
    let user = res.locals.currUser
    let responseData

    const query = {
        $or: [
            { upc: code },
            { ean: code }
        ]
    };

    // Find the item
    let newItem = await Item.findOne(query);
    if (newItem) {
        console.log(`item found in db`)
        console.log(user);
        res.status(200).render("home/show.ejs", { newItem , code });
    } else {


        request.post({
            uri: 'https://api.upcitemdb.com/prod/trial/lookup',
            headers: {
                "Content-Type": "application/json",
            },
            gzip: true,
            body: JSON.stringify({ "upc": `${code}` }),
        }, (err, resp, body) => {
            if (err) {
                console.error('Error:', err);
                return;
            }

            // Store the response data and response code in variables
            responseData = JSON.parse(body);
            let responseCode = resp.statusCode;

            // Log the data and response code to verify

            console.log('Response code:', responseCode);
            if (responseCode == 200 && !(responseData.items.length == 0)) {
                console.log("item found using api ");
                const {
                    items: [{
                        ean,
                        title,
                        upc,
                        gtin,
                        asin,
                        description,
                        brand,
                        model,
                        dimension,
                        weight,
                        category,
                        currency,
                        lowest_recorded_price,
                        highest_recorded_price,
                        images,

                    }]
                } = responseData;
                newItem = new Item({
                    ean,
                    title,
                    upc,
                    gtin,
                    asin,
                    description,
                    brand,
                    model,
                    dimension,
                    weight,
                    category,
                    currency,
                    lowest_recorded_price,
                    highest_recorded_price,
                    images,
                });

                newItem.save();
                console.log("stored into database");
                console.log(user);
                res.status(200).render("home/show.ejs", { newItem,code });
            }
            else {
                res.status(responseCode).render('home/show.ejs',{newItem,code});
            }

        });
    }



})
)

app.get("/search/custom/:code",(req,res)=>{
    const code = req.params.code;
    res.render("home/custom.ejs",{code, currUser});
})


app.post("/search/store/:code",isLoggedIn,wrapAsync(async(req,res)=>{
    const code = req.params.code;
    let user = await User.findById(res.locals.currUser._id).populate("items._item")
    const query = {
        $or: [
            { upc: code },
            { ean: code }
        ]
    };
    let newItem = await Item.findOne(query);
    user.items.push({ _item: newItem._id, count: 1 });
    let conso = await user.save();
    console.log(conso);
    req.flash("success","product added in inventory");
    res.redirect("/dashboard");
    // res.render("home/dashboard.ejs",{user});
}))


app.listen(process.env.PORT, (req, res) => {
    console.log(`listening on port ${process.env.PORT} ...`)
})




