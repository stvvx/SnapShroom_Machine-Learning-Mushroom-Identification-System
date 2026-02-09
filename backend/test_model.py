"""
Test Model Accuracy - Evaluate trained mushroom classifier
"""

import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import transforms, models
import json
from tqdm import tqdm
import yaml
from collections import defaultdict

# ==========================================
# CONFIGURATION
# ==========================================
DATASET_DIR = "datasets/mushroom_dataset"
DATA_YAML = os.path.join(DATASET_DIR, "data.yaml")
MODEL_PATH = "models/mushroom_classifier.pth"
CLASSES_PATH = "models/mushroom_classes.json"
BATCH_SIZE = 32
IMAGE_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"🖥️ Using device: {DEVICE}")

# Import dataset class from training script
import sys
sys.path.insert(0, os.path.dirname(__file__))
from train_custom import YoloMushroomDataset, MushroomClassifier

# ==========================================
# EVALUATION FUNCTION
# ==========================================
def evaluate_model(model, data_loader, class_id_to_name, class_name_to_id):
    """Evaluate model and return detailed accuracy metrics"""
    model.eval()
    
    total_correct = 0
    total_samples = 0
    
    # Per-class metrics
    class_correct = defaultdict(int)
    class_total = defaultdict(int)
    
    all_predictions = []
    all_labels = []
    
    print("\n🔍 Evaluating model...")
    
    with torch.no_grad():
        for images, class_names_batch, filenames in tqdm(data_loader, desc="Testing"):
            # Convert class names to indices
            labels = torch.tensor([
                class_name_to_id[name] for name in class_names_batch
            ], dtype=torch.long)
            
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            
            # Get predictions
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            
            # Calculate accuracy
            correct = (preds == labels)
            total_correct += correct.sum().item()
            total_samples += labels.size(0)
            
            # Store per-class results
            for i in range(len(labels)):
                label_id = labels[i].item()
                class_name = class_id_to_name[label_id]
                
                class_total[class_name] += 1
                if correct[i]:
                    class_correct[class_name] += 1
                
                all_predictions.append(preds[i].item())
                all_labels.append(label_id)
    
    overall_accuracy = total_correct / total_samples
    
    return overall_accuracy, class_correct, class_total, all_predictions, all_labels


# ==========================================
# MAIN TEST FUNCTION
# ==========================================
def test_model(test_split='test'):
    """
    Test the trained model
    
    Args:
        test_split: Which split to test on - 'test', 'valid', or 'train'
    """
    print("\n" + "="*60)
    print("🧪 MUSHROOM CLASSIFIER - MODEL EVALUATION")
    print("="*60)
    
    # Load class names from YAML
    print(f"\n📂 Loading dataset configuration from {DATA_YAML}...")
    with open(DATA_YAML, 'r') as f:
        data_config = yaml.safe_load(f)
    
    class_names = data_config['names']
    num_classes = len(class_names)
    print(f"✅ Found {num_classes} classes: {list(class_names.values())}")
    
    # Create mappings
    class_id_to_name = {int(k): v for k, v in class_names.items()}
    class_name_to_id = {v: int(k) for k, v in class_names.items()}
    
    # Load test dataset
    print(f"\n📦 Loading {test_split} dataset...")
    test_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    test_dataset = YoloMushroomDataset(
        DATASET_DIR,
        split=test_split,
        transform=test_transform,
        class_names=class_names
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0
    )
    
    # Load model
    print(f"\n🤖 Loading model from {MODEL_PATH}...")
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        print("   Please train the model first using: python backend/train_custom.py")
        return
    
    model = MushroomClassifier(num_classes=num_classes)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model = model.to(DEVICE)
    print("✅ Model loaded successfully")
    
    # Evaluate
    overall_acc, class_correct, class_total, preds, labels = evaluate_model(
        model, test_loader, class_id_to_name, class_name_to_id
    )
    
    # Print results
    print("\n" + "="*60)
    print("📊 EVALUATION RESULTS")
    print("="*60)
    print(f"\n🎯 Overall Accuracy: {overall_acc*100:.2f}%")
    print(f"   Correct: {sum(class_correct.values())} / {sum(class_total.values())}")
    
    print("\n📈 Per-Class Accuracy:")
    print("-" * 60)
    
    # Sort by class name
    sorted_classes = sorted(class_total.keys())
    
    for class_name in sorted_classes:
        total = class_total[class_name]
        correct = class_correct[class_name]
        acc = (correct / total * 100) if total > 0 else 0
        
        # Visual bar
        bar_length = 30
        filled = int(bar_length * acc / 100)
        bar = "█" * filled + "░" * (bar_length - filled)
        
        print(f"{class_name:25s} [{bar}] {acc:5.1f}% ({correct}/{total})")
    
    # Find best and worst performing classes
    class_accuracies = {
        name: (class_correct[name] / class_total[name] * 100)
        for name in class_total.keys()
    }
    
    best_class = max(class_accuracies, key=class_accuracies.get)
    worst_class = min(class_accuracies, key=class_accuracies.get)
    
    print("\n" + "="*60)
    print(f"🏆 Best Performance:  {best_class} ({class_accuracies[best_class]:.1f}%)")
    print(f"⚠️  Worst Performance: {worst_class} ({class_accuracies[worst_class]:.1f}%)")
    print("="*60)
    
    # Save results
    results = {
        "overall_accuracy": float(overall_acc),
        "test_split": test_split,
        "total_samples": sum(class_total.values()),
        "per_class_accuracy": {
            name: {
                "accuracy": float(class_correct[name] / class_total[name]),
                "correct": int(class_correct[name]),
                "total": int(class_total[name])
            }
            for name in class_total.keys()
        }
    }
    
    results_path = "models/test_results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to {results_path}")
    print("\n✅ Evaluation complete!\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test mushroom classifier")
    parser.add_argument(
        "--split",
        type=str,
        default="test",
        choices=["test", "valid", "train"],
        help="Which dataset split to test on (default: test)"
    )
    
    args = parser.parse_args()
    test_model(test_split=args.split)
