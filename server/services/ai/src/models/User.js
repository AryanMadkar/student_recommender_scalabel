const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    personalInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String, required: true },
      dateOfBirth: Date,
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      state: String,
      city: String,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    favorites: {
      colleges: [{ type: mongoose.Schema.Types.ObjectId, ref: "College" }],
      courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
      careers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Career" }],
    },

    educationStage: {
      type: String,
      enum: ["after10th", "after12th", "ongoing"],
      required: true,
    },

    academicInfo: {
      // For After 10th students
      class10: {
        board: String,
        percentage: Number,
        subjects: [
          {
            name: String,
            marks: Number,
          },
        ],
        year: Number,
      },

      // For After 12th students
      class12: {
        stream: { type: String, enum: ["Science", "Commerce", "Arts"] },
        board: String,
        percentage: Number,
        subjects: [
          {
            name: String,
            marks: Number,
          },
        ],
        year: Number,
      },

      // For Ongoing course students
      currentCourse: {
        degree: String,
        specialization: String,
        college: String,
        year: Number,
        cgpa: Number,
        semester: Number,
      },
    },

    assessmentResults: [
      {
        assessmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assessment",
        },
        responses: Map,
        scores: {
          aptitude: Number,
          interest: Number,
          iq: Number,
          personality: Number,
        },
        completedAt: { type: Date, default: Date.now },
      },
    ],

    parentalInfluence: {
      preferredFields: [String],
      supportLevel: { type: Number, min: 1, max: 5 },
      expectations: String,
    },

    recommendations: [
      {
        type: { type: String, enum: ["college", "course", "career", "skill"] },
        data: mongoose.Schema.Types.Mixed,
        confidence: Number,
        generatedAt: { type: Date, default: Date.now },
      },
    ],

    progress: {
      profileCompletion: { type: Number, default: 0 },
      assessmentsCompleted: { type: Number, default: 0 },
      lastActive: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
