# Mobile App Modal Design Guide

## Brand Colors Implementation

Your mobile app now uses the Charter Keke brand colors consistently across download and update modals:

### Color Palette
```
Primary Orange:    #FF9101 (Charter Keke Orange)
Orange Light:      #FFAB3F (For gradients & highlights)
White:             #FFFFFF (Light mode background)
Black:             #000000 (Text on orange, dark mode accents)
```

## Modal Components

### 1. DownloadModal (NEW)
**File:** `components/DownloadModal.tsx`

Optimized for app downloads with:
- **Header**: Orange gradient (#FF9101 → #FFAB3F)
- **Info Cards**: Version, file size, platform details
- **Features List**: Animated icons with orange backgrounds
- **Progress Bar**: Orange progress indicator
- **Button**: Orange gradient with black text
- **Dark Mode Support**: Full theme alternation

**Props:**
```typescript
{
  visible: boolean;
  version: string;
  fileSize: string;
  Platform: 'ios' | 'android' | 'web';
  releaseNotes?: string;
  onDownload: () => Promise<void>;
  onDismiss: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}
```

**Usage Example:**
```tsx
const [downloadVisible, setDownloadVisible] = useState(false);

<DownloadModal
  visible={downloadVisible}
  version="2.0.0"
  fileSize="85.4 MB"
  Platform="android"
  releaseNotes="Major performance improvements..."
  onDownload={handleDownload}
  onDismiss={() => setDownloadVisible(false)}
  isDownloading={isDownloading}
  downloadProgress={progress}
/>
```

### 2. UpdateModal (UPDATED)
**File:** `components/UpdateModal.tsx`

Updated to use brand colors:
- **Header**: Orange gradient (#FF9101 → #FFAB3F)
- **Button**: Orange gradient with black text
- **Icons**: White on orange header, orange on content
- **Dark Mode Support**: Full theme alternation

**Visual Changes:**
- Orange is now exactly #FF9101 (Charter Keke orange)
- Gradient uses lighter orange (#FFAB3F) for visual depth
- All white elements use #FFFFFF
- All button text is black (#000000) on orange

## Theme Modes

### Light Mode
```
Background:        #FFFFFF (White)
Secondary BG:      #F5F5F5 (Light gray)
Text Primary:      #000000 (Black)
Text Secondary:    #6B7280 (Medium gray)
Borders:           #E5E7EB (Light gray)
```

### Dark Mode
```
Background:        #0B0D0F (Very dark)
Secondary BG:      #1A1A1A (Dark)
Text Primary:      #FFFFFF (White)
Text Secondary:    #D1D5DB (Light gray)
Borders:           #374151 (Medium gray)
```

## Visual Examples

### Light Mode - DownloadModal
```
┌─────────────────────────────────┐
│  Orange Gradient Header         │
│  🍎 Ready to Download           │
│  iOS App v2.0.0                 │
├─────────────────────────────────┤
│ 📋 Version      2.0.0           │
│ 💾 File Size    85.4 MB         │
│ 🍎 Platform     iOS App         │
├─────────────────────────────────┤
│ 📋 What's New                   │
│ Major performance improvements  │
├─────────────────────────────────┤
│ ⚡ Optimized performance        │
│ 🛡️ Security improvements        │
│ 🐛 Bug fixes & stability        │
├─────────────────────────────────┤
│  [Later]  [🔽 Download]         │
└─────────────────────────────────┘
```

### Dark Mode - Same Modal
```
Light text on dark backgrounds
Orange remains the same (#FF9101)
Borders are lighter for contrast
```

## Color Specifications

### Orange Gradient
- **Start**: #FF9101 (Primary orange for header backgrounds)
- **End**: #FFAB3F (Lighter for gradient depth)
- **Direction**: Left-to-right or top-to-bottom for modal headers

### Text on Orange
- **Color**: #000000 (Black) for maximum contrast
- **Weight**: Bold (700 fontWeight)
- **Size**: 14-26px depending on purpose

### Info Cards
- **Light Mode**:
  - Background: #F5F5F5
  - Border: #E5E7EB
  - Icons: #FF9101
- **Dark Mode**:
  - Background: #1A1A1A
  - Border: #374151
  - Icons: #FF9101 (same)

## Feature Icons

Each feature in the features list has:
- **Icon Background**: #FF9101 (Orange)
- **Icon Color**: #FFFFFF (White)
- **Icon Size**: 18px
- **Background Shape**: Rounded square (8px border radius)

## Progress Bar

- **Background**: Theme-aware border color
  - Light: #E5E7EB
  - Dark: #374151
- **Fill**: #FF9101 (Orange)
- **Height**: 10px (thicker than typical)
- **Border Radius**: 5px (rounded)

## Button Styling

### Primary Button (Download/Install)
```
Background:    Orange Gradient (#FF9101 → #FFAB3F)
Text Color:    #000000 (Black)
Icon Color:    #000000 (Black)
Font Weight:   700 (Bold)
Padding:       12px vertical
Border Radius: 12px
```

### Secondary Button (Later)
```
Background:    Theme-aware secondary
               Light: #F5F5F5
               Dark: #2A2A2A
Text Color:    #000000 (light) or #FFFFFF (dark)
Border:        1.5px theme-aware border
Font Weight:   700 (Bold)
Padding:       12px vertical
Border Radius: 12px
```

## Animations

- **Fade In**: 300ms opacity transition
- **Slide Up**: Spring animation from bottom
- **Scale**: 0.9 → 1.0 spring animation
- **Download Progress**: Linear width animation

## Dark Mode Detection

Both modals automatically detect theme mode:
```typescript
const isLight = theme.mode === 'light';

const colors = {
  bgPrimary: isLight ? '#FFFFFF' : '#0B0D0F',
  textPrimary: isLight ? '#000000' : '#FFFFFF',
  // ... etc
};
```

## Implementation Tips

### For Download Button Link
When implementing the download button on your website, direct to:
```
GET /api/app/download/[version]/[filename]
Example: /api/app/download/2.0.0/app-2.0.0.apk
```

### Show Modal on Install Page
```tsx
import { DownloadModal } from '@/components/DownloadModal';

<DownloadModal
  visible={showDownloadModal}
  version={latestVersion}
  fileSize={fileSize}
  Platform="android"
  releaseNotes={releaseNotes}
  onDownload={() => {
    // Handle download
    // Can use WebView or redirect
  }}
  onDismiss={() => setShowDownloadModal(false)}
/>
```

## Color Constants

Add to your `utils/colors.ts` if needed:
```typescript
export const MODAL_COLORS = {
  brandOrange: '#FF9101',
  brandOrangeLight: '#FFAB3F',
  brandWhite: '#FFFFFF',
  brandBlack: '#000000',
};
```

## Testing Checklist

- [ ] Light mode: Orange header is visible and appealing
- [ ] Dark mode: All text is readable on dark background
- [ ] Button: Orange gradient displays correctly
- [ ] Icons: White on orange is high contrast
- [ ] Progress: Orange fill bar animates smoothly
- [ ] Transitions: Slide and fade animations are smooth
- [ ] Text: All text is properly sized and weighted
- [ ] Theme toggle: Colors switch instantly when theme changes
- [ ] Accessibility: All elements have sufficient contrast

## Next Steps

1. **Use in your Install Page**: Add the DownloadModal to the website
2. **Fix API Route**: Already fixed the `/api/app/download/[version]/[filename]` route
3. **Test Both Modals**: Try light and dark mode
4. **Connect to Real Downloads**: Integrate with actual APK/IPA storage
