# Changelog - Markov Chain Text Generator

## Latest Update - December 12, 2025

###  Major UI/UX Improvements

#### Dark Mode as Default
- Removed light/dark mode toggle
- Set dark mode as the default and only theme
#### Code Organization
- **Separated concerns**: Split The Main HTML file into three separate files
  - `index.html` - Clean HTML structure only
  - `style.css` - All CSS styles
  - `script.js` - All JavaScript functionality 

###  New Features

#### Multiple Paragraph Generation
- **New toggle option**: "Generate multiple paragraphs (disable random restarts)"
- **Disabled by default** - maintains original random restart behavior
- **When enabled**:
  - User can select 1-5 paragraphs
  - Each paragraph generates independently
  - No random restarts within paragraphs
  - Natural chain termination when no more words available

#### Sample Text Loader
- **New " Load Sample Text" button**
- Pre-loaded sample text about daily city life
- One-click demo experience

---

###  Interactive State Diagram

#### Visual Enhancements
- **Color-coded nodes**: Hot (yellow) to cold (green) based on connection count
- **Variable line thickness**: More frequent transitions = thicker lines
- **Glow effects**: Highlighted nodes and connections have subtle glow

#### Interactive Features
- **Hover to highlight**: Mouse over nodes to see all outgoing connections light up
- **Interactive tooltips**: Shows word name, connection count, and total transitions
- **Click to focus**: Click any node to keep it highlighted (click again to deselect)
- **Search functionality**: Type to find and highlight specific words in red
- **Zoom with mouse wheel**: Scroll to zoom in/out
- **Pan by dragging**: Click and drag anywhere on the canvas to move around
- **Reset view button**: Instantly reset zoom, pan, and all selections
