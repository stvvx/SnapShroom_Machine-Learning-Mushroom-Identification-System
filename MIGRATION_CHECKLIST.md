# ✅ Migration Checklist: Old System → Roboflow

Print this out and check items as you complete them!

---

## Phase 1: Setup Environment

- [ ] Create `backend/.env` file with Roboflow credentials
- [ ] Get Roboflow API key from https://roboflow.com/settings
- [ ] Set `ROBOFLOW_API_KEY` in `.env`
- [ ] Set `ROBOFLOW_WORKSPACE` in `.env`
- [ ] Verify `.env` is in `.gitignore` (don't commit secrets!)

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 2: Create Roboflow Projects

### Detection Project (`mushroom-detection`)
- [ ] Sign up at [roboflow.com](https://roboflow.com)
- [ ] Create new project named `mushroom-detection`
- [ ] Set task type to "Object Detection"
- [ ] Upload images with bounding boxes around mushrooms
- [ ] Add augmentation (Roboflow recommendations)
- [ ] Train YOLOv8 detection model
- [ ] Wait for training to complete
- [ ] Note the project ID (workspace/mushroom-detection)

**Status**: ⏳ In Progress / ✅ Complete

### Classification Project (`mushroom-edibility`)
- [ ] Create new project named `mushroom-edibility`
- [ ] Set task type to "Classification"
- [ ] Upload mushroom images with labels:
  - [ ] EDIBLE folder/tag
  - [ ] POISONOUS folder/tag
- [ ] Add augmentation (Roboflow recommendations)
- [ ] Train YOLOv8 classification model
- [ ] Wait for training to complete
- [ ] Note the project ID (workspace/mushroom-edibility)

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 3: Export Models

### Export Detection Model
- [ ] Go to mushroom-detection project → Versions
- [ ] Click on latest trained version
- [ ] Click "Export"
- [ ] Select "PyTorch" format
- [ ] Download the model (will be `best.pt`)
- [ ] Save to `backend/models/detection.pt`

**Status**: ⏳ In Progress / ✅ Complete

### Export Classification Model
- [ ] Go to mushroom-edibility project → Versions
- [ ] Click on latest trained version
- [ ] Click "Export"
- [ ] Select "PyTorch" format
- [ ] Download the model (will be `best.pt`)
- [ ] Save to `backend/models/classification.pt`

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 4: Install Dependencies

- [ ] Open terminal in project root
- [ ] Run: `pip install -r backend/roboflow_requirements.txt`
- [ ] Verify all packages installed (no errors)

Packages installed:
- [ ] roboflow
- [ ] ultralytics
- [ ] torch
- [ ] torchvision
- [ ] pillow
- [ ] requests
- [ ] python-dotenv
- [ ] opencv-python

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 5: Verify New Files

- [ ] `backend/train_roboflow.py` exists
- [ ] `backend/roboflow_unified_predict.py` exists
- [ ] `backend/roboflow_predict.py` exists
- [ ] `backend/routes/toxicity_routes_roboflow.py` exists
- [ ] `backend/models/detection.pt` exists
- [ ] `backend/models/classification.pt` exists
- [ ] `backend/roboflow_requirements.txt` exists

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 6: Test Setup

- [ ] Run: `python test_roboflow_setup.py`
- [ ] All checks should pass ✅
- [ ] No missing model files errors
- [ ] No import errors
- [ ] No configuration errors

Output should show:
```
✅ All checks passed! Ready to deploy.
```

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 7: Update Flask App

In `backend/app.py`:

### Find Old Import
- [ ] Locate line: `from routes.toxicity_routes import toxicity_bp`
- [ ] Uncomment or remove this line

### Add New Import
- [ ] Add line: `from routes.toxicity_routes_roboflow import toxicity_bp`
- [ ] Verify syntax is correct

### Verify Blueprint Registration
- [ ] Check that `app.register_blueprint(toxicity_bp, ...)` is still present
- [ ] Should register at same path: `/api/toxicity`

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 8: Test API Endpoints

### Start Flask Server
- [ ] Run: `python backend/app.py`
- [ ] Server should start without errors
- [ ] Check for any import errors

### Test Health Endpoint
- [ ] Run: `curl http://localhost:5000/api/toxicity/health`
- [ ] Response should be: `{"status": "ok", ...}`
- [ ] Models should be found

### Test Prediction Endpoint
- [ ] Prepare a test mushroom image
- [ ] Run: `curl -X POST -F "image=@test_mushroom.jpg" http://localhost:5000/api/toxicity/predict`
- [ ] Should return JSON with predictions
- [ ] Verify edibility classification works

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 9: Archive Old Files

### Backup Old Files
- [ ] `backend/predict.py` → `backend/OLD_predict.py.bak`
- [ ] `backend/detect_mushroom.py` → `backend/OLD_detect_mushroom.py.bak`
- [ ] `backend/train.py` → `backend/OLD_train.py.bak`
- [ ] `train_model.py` → `OLD_train_model.py.bak`

### Or Delete Directly (if no longer needed)
- [ ] Delete `backend/predict.py`
- [ ] Delete `backend/detect_mushroom.py`
- [ ] Delete `backend/train.py`
- [ ] Delete `train_model.py`

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 10: Final Verification

- [ ] All new files present ✅
- [ ] All old files archived/deleted ✅
- [ ] `.env` configured ✅
- [ ] Models exported ✅
- [ ] Dependencies installed ✅
- [ ] Tests passing ✅
- [ ] Flask app running ✅
- [ ] API endpoints working ✅

### Run Final Test
```bash
python test_roboflow_setup.py
```

Expected output:
```
✅ PASS: Environment
✅ PASS: Models
✅ PASS: Dependencies
✅ PASS: Predictor
✅ PASS: Flask Routes

🎉 All checks passed! Ready to deploy.
```

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 11: Commit to Git

- [ ] Review all changes with: `git status`
- [ ] Add `.env` to `.gitignore`
- [ ] Commit with: `git add .`
- [ ] Commit with: `git commit -m "Migrate to Roboflow unified system"`
- [ ] Push to repository: `git push`

**Status**: ⏳ In Progress / ✅ Complete

---

## Phase 12: Documentation

- [ ] Read `ROBOFLOW_UNIFIED_SETUP.md` for full details
- [ ] Read `ROBOFLOW_READY.md` for quick reference
- [ ] Share `OLD_FILES_ARCHIVAL.md` with team (what was deleted)
- [ ] Update any project documentation with new architecture
- [ ] Train team on new system

**Status**: ⏳ In Progress / ✅ Complete

---

## 🎉 Migration Complete!

When all items are checked:
- ✨ Old system: Retired
- 🚀 New Roboflow system: Active
- 📈 Accuracy: Improved
- 🔄 Maintenance: Simplified
- 💼 Production: Ready

---

## Next Steps After Migration

### Short Term (This Week)
- [ ] Monitor prediction accuracy
- [ ] Test with more mushroom images
- [ ] Gather feedback from users
- [ ] Document any issues

### Medium Term (This Month)
- [ ] Add more training data if needed
- [ ] Retrain models for better accuracy
- [ ] Optimize confidence thresholds
- [ ] Deploy to production environment

### Long Term (Ongoing)
- [ ] Continuously add new mushroom types
- [ ] Improve classification accuracy
- [ ] Monitor model performance
- [ ] Plan for feature expansions

---

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| Models not loading | Check `backend/models/` files exist |
| API returning errors | Check `test_roboflow_setup.py` output |
| Slow predictions | Enable GPU (check with `torch.cuda.is_available()`) |
| Old imports failing | Make sure old files are deleted/renamed |
| `.env` not loading | Make sure it's in `backend/` directory |

---

## Questions?

See full setup guide: [ROBOFLOW_UNIFIED_SETUP.md](ROBOFLOW_UNIFIED_SETUP.md)

---

**Last Updated**: February 1, 2026  
**Status**: Ready for Migration
