from ultralytics import YOLO

# load base model
model = YOLO("yolov8n.pt")
model = YOLO("runs/detect/train/weights/best.pt") #papalitan
# train
model.train(
    data="data.yaml",
    epochs=50,
    imgsz=640
)
