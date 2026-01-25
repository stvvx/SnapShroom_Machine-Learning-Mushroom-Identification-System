#!/usr/bin/env python3
"""
Quick network connectivity check for SnapShroom backend.
"""

import socket
import sys

def check_port(host='0.0.0.0', port=5000):
    """Check if port is accessible."""
    try:
        # Create a socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        
        # Try to bind to the port
        result = sock.bind((host, port))
        sock.close()
        return True
    except OSError:
        return False

def get_local_ip():
    """Get local IP address."""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "Unknown"

if __name__ == "__main__":
    print("=" * 60)
    print("SnapShroom Network Connectivity Check")
    print("=" * 60)
    
    local_ip = get_local_ip()
    print(f"\nYour computer's IP address: {local_ip}")
    print(f"Expected IP: 192.168.1.102")
    
    if local_ip != "192.168.1.102":
        print(f"\n⚠️  WARNING: IP address doesn't match expected value!")
        print(f"   Update frontend/utils/api.ts with: http://{local_ip}:5000")
    
    print(f"\nChecking if port 5000 is available...")
    if check_port('0.0.0.0', 5000):
        print("✅ Port 5000 is available")
    else:
        print("❌ Port 5000 is already in use or blocked!")
        print("   - Another program might be using port 5000")
        print("   - Or Windows Firewall is blocking it")
    
    print("\n" + "=" * 60)
    print("Next Steps:")
    print("=" * 60)
    print("1. Start backend: python app.py")
    print("2. Test on computer: http://localhost:5000")
    print(f"3. Test on phone: http://{local_ip}:5000")
    print("4. If phone test fails, check Windows Firewall!")
    print("=" * 60)