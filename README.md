# 🏠 Roomie2Homie

**Find your compatible roommate. Build a better living experience.**

Roomie2Homie is an MCA mini-project designed to help students and working professionals find suitable roommates based on their lifestyle, preferences, habits, and compatibility. The platform aims to make roommate searching easier, safer, and more organized through profile management, roommate matching, accommodation listings, and communication features.

## 📌 Project Overview

Finding a compatible roommate can be challenging because people have different lifestyles, schedules, budgets, cleanliness preferences, and living habits. Roomie2Homie aims to address this problem by providing a centralized platform where users can discover potential roommates and make more informed decisions.

The system is designed around roommate compatibility, allowing users to share their preferences and explore potential matches according to their requirements.

## 🎯 Objectives

- Develop a user-friendly platform for finding compatible roommates.
- Match users according to their lifestyle and personal preferences.
- Allow users to create and manage profiles.
- Help users discover accommodation and roommate opportunities.
- Support communication between interested users.
- Improve the convenience and transparency of the roommate-finding process.

## ✨ Key Features

### 👤 User Authentication and Profiles
- User registration and login.
- Personal profile management.
- Store relevant lifestyle preferences and roommate requirements.
- Manage profile information.

### 🤝 Roommate Matching
- Match users based on lifestyle preferences and compatibility.
- Collect user preferences through a questionnaire.
- Compare responses to identify potential roommate matches.
- Help users understand compatibility before making a decision.

### 📝 Lifestyle Questionnaire
The questionnaire can capture preferences such as:

- Cleanliness and organization.
- Sleeping and waking schedules.
- Food and cooking habits.
- Smoking preferences.
- Noise tolerance and social activities.
- Budget and accommodation requirements.

### 🏡 Accommodation Listings
- Explore available accommodation options.
- View listing details and relevant requirements.
- Help users discover potential living arrangements.

### 💬 Communication
- Support communication between interested users.
- Allow users to express interest in potential matches.
- Provide a foundation for roommate-related conversations.

### 🔔 Notifications and Match Requests
- Keep users informed about relevant match activity.
- Support match requests and their status.
- Help users track roommate-finding interactions.

### 🔐 Security and Administration
- Authentication and protected access to relevant features.
- Secure password handling.
- A foundation for managing users and platform content.

*Note: The features listed above describe the project scope. Confirm which features are implemented in the current codebase before presenting them as completed functionality.*

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Icons | Lucide React |
| Animations | Framer Motion |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT and bcryptjs, where configured |
| Real-time communication | Socket.IO, where integrated |
| Version control | Git and GitHub |

## 🏗️ System Architecture

Roomie2Homie follows a client-server architecture.

```text
                ┌──────────────────────┐
                │        User          │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   React Frontend     │
                │  TypeScript + Vite   │
                └──────────┬───────────┘
                           │
                     HTTP / API
                           │
                           ▼
                ┌──────────────────────┐
                │   Express Backend    │
                │    Node.js + TS      │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │      MongoDB         │
                │   Application Data   │
                └──────────────────────┘
```

The frontend provides the user interface, the backend handles application logic and API requests, and MongoDB stores application data. Real-time communication can be provided through Socket.IO if enabled in the current implementation.

## 📂 Project Structure

The repository is organized into separate frontend, backend, and documentation directories.

```text
Roomie2Homie/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── project documentation
│
├── .gitignore
└── README.md
```

*The directory tree is illustrative. Keep the actual folder and file names from your repository if they differ.*

## ⚙️ Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) and npm.
- [Git](https://git-scm.com/).
- [MongoDB](https://www.mongodb.com/) or an accessible MongoDB Atlas database.
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/).

Verify the installations:

```bash
node --version
npm --version
git --version
```

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Roomie2Homie
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your actual GitHub repository URL.

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

Open another terminal from the project root:

```bash
cd backend
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the backend directory using the variable names expected by your backend code.

Example:

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/roomie2homie
JWT_SECRET=replace_with_a_secure_random_secret
CLIENT_URL=http://localhost:5173
```

If your application uses different environment variable names, use those defined in the backend configuration.

If your frontend requires environment variables, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

Only keep variables that your frontend actually uses. For example, a socket URL is needed only if the application integrates Socket.IO.

**Security:** Never commit `.env` files, database credentials, JWT secrets, or other private keys to GitHub. Use `.env.example` to document required variables without including real secrets.

### 5. Start MongoDB

Make sure your local MongoDB service is running, or configure the connection string for your MongoDB Atlas database.

### 6. Run the backend

From the backend directory:

```bash
npm run dev
```

If the backend does not define a `dev` script, check its `package.json` and use the appropriate development command.

### 7. Run the frontend

From the frontend directory in a separate terminal:

```bash
npm run dev
```

Vite commonly serves the frontend at:

```text
http://localhost:5173
```

Open the URL printed in your terminal. The actual port may differ if Vite selects another available port.

## 📜 Useful Commands

Run commands from the relevant frontend or backend directory.

| Command | Purpose |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start the development server, if configured |
| `npm run build` | Build the application, if configured |
| `npm run lint` | Run lint checks, if configured |
| `npm run test` | Run tests, if configured |

Available commands depend on the scripts defined in each directory's `package.json`.

## 🧠 Roommate Compatibility Concept

The roommate matching process can be organized into the following steps:

1. A user creates an account and completes their profile.
2. The user answers lifestyle and accommodation preference questions.
3. The system compares preferences between users.
4. Potential matches are ranked or presented according to compatibility.
5. Users review profiles and express interest in suitable matches.

A future enhancement could introduce a machine learning model to improve match recommendations using user preferences and feedback. Any ML-based recommendation should be described as implemented only if it exists in the codebase.

## 🔮 Future Enhancements

- Machine learning-based roommate recommendations.
- More detailed compatibility explanations.
- Improved profile verification.
- Advanced search and filtering.
- Location-based roommate discovery.
- Better notification and messaging capabilities.
- Mobile-friendly improvements.
- User feedback to refine match recommendations.

## 🐛 Troubleshooting

### Frontend dependencies fail to install

Try running the following inside `frontend/`:

```bash
npm install
```

If the issue persists, check the error message and your Node.js and npm versions before deleting or regenerating any lock files.

### Backend cannot connect to MongoDB

- Verify that MongoDB is running.
- Check the database connection string in the backend `.env` file.
- Confirm that the database is reachable.
- Check that the variable name matches the backend configuration.

### Frontend cannot communicate with the backend

- Ensure the backend server is running.
- Verify the frontend API URL.
- Check the backend port and CORS configuration.
- Inspect the browser console and backend terminal for errors.

### Missing npm script

Run:

```bash
npm run
```

This displays the scripts available in the current package.

### Git reports merge conflicts

Review the conflicting files carefully, resolve the conflict markers, and test the project before committing the resolution.

## 🤝 Contribution Guidelines

1. Pull the latest changes from `main`.
2. Create a separate feature branch for your work.
3. Make changes related to your assigned task.
4. Test the changes before committing.
5. Use clear and descriptive commit messages.
6. Push your branch and open a Pull Request targeting `main`.
7. Avoid committing generated files, dependencies, environment secrets, or unrelated changes.

## 👥 Project Team

This project is developed collaboratively by the following MCA students:

1. **Twinkle Singh**
2. **Rujuta Dani**
3. **Prapti Dodal**
4. **Tanvi Ballal**
5. **Rashita Jomes**

*Developed as an MCA group project.*
## 📚 Project Documentation

Additional project documents and supporting materials are maintained in the `docs/` directory where available.

## 🎓 Academic Project

Developed as an MCA mini-project.

---

*Roomie2Homie — Helping people find compatible roommates for a better shared-living experience.*
