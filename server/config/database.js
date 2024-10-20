const mongoose = require("mongoose")

const {Mongo_Url} = process.env

exports.connect = async() =>{
    await mongoose.connect(Mongo_Url)
}