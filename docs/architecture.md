chapters.aur.chai – Architecture Overview

Purpose:
Defines the approved architecture for chapters.aur.chai.

System Architecture:
3-Tier (Frontend → Backend → Database)

Monorepo:
apps/web (Next.js)
apps/api (Node.js)
docs/

Backend:
MVC-inspired layered architecture:
Routes → Controllers → Services → Models → MongoDB

Frontend:
Next.js route-based architecture
MVVM-style separation using hooks

SEO & Performance:
SSR, SSG, ISR
Metadata per page
Sitemap & robots.txt

Status:
Approved and production-ready
