"""
Custom Mushroom Classifier - Training Pipeline
Uses your mushroom10kinds dataset to train a custom PyTorch model
"""

import os
import cv2
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.preprocessing import LabelEncoder
from pathlib import Path
import json
from tqdm import tqdm
from pathlib import Path

# ==========================================
# CONFIGURATION
# ==========================================
# Get parent directory (root of project)
BASE_DIR = Path(__file__).parent.parent
DATASET_CSV = str(BASE_DIR / "mushrooms10kinds.csv")
DATASET_DIR = "datasets/mushroom_dataset"  # Folder containing mushroom images
MODEL_PATH = "models/mushroom_classifier.pth"
CLASSES_PATH = "models/mushroom_classes.json"
BATCH_SIZE = 32
EPOCHS = 20
LEARNING_RATE = 0.001
IMAGE_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"🖥️ Using device: {DEVICE}")


# ==========================================
# DATASET CLASS
# ==========================================
class MushroomDataset(Dataset):
    """Custom dataset for mushroom images"""
    
    def __init__(self, csv_file, img_dir, transform=None):
        self.df = pd.read_csv(csv_file)
        self.img_dir = img_dir
        self.transform = transform
        
        # Encode labels (english_name)
        self.label_encoder = LabelEncoder()
        self.labels = self.label_encoder.fit_transform(self.df['english_name'])
        self.class_names = self.label_encoder.classes_
        
    def __len__(self):
        return len(self.df)
    
    def __getitem__(self, idx):
        # For now, use a placeholder image if real images not available
        # In production, load from files: self.img_dir / row['image_filename']
        
        row = self.df.iloc[idx]
        label = self.labels[idx]
        
        # Create placeholder image (or load real image if available)
        # img = cv2.imread(os.path.join(self.img_dir, row['image_path']))
        img = np.random.rand(IMAGE_SIZE, IMAGE_SIZE, 3) * 255  # Placeholder
        img = img.astype(np.uint8)
        
        if self.transform:
            img = self.transform(img)
        
        return img, label, row['english_name']


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
    """Train the mushroom classifier"""
    
    print("\n" + "="*50)
    print("🍄 MUSHROOM CLASSIFIER TRAINING")
    print("="*50)
    
    # Create output dirs
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
    
    # Load dataset
    print(f"\n📂 Loading dataset from: {DATASET_CSV}")
    dataset = MushroomDataset(DATASET_CSV, DATASET_DIR, transform=transform)
    
    print(f"📊 Total samples: {len(dataset)}")
    print(f"🏷️  Classes: {len(dataset.class_names)}")
    print(f"   Classes: {', '.join(dataset.class_names)}")
    
    # Split into train/val
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        dataset, [train_size, val_size]
    )
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    print(f"\n📈 Train samples: {train_size}")
    print(f"📉 Val samples: {val_size}")
    
    # Initialize model
    print(f"\n🤖 Initializing ResNet50 with {len(dataset.class_names)} classes...")
    model = MushroomClassifier(num_classes=len(dataset.class_names))
    model = model.to(DEVICE)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
    
    # Training loop
    best_val_loss = float('inf')
    
    for epoch in range(EPOCHS):
        print(f"\n--- Epoch {epoch+1}/{EPOCHS} ---")
        
        # Training
        model.train()
        train_loss = 0.0
        train_correct = 0
        
        for images, labels, _ in tqdm(train_loader, desc="Training"):
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
            for images, labels, _ in val_loader:
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
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"✅ Model saved to {MODEL_PATH}")
        
        scheduler.step(val_loss)
    
    # Save class names
    classes_dict = {
        "classes": list(dataset.class_names),
        "class_to_id": {name: idx for idx, name in enumerate(dataset.class_names)},
        "id_to_class": {str(idx): name for idx, name in enumerate(dataset.class_names)}
    }
    
    with open(CLASSES_PATH, 'w') as f:
        json.dump(classes_dict, f, indent=2)
    
    print(f"\n✅ Classes saved to {CLASSES_PATH}")
    print("\n" + "="*50)
    print("✅ TRAINING COMPLETE!")
    print("="*50)
    print(f"Model: {MODEL_PATH}")
    print(f"Classes: {CLASSES_PATH}")


if __name__ == "__main__":
    train_model()
