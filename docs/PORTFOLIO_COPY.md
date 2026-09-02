# Sevgilim Cepte — Portfolio Copy

Ready-to-use copy for portfolio website and project presentations.

---

## Title

**Sevgilim Cepte**

## Subtitle

Private Couples Companion App

## Short Description

A private two-user iOS companion app built with React Native, Expo, TypeScript and Supabase, featuring real-time synchronization, shared memories and calendar, push notifications, mood tracking, daily photo streaks, and an AI assistant with tool calling for calendar and event management.

## Tech Stack

React Native · Expo · TypeScript · Supabase · PostgreSQL · Realtime · Edge Functions · OpenAI · Zustand · NativeWind

## Portfolio Bullets

1. **Secure real-time data sharing** — Supabase Realtime with PostgreSQL Row Level Security ensures two linked users share calendar events, memories, and surprises instantly while preventing any unauthorized access.

2. **AI assistant with tool calling** — OpenAI GPT-4o integration via server-side Edge Function with function calling that can add calendar events, special days, and love reasons — all with user confirmation before any write operation.

3. **Full-stack mobile architecture** — Private cloud storage with signed URLs, push notifications via Edge Functions, native integrations (Calendar, Location, Camera, Maps), and comprehensive TypeScript coverage across 13 Zustand stores.

## Long Case Study

### Problem

Long-distance and busy couples need a private, shared digital space — but existing apps are either too public (social media), too generic (messaging), or lack the emotional features that make a relationship app feel personal.

### Solution

Sevgilim Cepte is a bespoke companion app designed exclusively for two users. It combines shared calendar management, photo memories with location tagging, mood tracking, daily photo streaks, a surprise box with contextual unlock conditions, and an AI-powered conversational assistant — all synchronized in real-time between partners.

### Technical Architecture

The app is built on React Native with Expo for cross-platform iOS deployment, using TypeScript throughout for type safety. The backend leverages Supabase's PostgreSQL with Row Level Security (RLS) policies on every table, ensuring data isolation between the linked couple and any other users. A custom `linked_user_ids()` SQL function drives the partner access model.

Media storage uses private Supabase Storage buckets with authenticated signed URLs — no photos are publicly accessible. The AI assistant communicates with OpenAI via a Supabase Edge Function that keeps the API key server-side, validates all requests, and hardcodes the model to prevent client-side manipulation. The assistant supports function calling for write operations (calendar events, special days, love reasons) with a confirmation-before-write pattern.

Push notifications flow through a dedicated Edge Function that verifies the sender-receiver partner relationship before delivering via the Expo Push API. Real-time updates use Supabase's PostgreSQL change data capture, keeping both partners' screens synchronized without polling.

### Outcome

A production-quality mobile app deployed via EAS Build and TestFlight, with comprehensive security (RLS, server-side secrets, private storage), automated CI (GitHub Actions), unit tests for core business logic, and professional documentation including architecture diagrams and security threat modeling.
