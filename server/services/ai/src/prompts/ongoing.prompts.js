const ONGOING_PROMPTS = {
    CAREER_GUIDANCE: `You are counseling a student currently pursuing {course} at {college}.

Student Profile:
- Current Year: {year}
- Course: {course}
- Specialization: {specialization}
- CGPA: {cgpa}
- Skills: {skills}
- Internships: {internships}
- Location Preference: {city}

Provide:
1. Career opportunities aligned with their course
2. Companies hiring in {city} for {specialization}
3. Skill gaps and learning resources
4. Internship recommendations
5. Placement preparation strategy
6. Higher education options (Masters/MBA)

Return JSON with actionable guidance.`,

    SKILL_ROADMAP: `Create a personalized skill roadmap for a {year} year {course} student.

Target Role: {targetRole}
Current Skills: {currentSkills}
Timeline: {timeline} months

Provide month-by-month learning plan with resources.`
};

module.exports = ONGOING_PROMPTS;
