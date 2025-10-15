require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://madkard_db_user:Ashlesha123@manproject2.jcc5w2f.mongodb.net/");
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const seedQuestions = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Load question files
    const dataPath = path.join(__dirname, '../data');
    
    const after10thQuestions = JSON.parse(
      fs.readFileSync(path.join(dataPath, 'after10th.json'), 'utf8')
    );
    const after12thQuestions = JSON.parse(
      fs.readFileSync(path.join(dataPath, 'after12th.json'), 'utf8')
    );
    const ongoingQuestions = JSON.parse(
      fs.readFileSync(path.join(dataPath, 'ongoing.json'), 'utf8')
    );

    // Insert questions
    const allQuestions = [
      ...after10thQuestions,
      ...after12thQuestions,
      ...ongoingQuestions
    ];

    const insertedQuestions = await Question.insertMany(allQuestions);
    console.log(`✅ Inserted ${insertedQuestions.length} questions`);

    // Create assessments
    const stages = ['after10th', 'after12th', 'ongoing'];
    const assessments = [];

    for (const stage of stages) {
      const stageQuestions = insertedQuestions.filter(q => 
        q.stage.includes(stage)
      );

      if (stageQuestions.length > 0) {
        // Comprehensive Assessment
        assessments.push({
          title: `Comprehensive Assessment - ${stage.replace('after', 'After ').replace('ongoing', 'Ongoing')}`,
          description: `Complete aptitude, interest, and personality assessment for ${stage} students`,
          stage,
          type: 'comprehensive',
          questions: stageQuestions.slice(0, 25).map(q => ({
            questionId: q._id,
            weight: 1
          })),
          duration: 1800,
          passingScore: 40,
          instructions: [
            'Read each question carefully',
            'Answer honestly based on your preferences',
            'There are no right or wrong answers for interest questions',
            'Complete within the time limit'
          ],
          isActive: true
        });

        // Interest Assessment
        const interestQuestions = stageQuestions.filter(q => q.category === 'interest');
        if (interestQuestions.length >= 10) {
          assessments.push({
            title: `Interest Assessment - ${stage.replace('after', 'After ').replace('ongoing', 'Ongoing')}`,
            description: 'Discover your interests and career inclinations',
            stage,
            type: 'interest',
            questions: interestQuestions.slice(0, 15).map(q => ({
              questionId: q._id,
              weight: 1
            })),
            duration: 900,
            passingScore: 40,
            instructions: ['Answer based on your genuine interests'],
            isActive: true
          });
        }

        // Aptitude Assessment
        const aptitudeQuestions = stageQuestions.filter(q => 
          ['analytical', 'technical', 'iq'].includes(q.category)
        );
        if (aptitudeQuestions.length >= 15) {
          assessments.push({
            title: `Aptitude Test - ${stage.replace('after', 'After ').replace('ongoing', 'Ongoing')}`,
            description: 'Test your analytical and problem-solving abilities',
            stage,
            type: 'aptitude',
            questions: aptitudeQuestions.slice(0, 20).map(q => ({
              questionId: q._id,
              weight: 1
            })),
            duration: 1200,
            passingScore: 50,
            instructions: ['This is a timed test', 'Answer to the best of your ability'],
            isActive: true
          });
        }
      }
    }

    const insertedAssessments = await Assessment.insertMany(assessments);
    console.log(`✅ Created ${insertedAssessments.length} assessments`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nCreated Assessments:');
    insertedAssessments.forEach(a => {
      console.log(`  - ${a.title} (${a.questions.length} questions)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedQuestions();
