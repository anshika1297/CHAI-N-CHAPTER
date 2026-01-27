
CHAPTERS.AUR.CHAI
MASTER SOFTWARE REQUIREMENTS & PRODUCT SPECIFICATION
Version 1.0

Owner: Anshika Mishra

--------------------------------------------------
TABLE OF CONTENTS
1. Introduction
2. Product Vision & Brand Positioning
3. Software Requirements Specification (SRS)
4. Feature Set & User Experience
5. Subscription & Notification System
6. Content Structure: Categories, Tags & Links
7. Book Clubs Feature
8. Database Schema
9. API Contracts
10. Admin Panel UX Flow
11. Frontend Routing & Pages
12. Monetization Structure (Phase 1)
13. Visual Design Identity
14. Non‑Functional Requirements
15. Launch Checklist & Future Scope
--------------------------------------------------

1. INTRODUCTION
chapters.aur.chai is a personal brand–driven book blog platform built to host book reviews,
reading wrap-ups, and reflective essays. The platform prioritizes reader comfort, trust,
and long-term scalability over algorithmic noise.

2. PRODUCT VISION & BRAND POSITIONING
The platform is positioned as a quiet, thoughtful digital space where books meet
personal reflection. It is designed to feel intimate, slow, and human.

Core values:
• Reader-first experience
• Calm, distraction-free design
• Ethical monetization
• Community-driven growth

3. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

3.1 Core Capabilities
• Publish rich blog posts with text and multiple images
• Organize posts using dynamic categories and tags
• Allow multi-category assignment per post
• Support structured internal and external links
• Enable category-based email subscriptions
• Display monetization and collaboration information
• Showcase book clubs run by the author

4. FEATURE SET & USER EXPERIENCE

4.1 Blog Posts
• Rich text editor (bold, italic, headings, quotes, lists)
• Multiple inline images with captions & alt text
• Reading progress bar
• Estimated reading time
• Related posts section
• Optional disclosure block

4.2 Reading Experience Enhancements
• Distraction-free reading mode
• Highlightable quotes
• Clean typography & generous spacing

5. SUBSCRIPTION & NOTIFICATION SYSTEM

• Email-based subscription (no account required)
• User can select preferred content categories
• Optional opt-in for all blog notifications
• Double opt-in email confirmation
• Category-matched notifications on new post publish
• Preference management via secure link

6. CONTENT STRUCTURE

6.1 Categories (Dynamic)
Examples:
• Book Reviews
• Weekly Wrap-Up
• Monthly Wrap-Up
• Yearly Wrap-Up
• Book Recommendations
• Reflection Corner

6.2 Tags
• Descriptive and optional
• Used for discovery, not navigation

6.3 Structured Links
• Author links (Instagram / website)
• Book links (purchase / affiliate-ready)
• Link type flag: organic / affiliate / sponsored

7. BOOK CLUBS FEATURE

7.1 Purpose
To showcase active book clubs hosted by the author and redirect interested readers
to community platforms.

7.2 Implementation (Phase 1)
• Dedicated Book Clubs page
• Each club displays:
  - Club name
  - Description
  - Reading focus
  - Platform (Instagram / WhatsApp)
• Join button redirects directly to group/community link

(No personal data collection in Phase 1)

8. DATABASE SCHEMA (ABSTRACT)

Post
- id, title, slug, content, status, seo fields, timestamps

Category
- id, name, slug, description

Tag
- id, name, slug

PostCategory
- post_id, category_id

Subscriber
- id, email, receive_all, status

SubscriberCategory
- subscriber_id, category_id

Book
- id, title, author, isbn, purchase_links

Author
- id, name, instagram_url, website_url

BookClub
- id, name, description, platform, join_link

9. API CONTRACTS (SUMMARY)

Auth
• POST /api/auth/login

Posts
• POST /api/posts
• GET /api/posts
• GET /api/posts/{slug}
• PUT /api/posts/{id}
• DELETE /api/posts/{id}

Categories
• POST /api/categories
• GET /api/categories

Subscriptions
• POST /api/subscribe
• GET /api/subscriber/preferences
• PUT /api/subscriber/preferences

Book Clubs
• GET /api/book-clubs

Contact
• POST /api/contact

10. ADMIN PANEL UX FLOW

• Dashboard overview
• Rich blog editor
• Category manager
• Subscriber list
• Contact inbox
• Book club manager

11. FRONTEND ROUTING

Public:
/
/blog
/blog/[slug]
/category/[slug]
/book-clubs
/work-with-me
/contact
/about

Admin:
/admin/dashboard
/admin/posts
/admin/categories
/admin/subscribers

12. MONETIZATION (PHASE 1)

• Work With Me page
• Sponsored reviews
• Brand collaborations
• Affiliate disclosures
(No payments collected initially)

13. VISUAL DESIGN IDENTITY

Brand Mood:
Warm, literary, calm, intimate

Color Palette:
• Chai Brown: #6B4F3F
• Cream Beige: #F6F1EB
• Sage Green: #9CAF88
• Muted Terracotta: #C97C5D

Typography:
• Headings: Playfair Display / Libre Baskerville
• Body: Lora / Inter
• Line height: 1.6–1.8
• Max content width: 680–720px

UI Principles:
• No clutter
• Soft shadows
• Minimal animations
• Mobile-first

14. NON-FUNCTIONAL REQUIREMENTS

• Fast load times
• SEO-friendly rendering
• Accessibility-compliant
• Secure admin routes
• Scalable architecture

15. LAUNCH CHECKLIST & FUTURE SCOPE

Launch:
• About page live
• First 5 posts published
• Subscription flow tested
• Book clubs listed
• Analytics enabled

Future:
• Interest-based book club forms
• Paid subscriptions
• Affiliate tracking
• Advanced analytics

END OF DOCUMENT

