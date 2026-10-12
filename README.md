# OpenSpace — Civic & Campus Venue Booking

OpenSpace is a responsive web application for booking vetted school, university, and public library spaces outside academic hours (evenings and weekends).

## Tech Stack & Architecture

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS design tokens & modular components (Plus Jakarta Sans, Inter, WCAG-accessible focus states, responsive CSS Grid / Flexbox)
- **Icons**: Lucide React
- **Demo Data Layer**: Isolated local storage service (`src/services/storage.ts`) with defaults and in-memory fallback
- **Testing**: Vitest + React Testing Library + JSDOM (`npm test`)
- **Linting & Typecheck**: Oxlint (`npm run lint`) + TypeScript (`npm run build`)

---

## Phase 1 Implementation Summary

- **App Shell & Responsive Layout**: Accessible header with main navigation, sticky bar, and mobile responsive drawer menu.
- **Home Page**: Clear introduction explaining after-hours facility bookings, 3-step booking journey, hero metrics, visual preview, and featured sample spaces.
- **Venue Discovery Shell**: Catalog view loading realistic sample spaces across schools, universities, and libraries.
- **Staff Dashboard Foundation**: Administrative overview showing managed spaces, incoming request queue, and operational stats.
- **Visible Demo Mode Role Switcher**: Interactive role switch (`Organizer` ↔ `Institution Staff`) with persistent local state, active badge, and contextual role announcement banner.
- **Realistic Sample Dataset**: 6 curated educational venues with institution names, addresses, room capacities, hourly rates, amenities, and policy rules.
- **Demo Reset Control**: Easily reset data in footer or via storage service.

---

## Available Commands

### Development Server
```bash
npm run dev
```
Starts Vite development server at `http://localhost:5173/`.

### Automated Test Suite
```bash
npm test
```
Runs Vitest test suite (Unit & Integration tests).

### Linter
```bash
npm run lint
```
Runs Oxlint checks across the codebase.

### Production Build & Typecheck
```bash
npm run build
```
Executes TypeScript compilation (`tsc -b`) and Vite production bundle.
