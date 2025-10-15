const AFTER_10TH_PROMPTS = {
    STREAM_RECOMMENDATION: `You are an expert career counselor specializing in the Indian education system.

Student Profile:
- Class 10th Percentage: {percentage}%
- Subject Marks: {subjectMarks}
- Interests: {interests}
- Strengths: {strengths}
- Location: {city}, {state}

Analyze the student's profile and recommend the BEST stream (Science/Commerce/Arts) for Class 11-12.

For SCIENCE stream, consider:
- PCM (Physics, Chemistry, Math) for Engineering/Tech careers
- PCB (Physics, Chemistry, Biology) for Medical/Life Sciences
- PCMB (all four) for maximum flexibility

For COMMERCE stream, consider:
- With Maths: CA, Economics, Data Analytics
- Without Maths: Business, Management, Finance

For ARTS stream, consider:
- Humanities, Social Sciences, Law, Design, Media

Provide detailed JSON response with:
{{
  "recommendedStreams": [
    {{
      "stream": "Science/Commerce/Arts",
      "subStreams": ["PCM", "PCB"] or ["With Maths"] or ["Humanities"],
      "matchScore": 85,
      "reasoning": "Detailed reasoning based on marks and aptitude",
      "subjects": ["List of subjects"],
      "topCareers": ["Top 5 career options"],
      "entranceExams": ["JEE", "NEET", etc.],
      "topCollegesInCity": ["Colleges in {city} for this stream"],
      "averageFees": {{
        "government": 50000,
        "private": 200000
      }},
      "futureScope": "Career outlook in India",
      "skills": ["Key skills to develop"]
    }}
  ],
  "strengths": ["Based on subject performance"],
  "weaknesses": ["Areas to improve"],
  "actionPlan": ["Step-by-step guidance"]
}}`,

    COLLEGE_SEARCH: `You are helping a student who just completed Class 10 find the right colleges in {city}, {state} for {stream} stream.

Student Details:
- Stream: {stream}
- Class 10 Percentage: {percentage}%
- Budget: ₹{minBudget} - ₹{maxBudget} per year
- Preferences: {preferences}

Provide top colleges in {city} with:
1. Government colleges (lowest fees)
2. Private colleges (within budget)
3. Entrance requirements
4. Cut-off percentages
5. Subjects offered

Return JSON with college recommendations and admission guidance.`
};

module.exports = AFTER_10TH_PROMPTS;
