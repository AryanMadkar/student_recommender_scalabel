const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: String,
  location: {
    state: String,
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  type: {
    type: String,
    enum: ['Government', 'Private', 'Deemed', 'Central']
  },
  
  courses: [{
    name: String,
    duration: String,
    fees: {
      annual: Number,
      total: Number
    },
    eligibility: {
      stream: [String],
      minimumPercentage: Number,
      entranceExam: String
    },
    cutoffs: [{
      year: Number,
      category: String,
      cutoff: Number
    }]
  }],
  
  ratings: {
    overall: Number,
    placement: Number,
    infrastructure: Number,
    faculty: Number
  },
  
  placementStats: {
    averagePackage: Number,
    highestPackage: Number,
    placementPercentage: Number,
    topRecruiters: [String]
  },
  website: String,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('College', collegeSchema);
