"""
Mushroom Detector - Binary Classification
Trains a model to detect: Mushroom vs Not Mushroom
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
import numpy as np
from pathlib import Path
from tqdm import tqdm
import json

# ==========================================
# CONFIGURATION
# ==========================================
BASE_DIR = Path(__file__).parent.parent
DATASET_DIR = "datasets/mushroom_dataset"
MODEL_PATH = "models/mushroom_detector.pth"
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001
IMAGE_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"🖥️ Using device: {DEVICE}")


# ==========================================
# DATASET CLASS - Binary Classification
# ==========================================
class BinaryMushroomDataset(Dataset):
    """Binary dataset: Mushroom (1) vs Not Mushroom (0)"""
    
    def __init__(self, data_dir, split='train', transform=None):
        self.data_dir = Path(data_dir)
        self.split = split
        self.transform = transform
        self.images = []
        self.labels = []
        
        # All mushroom classes = label 1
        img_dir = self.data_dir / split / 'images'
        
        if img_dir.exists():
            for img_file in img_dir.glob('*'):
                if img_file.suffix.lower() in ['.jpg', '.png', '.jpeg']:
                    self.images.append(str(img_file))
                    self.labels.append(1)  # All are mushrooms
        
        print(f"✅ Loaded {len(self.images)} {split} images (all mushrooms)")
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        from PIL import Image
        
        img_path = self.images[idx]
        label = self.labels[idx]
        
        try:
            img = Image.open(img_path).convert('RGB')
        except:
            # Return black image if load fails
            img = Image.new('RGB', (IMAGE_SIZE, IMAGE_SIZE), color='black')
        
        if self.transform:
            img = self.transform(img)
        
        return img, label


# ==========================================
# MODEL
# ==========================================
class MushroomDetector(nn.Module):
    """Binary classifier: Mushroom or Not Mushroom"""
    
    def __init__(self):
        super(MushroomDetector, self).__init__()
        self.backbone = models.resnet50(pretrained=True)
        num_features = self.backbone.fc.in_features
        # Binary classification: 2 classes (not mushroom, mushroom)
        self.backbone.fc = nn.Linear(num_features, 2)
    
    def forward(self, x):
        return self.backbone(x)


# ==========================================
# TRAINING FUNCTION
# ==========================================
def train_detector():
    """Train binary mushroom detector"""
    
    print("\n" + "="*50)
    print("🍄 MUSHROOM DETECTOR TRAINING (Binary)")
    print("="*50)
    
    os.makedirs("models", exist_ok=True)
    
    # Setup transforms
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    # Load datasets
    print(f"\n📂 Loading dataset from: {DATASET_DIR}")
    train_dataset = BinaryMushroomDataset(DATASET_DIR, split='train', transform=transform)
    val_dataset = BinaryMushroomDataset(DATASET_DIR, split='valid', transform=transform)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    print(f"📈 Train samples: {len(train_dataset)}")
    print(f"📉 Val samples: {len(val_dataset)}")
    
    # Initialize model
    print(f"\n🤖 Initializing ResNet50 for binary classification (Mushroom or Not)...")
    model = MushroomDetector()
    model = model.to(DEVICE)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
    
    # Training loop
    best_val_loss = float('inf')
    
    for epoch in range(EPOCHS):
        print(f"\n--- Epoch {epoch+1}/{EPOCHS} ---")
        
        # Training
        model.train()
        train_loss = 0.0
        train_correct = 0
        
        for images, labels in tqdm(train_loader, desc="Training"):
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
        train_acc = train_correct / len(train_dataset)
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(DEVICE)
                labels = labels.to(DEVICE)
                
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = val_correct / len(val_dataset)
        
        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
        print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"✅ Model saved to {MODEL_PATH}")
        
        scheduler.step(val_loss)
    
    print(f"\n✅ TRAINING COMPLETE!")
    print(f"Model: {MODEL_PATH}")
    print(f"\n Classes:")
    print(f"  - 0: Not a Mushroom")
    print(f"  - 1: Mushroom (proceed to classification)")


if __name__ == "__main__":
    train_detector()
