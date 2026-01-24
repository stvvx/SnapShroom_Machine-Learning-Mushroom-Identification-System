import torch
import torch.nn as nn
import torchvision.models as models
from torch.utils.data import DataLoader
from torchvision import transforms
import os
import argparse
from datetime import datetime

from datasets.mushroom_dataset import MushroomDataset, create_data_loaders
from services.species_classifier import SpeciesClassifier

def train_toxicity_model(dataset_path: str = "dataset",
                        csv_path: str = "mushrooms.csv",
                        epochs: int = 20,
                        batch_size: int = 32,
                        learning_rate: float = 0.0001,
                        save_path: str = "models/mushroom_edibility.pth"):
    """
    Train PyTorch model for toxicity detection (edible vs poisonous).
    """
    print("=== Training Toxicity Detection Model ===")
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {DEVICE}")

    # Create data loaders
    train_loader, test_loader, train_dataset, test_dataset = create_data_loaders(
        dataset_path, csv_path, batch_size=batch_size, classification_type='edibility'
    )

    print(f"Training samples: {len(train_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    print(f"Class distribution: {train_dataset.get_class_distribution()}")

    # Model
    print("Creating MobileNetV2 model...")
    try:
        model = models.mobilenet_v2(weights=None)  # Don't download pretrained weights
    except TypeError:
        # For older torchvision versions
        model = models.mobilenet_v2(pretrained=False)
    model.classifier[1] = nn.Linear(1280, 2)  # Binary classification
    model = model.to(DEVICE)

    # Loss & Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

    # Training loop
    print("Starting training...")
    best_accuracy = 0.0

    for epoch in range(epochs):
        # Training phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, (images, labels, _) in enumerate(train_loader):
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        train_accuracy = 100 * correct / total
        scheduler.step()

        # Validation phase
        model.eval()
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels, _ in test_loader:
                images = images.to(DEVICE)
                labels = labels.to(DEVICE)

                outputs = model(images)
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()

        val_accuracy = 100 * val_correct / val_total

        print(f"Epoch [{epoch+1}/{epochs}] "
              f"Loss: {running_loss/len(train_loader):.4f} "
              f"Train Acc: {train_accuracy:.2f}% "
              f"Val Acc: {val_accuracy:.2f}%")

        # Save best model
        if val_accuracy > best_accuracy:
            best_accuracy = val_accuracy
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model.state_dict(), save_path)
            print(f"Best model saved with accuracy: {best_accuracy:.2f}%")

    print(f"Training completed. Best validation accuracy: {best_accuracy:.2f}%")
    return best_accuracy

def train_species_model(dataset_path: str = "dataset",
                       csv_path: str = "mushrooms.csv",
                       save_path: str = "models/species_model.pkl"):
    """
    Train sklearn model for species classification.
    """
    print("\n=== Training Species Classification Model ===")

    classifier = SpeciesClassifier()
    success = classifier.train_model(dataset_path, save_path)

    if success:
        print("Species classification model trained successfully")
    else:
        print("Failed to train species classification model")

    return success

def main():
    parser = argparse.ArgumentParser(description='Train mushroom detection models')
    parser.add_argument('--dataset', default='dataset', help='Path to dataset directory')
    parser.add_argument('--csv', default='mushrooms.csv', help='Path to CSV file')
    parser.add_argument('--epochs', type=int, default=20, help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.0001, help='Learning rate')

    args = parser.parse_args()

    print(f"Training started at {datetime.now()}")
    print(f"Dataset: {args.dataset}")
    print(f"CSV: {args.csv}")

    # Train toxicity model
    toxicity_accuracy = train_toxicity_model(
        dataset_path=args.dataset,
        csv_path=args.csv,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )

    # Train species model
    species_success = train_species_model(
        dataset_path=args.dataset,
        csv_path=args.csv
    )

    print("\n=== Training Summary ===")
    print(f"Toxicity Model - Best Accuracy: {toxicity_accuracy:.2f}%")
    print(f"Species Model - Trained: {species_success}")
    print(f"Training completed at {datetime.now()}")

if __name__ == "__main__":
    main()

