# Fix Windows Firewall - Allow Port 5000

## Quick Fix (Temporary Test)

1. **Open Windows Security:**
   - Press `Windows + I`
   - Go to "Privacy & Security" → "Windows Security"
   - Click "Firewall & network protection"

2. **Temporarily Disable Firewall:**
   - Click "Private network"
   - Turn OFF "Windows Defender Firewall"
   - Click "Yes" to confirm

3. **Test:**
   - On phone browser: `http://192.168.1.102:5000`
   - If it works now → Firewall was the problem!

4. **Re-enable Firewall** and follow permanent fix below

## Permanent Fix (Allow Port 5000)

### Method 1: Windows Defender Firewall GUI

1. **Open Windows Defender Firewall:**
   - Press `Windows + R`
   - Type: `wf.msc` and press Enter

2. **Create Inbound Rule:**
   - Click "Inbound Rules" in left panel
   - Click "New Rule..." in right panel

3. **Rule Type:**
   - Select "Port" → Next

4. **Protocol and Ports:**
   - Select "TCP"
   - Select "Specific local ports"
   - Enter: `5000`
   - Click Next

5. **Action:**
   - Select "Allow the connection" → Next

6. **Profile:**
   - Check all three: Domain, Private, Public → Next

7. **Name:**
   - Name: `SnapShroom Flask Backend`
   - Description: `Allow Flask backend on port 5000`
   - Click Finish

8. **Repeat for Outbound Rules** (same steps, but select "Outbound Rules")

### Method 2: PowerShell (Quick)

Run PowerShell as Administrator:

```powershell
# Allow inbound on port 5000
New-NetFirewallRule -DisplayName "SnapShroom Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Allow outbound on port 5000
New-NetFirewallRule -DisplayName "SnapShroom Backend" -Direction Outbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Method 3: Allow Python Through Firewall

1. Open Windows Security → Firewall & network protection
2. Click "Allow an app through firewall"
3. Click "Change settings"
4. Find "Python" in the list
5. Check both "Private" and "Public" boxes
6. If Python isn't listed, click "Allow another app" → Browse → Find Python.exe

## Verify Firewall Fix

1. **Start backend:**
   ```bash
   cd SnapShroom\backend
   python app.py
   ```

2. **On computer browser:**
   - Go to: `http://localhost:5000`
   - Should work ✅

3. **On phone browser:**
   - Go to: `http://192.168.1.102:5000`
   - Should work now ✅

## Still Not Working?

### Check Backend is Binding Correctly

When you run `python app.py`, you should see:
```
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.1.102:5000  ← This line is important!
```

If you DON'T see the second line, the backend isn't accessible from network.

### Check Backend Config

Verify `backend/config.py` has:
```python
HOST = os.environ.get('HOST', '0.0.0.0')  # NOT '127.0.0.1'!
```

### Test Network Connection

On phone, try:
```bash
ping 192.168.1.102
```

If ping fails, there's a network issue (not firewall).

---

**Most Common Issue:** Windows Firewall blocking port 5000
**Solution:** Add firewall rule or temporarily disable to test