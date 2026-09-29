#!/usr/bin/env python3
"""
YOLO Face Detection and Student Matching Script

This script detects faces in an image and attempts to match them with
registered student profile pictures using feature comparison.

Usage:
  python yolo_face_detect.py --image <path_to_image> --students <json_array>
"""

import json
import sys
import argparse
import os
from pathlib import Path

# Try to import cv2 (OpenCV)
try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print(json.dumps({
        "success": False,
        "error": "OpenCV not installed. Install with: pip install opencv-python"
    }))
    sys.exit(1)

# Try to import ultralytics for YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("[INFO] YOLO not installed, using Haar Cascade fallback")


class FaceDetector:
    """Face detection and matching engine"""

    def __init__(self):
        """Initialize face detector"""
        self.face_cascade = None
        self.yolo_model = None
        self.setup_detector()

    def setup_detector(self):
        """Setup face detection model"""
        # Try YOLO first
        if YOLO_AVAILABLE:
            try:
                self.yolo_model = YOLO('yolov8n-face.pt')
                print("[INFO] YOLO model loaded", file=sys.stderr)
            except Exception as e:
                print(f"[WARN] YOLO model load failed: {e}", file=sys.stderr)
                self.setup_haar_cascade()
        else:
            self.setup_haar_cascade()

    def setup_haar_cascade(self):
        """Setup Haar Cascade as fallback"""
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        print("[INFO] Using Haar Cascade face detector", file=sys.stderr)

    def detect_faces(self, image_path):
        """
        Detect faces in image
        Returns: (image, detections) where detections = [(x1, y1, x2, y2, confidence), ...]
        """
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise Exception(f"Failed to read image: {image_path}")

        height, width = image.shape[:2]
        detections = []

        if self.yolo_model:
            detections = self._detect_with_yolo(image)
        else:
            detections = self._detect_with_haar(image)

        return image, detections, width, height

    def _detect_with_yolo(self, image):
        """Detect faces using YOLO"""
        try:
            results = self.yolo_model(image, conf=0.5)
            detections = []

            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    confidence = float(box.conf[0])
                    detections.append({
                        'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                        'confidence': confidence
                    })

            return detections
        except Exception as e:
            print(f"[WARN] YOLO detection failed: {e}", file=sys.stderr)
            return []

    def _detect_with_haar(self, image):
        """Detect faces using Haar Cascade"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)

        detections = []
        for (x, y, w, h) in faces:
            detections.append({
                'x1': x, 'y1': y, 'x2': x + w, 'y2': y + h,
                'confidence': 0.85  # Haar Cascade doesn't give confidence
            })

        return detections

    def extract_face_feature(self, image, detection):
        """Extract face region and compute color histogram feature"""
        x1, y1 = detection['x1'], detection['y1']
        x2, y2 = detection['x2'], detection['y2']

        # Crop face region
        face_region = image[y1:y2, x1:x2]

        if face_region.size == 0:
            return None

        # Compute HSV histogram (simple feature representation)
        hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist(
            [hsv], [0, 1], None, [8, 8],
            [0, 180, 0, 256]
        )
        hist = cv2.normalize(hist, hist).flatten()

        return hist

    def compute_histogram_similarity(self, hist1, hist2):
        """Compute similarity between two histograms (0-1, higher is more similar)"""
        if hist1 is None or hist2 is None:
            return 0.0

        # Use Bhattacharyya distance
        distance = cv2.compareHist(
            hist1.reshape(-1, 1), hist2.reshape(-1, 1),
            cv2.HISTCMP_BHATTACHARYYA
        )

        # Convert distance to similarity (0-1)
        similarity = 1.0 - min(distance, 1.0)
        return similarity

    def match_faces_with_students(self, image, detections, students):
        """Match detected faces with student profile pictures"""
        matched_detections = []

        for detection in detections:
            face_hist = self.extract_face_feature(image, detection)
            if face_hist is None:
                matched_detections.append({
                    'box': [detection['x1'], detection['y1'], detection['x2'], detection['y2']],
                    'confidence': detection['confidence'],
                    'matchedStudent': None
                })
                continue

            best_match = None
            best_similarity = 0.0

            # Compare against all student profile pictures
            for student in students:
                profile_pic_path = student.get('profilePicture', '')
                if not profile_pic_path or not os.path.exists(profile_pic_path):
                    continue

                try:
                    student_image = cv2.imread(profile_pic_path)
                    if student_image is None:
                        continue

                    # Extract face from student photo (assume it's the main face)
                    student_hist = self.extract_face_feature(student_image, {
                        'x1': 0, 'y1': 0, 'x2': student_image.shape[1], 'y2': student_image.shape[0]
                    })

                    if student_hist is None:
                        continue

                    similarity = self.compute_histogram_similarity(face_hist, student_hist)

                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match = {
                            '_id': student['_id'],
                            'studentId': student['studentId'],
                            'name': student['name'],
                            'similarity': round(similarity, 2)
                        }

                except Exception as e:
                    print(f"[WARN] Error processing student {student['studentId']}: {e}", file=sys.stderr)
                    continue

            # Use match if similarity > threshold (0.50)
            if best_similarity > 0.50:
                matched_detections.append({
                    'box': [detection['x1'], detection['y1'], detection['x2'], detection['y2']],
                    'confidence': detection['confidence'],
                    'matchedStudent': best_match
                })
            else:
                matched_detections.append({
                    'box': [detection['x1'], detection['y1'], detection['x2'], detection['y2']],
                    'confidence': detection['confidence'],
                    'matchedStudent': None
                })

        return matched_detections


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='YOLO Face Detection for Attendance')
    parser.add_argument('--image', required=True, help='Path to classroom image')
    parser.add_argument('--students', required=True, help='JSON array of students with profile pictures')

    try:
        args = parser.parse_args()

        # Parse students JSON
        students = json.loads(args.students)

        # Initialize detector
        detector = FaceDetector()

        # Detect faces
        image, detections, width, height = detector.detect_faces(args.image)

        # Match faces with students
        matched_detections = detector.match_faces_with_students(image, detections, students)

        # Output result
        result = {
            'success': True,
            'imageWidth': width,
            'imageHeight': height,
            'detections': matched_detections
        }

        print(json.dumps(result))

    except Exception as e:
        result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(result))
        sys.exit(1)


if __name__ == '__main__':
    main()
