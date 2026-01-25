# Fix: Phone Still Using localhost Instead of IP

## Problem
Your phone app is trying to connect to `http://localhost:5000` instead of `http://192.168.1.102:5000`

## Solution: Clear Expo Cache

The app is using cached code. You need to clear the cache and reload.

### Step 1: Stop Expo
Press `Ctrl+C` in the terminal running Expo

### Step 2: Clear Cache and Restart
```bash
cd SnapShroom/frontend
npx expo start -c
```

The `-c` flag clears the cache.

### Step 3: Reload App on Phone
- Shake your phone to open developer menu
- Tap "Reload" 
- Or press `r` in the Expo terminal

### Step 4: Verify
Check the logs - you should now see:
```
LOG  Testing connection to: http://192.168.1.102:5000
```

NOT `localhost:5000`!

## Alternative: Full Reset

If clearing cache doesn't work:

1. **Stop Expo completely** (Ctrl+C)

2. **Delete cache:**
   ```bash
   cd SnapShroom/frontend
   rm -rf .expo
   rm -rf node_modules/.cache
   ```

3. **Restart:**
   ```bash
   npx expo start -c
   ```

4. **Reload app on phone**

## Verify API URL is Correct

Check `frontend/utils/api.ts` line 16:
```typescript
const API_BASE_URL = 'http://192.168.1.102:5000';
```

Should be your computer's IP (192.168.1.102), NOT localhost!

## Still Using localhost?

If after clearing cache it's still using localhost:

1. **Check the file was saved:**
   - Open `frontend/utils/api.ts`
   - Verify line 16 shows: `'http://192.168.1.102:5000'`

2. **Force reload:**
   - Close Expo Go app completely
   - Reopen Expo Go
   - Scan QR code again

3. **Check for other localhost references:**
   - Search entire frontend folder for "localhost"
   - Make sure all references use the IP address

---

**Quick Fix:**
1. Stop Expo (Ctrl+C)
2. Run: `npx expo start -c`
3. Reload app on phone
4. Should now use `192.168.1.102:5000` ✅