import math
from PIL import Image, ImageDraw

def generate_star_icon():
    # 512x512 canvas with transparent background (RGBA)
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    cx, cy = size // 2, size // 2
    R = 220  # Outer radius
    r = 95   # Inner radius
    num_points = 5
    
    points = []
    for i in range(num_points * 2):
        angle = -math.pi / 2 + i * math.pi / num_points
        radius = R if i % 2 == 0 else r
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        points.append((x, y))
        
    # Draw a gold star with an orange outline
    # Gold color: #FFD700 -> (255, 215, 0)
    # Orange outline: #FF8C00 -> (255, 140, 0)
    draw.polygon(points, fill=(255, 215, 0, 255), outline=(255, 140, 0, 255), width=16)
    
    # Let's add a small highlight or inner detail to make it look polished
    # Inner star details
    inner_points = []
    for i in range(num_points * 2):
        angle = -math.pi / 2 + i * math.pi / num_points
        radius = (R - 25) if i % 2 == 0 else (r - 10)
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        inner_points.append((x, y))
        
    # draw a lighter highlight on the upper-left faces or a simple inner star line
    # For a flat/modern look, let's keep it simple and clean, but add a soft circle in the center or a subtle gradient.
    # Actually, a clean gold star with nice bold outline is perfect. Let's save it.
    image.save("/app/repo_rewards/icons/icon.png")
    print("Successfully generated /app/repo_rewards/icons/icon.png")

if __name__ == "__main__":
    generate_star_icon()
