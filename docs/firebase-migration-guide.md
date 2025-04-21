# Firebase Migration Guide

This guide explains how to migrate your codebase to follow the Firebase best practices we've established.

## Automated Migration

We've created a script that can automatically apply many of the Firebase best practices across the project:

```bash
npm run apply:firebase-best-practices
```

This script will:

1. Convert direct localStorage API mode access to use `getApiMode()`
2. Convert direct localStorage API mode setting to use `setApiMode()`
3. Update Firebase imports to use the improved client
4. Add status object to Firebase initialization calls
5. Add proper null checks for Firebase services
6. Replace conditional checks with `isFirebaseReady()`

## Manual Review

After running the automated migration script, you should:

1. Run the validation script to see if there are any remaining issues:

```bash
npm run validate:firebase
```

2. Manually review the changes the script made to ensure they are correct.

3. Fix any issues that couldn't be automatically fixed:
   - Complex Firebase service usage patterns
   - Custom initialization logic
   - Special case handling

## Testing

After applying the changes, test your application thoroughly:

1. Test with both API modes:
   - Mock mode: `localStorage.setItem('apiMode', 'mock')`
   - Live mode: `localStorage.setItem('apiMode', 'live')`

2. Test special routes like `/find` that force live mode

3. Test on different browsers to ensure persistence works correctly

## Special Cases

### ClientInit Component

The `ClientInit` component requires special handling:

```typescript
// src/components/ClientInit.tsx
import { initializeFirebaseClient, isFirebaseReady } from '@/lib/improvedFirebaseClient';

// In the init function
const { app, auth, db, analytics, status } = initializeFirebaseClient();
console.log('[ClientInit] Firebase status:', status);

// Check the status
if (status.dbInitialized) {
  console.log('[ClientInit] Firestore initialized successfully');
}
```

### Component with Firebase Dependency

Components that depend on Firebase should include safeguards:

```typescript
// Sample component
import { isFirebaseReady, db } from '@/lib/improvedFirebaseClient';

function MyFirebaseComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!isFirebaseReady()) {
        setError('Firebase is not available in current mode');
        setLoading(false);
        return;
      }

      try {
        // Safe to use Firestore now
        const snapshot = await getDocs(collection(db, 'someCollection'));
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

  // Your component JSX...
}
```

## Checklist

Use this checklist to ensure you've properly migrated:

- [ ] Replaced direct localStorage access with getApiMode()
- [ ] Replaced direct localStorage setting with setApiMode()
- [ ] Updated Firebase imports to use improvedFirebaseClient
- [ ] Added status checks for Firebase initialization
- [ ] Fixed unsafe Firebase service usage (null assertions)
- [ ] Added isFirebaseReady() checks where needed
- [ ] Added hydration safety checks in components
- [ ] Ensured proper cache settings in Firestore
- [ ] Tested in both live and mock modes
- [ ] Checked cross-tab synchronization

## Troubleshooting

### Common Issues

1. **Firebase Not Initializing**: Check your API mode and browser console for errors

2. **Import Errors**: Ensure proper imports from improvedFirebaseClient:
   ```typescript
   import { initializeFirebaseClient, isFirebaseReady, db, auth } from '@/lib/improvedFirebaseClient';
   ```

3. **Runtime Errors**: Always check if services are initialized:
   ```typescript
   // Bad: db!.collection('users')
   // Good: isFirebaseReady() ? db.collection('users') : null
   ```

4. **Hydration Errors**: Ensure components don't render Firebase-dependent content during server rendering:
   ```typescript
   const [mounted, setMounted] = useState(false);
   useEffect(() => { setMounted(true); }, []);
   if (!mounted) return null; // or a loading placeholder
   ```

If you encounter persistent issues, check the documentation in `docs/api-mode-lessons.md` and `docs/firebase-usage.md`. 