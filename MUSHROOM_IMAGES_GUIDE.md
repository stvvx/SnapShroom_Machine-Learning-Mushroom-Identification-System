# Mushroom Images Guide

## How to Add Mushroom Images

### Step 1: Prepare Your Images
1. Collect images for all 10 mushrooms
2. Rename them to match the species names:
   - `oyster-mushroom.jpg`
   - `enoki-mushroom.jpg`
   - `button-mushroom.jpg`
   - `shiitake.jpg`
   - `wood-ear.jpg`
   - `death-cap.jpg`
   - `false-morel.jpg`
   - `jack-o-lantern.jpg`
   - `funeral-bell.jpg`
   - `red-cage.jpg`

3. Recommended image specs:
   - Format: JPG or PNG
   - Size: 800x600px (or similar aspect ratio)
   - File size: < 500KB each

### Step 2: Add Images to Project
1. Place images in: `frontend/assets/images/mushrooms/`
2. Create the folder if it doesn't exist

### Step 3: Update Image Mapping
Open `frontend/app/(tabs)/map.tsx` and update the `MUSHROOM_IMAGES` object:

```typescript
const MUSHROOM_IMAGES: Record<string, any> = {
  'Oyster Mushroom': require('@/assets/images/mushrooms/oyster-mushroom.jpg'),
  'Enoki Mushroom': require('@/assets/images/mushrooms/enoki-mushroom.jpg'),
  'Button Mushroom': require('@/assets/images/mushrooms/button-mushroom.jpg'),
  'Shiitake': require('@/assets/images/mushrooms/shiitake.jpg'),
  'Wood Ear': require('@/assets/images/mushrooms/wood-ear.jpg'),
  'Death Cap': require('@/assets/images/mushrooms/death-cap.jpg'),
  'False Morel': require('@/assets/images/mushrooms/false-morel.jpg'),
  'Jack O Lantern': require('@/assets/images/mushrooms/jack-o-lantern.jpg'),
  'Funeral Bell': require('@/assets/images/mushrooms/funeral-bell.jpg'),
  'Red Cage': require('@/assets/images/mushrooms/red-cage.jpg'),
};
```

### Alternative: Using URLs (Database Method)

If you want to store images online (Cloudinary, etc.):

1. **Update Database Schema:**
```javascript
{
  english_name: "Oyster Mushroom",
  image_url: "https://your-cloudinary-url.com/oyster-mushroom.jpg",
  // ... other fields
}
```

2. **Update map.tsx:**
```typescript
// Replace Image component usage
<Image
  source={
    mushroom.image_url 
      ? { uri: mushroom.image_url }
      : require('@/assets/images/react-logo.png')
  }
  style={styles.mushroomImage}
  resizeMode="cover"
/>
```

3. **Add image_url to interface:**
```typescript
interface MushroomLocation {
  // ... existing fields
  image_url?: string;
}
```

## Current Status
- ✅ Gallery layout created
- ✅ Image placeholders added
- ✅ Card-based design implemented
- ⏳ **Need to add actual mushroom images** (currently using placeholder)

## Image Sources
- Free stock photos: Unsplash, Pexels, Pixabay
- Mycology databases: MushroomExpert.com
- Field guides: Ensure proper attribution
- Own photography: Best option for accuracy
