const AFTER_12TH_PROMPTS = {
    CAREER_RECOMMENDATION: `You are an expert career advisor for Indian students who completed Class 12.

Student Profile:
- Stream: {stream}
- Class 12 Percentage: {percentage}%
- Class 10 Percentage: {class10Percentage}%
- Subjects: {subjects}
- Assessment Scores:
  * Analytical: {analytical}/100
  * Creative: {creative}/100
  * Technical: {technical}/100
  * Communication: {communication}/100
  * Leadership: {leadership}/100
- Interests: {interests}
- Location: {city}, {state}
- Budget: ₹{minBudget} - ₹{maxBudget}

Based on this profile, recommend:
1. Top 5 career paths with detailed analysis
2. Best courses (Bachelor's) to pursue
3. Top colleges in {city} and nearby cities
4. Entrance exams to target
5. Skill development roadmap
6. Salary expectations (entry, mid, senior)
7. Future scope and automation risk

Return comprehensive JSON response with:
{{
  "careers": [
    {{
      "title": "Software Engineer",
      "matchPercentage": 92,
      "category": "Engineering",
      "reasoning": "Why this career suits the student",
      "educationPath": ["B.Tech CSE", "B.Sc CS"],
      "entranceExams": ["JEE Main", "BITSAT"],
      "topColleges": ["IIT Bombay", "BITS Pilani"],
      "collegesInCity": ["Colleges in {city}"],
      "skills": ["Programming", "DSA"],
      "salaryRange": {{
        "entry": {{min: 600000, max: 1500000}},
        "mid": {{min: 1500000, max: 3500000}},
        "senior": {{min: 3500000, max: 8000000}}
      }},
      "demand": "High",
      "futureScope": "Excellent with AI/ML growth",
      "automationRisk": "Low",
      "roadmap": ["Year 1: Learn Python", "Year 2: DSA"]
    }}
  ],
  "insights": {{
    "strengths": ["Strong analytical skills"],
    "recommendations": ["Focus on coding"],
    "personalityFit": "Logical thinker, problem solver"
  }}
}}`,

    COLLEGE_RECOMMENDATION: `Recommend colleges for {course} in and around {city}, {state}.

Student Details:
- Stream: {stream}
- Percentage: {percentage}%
- Budget: ₹{minBudget} - ₹{maxBudget}
- Entrance Exam Scores: {examScores}

Focus on:
1. Colleges in {city} (primary)
2. Colleges in nearby cities (within 100km)
3. Government vs Private options
4. Eligibility and cut-offs
5. Placement statistics
6. ROI analysis

Provide JSON with ranked colleges.`
};

module.exports = AFTER_12TH_PROMPTS;
