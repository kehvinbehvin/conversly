# Environment-Aware Configuration Guide

## Overview

Conversly uses environment-aware configuration to automatically switch between development and production settings for ElevenLabs integration.

## Configuration

### Environment Variables Required

**Development Environment:**
- `ELEVENLABS_WEBHOOK_SECRET_DEV` - Webhook signature verification secret for development
- `NODE_ENV` - Should be unset or set to `development`

**Production Environment:**
- `ELEVENLABS_WEBHOOK_SECRET` - Webhook signature verification secret for production  
- `NODE_ENV=production` - Triggers production mode

### Avatar Agent IDs

The system automatically selects the correct agent IDs based on environment:

**Development Agents:**
- Jessie (Barista): `agent_01jyfb9fh8f67agfzvv09tvg3t`
- Shawn (Party Friend): `agent_01jypzmj9heh3rhmn47anjbsr8`
- Maya (Cycling Enthusiast): `agent_01jyq00m9aev8rq8e6a040rjmv`
- Sam (Dinner +1): `agent_01jyq0j92gfxdrv3me49xygae1`

**Production Agents:**
- Jessie (Barista): `agent_01jys1g9ndfcqthwrs8p9fy4bn`
- Shawn (Party Friend): `agent_01jys1h6dfe0dt1x186wkqcnmb`
- Maya (Cycling Enthusiast): `agent_01jys1jsmje7wvb6vak1dt4t54`
- Sam (Dinner +1): `agent_01jys1hz8zf9crk3j8aq7hnk9b`

## How It Works

### Environment Detection

The system uses a universal environment detection utility that works on both server and client:

```typescript
function getEnvironment(): 'development' | 'production' {
  // Server-side: Check NODE_ENV
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
  
  // Client-side: Check Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD ? 'production' : 'development';
  }
  
  // Default to development for safety
  return 'development';
}
```

### Avatar Selection

The `AVATARS` array automatically switches based on environment:

```typescript
export const AVATARS: Avatar[] = getEnvironment() === 'production' 
  ? PRODUCTION_AVATARS 
  : DEVELOPMENT_AVATARS;
```

### Webhook Verification

Webhook signature verification automatically selects the correct secret:

```typescript
function getWebhookSecret(): string {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  
  if (environment === 'production') {
    return process.env.ELEVENLABS_WEBHOOK_SECRET || "";
  } else {
    return process.env.ELEVENLABS_WEBHOOK_SECRET_DEV || "";
  }
}
```

## Deployment

### Development
- Run `npm run dev` 
- Uses development agents and `ELEVENLABS_WEBHOOK_SECRET_DEV`
- Automatic environment detection

### Production
- Set `NODE_ENV=production`
- Run `npm run start`
- Uses production agents and `ELEVENLABS_WEBHOOK_SECRET`
- All configuration switches automatically

## Troubleshooting

### Missing Webhook Secret Error

If you see errors like:
```
No webhook secret found for [environment] environment. Please set [REQUIRED_ENV_VAR]
```

Set the appropriate environment variable:
- Development: `ELEVENLABS_WEBHOOK_SECRET_DEV`
- Production: `ELEVENLABS_WEBHOOK_SECRET`

### Wrong Agent IDs

Verify your environment:
- Check `NODE_ENV` value
- Confirm correct agent IDs are being used in logs
- Use `getAvatarsForEnvironment()` utility for testing specific environments

## Testing

The test suite validates both environments:

```bash
npx vitest run server/tests/avatarSelection.test.ts
```

Tests verify:
- Correct agent IDs for current environment
- Environment switching functionality
- Avatar data integrity
- Type safety