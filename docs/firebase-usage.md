# Firebase Integration Guide

## Overview
This guide explains how to use the improved Firebase client implementation in the Health Appointment System. The improved client provides better error handling, cache management, and integration with the application's API mode system.

## Basic Usage

### Initialization
The Firebase client should be initialized at the application bootstrap level:

```typescript
// In your ClientInit component or similar initialization point
import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';

function ClientInit() {
  useEffect(() => {
    // Get current API mode
    const currentMode = getApiMode();
    
    // Initialize Firebase based on current mode
    const { app, auth, db, analytics, status } = initializeFirebaseClient();
    
    // Log initialization status
    console.log('[ClientInit] Firebase status:', status);
    
    // Additional initialization logic
    // ...
    
    return () => {
      // Cleanup logic
    };
  }, []);
  
  return null; // This component doesn't render anything
}
```

### Checking Firebase Availability
Before using Firebase services, check if they're properly initialized:

```typescript
import { isFirebaseReady, db } from '@/lib/improvedFirebaseClient';

function MyComponent() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Check if Firebase is ready before using it
        if (!isFirebaseReady()) {
          // Handle mock mode or initialization failure
          setError('Firebase is not available in current mode');
          setLoading(false);
          return;
        }
        
        // Safe to use Firestore now
        const snapshot = await getDocs(collection(db!, 'someCollection'));
        const fetchedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setData(fetchedData);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
        console.error(err);
      }
    }
    
    fetchData();
  }, []);
  
  // Component rendering logic
}
```

## Advanced Usage

### Forcing API Mode for Specific Routes
For routes that require Firebase regardless of user settings:

```typescript
import { useRouter } from 'next/router';
import { setApiMode } from '@/config/appConfig';
import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';

function FirebaseRequiredPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Force live mode and Firebase initialization
    const { status } = initializeFirebaseClient('live');
    
    // Optional: Persist the forced mode
    setApiMode('live');
    
    console.log('Firebase initialized with status:', status);
  }, [router.pathname]);
  
  // Rest of component
}
```

### Performance Optimization
For components that may or may not need Firebase:

```typescript
import { lazy, Suspense } from 'react';
import { getApiMode } from '@/config/appConfig';

// Use dynamic imports based on API mode
function OptimizedComponent() {
  const [implementation, setImplementation] = useState<'mock' | 'firebase'>('mock');
  
  useEffect(() => {
    const mode = getApiMode();
    setImplementation(mode === 'live' ? 'firebase' : 'mock');
  }, []);
  
  // Conditionally render based on implementation
  return (
    <>
      {implementation === 'mock' ? (
        <MockImplementation />
      ) : (
        <FirebaseImplementation />
      )}
    </>
  );
}
```

## Error Handling
The improved client handles errors at multiple levels:

1. **Initialization Errors**: These are caught and logged. The client falls back to standard initialization when optimal settings fail.

2. **Service-Level Errors**: Each service (Auth, Firestore, Analytics) has its own error handling.

3. **Critical Failures**: In case of critical failures, all service instances are reset to null, and the `status` object indicates which services failed.

Always check the `status` object returned from `initializeFirebaseClient()` to understand the state of Firebase services.

## Troubleshooting

### Common Issues

1. **Firebase not initializing in mock mode**
   - This is expected behavior. Firebase only initializes in 'live' mode or for special routes.
   - Check current mode with `getApiMode()`.

2. **Persistence errors**
   - May occur in private browsing or with IndexedDB issues.
   - The client automatically falls back to non-persistent mode.
   - Check `status.persistence` to see if persistence is enabled.

3. **Cross-tab conflicts**
   - Using different settings in different tabs can cause issues.
   - The improved client uses consistent settings across tabs.

4. **Performance issues**
   - Consider lazy-loading Firebase components.
   - Use Firebase performance monitoring for production apps.

## Migration from Legacy Client
If you're migrating from the old client implementation:

1. Replace imports: 
   ```typescript
   // Old
   import { initializeFirebaseClient, app, auth, db } from '@/lib/firebaseClient';
   
   // New
   import { initializeFirebaseClient, app, auth, db, isFirebaseReady } from '@/lib/improvedFirebaseClient';
   ```

2. Update initialization:
   ```typescript
   // Old
   const { app, auth, db } = initializeFirebaseClient(currentApiMode);
   
   // New 
   const { app, auth, db, status } = initializeFirebaseClient();
   ```

3. Add safety checks:
   ```typescript
   // Add null checks or use isFirebaseReady()
   if (isFirebaseReady()) {
     // Safe to use Firebase services
   }
   ``` 