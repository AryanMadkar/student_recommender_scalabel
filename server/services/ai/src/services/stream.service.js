const StreamGuidance = require('../models/StreamGuidance');
const College = require('../models/College');
const Career = require('../models/Career');
const aiService = require('./ai.service');
const AFTER_10TH_PROMPTS = require('../prompts/after10th.prompts');

class StreamService {
    // Calculate stream scores based on subject performance
    calculateStreamScores(class10Data) {
        const scores = {
            science: 0,
            commerce: 0,
            arts: 0
        };

        const subjectMap = {
            mathematics: { science: 30, commerce: 25, arts: 10 },
            science: { science: 30, commerce: 5, arts: 5 },
            english: { science: 10, commerce: 20, arts: 25 },
            social_science: { science: 5, commerce: 15, arts: 30 },
            hindi: { science: 5, commerce: 10, arts: 20 }
        };

        class10Data.subjects.forEach(subject => {
            const normalizedName = subject.name.toLowerCase().replace(/\s+/g, '_');
            const weightage = subjectMap[normalizedName] || { science: 10, commerce: 10, arts: 10 };

            const percentageScore = (subject.marks / 100) * 100;

            scores.science += (percentageScore * weightage.science) / 100;
            scores.commerce += (percentageScore * weightage.commerce) / 100;
            scores.arts += (percentageScore * weightage.arts) / 100;
        });

        // Adjust for overall percentage
        const percentageBonus = Math.min((class10Data.percentage - 60) / 4, 10);
        scores.science += percentageBonus;
        scores.commerce += percentageBonus * 0.8;
        scores.arts += percentageBonus * 0.6;

        return scores;
    }

    // Get AI-powered stream recommendations
    async getStreamRecommendations(userId, studentData) {
        try {
            // Calculate base scores
            const streamScores = this.calculateStreamScores(studentData.class10Marks);

            // Prepare prompt
            const systemPrompt = "You are an expert Indian education counselor specializing in stream selection after Class 10. Always respond with valid JSON.";

            const userPrompt = AFTER_10TH_PROMPTS.STREAM_RECOMMENDATION
                .replace('{percentage}', studentData.class10Marks.percentage)
                .replace('{subjectMarks}', JSON.stringify(studentData.class10Marks.subjects))
                .replace('{interests}', studentData.interests?.join(', ') || 'Not specified')
                .replace('{strengths}', studentData.strengths?.join(', ') || 'Not specified')
                .replace('{city}', studentData.location.city)
                .replace('{state}', studentData.location.state);

            // Get AI analysis
            const aiResponse = await aiService.analyze(systemPrompt, userPrompt);

            // Enhance with local college data
            const enhancedRecommendations = await this.enhanceWithLocalData(
                aiResponse.recommendedStreams,
                studentData.location
            );

            // Save to database
            const guidance = new StreamGuidance({
                userId,
                class10Marks: studentData.class10Marks,
                recommendedStreams: enhancedRecommendations,
                aiAnalysis: {
                    subjectStrengths: aiResponse.strengths || [],
                    subjectWeaknesses: aiResponse.weaknesses || [],
                    aptitudeProfile: this.determineAptitude(studentData.class10Marks),
                    suggestedFocus: aiResponse.actionPlan?.[0] || ''
                }
            });

            await guidance.save();

            return {
                recommendations: enhancedRecommendations,
                analysis: guidance.aiAnalysis,
                actionPlan: aiResponse.actionPlan || []
            };
        } catch (error) {
            console.error('Stream recommendation error:', error);
            throw error;
        }
    }

    // Enhance AI recommendations with real college data
    async enhanceWithLocalData(recommendations, location) {
        const enhanced = [];

        for (const rec of recommendations) {
            // Find colleges in user's city for this stream
            const localColleges = await College.find({
                'location.city': new RegExp(location.city, 'i'),
                'courses.eligibility.stream': rec.stream,
                isActive: true
            })
                .select('name shortName type courses ratings placementStats')
                .limit(10)
                .sort({ 'ratings.overall': -1 });

            enhanced.push({
                ...rec,
                collegesInCity: localColleges.map(c => ({
                    name: c.name,
                    type: c.type,
                    rating: c.ratings.overall,
                    courses: c.courses.filter(course =>
                        course.eligibility.stream.includes(rec.stream)
                    ).map(course => ({
                        name: course.name,
                        fees: course.fees,
                        eligibility: course.eligibility
                    }))
                })),
                totalCollegesInCity: localColleges.length
            });
        }

        return enhanced;
    }

    // Determine aptitude profile
    determineAptitude(class10Marks) {
        const mathMarks = class10Marks.subjects.find(s =>
            s.name.toLowerCase().includes('math')
        )?.marks || 0;

        const scienceMarks = class10Marks.subjects.find(s =>
            s.name.toLowerCase().includes('science')
        )?.marks || 0;

        if (mathMarks >= 80 && scienceMarks >= 80) {
            return 'Strong Analytical & Technical Aptitude';
        } else if (mathMarks >= 70 || scienceMarks >= 70) {
            return 'Moderate Technical Aptitude';
        } else {
            return 'Creative & Conceptual Thinker';
        }
    }
}

module.exports = new StreamService();
