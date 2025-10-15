const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Direct MongoDB connection (replace with your actual MongoDB URI)
const MONGODB_URI = 'mongodb+srv://madkard_db_user:Ashlesha123@manproject2.jcc5w2f.mongodb.net/';

// Define Mongoose Schemas directly in this file
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: String,
  location: {
    state: String,
    city: String,
    address: String
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
  juniorCollegeStreams: [String],
  website: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const careerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['Engineering', 'Medical', 'Business', 'Arts', 'Science', 'Law', 'Design', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  requiredSkills: [{
    skill: String,
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    importance: { type: Number, min: 1, max: 5 }
  }],
  educationPath: [{
    level: { type: String, enum: ['10+2', 'Bachelor', 'Master', 'PhD', 'Diploma', 'Certificate'] },
    fields: [String],
    duration: String,
    mandatory: { type: Boolean, default: false }
  }],
  salaryRange: {
    entry: { min: Number, max: Number },
    mid: { min: Number, max: Number },
    senior: { min: Number, max: Number }
  },
  jobRoles: [String],
  industries: [String],
  growth: {
    demand: { type: String, enum: ['High', 'Medium', 'Low'] },
    futureScope: String,
    automationRisk: { type: String, enum: ['Low', 'Medium', 'High'] }
  },
  aptitudeMapping: {
    analytical: { type: Number, min: 0, max: 100 },
    creative: { type: Number, min: 0, max: 100 },
    technical: { type: Number, min: 0, max: 100 },
    communication: { type: Number, min: 0, max: 100 },
    leadership: { type: Number, min: 0, max: 100 }
  }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: String,
  type: {
    type: String,
    enum: ['Bachelor', 'Master', 'Diploma', 'Certificate', 'PhD'],
    required: true
  },
  category: {
    type: String,
    enum: ['Engineering', 'Medical', 'Commerce', 'Arts', 'Science', 'Law', 'Management'],
    required: true
  },
  specializations: [String],
  duration: { type: String, required: true },
  eligibility: {
    academicRequirement: String,
    minimumMarks: Number,
    requiredSubjects: [String],
    entranceExams: [String]
  },
  curriculum: [{
    semester: Number,
    subjects: [String],
    practicals: [String],
    projects: [String]
  }],
  careerProspects: [{
    jobRole: String,
    averageSalary: Number,
    industries: [String]
  }],
  skills: {
    technical: [String],
    soft: [String],
    tools: [String]
  },
  colleges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }],
  statistics: {
    averagePlacement: Number,
    averagePackage: Number,
    topRecruiters: [String]
  }
}, { timestamps: true });

// Create Models
const College = mongoose.model('College', collegeSchema);
const Career = mongoose.model('Career', careerSchema);
const Course = mongoose.model('Course', courseSchema);

// Load JSON files
const loadJsonData = (filename) => {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } else {
    console.warn(`⚠️  File ${filename} not found. Skipping.`);
    return [];
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing data
    console.log('🗑️  Clearing existing collections...');
    await College.deleteMany({});
    await Career.deleteMany({});
    await Course.deleteMany({});
    console.log('✅ Collections cleared');

    // Seed Colleges
    console.log('📚 Loading colleges.json...');
    const collegesData = loadJsonData('colleges.json');
    if (collegesData.length > 0) {
      await College.insertMany(collegesData);
      console.log(`✅ Seeded ${collegesData.length} colleges (MH focus with Atharva College & University)`);
    }

    // Seed Careers
    console.log('💼 Loading careers.json...');
    const careersData = loadJsonData('careers.json');
    if (careersData.length > 0) {
      await Career.insertMany(careersData);
      console.log(`✅ Seeded ${careersData.length} careers (India-specific with MH job market data)`);
    }

    // Seed Courses
    console.log('🎓 Loading courses.json...');
    const coursesData = loadJsonData('courses.json');
    if (coursesData.length > 0) {
      await Course.insertMany(coursesData);
      console.log(`✅ Seeded ${coursesData.length} courses (with MH college links)`);
    }

    console.log('\n🎉 Enhanced seeding completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log(`   - Colleges: ${await College.countDocuments()}`);
    console.log(`   - Careers: ${await Career.countDocuments()}`);
    console.log(`   - Courses: ${await Course.countDocuments()}`);
    console.log('\n💡 Note: after10th.json, after12th.json, ongoing.json are used in services for stage-specific logic');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
