import type {
  AppNotification,
  ChatMessage,
  ChatThread,
  Lifestyle,
  MatchCandidate,
  Profile,
  Room } from
'../types';

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
  room3: "/b905749c-c35e-4440-8ef2-40472ccd5bc4.jpg"
};

export const cities = [
'Bengaluru',
'Mumbai',
'Pune',
'Hyderabad',
'Delhi NCR',
'Chennai',
'Ahmedabad',
'Kolkata'];


export const localities: Record<string, string[]> = {
  Bengaluru: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Jayanagar'],
  Mumbai: ['Andheri West', 'Powai', 'Bandra', 'Thane', 'Lower Parel'],
  Pune: ['Kothrud', 'Baner', 'Viman Nagar', 'Hinjewadi', 'Kharadi'],
  Hyderabad: ['Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills'],
  'Delhi NCR': ['Hauz Khas', 'Sector 62 Noida', 'Gurugram Cyber City', 'Saket'],
  Chennai: ['Adyar', 'Velachery', 'OMR', 'Anna Nagar'],
  Ahmedabad: ['Satellite', 'Vastrapur', 'Prahlad Nagar'],
  Kolkata: ['Salt Lake', 'Ballygunge', 'New Town']
};

export const currentUserLifestyle: Lifestyle = {
  sleep: 'night_owl',
  cleanliness: 'tidy',
  social: 'balanced',
  food: 'vegetarian',
  smoking: 'no',
  pets: true,
  guests: 'sometimes',
  workFromHome: true,
  music: 'headphones',
  fitness: 'sometimes'
};

const baseLifestyle: Lifestyle = { ...currentUserLifestyle };

function lifestyle(overrides: Partial<Lifestyle>): Lifestyle {
  return { ...baseLifestyle, ...overrides };
}

export const profiles: Profile[] = [
{
  id: 'p1',
  name: 'Ananya Iyer',
  age: 24,
  gender: 'female',
  avatar: IMG.ava1,
  occupation: 'Product Designer',
  company: 'Swiggy',
  city: 'Bengaluru',
  locality: 'Koramangala',
  budget: 22000,
  moveIn: '2026-10-01',
  bio: 'Designer who cooks a mean rasam on Sundays. Looking for a calm flat with people who respect quiet hours and share chai duty.',
  languages: ['Tamil', 'English', 'Hindi'],
  interests: ['Filter coffee', 'Pottery', 'Indie music', 'Trekking'],
  verification: 'verified',
  lifestyle: lifestyle({ sleep: 'night_owl', cleanliness: 'very_tidy' }),
  hasRoom: true,
  joinedAt: '2026-06-12',
  lastActive: '12 min ago'
},
{
  id: 'p2',
  name: 'Rohan Deshpande',
  age: 26,
  gender: 'male',
  avatar: IMG.ava2,
  occupation: 'Backend Engineer',
  company: 'Razorpay',
  city: 'Bengaluru',
  locality: 'HSR Layout',
  budget: 18000,
  moveIn: '2026-09-25',
  bio: 'Gym in the morning, code all day, badminton on weekends. Clean, quiet and fine with a flatmate who has a cat.',
  languages: ['Marathi', 'English', 'Hindi'],
  interests: ['Badminton', 'Anime', 'Cooking', 'Formula 1'],
  verification: 'verified',
  lifestyle: lifestyle({ fitness: 'gym_daily', food: 'non_vegetarian', sleep: 'early_bird' }),
  hasRoom: false,
  joinedAt: '2026-07-02',
  lastActive: '1 hour ago'
},
{
  id: 'p3',
  name: 'Meher Kaur',
  age: 22,
  gender: 'female',
  avatar: IMG.ava3,
  occupation: 'MBA Student',
  company: 'IIM Bangalore',
  city: 'Bengaluru',
  locality: 'Jayanagar',
  budget: 15000,
  moveIn: '2026-09-20',
  bio: 'Second-year MBA student. Loud laugh, strong opinions on biryani, very organised about bills and chores.',
  languages: ['Punjabi', 'English', 'Hindi'],
  interests: ['Debating', 'Street food', 'Bollywood', 'Cycling'],
  verification: 'pending',
  lifestyle: lifestyle({ social: 'very_social', guests: 'often', cleanliness: 'tidy' }),
  hasRoom: false,
  joinedAt: '2026-08-01',
  lastActive: '3 hours ago'
},
{
  id: 'p4',
  name: 'Kabir Malhotra',
  age: 28,
  gender: 'male',
  avatar: IMG.ava4,
  occupation: 'Data Scientist',
  company: 'Flipkart',
  city: 'Bengaluru',
  locality: 'Indiranagar',
  budget: 30000,
  moveIn: '2026-11-01',
  bio: 'Work from home most days, so a quiet flat matters. I keep common areas spotless and cook twice a week for the house.',
  languages: ['Hindi', 'English'],
  interests: ['Chess', 'Jazz', 'Photography', 'Running'],
  verification: 'verified',
  lifestyle: lifestyle({ workFromHome: true, cleanliness: 'very_tidy', social: 'homebody' }),
  hasRoom: true,
  joinedAt: '2026-05-19',
  lastActive: 'Online now'
},
{
  id: 'p5',
  name: 'Sanjana Reddy',
  age: 25,
  gender: 'female',
  avatar: IMG.ava5,
  occupation: 'Marketing Associate',
  company: 'Zomato',
  city: 'Hyderabad',
  locality: 'Gachibowli',
  budget: 17000,
  moveIn: '2026-10-10',
  bio: 'Weekend plant-shopper, weekday spreadsheet person. Happy to split cooking and would love a flat that gets morning sun.',
  languages: ['Telugu', 'English', 'Hindi'],
  interests: ['Gardening', 'Yoga', 'Board games', 'Podcasts'],
  verification: 'verified',
  lifestyle: lifestyle({ sleep: 'early_bird', pets: false, food: 'eggetarian' }),
  hasRoom: false,
  joinedAt: '2026-07-24',
  lastActive: '2 days ago'
},
{
  id: 'p6',
  name: 'Aditya Sharma',
  age: 27,
  gender: 'male',
  avatar: IMG.ava6,
  occupation: 'UX Researcher',
  company: 'Freshworks',
  city: 'Pune',
  locality: 'Baner',
  budget: 20000,
  moveIn: '2026-09-30',
  bio: 'Night owl who edits films till 2am with headphones on. Looking for flatmates who are relaxed about a slightly messy desk.',
  languages: ['Hindi', 'English', 'Marathi'],
  interests: ['Filmmaking', 'Cricket', 'Coffee brewing', 'Books'],
  verification: 'unverified',
  lifestyle: lifestyle({ sleep: 'night_owl', cleanliness: 'relaxed', smoking: 'occasionally' }),
  hasRoom: false,
  joinedAt: '2026-08-14',
  lastActive: '5 hours ago'
}];


function factors(p: Profile, score: number) {
  const you = currentUserLifestyle;
  const label = (key: keyof Lifestyle, value: unknown) => {
    const map: Record<string, string> = {
      early_bird: 'Early bird (up by 6am)',
      flexible: 'Flexible schedule',
      night_owl: 'Night owl (sleeps after 1am)',
      very_tidy: 'Very tidy, cleans daily',
      tidy: 'Tidy, weekly deep clean',
      relaxed: 'Relaxed about mess',
      homebody: 'Homebody',
      balanced: 'Balanced social life',
      very_social: 'Very social, loves hosting',
      vegetarian: 'Vegetarian kitchen',
      eggetarian: 'Eggetarian',
      non_vegetarian: 'Non-vegetarian',
      jain: 'Jain food',
      no: 'Non-smoker',
      occasionally: 'Smokes occasionally',
      yes: 'Smoker',
      rarely: 'Guests rarely',
      sometimes: 'Guests sometimes',
      often: 'Guests often',
      headphones: 'Headphones mostly',
      low_speaker: 'Low speaker volume',
      loud: 'Loud music',
      gym_daily: 'Gym every morning',
      not_really: 'Not into fitness',
      true: 'Yes',
      false: 'No'
    };
    return map[String(value)] ?? String(value);
  };
  return [
  {
    label: 'Sleep schedule',
    score: you.sleep === p.lifestyle.sleep ? 96 : 62,
    you: label('sleep', you.sleep),
    them: label('sleep', p.lifestyle.sleep),
    note:
    you.sleep === p.lifestyle.sleep ?
    'You keep the same hours, so late-night kitchen trips will not wake anyone.' :
    'Different hours — worth agreeing on quiet times after 11pm.'
  },
  {
    label: 'Cleanliness',
    score: you.cleanliness === p.lifestyle.cleanliness ? 94 : 70,
    you: label('cleanliness', you.cleanliness),
    them: label('cleanliness', p.lifestyle.cleanliness),
    note:
    you.cleanliness === p.lifestyle.cleanliness ?
    'Same standard for common areas, so chores rarely become an argument.' :
    'Slightly different standards — a written chore rota helps here.'
  },
  {
    label: 'Food & kitchen',
    score: you.food === p.lifestyle.food ? 92 : 68,
    you: label('food', you.food),
    them: label('food', p.lifestyle.food),
    note:
    you.food === p.lifestyle.food ?
    'Same kitchen preference, so shared groceries and utensils are simple.' :
    'Different diets — separate shelves and pans usually solve it.'
  },
  {
    label: 'Social energy',
    score: you.social === p.lifestyle.social ? 90 : 74,
    you: label('social', you.social),
    them: label('social', p.lifestyle.social),
    note:
    you.social === p.lifestyle.social ?
    'Similar appetite for guests and house dinners.' :
    'One of you hosts more — agree on notice before guests arrive.'
  },
  {
    label: 'Habits & pets',
    score: you.smoking === p.lifestyle.smoking && you.pets === p.lifestyle.pets ? 88 : 66,
    you: `${label('smoking', you.smoking)} · pets ${you.pets ? 'yes' : 'no'}`,
    them: `${label('smoking', p.lifestyle.smoking)} · pets ${p.lifestyle.pets ? 'yes' : 'no'}`,
    note:
    you.smoking === p.lifestyle.smoking ?
    'Matching habits around smoking and pets inside the flat.' :
    'Set a balcony-only rule early to avoid friction.'
  },
  {
    label: 'Budget & locality',
    score,
    you: '₹18,000 – ₹25,000 · Koramangala, HSR Layout',
    them: `₹${p.budget.toLocaleString('en-IN')} · ${p.locality}`,
    note: 'Overlapping budget band and preferred neighbourhoods.'
  }];

}

const shared = (p: Profile) =>
p.interests.filter((i) =>
['Filter coffee', 'Trekking', 'Cooking', 'Books', 'Yoga', 'Podcasts', 'Indie music'].includes(i)
);

export const matches: MatchCandidate[] = [
{ profile: profiles[0], score: 94, status: 'suggested' },
{ profile: profiles[3], score: 91, status: 'incoming' },
{ profile: profiles[1], score: 86, status: 'accepted' },
{ profile: profiles[2], score: 78, status: 'sent' },
{ profile: profiles[4], score: 74, status: 'suggested' },
{ profile: profiles[5], score: 64, status: 'suggested' }].
map((m) => ({
  ...m,
  sharedInterests: shared(m.profile),
  factors: factors(m.profile, m.score),
  requestedAt:
  m.status === 'incoming' ?
  '2 hours ago' :
  m.status === 'sent' ?
  'Yesterday' :
  m.status === 'accepted' ?
  '4 days ago' :
  undefined,
  message:
  m.status === 'incoming' ?
  'Hey! We both work from home and want a quiet flat in Indiranagar. Want to see a place together this weekend?' :
  undefined
}));

export const rooms: Room[] = [
{
  id: 'r1',
  title: 'Sunlit private room in a 3BHK with two designers',
  city: 'Bengaluru',
  locality: 'Koramangala 5th Block',
  rent: 21500,
  deposit: 43000,
  type: 'private_room',
  furnishing: 'furnished',
  availableFrom: '2026-10-01',
  images: [IMG.room1, IMG.room2, IMG.room3],
  amenities: ['Wi-Fi 300 Mbps', 'Attached bathroom', 'Cook 6 days', 'Washing machine', 'Power backup', 'Covered parking'],
  flatmates: 2,
  preferredGender: 'female',
  hostId: 'p1',
  verified: true,
  description:
  'Corner room with a balcony in a quiet lane off 5th Block. Two of us work in design, we cook together on Sundays and keep the flat calm on weekdays.',
  houseRules: ['No smoking indoors', 'Guests with a heads-up', 'Vegetarian kitchen', 'Quiet hours after 11pm'],
  bills: { rent: 21500, maintenance: 1500, internet: 400, electricity: 900 }
},
{
  id: 'r2',
  title: 'Spacious room in a quiet 2BHK near Indiranagar metro',
  city: 'Bengaluru',
  locality: 'Indiranagar',
  rent: 28000,
  deposit: 56000,
  type: 'private_room',
  furnishing: 'semi_furnished',
  availableFrom: '2026-11-01',
  images: [IMG.room2, IMG.room1, IMG.room3],
  amenities: ['Wi-Fi 200 Mbps', 'Balcony', 'Lift', 'Gym in building', 'Pet friendly'],
  flatmates: 1,
  preferredGender: 'any',
  hostId: 'p4',
  verified: true,
  description:
  'Walking distance to the metro and 100 ft road. I work from home so weekdays are quiet; the second bedroom gets morning light.',
  houseRules: ['Pets welcome', 'No parties on weekdays', 'Split bills on the 5th'],
  bills: { rent: 28000, maintenance: 2000, internet: 500, electricity: 1200 }
},
{
  id: 'r3',
  title: 'Furnished studio for one, walk to Gachibowli tech park',
  city: 'Hyderabad',
  locality: 'Gachibowli',
  rent: 16500,
  deposit: 33000,
  type: 'studio',
  furnishing: 'furnished',
  availableFrom: '2026-09-28',
  images: [IMG.room3, IMG.room1, IMG.room2],
  amenities: ['Wi-Fi included', 'Kitchenette', 'Security 24x7', 'Water purifier'],
  flatmates: 0,
  preferredGender: 'any',
  hostId: 'p5',
  verified: false,
  description:
  'Compact studio in a gated community, 10 minutes from the tech park. Ideal for someone who wants their own space without a big rent.',
  houseRules: ['No smoking', 'No loud music after 10pm'],
  bills: { rent: 16500, maintenance: 1200, internet: 0, electricity: 800 }
},
{
  id: 'r4',
  title: 'Shared room in a friendly 3BHK, Baner',
  city: 'Pune',
  locality: 'Baner',
  rent: 11000,
  deposit: 22000,
  type: 'shared_room',
  furnishing: 'furnished',
  availableFrom: '2026-10-05',
  images: [IMG.room1, IMG.room3, IMG.room2],
  amenities: ['Wi-Fi 150 Mbps', 'Cook 5 days', 'Two-wheeler parking', 'Terrace access'],
  flatmates: 3,
  preferredGender: 'male',
  hostId: 'p6',
  verified: true,
  description:
  'Four of us in a 3BHK — two engineers, one student, one filmmaker. Chill house, movie nights on Fridays, everyone cleans their own plates.',
  houseRules: ['Split groceries weekly', 'Smoking on balcony only', 'No overnight guests on weekdays'],
  bills: { rent: 11000, maintenance: 800, internet: 300, electricity: 600 }
}];


export const threads: ChatThread[] = [
{
  id: 't1',
  participantId: 'p2',
  lastMessage: 'Perfect, let us do the HSR flat visit at 11 on Saturday.',
  lastAt: '10:42 AM',
  unread: 2,
  online: true,
  context: 'Accepted match · 86% compatible'
},
{
  id: 't2',
  participantId: 'p1',
  lastMessage: 'I have shared photos of the Koramangala room, have a look!',
  lastAt: 'Yesterday',
  unread: 0,
  online: false,
  context: 'Room enquiry · Koramangala 5th Block'
},
{
  id: 't3',
  participantId: 'p4',
  lastMessage: 'Do you work from home every day or only twice a week?',
  lastAt: 'Mon',
  unread: 0,
  online: true,
  context: 'Incoming request · 91% compatible'
}];


export const messages: ChatMessage[] = [
{ id: 'm1', threadId: 't1', senderId: 'p2', body: 'Hey Priya! Saw we matched at 86%. Are you still looking around HSR?', at: '10:12 AM', read: true },
{ id: 'm2', threadId: 't1', senderId: 'me', body: 'Hi Rohan! Yes, budget around ₹22k and I can move by 1 October.', at: '10:18 AM', read: true },
{ id: 'm3', threadId: 't1', senderId: 'p2', body: 'That works. I found a 2BHK in HSR Sector 2 at ₹42k total, so ₹21k each.', at: '10:30 AM', read: true },
{ id: 'm4', threadId: 't1', senderId: 'p2', body: 'Perfect, let us do the HSR flat visit at 11 on Saturday.', at: '10:42 AM', read: false },
{ id: 'm5', threadId: 't2', senderId: 'p1', body: 'I have shared photos of the Koramangala room, have a look!', at: 'Yesterday', read: true },
{ id: 'm6', threadId: 't3', senderId: 'p4', body: 'Do you work from home every day or only twice a week?', at: 'Mon', read: true }];


export const notifications: AppNotification[] = [
{
  id: 'n1',
  kind: 'match_request',
  title: 'Kabir Malhotra sent you a match request',
  body: '91% compatible · works from home, very tidy, Indiranagar',
  at: '2 hours ago',
  read: false,
  link: '/app/matches'
},
{
  id: 'n2',
  kind: 'message',
  title: 'New message from Rohan Deshpande',
  body: 'Perfect, let us do the HSR flat visit at 11 on Saturday.',
  at: '3 hours ago',
  read: false,
  link: '/app/chat/t1'
},
{
  id: 'n3',
  kind: 'room',
  title: 'A new room matches your filters',
  body: 'Private room in Koramangala 5th Block · ₹21,500/month',
  at: 'Yesterday',
  read: false,
  link: '/app/rooms/r1'
},
{
  id: 'n4',
  kind: 'verification',
  title: 'Your college ID is under review',
  body: 'Verification usually completes within one working day.',
  at: '2 days ago',
  read: true,
  link: '/app/verification'
},
{
  id: 'n5',
  kind: 'match_accepted',
  title: 'Rohan Deshpande accepted your request',
  body: 'You can now chat and plan a flat visit together.',
  at: '4 days ago',
  read: true,
  link: '/app/chat/t1'
}];


export const quizQuestions: Array<{
  key: keyof Lifestyle;
  question: string;
  helper: string;
  options: Array<{value: string | boolean;label: string;emoji?: string;}>;
}> = [
{
  key: 'sleep',
  question: 'When does your day usually end?',
  helper: 'Sleep schedule is the top reason flatmates clash.',
  options: [
  { value: 'early_bird', label: 'In bed before 11pm' },
  { value: 'flexible', label: 'Depends on the week' },
  { value: 'night_owl', label: 'Awake past 1am' }]

},
{
  key: 'cleanliness',
  question: 'How tidy do you keep common areas?',
  helper: 'Be honest — this sets expectations for chores.',
  options: [
  { value: 'very_tidy', label: 'Spotless, I clean daily' },
  { value: 'tidy', label: 'Tidy, weekly deep clean' },
  { value: 'relaxed', label: 'Relaxed, some mess is fine' }]

},
{
  key: 'social',
  question: 'What does a good weekend at home look like?',
  helper: 'Helps us match your appetite for guests.',
  options: [
  { value: 'homebody', label: 'Quiet, just the flat' },
  { value: 'balanced', label: 'A few friends over sometimes' },
  { value: 'very_social', label: 'House dinners and parties' }]

},
{
  key: 'food',
  question: 'What is cooked in your kitchen?',
  helper: 'Shared kitchens work best when this is clear.',
  options: [
  { value: 'vegetarian', label: 'Vegetarian only' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
  { value: 'jain', label: 'Jain' }]

},
{
  key: 'smoking',
  question: 'Do you smoke?',
  helper: 'Balcony-only is the most common house rule.',
  options: [
  { value: 'no', label: 'No' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'yes', label: 'Yes' }]

},
{
  key: 'pets',
  question: 'Are pets welcome in the flat?',
  helper: 'Includes your own pets and your flatmates\u2019.',
  options: [
  { value: true, label: 'Yes, love them' },
  { value: false, label: 'Prefer no pets' }]

},
{
  key: 'workFromHome',
  question: 'Do you work from home?',
  helper: 'Daytime calls need a quiet flat.',
  options: [
  { value: true, label: 'Most days' },
  { value: false, label: 'I am out at work' }]

},
{
  key: 'music',
  question: 'How do you listen to music at home?',
  helper: 'Noise is the second biggest flatmate conflict.',
  options: [
  { value: 'headphones', label: 'Headphones mostly' },
  { value: 'low_speaker', label: 'Speaker on low' },
  { value: 'loud', label: 'Loud and proud' }]

}];


export const adminStats = {
  totals: {
    users: 12840,
    activeToday: 2317,
    verifiedUsers: 8461,
    pendingVerifications: 43,
    rooms: 1962,
    matchesMade: 5738,
    reports: 7,
    revenue: 486500
  },
  weekly: [
  { day: 'Mon', signups: 128, matches: 214 },
  { day: 'Tue', signups: 156, matches: 241 },
  { day: 'Wed', signups: 142, matches: 268 },
  { day: 'Thu', signups: 173, matches: 292 },
  { day: 'Fri', signups: 198, matches: 341 },
  { day: 'Sat', signups: 224, matches: 386 },
  { day: 'Sun', signups: 186, matches: 304 }],

  cityMix: [
  { city: 'Bengaluru', users: 4820 },
  { city: 'Mumbai', users: 2614 },
  { city: 'Pune', users: 1982 },
  { city: 'Hyderabad', users: 1730 },
  { city: 'Delhi NCR', users: 1694 }],

  queue: [
  { id: 'v1', name: 'Meher Kaur', city: 'Bengaluru', doc: 'College ID · IIM Bangalore', at: '12 min ago' },
  { id: 'v2', name: 'Aditya Sharma', city: 'Pune', doc: 'Aadhaar + Offer letter', at: '1 hour ago' },
  { id: 'v3', name: 'Nikhil Menon', city: 'Chennai', doc: 'Employee ID · Zoho', at: '3 hours ago' },
  { id: 'v4', name: 'Tanvi Joshi', city: 'Mumbai', doc: 'College ID · NMIMS', at: 'Yesterday' }],

  flagged: [
  { id: 'f1', type: 'Listing', subject: 'PG in Andheri West · ₹6,000', reason: 'Suspected broker posting as owner', at: '2 hours ago' },
  { id: 'f2', type: 'Profile', subject: 'Unverified account · Delhi NCR', reason: 'Reported for spam messages', at: 'Yesterday' }]

};