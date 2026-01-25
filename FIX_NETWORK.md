# Fix Network Connection - Step by Step

## Your Setup:
- **Computer IP:** 192.168.1.102 ✅
- **Phone IP:** 192.168.1.103 ✅
- **Same WiFi:** Yes ✅

## Problem:
Phone browser can't access `http://192.168.1.102:5000`

## Solutions (Try in order):

### Solution 1: Check Backend is Running

1. **On your computer**, open Command Prompt
2. Navigate to backend:
   ```bash
   cd SnapShroom\backend
   python app.py
   ```
3. You should see:
   ```
   * Running on http://127.0.0.1:5000
   * Running on http://192.168.1.102:5000
   ```
4. **If you DON'T see the second line**, the backend isn't accessible from network!

### Solution 2: Fix Windows Firewall

**Windows Firewall is likely blocking port 5000!**

**Quick Fix (Temporary):**
1. Open Windows Security
2. Go to "Firewall & network protection"
3. Click "Private network"
4. Turn OFF firewall temporarily
5. Test again in phone browser

**Permanent Fix:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" → Enter port: `5000` → Next
6. Select "Allow the connection" → Next
7. Check all (Domain, Private, Public) → Next
8. Name: "Flask SnapShroom" → Finish

### Solution 3: Verify Backend Binding

The backend MUST bind to `0.0.0.0` (all interfaces), not just `127.0.0.1`.

Check `backend/config.py` - should have:
```python
HOST = os.environ.get('HOST', '0.0.0.0')  # NOT '127.0.0.1'!
```

### Solution 4: Test Connection

**On Computer:**
1. Open browser
2. Go to: `http://localhost:5000`
3. Should see JSON response

**On Phone Browser:**
1. Open browser
2. Go to: `http://192.168.1.102:5000`
3. Should see SAME JSON response
4. **If this doesn't work, firewall is blocking!**

### Solution 5: Alternative - Use ngrok (Tunnel)

If firewall is too complicated:

1. Install ngrok: https://ngrok.com/download
2. Start backend: `python app.py`
3. In new terminal: `ngrok http 5000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update `frontend/utils/api.ts`:
   ```typescript
   const API_BASE_URL = 'https://abc123.ngrok.io';
   ```

## Quick Test Checklist:

- [ ] Backend running: `python app.py`
- [ ] Backend shows: `Running on http://192.168.1.102:5000`
- [ ] Computer browser works: `http://localhost:5000`
- [ ] Phone browser works: `http://192.168.1.102:5000`
- [ ] Firewall allows port 5000
- [ ] API URL in `utils/api.ts` is `http://192.168.1.102:5000` (computer IP, NOT phone IP!)

## Most Common Issue: Windows Firewall

**90% of the time, it's Windows Firewall blocking port 5000!**

Try disabling firewall temporarily to test. If it works, then enable firewall and add the rule above.

---

**Still not working?** Check backend terminal for error messages!