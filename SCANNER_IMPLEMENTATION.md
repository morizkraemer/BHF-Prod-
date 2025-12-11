# Scanner Implementation Notes

## Current Implementation

The current implementation uses AppleScript to interface with macOS Image Capture framework programmatically. This works but may show a brief UI.

## For Fully Headless Scanning

To completely avoid any UI, you would need a native Node.js addon that interfaces directly with Image Capture framework using Objective-C/Swift.

### Option 1: Use a Native Addon (Recommended for Production)

Create a native addon using `node-gyp` that wraps Image Capture framework:

1. Install build tools:
```bash
npm install -g node-gyp
```

2. Create a native addon that uses Image Capture framework's `ICDeviceBrowser` and `ICScannerDevice` APIs

### Option 2: Use Existing Library

Consider using a library like:
- `node-image-capture` (if available)
- Create a wrapper around Image Capture framework

### Option 3: Current AppleScript Approach

The current implementation uses AppleScript which:
- ✅ Works without installing additional libraries
- ✅ Uses native macOS Image Capture framework
- ⚠️ May show brief UI during scan
- ✅ Returns scanned files directly to the app

## Testing

To test the current implementation:
1. Connect a scanner
2. Go to Settings → Printer / Scanner and select your scanner
3. Go to Tontechniker page
4. Click "Scannen"
5. The scan should complete and display in the app

## Future Improvements

- Add native addon for completely headless scanning
- Add scan settings (resolution, color/B&W, etc.)
- Add progress indicator during scanning
- Support for multiple page scanning


