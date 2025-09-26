const mongoose = require('mongoose');

const salesAgentSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
},{timestamps:true})

const SalesAgent = mongoose.model('SalesAgent',salesAgentSchema);

module.exports = SalesAgent;