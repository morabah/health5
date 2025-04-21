# API Mode & Firebase Implementation Lessons

## Overview
This document captures key lessons learned while implementing and debugging the API mode switching and Firebase integration in the Health Appointment System application.

## API Mode Configuration

### Current Implementation
- The application supports two API modes: `live` and `mock`
- Mode selection is controlled through:
  - Environment variables (NEXT_PUBLIC_API_MODE)
  - localStorage persistence 
  - Toggle UI controls
- Special routes like `/find` force `live` mode regardless of the current setting

### Best Practices
1. **Single Source of Truth**: Always use the `getApiMode()` function from `appConfig.ts` rather than direct localStorage access.
2. **Cross-Tab Synchronization**: API mode changes are broadcasted to all open tabs using:
   - BroadcastChannel API
   - StorageEvent listeners
   - Custom DOM events
3. **Component Hydration**: Always use mounted state checks to prevent hydration mismatches with SSR.

## Firebase Initialization

### Initialization Strategy
- Conditional initialization based on API mode
- Special route handling for `/find` path
- Graceful fallback to standard initialization if optimal settings fail
- Single initialization pattern with instance caching

### Firestore Configuration Best Practices
1. **Avoid Conflicting Settings**:
   - Don't use both `experimentalForceLongPolling` and `experimentalAutoDetectLongPolling`
   - Let Firestore auto-detect the best connection method

2. **Cache Management**:
   - Use reasonable cache sizes (e.g., 50MB) instead of `CACHE_SIZE_UNLIMITED`
   - Use the `cache` configuration option instead of the deprecated `enableIndexedDbPersistence()`
   ```javascript
   const settings = {
     ignoreUndefinedProperties: true,
     cacheSizeBytes: 50 * 1024 * 1024, // 50MB
     experimentalAutoDetectLongPolling: true,
     cache: {
       persistenceEnabled: true,
       tabSizeBytes: 50 * 1024 * 1024 // 50MB per tab
     }
   };
   ```

3. **Error Handling**:
   - Implement multi-level fallback strategies
   - Log initialization failures with detailed error information
   - Provide clear user feedback when in fallback modes

4. **Performance Optimization**:
   - Use `ignoreUndefinedProperties: true` to improve data flexibility
   - Consider Firebase bundle sizes in your application
   - Implement lazy loading where appropriate

## Common Issues & Solutions

### Persistence Errors
- **Problem**: Firestore persistence initialization failures
- **Causes**: 
  - Browser IndexedDB limitations
  - Multiple tabs using different persistence configurations
  - Private browsing modes
- **Solutions**:
  - Use the `cache` configuration option instead of `enableIndexedDbPersistence()`
  - Handle persistence errors gracefully
  - Provide fallback to in-memory caching

### API Mode Detection
- **Problem**: Inconsistent API mode across components
- **Causes**: 
  - Direct localStorage access
  - Race conditions during initialization
- **Solutions**: 
  - Use centralized `getApiMode()` function
  - Implement proper event subscriptions
  - Verify mode before critical operations

### Route-Based Configuration
- **Problem**: Certain routes require specific API modes
- **Solution**: Force mode detection on route change:
  ```javascript
  const pathname = usePathname();
  // Force live mode for specific routes
  useEffect(() => {
    if (pathname && pathname.includes('/find')) {
      localStorage.setItem('apiMode', 'live');
    }
  }, [pathname]);
  ```

## Future Improvements
1. **Unified Data Provider**: Create a single context provider that handles all data source switching
2. **Stronger Type Safety**: Enforce API mode types throughout the application
3. **Persistence Opt-Out**: Allow users to disable persistence for privacy-sensitive scenarios
4. **Monitoring & Analytics**: Track API mode usage patterns to inform development
5. **Lazy Firebase Loading**: Only load Firebase when needed to improve initial load performance 