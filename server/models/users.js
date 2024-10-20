const mongoose = require("mongoose")
const Item = require("./items.js");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose")


const userSchema = new Schema({
    email: 
    {   
        type : String,
        unique: true,
        default : null
    },
    tokens : {
        type : String
    },
    amount :{
        type : Number,
        default : 0
    },
    items: [
        {
          _item: {
            type: Schema.Types.ObjectId,
            ref: 'Item',
          },
          count: {
            type: Number,
            default: 1
          }
        }
      ]
    
})

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User",userSchema)
module.exports = User;