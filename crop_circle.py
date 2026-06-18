import os
import math
from PIL import Image, ImageDraw

def crop_circle_logo(input_path, output_paths, radius=970):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return
        
    print(f"Opening image: {input_path}")
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    cx, cy = width // 2, height // 2
    
    # We will create a circular mask of the specified radius
    # Any pixel outside the circle of radius `radius` centered at (cx, cy) is made transparent
    # Any pixel inside is kept.
    print(f"Applying circular mask of radius {radius} centered at ({cx}, {cy})...")
    
    # Crop to a square bounding box of size 2*radius x 2*radius
    x1 = cx - radius
    y1 = cy - radius
    x2 = cx + radius
    y2 = cy + radius
    
    cropped_img = img.crop((x1, y1, x2, y2))
    c_width, c_height = cropped_img.size
    ccx, ccy = c_width // 2, c_height // 2
    
    # Convert pixels to make anything outside the circle transparent
    pixels = cropped_img.load()
    final_data = []
    
    # We will also apply anti-aliasing to the circular edge to make it smooth
    for y in range(c_height):
        for x in range(c_width):
            r, g, b, a = pixels[x, y]
            # Calculate distance from center of the cropped image
            dist = math.sqrt((x - ccx)**2 + (y - ccy)**2)
            
            # Anti-aliasing threshold at the circle boundary
            if dist > radius:
                # Outside the circle -> fully transparent
                final_data.append((r, g, b, 0))
            elif dist > radius - 2:
                # Anti-aliasing band: fade alpha linearly
                alpha_factor = (radius - dist) / 2.0
                new_a = int(a * alpha_factor)
                final_data.append((r, g, b, new_a))
            else:
                # Inside the circle -> keep original pixel
                final_data.append((r, g, b, a))
                
    final_img = Image.new("RGBA", cropped_img.size)
    final_img.putdata(final_data)
    
    # Save to outputs
    for output_path in output_paths:
        print(f"Saving circular cropped image to: {output_path}")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        final_img.save(output_path, "PNG")
        
    print("Circular cropping process completed successfully.")

if __name__ == "__main__":
    base_dir = "C:\\Users\\egapo\\Desktop\\Mis avances+\\Nexo-Estadias2026-main"
    input_file = os.path.join(base_dir, "Gemini_Generated_Image_a5n7ipa5n7ipa5n7.png")
    outputs = [
        os.path.join(base_dir, "frontend", "public", "logo_utcv.png"),
        os.path.join(base_dir, "logo_utcv_circular.png")
    ]
    crop_circle_logo(input_file, outputs, radius=970)
