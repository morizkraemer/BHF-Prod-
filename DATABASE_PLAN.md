# Database/Item Catalog Implementation Plan

## Overview
We'll use **electron-store** (already installed) to create a simple item catalog system for Rider Extras. This allows storing predefined items with prices that can be selected instead of typing manually.

## Architecture

### Storage Method: electron-store
- **Location**: `~/.config/nightclub-production-tool/config.json` (macOS)
- **Format**: JSON file, automatically managed by electron-store
- **Advantages**: 
  - Simple, no database server needed
  - Automatic persistence
  - Fast read/write
  - Perfect for small-medium datasets

### Data Structure
```json
{
  "riderExtrasItems": [
    {
      "id": "unique-id",
      "name": "Item Name",
      "price": 25.50,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Implementation Plan

### Phase 1: IPC Handlers (main.js)
- Set up electron-store instance
- Create IPC handlers for:
  - `get-rider-items` - Get all items
  - `add-rider-item` - Add new item
  - `update-rider-item` - Update existing item
  - `delete-rider-item` - Delete item

### Phase 2: Preload Script
- Expose item catalog API to renderer process

### Phase 3: Item Management UI
- Create component for managing items (optional admin view)
- Add/Edit/Delete functionality
- Form validation

### Phase 4: Integration with Rider Extras Form
- Add autocomplete/dropdown to name field
- When item selected, auto-fill name and price
- Still allow manual entry

## User Flow

1. **Admin/Setup Mode** (optional):
   - Add items to catalog: "Coca Cola", "€2.50"
   - Add items: "Red Bull", "€3.00"
   - Edit/Delete items as needed

2. **During Shift**:
   - Open Rider Extras form
   - Start typing item name → see suggestions
   - Select item → name and price auto-filled
   - Adjust amount if needed
   - Or type manually if item not in catalog

## Alternative: SQLite (if needed later)
If the catalog grows large or we need complex queries:
- Install `better-sqlite3` or `sql.js`
- More robust but adds complexity
- Better for relational data (items, categories, etc.)

## Current Recommendation
Start with **electron-store** - it's perfect for this use case and already installed!

