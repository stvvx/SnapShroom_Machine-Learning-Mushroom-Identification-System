"""
Custom Mushroom Classifier - Training Pipeline (YOLO Dataset Format)
Trains a ResNet50-based classifier on your Roboflow YOLO dataset
"""

import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from pathlib import Path
import json
from tqdm import tqdm
import yaml

# ==========================================
# CONFIGURATION
# ==========================================
DATASET_DIR = "datasets/mushroom_dataset"  # YOLO dataset folder
DATA_YAML = os.path.join(DATASET_DIR, "data.yaml")
MODEL_PATH = "models/mushroom_classifier.pth"
CLASSES_PATH = "models/mushroom_classes.json"
CHECKPOINT_PATH = "models/checkpoint.pth"  # Checkpoint for resuming
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001
IMAGE_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"🖥️ Using device: {DEVICE}")


# ==========================================
# DATASET CLASS
# ==========================================
class YoloMushroomDataset(Dataset):
    """Load images from YOLO format dataset"""
    
    def __init__(self, data_dir, split='train', transform=None, class_names=None):
        """
        Args:
            data_dir: Path to YOLO dataset (contains train/, valid/, test/)
            split: 'train', 'valid', or 'test'
            transform: Image transforms
            class_names: Dict mapping class ID to class name
        """
        self.image_dir = os.path.join(data_dir, split, 'images')
        self.label_dir = os.path.join(data_dir, split, 'labels')
        self.transform = transform
        self.class_names = class_names or {}
        
        if not os.path.exists(self.image_dir):
            raise FileNotFoundError(f"Image directory not found: {self.image_dir}")
        
        if not os.path.exists(self.label_dir):
            raise FileNotFoundError(f"Label directory not found: {self.label_dir}")
        
        # Get all image files and filter by valid labels
        all_image_files = sorted([
            f for f in os.listdir(self.image_dir)
            if f.lower().endswith(('.jpg', '.jpeg', '.png'))
        ])
        
        # Validate that each image has a non-empty label file
        self.image_files = []
        skipped = 0
        
        for img_name in all_image_files:
            label_name = os.path.splitext(img_name)[0] + '.txt'
            label_path = os.path.join(self.label_dir, label_name)
            
            # Check if label exists and is not empty
            if os.path.exists(label_path) and os.path.getsize(label_path) > 0:
                self.image_files.append(img_name)
            else:
                skipped += 1
        
        if len(self.image_files) == 0:
            raise ValueError(f"No valid images found in {self.image_dir}")
        
        if skipped > 0:
            print(f"  ⚠️  Skipped {skipped} images with empty/missing labels")
        
        print(f"  ✅ Found {len(self.image_files)} valid images in {split}")
        
    def __len__(self):
        return len(self.image_files)
    
    def __getitem__(self, idx):
        img_name = self.image_files[idx]
        img_path = os.path.join(self.image_dir, img_name)
        
        # Read image
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError(f"Failed to read image: {img_path}")
        
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Get label from corresponding txt file
        label_name = os.path.splitext(img_name)[0] + '.txt'
        label_path = os.path.join(self.label_dir, label_name)
        
        # Read label file - first number is class ID
        with open(label_path, 'r') as f:
            first_line = f.readline().strip()
            if not first_line:
                raise ValueError(f"Empty label file: {label_path}")
            
            class_id = int(first_line.split()[0])
            class_name = self.class_names.get(class_id, f"Class_{class_id}")
        
        if self.transform:
            img = self.transform(img)
        
        return img, class_name, img_name


# ==========================================
# MODEL
# ==========================================
class MushroomClassifier(nn.Module):
    """ResNet50-based mushroom classifier"""
    
    def __init__(self, num_classes):
        super(MushroomClassifier, self).__init__()
        
        # Load pre-trained ResNet50
        self.backbone = models.resnet50(pretrained=True)
        
        # Replace final layer
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Linear(num_features, num_classes)
    
    def forward(self, x):
        return self.backbone(x)


# ==========================================
# TRAINING FUNCTION
# ==========================================
def train_model():
    """Train the mushroom classifier using YOLO dataset"""
    
    print("\n" + "="*50)
    print("🍄 MUSHROOM CLASSIFIER TRAINING")
    print("="*50)
    
    # Create output dirs
    os.makedirs("models", exist_ok=True)
    
    if not os.path.exists(DATA_YAML):
        print(f"❌ Dataset config not found: {DATA_YAML}")
        return
    
    # Load data.yaml to get class names
    print(f"\n📚 Loading YOLO dataset config from: {DATA_YAML}")
    with open(DATA_YAML, 'r') as f:
        yaml_data = yaml.safe_load(f)
    
    class_names = yaml_data.get('names', {})
    if isinstance(class_names, list):
        class_names = {i: name for i, name in enumerate(class_names)}
    
    num_classes = len(class_names)
    print(f"🏷️  Found {num_classes} classes: {', '.join(class_names.values())}")
    
    # Setup transforms
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    # Load datasets - pass class_names to dataset loader
    print(f"\n📂 Loading dataset from: {DATASET_DIR}")
    try:
        train_dataset = YoloMushroomDataset(DATASET_DIR, split='train', transform=transform, class_names=class_names)
        val_dataset = YoloMushroomDataset(DATASET_DIR, split='valid', transform=transform, class_names=class_names)
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    train_size = len(train_dataset)
    val_size = len(val_dataset)
    
    print(f"\n📈 Train samples: {train_size}")
    print(f"📉 Val samples: {val_size}")
    
    # Create class name to index mapping
    class_name_to_id = {name: idx for idx, name in class_names.items()}
    
    # Initialize model
    print(f"\n🤖 Initializing ResNet50 with {num_classes} classes...")
    model = MushroomClassifier(num_classes=num_classes)
    model = model.to(DEVICE)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
    
    # Resume from checkpoint if exists
    start_epoch = 0
    best_val_loss = float('inf')
    
    if os.path.exists(CHECKPOINT_PATH):
        print(f"\n📂 Loading checkpoint from {CHECKPOINT_PATH}...")
        checkpoint = torch.load(CHECKPOINT_PATH)
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        start_epoch = checkpoint['epoch'] + 1
        best_val_loss = checkpoint['best_val_loss']
        print(f"✅ Resuming from epoch {start_epoch}/{EPOCHS}")
        print(f"   Best validation loss so far: {best_val_loss:.4f}")
    else:
        print("\n🆕 Starting training from scratch...")
    
    # Training loop
    
    for epoch in range(start_epoch, EPOCHS):
        print(f"\n--- Epoch {epoch+1}/{EPOCHS} ---")
        
        # Training
        model.train()
        train_loss = 0.0
        train_correct = 0
        
        for images, class_names_batch, filenames in tqdm(train_loader, desc="Training"):
            # Convert class names to indices
            labels = torch.tensor([
                class_name_to_id[name] for name in class_names_batch
            ], dtype=torch.long)
            
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
        
        train_loss /= len(train_loader)
        train_acc = train_correct / train_size
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        
        with torch.no_grad():
            for images, class_names_batch, filenames in val_loader:
                # Convert class names to indices
                labels = torch.tensor([
                    class_name_to_id[name] for name in class_names_batch
                ], dtype=torch.long)
                
                images = images.to(DEVICE)
                labels = labels.to(DEVICE)
                
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = val_correct / val_size
        
        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
        print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
        
        # Save checkpoint after every epoch
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'best_val_loss': best_val_loss,
            'train_loss': train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'val_acc': val_acc
        }
        torch.save(checkpoint, CHECKPOINT_PATH)
        print(f"💾 Checkpoint saved to {CHECKPOINT_PATH}")
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"✅ Best model saved to {MODEL_PATH}")
        
        scheduler.step(val_loss)
    
    # Save class names
    classes_dict = {
        "classes": list(class_names.values()),
        "class_to_id": {name: int(idx) for idx, name in class_names.items()},
        "id_to_class": {str(idx): name for idx, name in class_names.items()}
    }
    
    with open(CLASSES_PATH, 'w') as f:
        json.dump(classes_dict, f, indent=2)
    
    print(f"\n✅ Classes saved to {CLASSES_PATH}")
    
    # Remove checkpoint after successful completion
    if os.path.exists(CHECKPOINT_PATH):
        os.remove(CHECKPOINT_PATH)
        print(f"🗑️ Checkpoint removed (training complete)")
    
    print("\n" + "="*50)
    print("✅ TRAINING COMPLETE!")
    print("="*50)
    print(f"Model: {MODEL_PATH}")
    print(f"Classes: {CLASSES_PATH}")
    print(f"Model classes: {list(class_names.values())}")


if __name__ == "__main__":
    train_model()
