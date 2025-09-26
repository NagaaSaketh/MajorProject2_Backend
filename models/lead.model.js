const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['Website', 'Referral', 'Cold Call', 'Advertisement', 'Email', 'Other']
  },
  salesAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'SalesAgent',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed'],
    default: 'New',
  },
  tags: [{
    type: String
  }],
  timeToClose: {
    type: Number,
    required: true,
    min: 1 
  },
  priority: {
    type: String,
    required: true,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  closedAt: {
    type: Date,  
  },
},{timestamps:true});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
