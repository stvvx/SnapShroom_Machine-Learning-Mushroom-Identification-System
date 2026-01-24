# predict.py
import torch
import torchvision.models as models
import torch.nn as nn
from torchvision import transforms
from PIL import Image

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

try:
    model = models.mobilenet_v2(weights=None)
except TypeError:
    model = models.mobilenet_v2(pretrained=False)
model.classifier[1] = nn.Linear(1280, 2)
model.load_state_dict(
    torch.load("models/mushroom_edibility.pth", map_location=DEVICE)
)
model.eval().to(DEVICE)

def predict_toxicity(image: Image.Image):
    img = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(img)
        probs = torch.softmax(outputs, dim=1)
        pred = torch.argmax(probs, 1).item()

    return {
        "result": "EDIBLE" if pred == 1 else "POISONOUS",
        "confidence": round(float(probs[0][pred]), 4)
    }
