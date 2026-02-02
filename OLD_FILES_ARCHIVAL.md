# OLD FILES TO ARCHIVE/DELETE

This document lists the old prediction files that are **REPLACED** by the new Roboflow unified system.

## Files to Remove or Archive

### 1. ❌ `backend/predict.py`
**Purpose:** Old PyTorch classification model (edible/poisonous only)  
**Status:** REPLACED by `roboflow_unified_predict.py`  
**Why remove:** 
- Only did classification, not detection
- Used local PyTorch models
- No cloud training support
- Slower than Roboflow

**Archive:**
```bash
# Option 1: Keep as backup
mv backend/predict.py backend/OLD_predict.py.bak

# Option 2: Delete entirely
rm backend/predict.py
```

---

### 2. ❌ `backend/detect_mushroom.py`
**Purpose:** Combined detection + classification (early version)  
**Status:** REPLACED by `roboflow_unified_predict.py`  
**Why remove:**
- Complex, redundant code
- Used multiple models inefficiently
- No error handling
- Hard to maintain

**Archive:**
```bash
# Option 1: Keep as backup
mv backend/detect_mushroom.py backend/OLD_detect_mushroom.py.bak

# Option 2: Delete entirely
rm backend/detect_mushroom.py
```

---

### 3. ❌ `train_model.py` (root directory)
**Purpose:** Local YOLOv8 detection training  
**Status:** REPLACED by `backend/train_roboflow.py`  
**Why remove:**
- Slower training (local GPU only)
- No augmentation/optimization
- Manual model management
- Roboflow is much better

**Archive:**
```bash
# Option 1: Keep as backup
mv train_model.py OLD_train_model.py.bak

# Option 2: Delete entirely
rm train_model.py
```

---

### 4. ❌ `backend/train.py`
**Purpose:** Local PyTorch toxicity model training  
**Status:** REPLACED by `backend/train_roboflow.py`  
**Why remove:**
- Only for classification, not detection
- Slow local training
- No cloud support
- Outdated approach

**Archive:**
```bash
# Option 1: Keep as backup
mv backend/train.py backend/OLD_train.py.bak

# Option 2: Delete entirely
rm backend/train.py
```

---

### 5. ⚠️ `backend/routes/toxicity_routes.py` (Original)
**Purpose:** Old Flask endpoints using old prediction models  
**Status:** REPLACED by `backend/routes/toxicity_routes_roboflow.py`  
**Action:** 
- Keep as reference only
- Don't use in `app.py`
- Update `app.py` to use `toxicity_routes_roboflow.py`

---

## What to Keep

### ✅ KEEP THESE:
- `backend/roboflow_unified_predict.py` - Main prediction script
- `backend/routes/toxicity_routes_roboflow.py` - New Flask routes
- `backend/train_roboflow.py` - Training script
- `backend/roboflow_predict.py` - Optional API-based inference
- `backend/models/detection.pt` - Exported detection model
- `backend/models/classification.pt` - Exported classification model

### 📦 Optional (Backup):
- `backend/OLD_predict.py.bak` - Keep for reference (2-4 weeks)
- `backend/OLD_train.py.bak` - Keep for reference (2-4 weeks)

---

## Files That Can Be Deleted Safely

```bash
# SAFE TO DELETE - These are completely replaced
rm backend/predict.py
rm backend/detect_mushroom.py  
rm train_model.py
rm backend/train.py

# OPTIONAL - Keep as backups if unsure
# mv backend/predict.py backend/OLD_predict.py.bak
# mv backend/detect_mushroom.py backend/OLD_detect_mushroom.py.bak
# etc.
```

---

## Old vs New Comparison

| Aspect | Old System | New Roboflow System |
|--------|-----------|-------------------|
| Training | Local (slow) | Cloud GPU (fast) |
| Models | PyTorch + YOLOv8 | YOLOv8 only |
| Pipeline | Separate detect/classify | Unified detection+classification |
| Accuracy | Medium | High (Roboflow optimized) |
| Maintenance | Manual | Automatic versioning |
| Code | Multiple files | Single unified file |
| Scalability | Limited | Enterprise-grade |

---

## Migration Checklist

- [ ] Export detection model from Roboflow → `models/detection.pt`
- [ ] Export classification model from Roboflow → `models/classification.pt`
- [ ] Update `.env` with Roboflow credentials
- [ ] Update `app.py` to import `toxicity_routes_roboflow`
- [ ] Test new endpoints
- [ ] Archive or delete old files
- [ ] Commit changes to git

---

## How to Update app.py

**BEFORE (Old):**
```python
from routes.toxicity_routes import toxicity_bp
app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
```

**AFTER (New):**
```python
from routes.toxicity_routes_roboflow import toxicity_bp
app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
```

---

## Reverting to Old System (If Needed)

If something goes wrong, you can revert:

```bash
# Restore old files
mv backend/OLD_predict.py.bak backend/predict.py
mv backend/OLD_train.py.bak backend/train.py
mv backend/OLD_detect_mushroom.py.bak backend/detect_mushroom.py

# Update app.py back to old import
# (Change toxicity_routes_roboflow back to toxicity_routes)

# Restart Flask
```

---

## Questions?

See [ROBOFLOW_UNIFIED_SETUP.md](ROBOFLOW_UNIFIED_SETUP.md) for full setup guide.
