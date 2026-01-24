import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image
import os
import pandas as pd
from typing import Tuple, List, Optional
import ast

class MushroomDataset(Dataset):
    """
    Custom dataset for mushroom classification.
    Supports both edibility classification (edible/poisonous) and species classification.
    """

    def __init__(self,
                 root_dir: str,
                 csv_path: Optional[str] = None,
                 transform: Optional[transforms.Compose] = None,
                 classification_type: str = 'edibility',
                 subset: str = 'train'):
        """
        Args:
            root_dir: Root directory containing train/test folders
            csv_path: Path to CSV file with mushroom metadata
            transform: Optional transform to be applied on images
            classification_type: 'edibility' or 'species'
            subset: 'train' or 'test'
        """
        self.root_dir = os.path.join(root_dir, subset)
        self.transform = transform
        self.classification_type = classification_type
        self.subset = subset

        # Load CSV if provided
        self.csv_data = None
        if csv_path and os.path.exists(csv_path):
            self.csv_data = pd.read_csv(csv_path)

        # Build image paths and labels
        self.image_paths = []
        self.labels = []
        self.class_names = []
        self.species_names = []

        self._build_dataset()

    def _build_dataset(self):
        """Build the dataset by scanning directories and assigning labels."""

        if self.classification_type == 'edibility':
            # Edibility classification: edible vs poisonous
            edible_dir = os.path.join(self.root_dir, 'edible')
            poisonous_dir = os.path.join(self.root_dir, 'poisonous')

            # Label 0: poisonous, Label 1: edible
            if os.path.exists(poisonous_dir):
                self._add_images_from_category_dir(poisonous_dir, 0)

            if os.path.exists(edible_dir):
                self._add_images_from_category_dir(edible_dir, 1)

            self.class_names = ['poisonous', 'edible']

        elif self.classification_type == 'species':
            # Species classification
            edible_dir = os.path.join(self.root_dir, 'edible')
            poisonous_dir = os.path.join(self.root_dir, 'poisonous')

            species_id = 0
            species_map = {}

            # Process edible species
            if os.path.exists(edible_dir):
                for species_name in os.listdir(edible_dir):
                    species_path = os.path.join(edible_dir, species_name)
                    if os.path.isdir(species_path):
                        if species_name not in species_map:
                            species_map[species_name] = species_id
                            self.species_names.append(species_name)
                            species_id += 1
                        self._add_images_from_dir(species_path, species_map[species_name], species_name)

            # Process poisonous species
            if os.path.exists(poisonous_dir):
                for species_name in os.listdir(poisonous_dir):
                    species_path = os.path.join(poisonous_dir, species_name)
                    if os.path.isdir(species_path):
                        if species_name not in species_map:
                            species_map[species_name] = species_id
                            self.species_names.append(species_name)
                            species_id += 1
                        self._add_images_from_dir(species_path, species_map[species_name], species_name)

            self.class_names = self.species_names

        print(f"Dataset built with {len(self.image_paths)} images and {len(self.class_names)} classes")

    def _add_images_from_category_dir(self, category_dir: str, label: int):
        """Add images from all species subdirectories in a category (edible/poisonous)."""
        if not os.path.exists(category_dir):
            return

        # Scan through all species subdirectories
        for species_name in os.listdir(category_dir):
            species_path = os.path.join(category_dir, species_name)
            if os.path.isdir(species_path):
                self._add_images_from_dir(species_path, label, species_name)

    def _add_images_from_dir(self, directory: str, label: int, species_name: str):
        """Add all images from a directory with the given label."""
        if not os.path.exists(directory):
            return

        valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'}

        for filename in os.listdir(directory):
            if any(filename.lower().endswith(ext) for ext in valid_extensions):
                filepath = os.path.join(directory, filename)
                self.image_paths.append(filepath)
                self.labels.append(label)

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        """
        Returns:
            image: Transformed image tensor
            label: Class label (int)
            species_name: Species name (str)
        """
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        # Load image
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            print(f"Error loading image {img_path}: {e}")
            # Return a blank image if loading fails
            image = Image.new('RGB', (224, 224), color=(128, 128, 128))

        # Apply transforms
        if self.transform:
            image = self.transform(image)

        # Get species name from path
        species_name = self._get_species_from_path(img_path)

        return image, label, species_name

    def _get_species_from_path(self, img_path: str) -> str:
        """Extract species name from image path."""
        # Path structure: .../edible_or_poisonous/species_name/filename.jpg
        parts = img_path.split(os.sep)
        if len(parts) >= 2:
            return parts[-2]  # species name is second to last
        return "unknown"

    def get_class_distribution(self) -> dict:
        """Get the distribution of classes in the dataset."""
        from collections import Counter
        label_counts = Counter(self.labels)
        return {self.class_names[i]: count for i, count in label_counts.items()}

    def get_csv_info(self, species_name: str) -> Optional[dict]:
        """Get CSV information for a species."""
        if self.csv_data is None:
            return None

        # Find matching row by scientific name
        matching_rows = self.csv_data[
            self.csv_data['scientific_name'].str.replace(' ', '_') == species_name
        ]

        if len(matching_rows) == 0:
            return None

        row = matching_rows.iloc[0]
        return {
            'mushroom_id': row.get('mushroom_id'),
            'english_name': row.get('english_name'),
            'local_name': row.get('local_name'),
            'scientific_name': row.get('scientific_name'),
            'edible': row.get('edible'),
            'poisonous': row.get('poisonous'),
            'location_region': row.get('location_region'),
            'location_province': row.get('location_province'),
            'habitat': row.get('habitat'),
            'cap_color': row.get('cap_color'),
            'cap_size_cm': row.get('cap_size_cm'),
            'season_month': row.get('season_month'),
            'notes': row.get('notes')
        }


def create_data_loaders(root_dir: str,
                       csv_path: str = None,
                       batch_size: int = 32,
                       transform: transforms.Compose = None,
                       classification_type: str = 'edibility'):
    """
    Create train and test data loaders.
    """
    if transform is None:
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    train_dataset = MushroomDataset(root_dir, csv_path, transform, classification_type, 'train')
    test_dataset = MushroomDataset(root_dir, csv_path, transform, classification_type, 'test')

    train_loader = torch.utils.data.DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True, num_workers=0
    )
    test_loader = torch.utils.data.DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False, num_workers=0
    )

    return train_loader, test_loader, train_dataset, test_dataset