import os
from PIL import Image

def find_edge():
    base_dir = "C:\\Users\\egapo\\Desktop\\Mis avances+\\Nexo-Estadias2026-main"
    input_file = os.path.join(base_dir, "Gemini_Generated_Image_a5n7ipa5n7ipa5n7.png")
    if not os.path.exists(input_file):
        print("File not found")
        return
    img = Image.open(input_file).convert("RGBA")
    pixels = img.load()
    cx, cy = img.width // 2, img.height // 2
    
    print("Scanning from 960 to 980 pixels outwards to the right:")
    for dist in range(960, 985, 2):
        print(f"Dist {dist} (pixel {cx + dist}, {cy}): {pixels[cx + dist, cy]}")

if __name__ == "__main__":
    find_edge()
