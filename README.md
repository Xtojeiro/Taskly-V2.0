# Taskly

Taskly is a mobile habit and task tracker built with Expo and Convex for the M16 software project.

## Features

- Local signup/login flow with a persisted session token.
- Recurring daily, weekly, and monthly tasks.
- Today and plan views with completion toggles.
- Monthly heatmap, completion rate, points, and daily task details.
- Focus color and theme settings.
- AI habit coaching through OpenRouter, using a Convex action so the API key stays off the client.

## Setup

```bash
npm install
npx convex dev
npx expo start
```

Configure these Convex environment variables before using AI insights:

```bash
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_APP_TITLE=Taskly
```

## Quality Checks

```bash
npx tsc --noEmit
npm run lint
npm test
```
