CHAI.N.CHAPTER
MASTER ENGINEERING HANDBOOK
Version 1.0
Owner: Anshika Mishra

==================================================
TABLE OF CONTENTS
1. Introduction
2. Product Vision & Goals
3. System Architecture Overview
4. Monorepo Structure
5. Backend Engineering Guide
6. Frontend Engineering Guide
7. Data Models & Schemas
8. API Design & Contracts
9. Subscription & Notification System
10. Book Clubs Feature
11. SEO & Performance Strategy
12. Security & Reliability
13. Development Workflow & Standards
14. Deployment & Environment Setup
15. Future Scalability
==================================================

1. INTRODUCTION
This handbook is the single source of truth for engineering chai.n.chapter.
It is written so that any developer can onboard and build the system without
needing additional clarification.

2. PRODUCT VISION & GOALS
chai.n.chapter is a personal brand-driven book blog focused on:
- Book reviews and wrap-ups
- Reflective writing
- Reader-first experience
- High SEO visibility
- Ethical monetization readiness

Non-goals:
- No social feed or commenting system in MVP
- No user accounts for readers

3. SYSTEM ARCHITECTURE OVERVIEW

3.1 Architectural Style
- Monorepo
- 3-Tier Architecture
  Presentation (Next.js)
  Application (Node.js + Express)
  Data (MongoDB)

3.2 High-Level Flow
Browser → Frontend → Backend API → MongoDB

4. MONOREPO STRUCTURE

chai-n-chapter/
  apps/
    api/     Backend
    web/     Frontend
  docs/     Specifications & Architecture
  packages/ Shared utilities (future)

5. BACKEND ENGINEERING GUIDE

5.1 Backend Architecture
MVC-inspired layered architecture:
Routes → Controllers → Services → Models → Database

5.2 Backend Folder Structure

apps/api/src/
  server.ts
  app.ts
  config/
  routes/
  controllers/
  services/
  models/
  middlewares/
  utils/

5.3 Backend Responsibilities
- Content APIs
- Subscription system
- Email notifications
- Book clubs API
- Admin authentication

6. FRONTEND ENGINEERING GUIDE

6.1 Frontend Architecture
Next.js route-based + component-driven architecture
MVVM-style separation via hooks

6.2 Frontend Folder Structure

apps/web/src/
  app/
  components/
  lib/
  hooks/
  styles/
  types/

6.3 Frontend Responsibilities
- Page rendering
- SEO & metadata
- Subscription & contact forms
- Blog reading experience

7. DATA MODELS & SCHEMAS (ABSTRACT)

Post:
- title, slug, content, status, seo, timestamps

Category:
- name, slug, description

Subscriber:
- email, receiveAll, status

BookClub:
- name, description, platform, joinLink

8. API DESIGN & CONTRACTS

Base URL: /api

Public Endpoints:
- GET /posts
- GET /posts/:slug
- GET /categories
- GET /book-clubs
- POST /subscribe
- POST /contact

Admin Endpoints:
- POST /auth/login
- CRUD /posts
- CRUD /categories

9. SUBSCRIPTION & NOTIFICATION SYSTEM

- Email-based subscription
- Category-based preferences
- Double opt-in confirmation
- Notify on publish
- Preference management links

10. BOOK CLUBS FEATURE

- Dedicated page
- Direct redirect to Instagram / WhatsApp groups
- No personal data collection in Phase 1

11. SEO & PERFORMANCE STRATEGY

Frontend:
- SSR, SSG, ISR
- Metadata per route
- Sitemap & robots.txt
- Image optimization

Backend:
- Fast API responses
- Caching-friendly headers

12. SECURITY & RELIABILITY

- JWT-based admin auth
- Rate limiting on sensitive routes
- Input validation
- Centralized error handling
- Secure headers

13. DEVELOPMENT WORKFLOW & STANDARDS

- Feature-based commits
- Clear commit messages
- All assumptions logged in docs/DECISIONS.md
- Architecture changes require documentation

14. DEPLOYMENT & ENVIRONMENT SETUP

Backend:
- Node.js + PM2
- Nginx reverse proxy
- SSL via Let’s Encrypt

Frontend:
- Vercel or equivalent
- Environment-based config

15. FUTURE SCALABILITY

- Paid subscriptions
- Affiliate tracking
- Advanced analytics
- Admin dashboard
- Comment system (moderated)

END OF DOCUMENT
