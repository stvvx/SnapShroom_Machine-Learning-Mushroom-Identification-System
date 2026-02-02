from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
from predict import predict_toxicity   # your existing function

# load YOLO detection model
detector = YOLO("best.pt")   # your trained YOLO mushroom detector
model = YOLO("best.pt")
def detect_and_classify(image_path):

    results = detector(image_path)

    image = Image.open(image_path).convert("RGB")

    outputs = []

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        classes = r.boxes.cls.cpu().numpy()
        confs = r.boxes.conf.cpu().numpy()

        for box, cls, conf in zip(boxes, classes, confs):
            x1,y1,x2,y2 = map(int, box)

            # crop detected mushroom
            crop = image.crop((x1,y1,x2,y2))

            # run your existing edibility classifier
            tox = predict_toxicity(crop)

            outputs.append({
                "species": detector.names[int(cls)],
                "confidence": round(float(conf), 3),
                "edibility": tox["result"],
                "edibility_confidence": tox["confidence"]
            })

    return outputs
