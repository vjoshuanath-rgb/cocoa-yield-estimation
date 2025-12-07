#!/usr/bin/env python3
"""
Convert Cocoa Diseases Dataset from Supervisely format to YOLO format
Usage: python convert_supervisely_to_yolo.py
"""

import json
import os
import shutil
from pathlib import Path
import random

# Configuration
SOURCE_DIR = os.path.expanduser("~/Downloads/cocoa-diseases-DatasetNinja/all")
OUTPUT_DIR = os.path.expanduser("~/Downloads/cocoa-diseases-yolo")

# Class mapping (based on the dataset)
CLASS_MAPPING = {
    'healthy': 0,
    'phytophthora': 1,
    'monilia': 2
}

# Split ratios
TRAIN_RATIO = 0.80
VAL_RATIO = 0.10
TEST_RATIO = 0.10

def convert_bbox_to_yolo(bbox, img_width, img_height):
    """
    Convert Supervisely bbox to YOLO format
    Supervisely: [x1, y1], [x2, y2] (top-left, bottom-right)
    YOLO: class_id x_center y_center width height (all normalized 0-1)
    """
    x1, y1 = bbox['exterior'][0]
    x2, y2 = bbox['exterior'][1]
    
    # Calculate center, width, height
    x_center = (x1 + x2) / 2.0 / img_width
    y_center = (y1 + y2) / 2.0 / img_height
    width = abs(x2 - x1) / img_width
    height = abs(y2 - y1) / img_height
    
    return x_center, y_center, width, height

def process_annotation(ann_path, img_width, img_height):
    """Process a single annotation file and return YOLO format labels"""
    with open(ann_path, 'r') as f:
        data = json.load(f)
    
    labels = []
    for obj in data.get('objects', []):
        class_title = obj.get('classTitle', '').lower()
        
        if class_title not in CLASS_MAPPING:
            print(f"Warning: Unknown class '{class_title}' in {ann_path}")
            continue
        
        class_id = CLASS_MAPPING[class_title]
        
        # Get bounding box
        points = obj.get('points', {})
        if points:
            x_center, y_center, width, height = convert_bbox_to_yolo(
                points, img_width, img_height
            )
            labels.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
    
    return labels

def create_yolo_dataset():
    """Convert entire dataset to YOLO format with train/val/test splits"""
    
    print("🚀 Starting conversion from Supervisely to YOLO format...")
    
    # Create output directory structure
    splits = ['train', 'val', 'test']
    for split in splits:
        os.makedirs(f"{OUTPUT_DIR}/{split}/images", exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/{split}/labels", exist_ok=True)
    
    # Get all image files
    img_dir = f"{SOURCE_DIR}/img"
    ann_dir = f"{SOURCE_DIR}/ann"
    
    image_files = sorted([f for f in os.listdir(img_dir) if f.endswith('.jpg')])
    
    print(f"📊 Found {len(image_files)} images")
    
    # Shuffle for random split
    random.seed(42)
    random.shuffle(image_files)
    
    # Calculate split indices
    total = len(image_files)
    train_end = int(total * TRAIN_RATIO)
    val_end = train_end + int(total * VAL_RATIO)
    
    # Split files
    train_files = image_files[:train_end]
    val_files = image_files[train_end:val_end]
    test_files = image_files[val_end:]
    
    print(f"📦 Split: Train={len(train_files)}, Val={len(val_files)}, Test={len(test_files)}")
    
    # Process each split
    splits_data = {
        'train': train_files,
        'val': val_files,
        'test': test_files
    }
    
    stats = {split: {'images': 0, 'labels': 0, 'objects': 0} for split in splits}
    
    for split_name, files in splits_data.items():
        print(f"\n🔄 Processing {split_name} split...")
        
        for img_file in files:
            # Source paths
            img_src = f"{img_dir}/{img_file}"
            ann_src = f"{ann_dir}/{img_file}.json"
            
            # Destination paths
            img_dst = f"{OUTPUT_DIR}/{split_name}/images/{img_file}"
            label_dst = f"{OUTPUT_DIR}/{split_name}/labels/{img_file.replace('.jpg', '.txt')}"
            
            # Copy image
            shutil.copy2(img_src, img_dst)
            stats[split_name]['images'] += 1
            
            # Process annotation if exists
            if os.path.exists(ann_src):
                with open(ann_src, 'r') as f:
                    ann_data = json.load(f)
                
                img_height = ann_data['size']['height']
                img_width = ann_data['size']['width']
                
                # Convert annotations
                labels = process_annotation(ann_src, img_width, img_height)
                
                if labels:
                    # Write YOLO labels
                    with open(label_dst, 'w') as f:
                        f.write('\n'.join(labels))
                    stats[split_name]['labels'] += 1
                    stats[split_name]['objects'] += len(labels)
                else:
                    # Create empty label file if no objects
                    open(label_dst, 'w').close()
    
    # Create data.yaml
    yaml_content = f"""# Cocoa Diseases Dataset - YOLO Format
path: {OUTPUT_DIR}
train: train/images
val: val/images
test: test/images

# Classes
names:
  0: healthy
  1: phytophthora
  2: monilia

# Number of classes
nc: 3

# Dataset info
dataset: Cocoa Diseases (Monilia & Phytophthora)
source: https://datasetninja.com/cocoa-diseases
"""
    
    with open(f"{OUTPUT_DIR}/data.yaml", 'w') as f:
        f.write(yaml_content)
    
    # Print statistics
    print("\n" + "="*60)
    print("✅ Conversion Complete!")
    print("="*60)
    print(f"\n📁 Output directory: {OUTPUT_DIR}")
    print(f"\n📊 Statistics:")
    print(f"{'Split':<10} {'Images':<10} {'Labels':<10} {'Objects':<10}")
    print("-" * 40)
    for split_name in splits:
        s = stats[split_name]
        print(f"{split_name:<10} {s['images']:<10} {s['labels']:<10} {s['objects']:<10}")
    
    print(f"\n📄 Configuration file created: {OUTPUT_DIR}/data.yaml")
    print(f"\n🎯 Class mapping:")
    for class_name, class_id in CLASS_MAPPING.items():
        print(f"  {class_id}: {class_name}")
    
    print(f"\n✨ Ready for training! Use this path in Colab:")
    print(f"   {OUTPUT_DIR}")
    
    return OUTPUT_DIR

if __name__ == "__main__":
    try:
        output_path = create_yolo_dataset()
        print(f"\n🚀 Next step: Upload the folder to Google Colab")
        print(f"   Or upload to Google Drive: MyDrive/cocoa-disease-detection/dataset/")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
