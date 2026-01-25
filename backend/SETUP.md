# SnapShroom Backend Setup Guide

## Creating a Virtual Environment

### Windows (PowerShell or Command Prompt)

1. **Navigate to the backend directory:**
   ```powershell
   cd SnapShroom\backend
   ```

2. **Create the virtual environment:**
   ```powershell
   python -m venv venv
   ```
   
   Or if you have Python 3.10.11 specifically:
   ```powershell
   python3.10 -m venv venv
   ```

3. **Activate the virtual environment:**
   
   **In PowerShell:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get an execution policy error, run this first:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   
   **In Command Prompt (cmd):**
   ```cmd
   venv\Scripts\activate.bat
   ```

4. **Verify activation:**
   You should see `(venv)` at the beginning of your command prompt:
   ```
   (venv) PS C:\Users\telfa\Downloads\mushroom\SnapShroom\backend>
   ```

5. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

6. **Deactivate when done:**
   ```powershell
   deactivate
   ```

### Alternative: Using conda (if you have Anaconda/Miniconda)

```powershell
conda create -n snapshroom python=3.10.11
conda activate snapshroom
pip install -r requirements.txt
```

## Complete Setup Steps

1. **Create and activate venv:**
   ```powershell
   cd SnapShroom\backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Upgrade pip:**
   ```powershell
   python -m pip install --upgrade pip
   ```

3. **Install all dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Verify installation:**
   ```powershell
   python -c "import torch; import flask; print('All packages installed!')"
   ```

5. **Run the application:**
   ```powershell
   python app.py
   ```

## Troubleshooting

### "python is not recognized"
- Make sure Python 3.10.11 is installed
- Add Python to your PATH environment variable
- Or use `py -3.10` instead of `python`

### "Activate.ps1 cannot be loaded"
Run this in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "No module named 'venv'"
- Make sure you're using Python 3.3+ (venv is built-in)
- Try: `python3 -m venv venv` or `py -3 -m venv venv`

### Virtual environment not activating
- Make sure you're in the correct directory
- Check that `venv\Scripts\Activate.ps1` exists
- Try using the full path: `C:\path\to\venv\Scripts\Activate.ps1`

## Quick Reference

```powershell
# Create venv
python -m venv venv

# Activate (PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (CMD)
venv\Scripts\activate.bat

# Install packages
pip install -r requirements.txt

# Deactivate
deactivate
```

## For Deployment

When deploying, you typically don't need to create a venv on the server if using:
- **Docker**: Virtual environment is handled in the container
- **Heroku/Railway**: They handle Python environments automatically
- **Cloud platforms**: Usually have their own environment management

But for local development and testing, always use a venv!