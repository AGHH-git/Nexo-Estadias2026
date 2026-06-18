import os
from PIL import Image

def debug():
    base_dir = "C:\\Users\\egapo\\Desktop\\Mis avances+\\Nexo-Estadias2026-main"
    input_file = os.path.join(base_dir, "Gemini_Generated_Image_a5n7ipa5n7ipa5n7.png")
    if not os.path.exists(input_file):
        print("File not found")
        return
    img = Image.open(input_file).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    print("Corners:")
    print("Top-Left (0,0):", pixels[0, 0])
    print("Top-Right (width-1,0):", pixels[width-1, 0])
    print("Bottom-Left (0,height-1):", pixels[0, height-1])
    print("Bottom-Right (width-1,height-1):", pixels[width-1, height-1])
    
    print("\nSamples from edges (y=10):")
    for x in range(0, width, width // 10):
        print(f"({x}, 10):", pixels[x, 10])
        
    print("\nSamples from edges (x=10):")
    for y in range(0, height, height // 10):
        print(f"(10, {y}):", pixels[10, y])

if __name__ == "__main__":
    debug()
