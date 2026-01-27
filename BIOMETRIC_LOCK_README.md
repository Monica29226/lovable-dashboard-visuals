# Biometric Lock System for Lovable Apps

This document describes how to implement and reuse the biometric authentication (Face ID / Touch ID) system in Lovable projects.

## Overview

The biometric lock adds an extra layer of security on top of Supabase Auth. After a user logs in with email/password, they can optionally enable Face ID or Touch ID to protect app access.

## Files to Copy

To add biometric lock to another Lovable project, copy these files:

### Required Files

1. **`capacitor.config.ts`** - Capacitor configuration (project root)
2. **`src/config/biometricConfig.ts`** - Biometric settings and configuration
3. **`src/hooks/useBiometricLock.ts`** - Core biometric hook
4. **`src/contexts/BiometricContext.tsx`** - React context for biometric state
5. **`src/components/BiometricLockScreen.tsx`** - Lock screen UI component
6. **`src/components/BiometricSettings.tsx`** - Settings panel component
7. **`src/components/BiometricProtectedRoute.tsx`** - Route protection HOC

### Optional Files

- **`src/pages/Settings.tsx`** - Settings page with biometric toggle

## Dependencies

Install these npm packages:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @aparajita/capacitor-biometric-auth
```

## Integration Steps

### 1. Wrap Your App with BiometricProvider

In your `App.tsx`, add the BiometricProvider **inside** AuthProvider:

```tsx
import { BiometricProvider } from '@/contexts/BiometricContext';

// Inside your App component:
<AuthProvider>
  <BiometricProvider>
    {/* Your app content */}
  </BiometricProvider>
</AuthProvider>
```

### 2. Add BiometricProtectedRoute

Wrap your protected content with `BiometricProtectedRoute`:

```tsx
import { BiometricProtectedRoute } from '@/components/BiometricProtectedRoute';

<ProtectedRoute>
  <BiometricProtectedRoute>
    {/* Your protected app content */}
  </BiometricProtectedRoute>
</ProtectedRoute>
```

### 3. Add Settings UI

Include the BiometricSettings component in your settings page:

```tsx
import { BiometricSettings } from '@/components/BiometricSettings';

// In your settings page:
<BiometricSettings />
```

### 4. Configure Behavior

Edit `src/config/biometricConfig.ts` to customize:

```typescript
export const biometricConfig: BiometricConfig = {
  enabled: true,                          // Master switch
  triggerPoint: 'after_login',            // When to prompt
  protectedRoutes: ['/dashboard', '/*'],  // Routes requiring biometric
  excludedRoutes: ['/auth', '/public'],   // Routes to skip
  backgroundLockTimeout: 5 * 60 * 1000,   // 5 minutes
  // ... other options
};
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | boolean | Master switch to enable/disable biometrics globally |
| `triggerPoint` | 'app_start' \| 'after_login' \| 'route_access' | When to prompt for biometrics |
| `protectedRoutes` | string[] | Routes that require biometric (supports wildcards) |
| `excludedRoutes` | string[] | Routes that never trigger biometric |
| `allowDeviceCredentialFallback` | boolean | Allow PIN/pattern as fallback |
| `backgroundLockTimeout` | number | Ms before requiring re-auth after background |
| `promptTitle` | string | Title shown on biometric dialog |
| `promptSubtitle` | string | Description shown on biometric dialog |

## Hook API

The `useBiometricLock` hook provides:

```typescript
const {
  isAvailable,           // Device supports biometrics
  biometryType,          // 'faceId' | 'touchId' | etc.
  isEnabled,             // User has enabled biometric lock
  isVerified,            // Biometric verified this session
  isAuthenticating,      // Auth in progress
  error,                 // Last error message
  isNativePlatform,      // Running in Capacitor
  checkAvailability,     // Check if biometrics available
  authenticate,          // Trigger biometric prompt
  enableBiometric,       // Enable biometric lock
  disableBiometric,      // Disable biometric lock
  markVerified,          // Mark session as verified
  clearVerification,     // Require re-verification
  getBiometryDisplayName // Get "Face ID" or "Touch ID" string
} = useBiometricLock();
```

## Native Setup

After copying files, build for native:

1. Export project to GitHub
2. Clone and run `npm install`
3. Run `npx cap add ios` and/or `npx cap add android`
4. Run `npx cap sync`
5. Open in Xcode/Android Studio to configure permissions

### iOS Info.plist

Add to your iOS project:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to unlock the app</string>
```

### Android

Biometric permissions are automatically added by the plugin.

## User Flow

1. User logs in with Supabase Auth (email/password)
2. On first login, biometric settings show "Biometrics available"
3. User enables biometric lock in Settings
4. Next app open: biometric prompt appears
5. User verifies with Face ID/Touch ID
6. Session marked as verified until:
   - User logs out
   - App in background > 5 minutes
   - User manually requires re-verification

## Fallback Behavior

- **Web browser**: Biometric lock is skipped (not available)
- **Biometrics unavailable**: User continues without biometric
- **3 failed attempts**: Fallback options shown
- **User cancels**: Can skip or logout

## Security Notes

- Biometric preference stored in `localStorage` (per-device)
- Session verification stored in `sessionStorage` (per-tab)
- No biometric data is ever stored by the app
- Falls back gracefully when biometrics unavailable
