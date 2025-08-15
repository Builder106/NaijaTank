# NaijaTank Homepage Minimal Reproduction

This is a minimal reproduction of the NaijaTank homepage component for Stackblitz.

## Files to Upload to Stackblitz

1. **src/main.ts** - Copy content from `src/main.ts`
2. **src/home.component.ts** - Copy content from `src/home.component.ts`
3. **src/index.html** - Copy content from `src/index.html`
4. **package.json** - Copy content from `package.json`
5. **tsconfig.json** - Copy content from `tsconfig.json`

## How to Create the Stackblitz

1. Go to [stackblitz.com](https://stackblitz.com)
2. Click "Create" -> "Angular"
3. Replace the generated files with the content from the files in this folder
4. The project should automatically compile and run

## Features Included

- ✅ Hero section with animated text
- ✅ Search functionality with filtering
- ✅ Mock fuel station data
- ✅ Responsive design with Tailwind CSS
- ✅ Station cards with hover effects
- ✅ How it works section
- ✅ Call-to-action section

## Features Removed for Simplicity

- ❌ NgRx state management (replaced with local state)
- ❌ GSAP ScrollTrigger animations (replaced with CSS animations)
- ❌ Lottie animations (replaced with emojis)
- ❌ Complex video handling (replaced with gradient background)
- ❌ Geolocation services (using mock data)
- ❌ Complex routing (simplified)

## Key Differences from Original

1. **State Management**: Uses simple component state instead of NgRx
2. **Animations**: Uses CSS animations instead of GSAP
3. **Data**: Uses mock data instead of API calls
4. **Styling**: Uses Tailwind CDN instead of local configuration
5. **Dependencies**: Minimal Angular dependencies only

## Usage

The component demonstrates the core layout and functionality of the original homepage:

- Hero section with animated header
- Search bar that filters stations
- Grid of fuel station cards
- Responsive design
- Smooth animations

Perfect for testing layout changes, styling updates, or basic functionality without the complexity of the full application. 