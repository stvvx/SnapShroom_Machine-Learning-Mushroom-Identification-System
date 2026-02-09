@echo off
REM Quick script to make a user admin
REM Usage: setup_admin.bat

echo ===================================
echo    SnapShroom Admin Setup
echo ===================================
echo.

set /p email="Enter your email address: "

echo.
echo Making %email% an admin...
echo.

cd backend
python make_admin.py %email%

echo.
echo ===================================
echo Done! Please restart the app and log in with this account.
echo You should now see the Admin tab in the bottom navigation.
echo ===================================
echo.

pause
