/**
 * src/data/mock.ts
 * LEGITIMATE STATIC CONFIGURATION ONLY
 * Contains: supported cities, locality mapping, public image paths, and quiz question definitions.
 * ZERO fake application records, fake users, fake rooms, fake matches, or fake admin stats.
 */

export const IMG = {
  hero: "/e7ee1407-98ae-47b5-aa77-8333481efd42.jpg",
  ava1: "/6b616448-e335-4892-a7c6-8d8ee0eb4c03.jpg",
  ava2: "/465fe41c-c076-4c0c-98a8-c72e3573b12a.jpg",
  ava3: "/f871d4b1-c7c3-43e7-b9ad-1f6fe2ca8e8b.jpg",
  ava4: "/8a318b9a-bf96-4f2b-a123-da9c2c4ec595.jpg",
  ava5: "/5057c662-42c7-48bf-9396-3108a77442f7.jpg",
  ava6: "/4ecbeae4-80d9-4b26-8344-2c83f302a431.jpg",
  room1: "/af861e21-5414-4888-b572-8fd510f654e3.jpg",
  room2: "/7b216db5-152f-47e1-b45b-3912748ad348.jpg",
  room3: "/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg",
};

export const cities = [
  'Pune',
  'Bengaluru',
  'Mumbai',
  'Hyderabad',
  'Delhi NCR',
  'Chennai',
  'Ahmedabad',
  'Kolkata',
];

export const localities: Record<string, string[]> = {
  Pune: [
    'Kothrud',
    'Paud Road',
    'Bavdhan',
    'Karvenagar',
    'S.B. Road',
    'Shivajinagar',
    'Deccan',
    'Warje',
    'Baner',
    'Aundh',
    'Viman Nagar',
    'Hinjewadi',
    'Kharadi',
  ],
  Bengaluru: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Jayanagar'],
  Mumbai: ['Andheri West', 'Powai', 'Bandra', 'Thane', 'Lower Parel'],
  Hyderabad: ['Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills'],
  'Delhi NCR': ['Hauz Khas', 'Sector 62 Noida', 'Gurugram Cyber City', 'Saket'],
  Chennai: ['Adyar', 'Velachery', 'OMR', 'Anna Nagar'],
  Ahmedabad: ['Satellite', 'Vastrapur', 'Prahlad Nagar'],
  Kolkata: ['Salt Lake', 'Ballygunge', 'New Town'],
};

export const quizQuestions = [
  {
    key: 'sleep',
    question: 'When does your day usually end?',
    helper: 'Sleep schedule is the top reason flatmates clash.',
    options: [
      { value: 'early_bird', label: 'In bed before 11pm' },
      { value: 'flexible', label: 'Depends on the week' },
      { value: 'night_owl', label: 'Awake past 1am' },
    ],
  },
  {
    key: 'cleanliness',
    question: 'How tidy do you keep common areas?',
    helper: 'Be honest — this sets expectations for chores.',
    options: [
      { value: 'very_tidy', label: 'Spotless, I clean daily' },
      { value: 'tidy', label: 'Tidy, weekly deep clean' },
      { value: 'relaxed', label: 'Relaxed, some mess is fine' },
    ],
  },
  {
    key: 'social',
    question: 'What does a good weekend at home look like?',
    helper: 'Helps us match your appetite for guests.',
    options: [
      { value: 'homebody', label: 'Quiet, just the flat' },
      { value: 'balanced', label: 'A few friends over sometimes' },
      { value: 'very_social', label: 'House dinners and parties' },
    ],
  },
  {
    key: 'food',
    question: 'What is cooked in your kitchen?',
    helper: 'Shared kitchens work best when this is clear.',
    options: [
      { value: 'vegetarian', label: 'Vegetarian only' },
      { value: 'eggetarian', label: 'Eggetarian' },
      { value: 'non_vegetarian', label: 'Non-vegetarian' },
      { value: 'jain', label: 'Jain' },
    ],
  },
  {
    key: 'smoking',
    question: 'Do you smoke?',
    helper: 'Balcony-only is the most common house rule.',
    options: [
      { value: 'no', label: 'No' },
      { value: 'occasionally', label: 'Occasionally' },
      { value: 'yes', label: 'Yes' },
    ],
  },
  {
    key: 'pets',
    question: 'Are pets welcome in the flat?',
    helper: 'Includes your own pets and your flatmates.',
    options: [
      { value: true, label: 'Yes, love them' },
      { value: false, label: 'Prefer no pets' },
    ],
  },
  {
    key: 'workFromHome',
    question: 'Do you work or study from home?',
    helper: 'Daytime calls and study sessions need a quiet flat.',
    options: [
      { value: true, label: 'Most days' },
      { value: false, label: 'I am out at college / work' },
    ],
  },
  {
    key: 'music',
    question: 'How do you listen to music at home?',
    helper: 'Noise is the second biggest flatmate conflict.',
    options: [
      { value: 'headphones', label: 'Headphones mostly' },
      { value: 'low_speaker', label: 'Speaker on low' },
      { value: 'loud', label: 'Loud and proud' },
    ],
  },
];