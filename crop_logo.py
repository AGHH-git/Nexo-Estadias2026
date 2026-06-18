import os
from PIL import Image

def crop_logo(input_path, output_paths):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return
        
    print(f"Opening image to crop: {input_path}")
    img = Image.open(input_path)
    img_rgba = img.convert("RGBA")
    width, height = img_rgba.size
    
    # Let's inspect the corner color to know what background color to filter out
    pixels = img_rgba.load()
    bg_color = pixels[0, 0]
    print(f"Background color detected: {bg_color}")
    
    # We find the bounding box of pixels that are significantly different from the background
    # Background color is (255, 255, 255, 255) in most cases, let's write a general threshold.
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Check if pixel is different from background
            dist = ((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)**0.5
            if dist > 30: # Threshold of difference
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
    if max_x < min_x or max_y < min_y:
        print("Could not find logo bounding box (image is solid color).")
        return
        
    print(f"Logo bounding box found: X({min_x} to {max_x}), Y({min_y} to {max_y})")
    logo_width = max_x - min_x
    logo_height = max_y - min_y
    print(f"Logo size: {logo_width}x{logo_height}")
    
    # Let's add a small padding (e.g. 15 pixels) so the logo doesn't touch the edges tightly
    padding = 20
    crop_x1 = max(0, min_x - padding)
    crop_y1 = max(0, min_y - padding)
    crop_x2 = min(width, max_x + padding)
    crop_y2 = min(height, max_y + padding)
    
    print(f"Cropping region: ({crop_x1}, {crop_y1}) to ({crop_x2}, {crop_y2})")
    cropped_img = img_rgba.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    
    # Now, let's also make the background transparent in the cropped image
    # (Since background color is bg_color, we make pixels near bg_color transparent)
    cropped_pixels = cropped_img.load()
    c_width, c_height = cropped_img.size
    final_data = []
    
    for y in range(c_height):
        for x in range(c_width):
            r, g, b, a = cropped_pixels[x, y]
            dist = ((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)**0.5
            
            is_bg = False
            if dist < 65:
                is_bg = True
            if (bg_color[0] > 200 and bg_color[1] > 200 and bg_color[2] > 200):
                if r > 230 and g > 230 and b > 230:
                    is_bg = True
                    
            if is_bg:
                final_data.append((r, g, b, 0))
            else:
                final_data.append((r, g, b, a))
                
    final_img = Image.new("RGBA", cropped_img.size)
    final_img.putdata(final_data)
    
    # Save the cropped and transparent logo
    for output_path in output_paths:
        print(f"Saving cropped image to: {output_path}")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        final_img.save(output_path, "PNG")
        
    print("Crop and transparency process finished successfully.")

if __name__ == "__main__":
    base_dir = "C:\\Users\\egapo\\Desktop\\Mis avances+\\Nexo-Estadias2026-main"
    input_file = os.path.join(base_dir, "Gemini_Generated_Image_a5n7ipa5n7ipa5n7.png")
    outputs = [
        os.path.join(base_dir, "frontend", "public", "logo_utcv.png"),
        os.path.join(base_dir, "logo_utcv_cropped.png")
    ]
    crop_logo(input_file, outputs)
