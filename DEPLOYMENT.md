# Deployment Guide for PostHog Analytics

## Environment Variables for Production

Your production site at **https://www.pitchbuddy.online/** needs the following environment variables configured in your hosting platform:

### Required Environment Variables

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_yadYvotjjYlgPC374Vp1IMSX6pkkot7nKHrW6KEhxA2
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# API Configuration
NEXT_PUBLIC_API_URL=https://api.pitchbuddy.online

# Node Environment
NODE_ENV=production
```

## Platform-Specific Instructions

### Vercel
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable above
4. Set scope to **Production**
5. Redeploy your application

### Netlify
1. Go to **Site settings** → **Environment variables**
2. Add each variable above
3. Redeploy your site

### AWS Amplify / DigitalOcean / Other
1. Navigate to your app's environment variables section
2. Add each variable above
3. Trigger a new deployment

## Important Notes

- **Localhost is excluded**: The PostHog configuration automatically prevents tracking on localhost to avoid polluting your analytics with development data
- **Production only**: Analytics will only be active when `NODE_ENV=production` and not on localhost
- **API URL**: Make sure `NEXT_PUBLIC_API_URL` points to your production backend API

## Testing Production Analytics

After deploying with the environment variables:

1. Visit https://www.pitchbuddy.online/
2. Open your PostHog dashboard
3. Navigate to **Events** or **Live Events**
4. You should see:
   - `$pageview` events when navigating pages
   - `pitch_recording_started` when users record pitches
   - `pitch_analysis_completed` when analysis finishes

## Current Configuration

- ✓ PostHog provider configured
- ✓ Localhost tracking disabled
- ✓ Production environment variables ready
- ✓ Event tracking on key user actions
