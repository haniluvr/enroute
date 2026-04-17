# 📱 Mobile App Audit & Gap Analysis

This report outlines the current status of the Enroute mobile application, identifying missing features, logic gaps, and areas for improvement based on a thorough scan of the `apps/mobile` and `apps/backend` codebases.

---

## 🏗️ Missing Screens

While the core flow is present, several supporting screens are missing to provide a complete user experience:

1.  **Job Application Tracker**: 
    - **Current**: Users can "Swipe Right" on jobs in `explore.tsx`.
    - **Missing**: A dedicated screen to view "Interested" jobs, track application status, or manage saved opportunities.
2.  **Mentorship & Networking Hub**:
    - **Missing**: A section to connect with mentors or peer groups, which is a staple in career development.
3.  **Advanced Skills Dashboard**:
    - **Current**: CV Scan shows skills.
    - **Missing**: A centralized "Skills Profile" where users can manually add, verify, or see a heat-map of their skill growth over time across roadmaps.
4.  **Learning Resource Details**:
    - **Current**: Roadmap steps mention platforms like "Coursera".
    - **Missing**: Clicking a step doesn't show a detailed view of the specific course, reviews, or a direct "Enroll" integration beyond a simple external link.
5.  **Offline Roadmap Access**:
    - **Missing**: A "Saved Offline" view for roadmaps and recorded ideas to allow career planning without data.

---

## 🧠 Missing Logic & Functions

1.  **Real-Time Job Synchronization**:
    - **current**: Fetches from a static `jobs` table in Supabase.
    - **Missing**: Integration with the `externalDataService` (Adzuna/JSearch) on the mobile side to pull live, real-world job postings instead of mock/static data.
2.  **Push Notification Registry**:
    - **Current**: `notifications.tsx` screen exists.
    - **Missing**: The actual `expo-notifications` setup logic for token registration and handling background triggers (e.g., "A new job matches your roadmap!").
3.  **Session Persistence for Guests**:
    - **Current**: `home.tsx` and `dahlia.tsx` have logic for `pending` (guest) users that returns empty or "TODO".
    - **Missing**: LocalStorage (AsyncStorage) sync for guest users so their progress isn't lost if they don't sign up immediately.
4.  **AI-Driven Recommendation Engine**:
    - **Current**: Basic string matching in `explore.tsx` (`role.includes(suggestion)`).
    - **Missing**: A more robust logic using embeddings or an AI endpoint to suggest jobs based on *semantic* overlap between CV skills and job descriptions.

---

## 🗄️ Database Matching & Synchronization

1.  **Synchronization Strategy**:
    - **Current**: Manual `useEffect` hooks with state management.
    - **Missing**: Implementation of **React Query (TanStack Query)** or **SWR**. This leads to "stale" data and redundant loading states when navigating between tabs.
2.  **Missing Schema Relationships**:
    - **Missing**: `user_preferences` table to store more than just CV scans (e.g., "Remote only", "Salary expectations", "Preferred locations").
    - **Missing**: `learning_progress` table to track percent completion for specific roadmap steps across different roadmaps.
3.  **Database Matching**:
    - **Lacking**: The matching is currently done on the client-side (`explore.tsx`). This should be moved to a Postgres Function (RPC) or Backend service for better performance and scalability.

---

## ⚡ Improvements Needed

### 🎨 UI & UX
- **Micro-interactions**: The "Career Swipe" needs more visual feedback (e.g., "It's a Match!" overlay) when high-percentage roles are liked.
- **Onboarding Flow**: The `onboarding.tsx` is quite linear; it could be improved with more interactive persona selection.
- **Dynamic Glassmorphism**: Some screens use static `bg-white/10`. Standardizing the `GlassCard` and `GlassBackground` custom tokens across *all* components would improve consistency.

### ⚙️ Logic & Code Quality
- **Global Error Boundary**: Many screens use generic `console.error`. They need a global error handling UI that isn't just an `Alert`.
- **State Management**: Authentication state is checked on every screen. Centralizing this in a more robust `useAuth` provider with better caching would prevent "flicker" on load.
- **Input Validation**: `sign-up.tsx` and `edit-profile.tsx` need stronger client-side validation for phone numbers, URLs, and password strength.

---

## 🎯 Priority Checklist for Next Sprint

- [ ] Implement Live Job API sync in `explore.tsx`.
- [ ] Add `job_applications` table and "My Jobs" screen.
- [ ] Refactor fetching logic to use `TanStack Query`.
- [ ] Complete the "Guest to Registered" data migration logic.
- [ ] Enhance Match logic with a dedicated AI Matching Service.
