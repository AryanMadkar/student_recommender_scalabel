const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortName: String,
    location: {
        state: { type: String, required: true },
        city: { type: String, required: true },
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    type: {
        type: String,
        enum: ['Government', 'Private', 'Deemed', 'Central'],
        required: true
    },
    courses: [{
        name: String,
        duration: String,
        fees: {
            annual: Number,
            total: Number
        },
        eligibility: {
            stream: [{ type: String, enum: ['Science', 'Commerce', 'Arts'] }],
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
        overall: { type: Number, min: 0, max: 5 },
        placement: { type: Number, min: 0, max: 5 },
        infrastructure: { type: Number, min: 0, max: 5 },
        faculty: { type: Number, min: 0, max: 5 }
    },
    placementStats: {
        averagePackage: Number,
        highestPackage: Number,
        placementPercentage: Number,
        topRecruiters: [String]
    },
    website: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for location-based search
collegeSchema.index({ 'location.city': 1, 'location.state': 1 });
collegeSchema.index({ 'courses.eligibility.stream': 1 });

module.exports = mongoose.model('College', collegeSchema);
