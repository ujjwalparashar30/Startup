const User = require("./models/users.js");

module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","Please login first to access dashboard");
        return res.redirect("/login");
    }
    next();
}

// module.exports.saveUrl  = (req,res,next)=>{
//     if(req.session.redirectUrl){
//         res.locals.redirectUrl = req.session.redirectUrl;
//         }
//         next();
// }

// module.exports.isOwner = (req,res,next)=>{
//     const {id} = req.params;
//     const listing = Listing.findById(id);
//     if(!listing.owner.equals(res.locals.currUser._id)){
//         req.flash("error","You do not have permission to do that");
//         return res.redirect(`/listings/${id}`);

//     }
// }