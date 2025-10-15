// Indian Education System Constants

const STREAMS = {
  SCIENCE: {
    name: 'Science',
    subStreams: ['PCM', 'PCB', 'PCMB'],
    subjects: {
      PCM: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science/Physical Education'],
      PCB: ['Physics', 'Chemistry', 'Biology', 'English', 'Computer Science/Physical Education'],
      PCMB: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English']
    }
  },
  COMMERCE: {
    name: 'Commerce',
    subStreams: ['With Maths', 'Without Maths'],
    subjects: {
      'With Maths': ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'],
      'Without Maths': ['Accountancy', 'Business Studies', 'Economics', 'Informatics Practices', 'English']
    }
  },
  ARTS: {
    name: 'Arts',
    subStreams: ['Humanities', 'Fine Arts'],
    subjects: {
      'Humanities': ['History', 'Political Science', 'Economics', 'Sociology', 'English'],
      'Fine Arts': ['Music', 'Painting', 'English', 'History', 'Psychology']
    }
  }
};

const ENTRANCE_EXAMS = {
  SCIENCE: ['JEE Main', 'JEE Advanced', 'NEET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'KCET', 'MHT CET'],
  COMMERCE: ['CA Foundation', 'IPMAT', 'NPAT', 'SET', 'CUET'],
  ARTS: ['CUET', 'DU JAT', 'BHU UET', 'TISSNET', 'CLAT'],
  DESIGN: ['UCEED', 'NID DAT', 'NIFT', 'CEED']
};

const CAREER_CATEGORIES = [
  'Engineering',
  'Medical',
  'Business',
  'Arts',
  'Science',
  'Law',
  'Design',
  'Other'
];

const COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Central'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal'
];

const EDUCATION_STAGES = {
  AFTER_10TH: 'after10th',
  AFTER_12TH: 'after12th',
  ONGOING: 'ongoing'
};

const APTITUDE_CATEGORIES = [
  'analytical',
  'creative',
  'technical',
  'communication',
  'leadership'
];

module.exports = {
  STREAMS,
  ENTRANCE_EXAMS,
  CAREER_CATEGORIES,
  COLLEGE_TYPES,
  INDIAN_STATES,
  EDUCATION_STAGES,
  APTITUDE_CATEGORIES
};
