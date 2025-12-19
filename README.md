# Prolance - Connecting Talent & Projects

A professional marketplace connecting businesses with skilled video editors. Business owners can review freelancer sample reels before choosing the perfect editor for their projects.

## Features

- **Two-Role System**: Business Owners and Freelancers
- **Sample Reels**: Freelancers upload 3 sample reels showcasing their work
- **Reel Preview**: Business owners can watch freelancer reels when reviewing applications
- **Authentication**: Email/password with role selection
- **Task Management**: Business owners can post tasks with title, description, category, budget, and location
- **Application System**: Freelancers can browse tasks and apply with proposals and prices
- **Dashboards**: Role-specific dashboards showing relevant information
- **WhatsApp Integration**: Simple contact via WhatsApp button
- **User Profiles**: Complete profile management with reel uploads

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Backend (Firestore database + Authentication)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon) > General tab
4. Scroll down to "Your apps" section
5. Click on the Web icon (`</>`) to add a web app
6. Copy the Firebase configuration object
7. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Enable Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

### 4. Set up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (for MVP - you can add security rules later)
4. Choose a location for your database

### 5. Set up Firestore Security Rules

Go to Firestore Database > Rules and use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true; // Anyone can read user profiles
      allow write: if request.auth != null && request.auth.uid == userId; // Users can only update their own profile
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if resource.data.status == 'open' || request.auth != null && resource.data.business_owner_id == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.business_owner_id == request.auth.uid;
      allow update: if request.auth != null && resource.data.business_owner_id == request.auth.uid;
    }
    
    // Applications collection
    match /applications/{applicationId} {
      allow read: if request.auth != null && (
        resource.data.freelancer_id == request.auth.uid ||
        get(/databases/$(database)/documents/tasks/$(resource.data.task_id)).data.business_owner_id == request.auth.uid
      );
      allow create: if request.auth != null && request.resource.data.freelancer_id == request.auth.uid;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/tasks/$(resource.data.task_id)).data.business_owner_id == request.auth.uid;
    }
  }
}
```

### 6. Create Firestore Indexes

Firestore may require composite indexes. If you see errors about missing indexes, click the link in the error message to create them automatically, or create these indexes manually:

1. Go to Firestore Database > Indexes
2. Create these composite indexes:
   - Collection: `tasks`
     - Fields: `status` (Ascending), `created_at` (Descending)
   - Collection: `applications`
     - Fields: `task_id` (Ascending), `created_at` (Descending)
   - Collection: `applications`
     - Fields: `freelancer_id` (Ascending), `created_at` (Descending)

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── dashboard/
│   │   ├── business/      # Business owner dashboard
│   │   └── freelancer/    # Freelancer dashboard
│   ├── tasks/
│   │   ├── create/        # Create task page
│   │   ├── [id]/          # Task details page
│   │   └── page.tsx       # Task list page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── profile/           # Profile page
│   └── layout.tsx         # Root layout
├── components/
│   └── Navbar.tsx         # Navigation component
├── lib/
│   ├── firebase.ts        # Firebase client & types
│   ├── auth.ts            # Authentication utilities
│   └── tasks.ts           # Task & application utilities
└── README.md
```

## Key Pages

- `/login` - Login page
- `/signup` - Signup with role selection
- `/dashboard/business` - Business owner dashboard
- `/dashboard/freelancer` - Freelancer dashboard
- `/tasks` - Browse all tasks
- `/tasks/create` - Create new task (business owners only)
- `/tasks/[id]` - Task details and application
- `/profile` - User profile management

## Firebase Collections Structure

- **users**: User profiles with role, contact info, and bio
- **tasks**: Tasks posted by business owners
- **applications**: Applications submitted by freelancers

## Next Steps

This is a minimal MVP. Consider adding:

- Email notifications
- File uploads for portfolios/work samples
- Reviews and ratings
- Payment integration
- Advanced search and filters
- Real-time chat (currently using WhatsApp)
- Task status workflow management
- Analytics and reporting
