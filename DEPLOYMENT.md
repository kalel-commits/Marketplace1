# Deployment Guide for NearCut

This guide will help you deploy NearCut to production and gather real users.

## Pre-Deployment Checklist

### 1. Firebase Configuration
- [ ] Update Firebase Security Rules for production
- [ ] Set up proper Firestore indexes
- [ ] Configure Firebase Authentication settings
- [ ] Set up Firebase Hosting (optional) or use Vercel/Netlify

### 2. Environment Variables
Ensure all Firebase environment variables are set in your deployment platform:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. Create Admin User
Before deploying, create an admin user:
1. Sign up normally as a business owner or freelancer
2. In Firebase Console > Firestore Database
3. Find the user document
4. Update the `role` field to `"admin"`

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Or use Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Configure:**
   - Framework Preset: Next.js
   - Root Directory: `.` (if repo is at root)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Option 2: Netlify

1. **Connect Repository:**
   - Go to [netlify.com](https://netlify.com)
   - Import from GitHub
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

2. **Add Environment Variables:**
   - Site settings > Environment variables
   - Add all Firebase variables

### Option 3: Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize:**
   ```bash
   firebase init hosting
   ```

3. **Build and Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

## Post-Deployment Steps

### 1. Update Firebase Security Rules

Update Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true; // Anyone can read user profiles
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if resource.data.status == 'open' || 
                     (request.auth != null && resource.data.business_owner_id == request.auth.uid);
      allow create: if request.auth != null && 
                       request.resource.data.business_owner_id == request.auth.uid;
      allow update: if request.auth != null && 
                       resource.data.business_owner_id == request.auth.uid;
    }
    
    // Applications collection
    match /applications/{applicationId} {
      allow read: if request.auth != null && (
        resource.data.freelancer_id == request.auth.uid ||
        get(/databases/$(database)/documents/tasks/$(resource.data.task_id)).data.business_owner_id == request.auth.uid
      );
      allow create: if request.auth != null && 
                       request.resource.data.freelancer_id == request.auth.uid;
      allow update: if request.auth != null && 
                       get(/databases/$(database)/documents/tasks/$(resource.data.task_id)).data.business_owner_id == request.auth.uid;
    }
  }
}
```

### 2. Set Up Firestore Indexes

Create these composite indexes in Firebase Console:

1. **Collection: `tasks`**
   - Fields: `status` (Ascending), `created_at` (Descending)

2. **Collection: `applications`**
   - Fields: `task_id` (Ascending), `created_at` (Descending)
   - Fields: `freelancer_id` (Ascending), `created_at` (Descending)

### 3. Test Admin Access

1. Create admin user (see above)
2. Log in as admin
3. Verify admin dashboard loads all data
4. Test search functionality
5. Verify Instagram IDs are visible for freelancers

## Gathering Users

### For Business Owners:
- Share the platform in local business groups
- Post on social media
- Reach out to small businesses directly
- Create sample tasks to show how it works

### For Freelancers:
- Share in freelancer communities
- Post on Instagram (since they need Instagram IDs)
- Reach out to content creators and editors
- Create a referral program

## Monitoring

### Admin Dashboard Features:
- View all users with Instagram IDs
- Monitor all tasks and applications
- Track user growth
- Search and filter data
- Export data if needed (future feature)

### Key Metrics to Track:
- Total users (business owners vs freelancers)
- Tasks created
- Applications submitted
- Acceptance rate
- User engagement

## Next Steps After Launch

1. **Gather Feedback:**
   - Monitor admin dashboard for patterns
   - Collect user feedback
   - Track common issues

2. **Refine Based on Data:**
   - Analyze which categories are most popular
   - See which locations have most activity
   - Understand pricing patterns
   - Identify feature requests

3. **Iterate:**
   - Add features based on real usage
   - Improve UX based on feedback
   - Optimize performance
   - Add missing functionality

## Support

For issues or questions:
- Check Firebase Console for errors
- Monitor admin dashboard for data issues
- Review user feedback
- Check application logs

## Security Notes

- Never commit `.env.local` to git
- Use environment variables in deployment platform
- Regularly update dependencies
- Monitor Firebase usage and costs
- Set up proper security rules
