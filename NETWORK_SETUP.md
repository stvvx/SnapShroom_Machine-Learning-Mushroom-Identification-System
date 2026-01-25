# Network Setup Guide - Fixing "Network Request Failed"

## Quick Fix Checklist

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt or PowerShell
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
   - Example: `192.168.1.102` or `192.168.0.105`
   - **NOT** `127.0.0.1` (that's localhost, won't work from phone)

**Mac/Linux:**
```bash
ifconfig | grep "inet "
# or
ip addr show
```

### Step 2: Update API URL in Frontend

1. Open: `SnapShroom/frontend/utils/api.ts`
2. Find this line:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:5000'  // Development - same machine
     : 'http://192.168.1.100:5000'; // Production - update with your server IP
   ```
3. Replace `192.168.1.100` with YOUR computer's IP address
4. Example: `'http://192.168.1.102:5000'`

### Step 3: Ensure Backend is Running

```bash
cd SnapShroom/backend
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.1.XXX:5000  # Your IP
```

### Step 4: Check Network Connection

**IMPORTANT:** Phone and computer MUST be on the **same WiFi network**

- ✅ Same WiFi = Works
- ❌ Different WiFi = Won't work
- ❌ Phone on mobile data = Won't work

### Step 5: Test Connection

1. On your phone's browser, try accessing:
   ```
   http://YOUR_COMPUTER_IP:5000
   ```
   Example: `http://192.168.1.102:5000`

2. You should see:
   ```json
   {
     "status": "SnapShroom backend running",
     "version": "1.0"
   }
   ```

3. If this works, the app should work too!

## Common Issues & Solutions

### Issue 1: "Network Request Failed"

**Causes:**
- Backend not running
- Wrong IP address
- Different networks
- Firewall blocking

**Solutions:**
1. ✅ Start backend: `python app.py`
2. ✅ Verify IP address with `ipconfig`
3. ✅ Update `utils/api.ts` with correct IP
4. ✅ Check phone and computer on same WiFi
5. ✅ Disable firewall temporarily to test

### Issue 2: "Connection Refused"

**Cause:** Backend not running or wrong port

**Solution:**
```bash
cd SnapShroom/backend
python app.py
# Should show: Running on http://0.0.0.0:5000
```

### Issue 3: "Timeout"

**Cause:** Backend taking too long or not responding

**Solution:**
- Check backend terminal for errors
- Try restarting backend
- Check if models are loaded

### Issue 4: Works on Computer Browser, Not on Phone

**Cause:** Using `localhost` instead of IP address

**Solution:**
- `localhost` only works on the same device
- Use your computer's IP address instead
- Update `utils/api.ts` with IP address

## Windows Firewall Fix

If firewall is blocking:

1. Open Windows Defender Firewall
2. Click "Allow an app or feature"
3. Find Python or add new rule
4. Allow Python through firewall for Private networks

**Or temporarily disable firewall to test:**
1. Windows Security → Firewall & network protection
2. Turn off for Private network (temporarily)

## Testing Steps

### Test 1: Backend Health Check
```bash
# On computer, open browser:
http://localhost:5000
# Should show JSON response
```

### Test 2: Network Access
```bash
# On phone browser:
http://YOUR_IP:5000
# Should show same JSON response
```

### Test 3: App Connection
- Open SnapShroom app
- Tap "Test Connection" button
- Should show "✅ Backend connection successful!"

## Quick Reference

**Find IP:**
```bash
# Windows
ipconfig

# Mac/Linux  
ifconfig
```

**Update API URL:**
```typescript
// frontend/utils/api.ts
const API_BASE_URL = 'http://YOUR_IP_HERE:5000';
```

**Start Backend:**
```bash
cd SnapShroom/backend
python app.py
```

**Verify Connection:**
- Phone browser: `http://YOUR_IP:5000`
- App: Use "Test Connection" button

## Still Not Working?

1. **Check backend is running:**
   - Look at terminal - should show "Running on..."
   - Try `http://localhost:5000` in computer browser

2. **Verify IP address:**
   - Run `ipconfig` again
   - Make sure it matches what's in `utils/api.ts`

3. **Check WiFi:**
   - Phone and computer on same network?
   - Try disconnecting and reconnecting WiFi

4. **Try different IP:**
   - Some networks use `192.168.0.x` instead of `192.168.1.x`
   - Check all IP addresses from `ipconfig`

5. **Restart everything:**
   - Restart backend server
   - Restart Expo app
   - Clear Expo cache: `npx expo start -c`

---

**Need more help?** Check backend terminal for error messages!