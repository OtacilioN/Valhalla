# Tournamenter Visual Patterns Extracted For Valhalla

## Core Visual Signals

### 1. Primary blue anchors the application

The legacy app repeatedly uses a saturated medium blue as the main structural color.

Primary references:

- `TournamenterApp/public/styles/dashboard.css`
- `TournamenterApp/public/index.html`

Observed use:

- top bars
- tabs
- active window chrome
- app loading state

Translation for Valhalla:

- make blue the navigation/action anchor
- keep neutral content surfaces beneath it
- do not dilute the identity with unrelated palette choices

### 2. Gray surfaces define work areas

The legacy tool uses very light gray for submenus, panels, and operational containers.

Primary references:

- `TournamenterApp/public/styles/dashboard.css`
- `TournamenterApp/public/styles/common.css`

Translation for Valhalla:

- use near-white or light gray work surfaces
- prefer visible borders over heavy shadows
- keep contrast practical and crisp

### 3. Density is compact and operational

Tournamenter is not visually sparse. Controls, bars, and lists are compact.

Primary references:

- `TournamenterApp/public/styles/common.css`
- `TournamenterApp/public/styles/dashboard.css`

Translation for Valhalla:

- use moderate padding
- reduce oversized radius
- avoid giant empty hero areas inside authenticated flows
- favor more information per viewport when it helps operators

### 4. Hierarchy is structural, not decorative

The app’s hierarchy comes from bars, tabs, panels, and status areas instead of decorative illustrations.

Primary references:

- `TournamenterApp/public/index.html`
- `TournamenterApp/public/styles/dashboard.css`

Translation for Valhalla:

- build identity through shell chrome and consistent controls
- let content cards do the work
- use badges and compact labels for state

### 5. Utility over flair

The legacy OBR plugin feels like a tool made for real event usage, not a generic startup dashboard.

Primary references:

- `tournamenter-obr/public/tournamenter-obr/styles/site.css`
- scorer and management screens in `tournamenter-obr/public/tournamenter-obr/views/`

Translation for Valhalla:

- optimize for quick recognition and low cognitive load
- prioritize legibility on shared laptops and arena stations
- avoid “AI default app” visuals

## Recommended Design Tokens

- primary blue around `#2C80D2`
- light workspace gray around `#F0F0F0`
- borders around `#CCCCCC`
- active accent can use a warmer contrasting tone sparingly
- compact radius around `6px`
- Roboto or equivalent neutral grotesk

## Apply This In Practice

- login should feel like entering an operations console
- admin should read as a control center with strong top chrome
- referee should minimize friction between selecting category, team, and score entry
- ranking should favor clean tabular reading and category switching
