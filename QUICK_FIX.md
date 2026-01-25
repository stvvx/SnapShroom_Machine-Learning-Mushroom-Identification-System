# Quick Fix: "Network Request Failed" Error

## 🚀 3-Step Quick Fix

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Look for **"IPv4 Address"** - that's your IP!
   - Example: `192.168.1.102` or `192.168.0.105`

### Step 2: Update the API URL

1. Open: `SnapShroom/frontend/utils/api.ts`
2. Find line 9:
   ```typescript
   : 'http://192.168.1.100:5000'; // ⚠️ CHANGE THIS
   ```
3. Replace `192.168.1.100` with **YOUR IP** from Step 1
4. Save the file

### Step 3: Start Backend & Test

1. **Start backend:**
   ```bash
   cd SnapShroom\backend
   python app.py
   ```

2. **Test in phone browser:**
   - Open browser on your phone
   - Go to: `http://YOUR_IP:5000`
   - Should see: `{"status": "SnapShroom backend running"...}`

3. **If browser works, app will work too!**

## ⚠️ Important Checklist

- [ ] Backend is running (`python app.py`)
- [ ] IP address in `utils/api.ts` matches your computer's IP
- [ ] Phone and computer are on **SAME WiFi network**
- [ ] Tested in phone browser first (should work before app)

## 🔥 Still Not Working?

### Try This:

1. **Double-check IP:**
   - Run `ipconfig` again
   - Make sure you're using the IP under your **active WiFi adapter**
   - NOT `127.0.0.1` (that's localhost)

2. **Test connection:**
   - On phone browser: `http://YOUR_IP:5000`
   - If this doesn't work, the app won't work either

3. **Check firewall:**
   - Windows might be blocking port 5000
   - Temporarily disable firewall to test
   - Or allow Python through firewall

4. **Restart everything:**
   - Stop backend (Ctrl+C)
   - Restart backend: `python app.py`
   - Restart Expo: `npx expo start -c`

## 📱 Example

If your IP is `192.168.1.102`:

1. Update `utils/api.ts`:
   ```typescript
   : 'http://192.168.1.102:5000';
   ```

2. Test in phone browser:
   ```
   http://192.168.1.102:5000
   ```

3. Should see backend response!

---

**Need more help?** See `NETWORK_SETUP.md` for detailed troubleshooting.