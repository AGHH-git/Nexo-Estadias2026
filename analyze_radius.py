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
    print(f"Center pixel ({cx}, {cy}): {pixels[cx, cy]}")
    
    # Let's print pixel colors from center to the right edge every 50 pixels
    print("\nScanning from center to right edge (y=1024):")
    for dx in range(0, cx, 40):
        x = cx + dx
        print(f"Dist {dx} (pixel {x}, 1024): {pixels[x, cy]}")

if __name__ == "__main__":
    analyze()
