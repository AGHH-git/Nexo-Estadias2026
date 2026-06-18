import os
from PIL import Image

def analyze():
    base_dir = "C:\\Users\\egapo\\Desktop\\Mis avances+\\Nexo-Estadias2026-main"
    input_file = os.path.join(base_dir, "Gemini_Generated_Image_a5n7ipa5n7ipa5n7.png")
    if not os.path.exists(input_file):
        print("File not found")
        return
    img = Image.open(input_file).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    cx, cy = width // 2, height // 2
    
    # Check four directions
    directions = {
        "Right": (1, 0),
        "Left": (-1, 0),
        "Down": (0, 1),
        "Up": (0, -1)
    }
    
    for name, (dx, dy) in directions.items():
        print(f"\n--- Scanning {name} ---")
        for dist in range(0, cx, 50):
            x = cx + dx * dist
            y = cy + dy * dist
            print(f"Dist {dist} ({x}, {y}): {pixels[x, y]}")

if __name__ == "__main__":
    analyze()
