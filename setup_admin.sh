#!/bin/bash
# Quick script to make a user admin
# Usage: ./setup_admin.sh

echo "==================================="
echo "   SnapShroom Admin Setup"
echo "==================================="
echo ""

read -p "Enter your email address: " email

echo ""
echo "Making $email an admin..."
echo ""

cd backend
python3 make_admin.py "$email"

echo ""
echo "==================================="
echo "Done! Please restart the app and log in with this account."
echo "You should now see the Admin tab in the bottom navigation."
echo "==================================="
echo ""
