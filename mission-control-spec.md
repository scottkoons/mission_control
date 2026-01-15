# Mission Control — Ralph Wiggum Build Spec

## Project Overview

**App Name:** Mission Control  
**Purpose:** Marketing task tracker and meeting agenda generator for Colorado Mountain Brewery  
**Primary User:** Scott (Marketing/Operations)  
**Core Functions:**
1. Dashboard to track marketing tasks with draft and final due dates
2. PDF export for marketing meeting handouts
3. File cabinet for shared marketing assets

---

## Tech Stack

### Phase 1 (Current Build)
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS
- **Storage:** localStorage + IndexedDB (for file attachments)
- **PDF Generation:** react-pdf or jspdf
- **Drag & Drop:** @dnd-kit/core
- **Icons:** Lucide React
- **Date Handling:** date-fns

### Architecture Requirement
Build a **storage abstraction layer** (`src/services/storageService.js`) so all data operations go through one file. This enables easy Firebase migration later.

```javascript
// All components use these methods — never direct localStorage calls
export const storageService = {
  getTasks: () => {},
  saveTask: (task) => {},
  deleteTask: (id) => {},
  getMonthlyNotes: () => {},
  saveMonthlyNotes: (monthKey, notes) => {},
  getFiles: () => {},
  saveFile: (file) => {},
  deleteFile: (id) => {},
  getSettings: () => {},
  saveSettings: (settings) => {},
};
```

---

## Branding & Assets

### Logo Files (in `/public/assets/`)
| File | Use |
|------|-----|
| `mission-control-orange-logo.png` | Sidebar header |
| `mission-control-orange-favicon.png` | Browser favicon |
| `mission-control-wt-logo.png` | Dark background variant |
| `mission-control-wt-favicon.png` | Dark background variant |

### Favicon Setup
Use `mission-control-orange-favicon.png` as the browser favicon in `index.html`.

---

## Color Themes

### Theme 1: Space Program (DEFAULT)
```javascript
const spaceProgram = {
  name: 'space-program',
  background: '#0F172A',      // Deep Navy
  surface: '#1E293B',         // Slate
  surfaceHover: '#334155',    // Lighter slate for hover
  primary: '#E8922D',         // Mission Orange
  secondary: '#38BDF8',       // Sky Blue
  text: '#F8FAFC',            // White
  textSecondary: '#94A3B8',   // Slate Gray
  textMuted: '#64748B',       // Muted gray for placeholders
  success: '#10B981',         // Emerald Green
  warning: '#FBBF24',         // Amber Yellow
  danger: '#F43F5E',          // Rose Red
  border: '#334155',          // Border color
};
```

### Theme 2: Control Center (Dark)
```javascript
const controlCenter = {
  name: 'control-center',
  background: '#0D1117',      // Space Black
  surface: '#161B22',         // Dark Slate
  surfaceHover: '#21262D',
  primary: '#E8922D',         // Mission Orange
  secondary: '#58A6FF',       // Blue
  text: '#FFFFFF',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  success: '#3FB950',         // Green
  warning: '#D29922',         // Amber
  danger: '#F85149',          // Red
  border: '#30363D',
};
```

### Theme 3: Light Mode
```javascript
const lightMode = {
  name: 'light-mode',
  background: '#F6F8FA',      // Off-White
  surface: '#FFFFFF',         // White
  surfaceHover: '#F3F4F6',
  primary: '#E8922D',         // Mission Orange
  secondary: '#2563EB',       // Blue
  text: '#24292F',            // Charcoal
  textSecondary: '#57606A',   // Gray
  textMuted: '#8C959F',
  success: '#1A7F37',         // Green
  warning: '#BF8700',         // Amber
  danger: '#CF222E',          // Red
  border: '#D0D7DE',
};
```

### Theme Implementation
Store selected theme in localStorage. Provide toggle in sidebar footer or settings. Apply theme via CSS variables or Tailwind config.

---

## Date Badge Color Logic

| Status | Color | Hex (Space Program) |
|--------|-------|---------------------|
| Future (4+ days) | Blue | `#38BDF8` |
| Due within 3 days | Yellow/Amber | `#FBBF24` |
| Overdue | Red | `#F43F5E` |
| Completed | Green | `#10B981` |

**Badge Style:** Pill-shaped with rounded corners, subtle background fill.

---

## Data Structures

### Task Object
```javascript
{
  id: 'uuid-v4',
  taskName: 'Valentine\'s Email 1',
  notes: 'Include info on the Valentine\'s Dinner',
  draftDue: '2026-01-28',           // ISO date string or null
  finalDue: '2026-02-04',           // ISO date string or null
  draftComplete: false,
  finalComplete: false,
  completedAt: null,                 // ISO timestamp when both complete
  attachments: [
    {
      id: 'uuid-v4',
      name: 'valentine-promo.jpg',
      type: 'image/jpeg',
      size: 245000,
      data: 'base64...',            // Or IndexedDB reference
      uploadedAt: '2026-01-15T10:30:00Z'
    }
  ],
  repeat: 'none',                   // none | daily | weekly | biweekly | monthly | monthly-15th
  isRecurring: false,               // true if spawned from recurring template
  recurringParentId: null,          // reference to parent recurring task
  sortOrder: 1,                     // for manual drag-drop ordering
  createdAt: '2026-01-10T08:00:00Z',
  updatedAt: '2026-01-15T10:30:00Z'
}
```

### Monthly Notes Object
```javascript
{
  '2026-01': 'Super Bowl is Feb 8th\nMake sure Beer for a Year is working.',
  '2026-02': 'Valentine\'s Day push\nSpring menu planning begins.',
  'unscheduled': 'Review steak combo menu...'
}
```

### File Cabinet Object
```javascript
{
  id: 'uuid-v4',
  name: 'Brand Guidelines.pdf',
  type: 'application/pdf',
  size: 1250000,
  data: 'base64...',
  uploadedAt: '2026-01-05T09:00:00Z'
}
```

### Settings Object
```javascript
{
  theme: 'space-program',
  sidebarCollapsed: false,
  defaultView: 'grouped',
  groupedDateMode: 'draft',         // 'draft' | 'final'
  calendarDateMode: 'all'           // 'draft' | 'final' | 'all'
}
```

---

## Application Structure

### Sidebar Navigation

```
┌─────────────────────────────┐
│ [Logo] Colorado Mountain    │  ← Collapsible
│         Brewery        [«]  │
├─────────────────────────────┤
│ 📊 Dashboard          (3)   │  ← (3) = overdue count badge
│ ✓  Completed                │
│ 📁 File Cabinet             │
├─────────────────────────────┤
│ VIEW                        │
│ ├─ ☰ Grouped               │
│ ├─ ≡ Flat                  │
│ └─ 📅 Calendar             │
├─────────────────────────────┤
│ EXPORT                      │
│ ├─ 📄 PDF - Flat           │
│ ├─ 📄 PDF - Grouped        │
│ ├─ 📊 Export CSV           │
│ └─ ⬆️ Import CSV           │
├─────────────────────────────┤
│ [Theme Toggle]              │  ← Footer area
└─────────────────────────────┘
```

**Collapsed State:** Show only icons, tooltip on hover.

**Overdue Badge:** Red circle with count on Dashboard nav item.

---

## Pages & Views

### 1. Dashboard — Grouped View (DEFAULT)

**Header:**
```
Marketing Task List          [Draft Date ▼]  [🔍 Search...]  [+ Add New Task]
```

- Title: "Marketing Task List"
- Toggle dropdown: "Draft Date" / "Final Date" (controls month grouping)
- Search bar: filters tasks by name/notes in real-time
- Add New Task button (orange, primary)

**Body — Monthly Sections:**

Each month with tasks displays as a card:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            January 2026                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ ⋮⋮ │ TASK NAME ▲        │ NOTES              │ DRAFT DUE │ FINAL DUE │ INFO │
├────┼────────────────────┼────────────────────┼───────────┼───────────┼──────┤
│ ⋮⋮ │ Valentine's Email 1│ No notes           │ [Jan 28]  │ [Feb 04]  │ 📎 🗑️│
│ ⋮⋮ │ Super Bowl Email   │ Promote the party  │ [Jan 28]  │ [Feb 04]  │ 🗑️  │
├─────────────────────────────────────────────────────────────────────────┤
│ JANUARY 2026 NOTES                                      [+ Add New Task]│
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Super Bowl is Feb 8th                                               │ │
│ │ Make sure Beer for a Year is working. Can also give away other...  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**Table Features:**
- Drag handle (⋮⋮) for manual reordering
- Click column header to sort (show ▲/▼ indicator)
- Click task name/notes area → opens Edit Task modal
- Click date badge → toggles completion (green)
- Paperclip icon (gray, turns blue on hover) → opens Edit Task modal to attachments
- Trash icon (gray, turns red on hover) → delete with undo toast

**Monthly Notes:**
- Editable textarea at bottom of each month section
- Placeholder: "Type generic notes here..."
- Auto-saves on blur/debounce
- Small "Add New Task" button to the right of the notes header

**Unscheduled Section (at bottom):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Unscheduled                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ⋮⋮ │ TASK NAME          │ NOTES              │ DRAFT DUE │ FINAL DUE │ INFO │
├────┼────────────────────┼────────────────────┼───────────┼───────────┼──────┤
│ ⋮⋮ │ Discuss Bonus plan │ No notes           │     -     │     -     │ 🗑️  │
│ ⋮⋮ │ Send valuation     │ No notes           │     -     │     -     │ 🗑️  │
├─────────────────────────────────────────────────────────────────────────┤
│ UNSCHEDULED NOTES                                       [+ Add New Task]│
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ on steak combo menu - review steak toppings...                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Dashboard — Flat View

**Header:**
```
Marketing Task List (Flat)              [🔍 Search...]  [+ Add New Task]
```

**Body:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              All Tasks                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ⋮⋮ │ TASK NAME          │ NOTES              │ DRAFT DUE │ FINAL DUE │ INFO │
├────┼────────────────────┼────────────────────┼───────────┼───────────┼──────┤
│    │ [All tasks in single list, dated tasks first sorted by draft]      │
│    │ [Unscheduled tasks at bottom with - for dates]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

- No monthly groupings
- No monthly notes sections
- Default sort: Draft Due ascending (dated tasks), then unscheduled at bottom
- Same drag-drop and column sorting as Grouped

---

### 3. Dashboard — Calendar View

**Header:**
```
January 2026    [<] [Today] [>]       [Draft Date] [Final Date] [All]  [📥 Download PDF]
```

**Body:**
- Standard monthly calendar grid (Sun-Sat)
- Today's date highlighted with blue circle
- Tasks appear as colored bars on their due dates:
  - Blue bar: "Draft: Task Name"
  - Green bar: "Final: Task Name"
- Filter toggles control which tasks display
- Click task bar → opens Edit Task modal
- Navigate months with arrows

**Calendar PDF:**
- Landscape orientation
- One month per page
- Only months with non-recurring tasks are included
- Excludes unscheduled tasks

---

### 4. Completed Page

**Header:**
```
Completed Tasks                                           [+ Add New Task]
```

**Body:**
- Same structure as Grouped view
- Tasks grouped by **completion date** (month/year)
- Tasks show with strikethrough text
- All date badges are green
- Monthly notes sections included
- Click a green date badge → un-completes, task returns to Dashboard
- Can still edit and delete tasks

---

### 5. File Cabinet Page

**Header:**
```
File Cabinet                                              [+ Upload Files]
```

**Body:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│   │  📄     │  │  🖼️     │  │  📄     │  │  🖼️     │  │  📄     │     │
│   │         │  │         │  │         │  │         │  │         │     │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│   Brand        Menu         Q1 Brief    Logo Pack   Media Kit          │
│   Guide.pdf    Photo.jpg               .zip         .pdf               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

- Grid of file thumbnails (like Finder/Explorer)
- Single flat level (no folders)
- Hover shows overlay with: Expand | Download | Delete
- Click to preview
- Supports: SVG, PNG, JPG, PDF (max 10MB each)

---

## Modals

### Add New Task Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Add New Task                                                        ✕   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Task Name                                                               │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ e.g., Q4 Social Media Campaign                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Description                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Enter task details, requirements, and stakeholders...               │ │
│ │                                                                     │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Draft Due Date              Final Due/Publish Date                      │
│ ┌──────────────────┐       ┌──────────────────┐                        │
│ │ mm/dd/yyyy    📅 │       │ mm/dd/yyyy    📅 │                        │
│ └──────────────────┘       └──────────────────┘                        │
│                                                                         │
│ Repeat                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ None                                                            ▼   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ Options: None | Daily | Weekly | Biweekly | Monthly | 15th of Month    │
│                                                                         │
│ Upload Attachments                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                    ☁️                                               │ │
│ │           Click to upload or drag and drop                         │ │
│ │            SVG, PNG, JPG or PDF (MAX. 10MB)                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ [Uploaded thumbnails appear here with hover overlay]                    │
│                                                                         │
│                                        [Cancel]  [Create Task]          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Date Picker Quick Shortcuts:**
- Tomorrow
- Next Monday
- End of Month
- +1 Week

---

### Edit Task Modal

Same as Add New Task but:
- Title: "Edit Task"
- Fields pre-populated with existing data
- Existing attachments shown as thumbnails
- Button: "Save Changes"
- Additional action: "Duplicate Task" link/button

---

### Import CSV Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Import Tasks from CSV                                               ✕   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                    ☁️                                               │ │
│ │           Click to upload or drag and drop                         │ │
│ │                      .csv files                                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 📥 Download blank CSV template                                          │
│                                                                         │
│ ℹ️ Tip: Export your current tasks to see the expected format           │
│                                                                         │
│                                        [Cancel]  [Import]               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Delete Confirmation (Undo Toast)

Instead of a blocking modal, use a toast notification:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🗑️ Task deleted                                        [Undo] [✕]  │
└─────────────────────────────────────────────────────────────────────┘
```

- Appears bottom-center or bottom-right
- 10-second countdown
- "Undo" restores the task
- Auto-dismisses after 10 seconds
- Clicking ✕ dismisses immediately (task permanently deleted)

---

## Interactions & Behaviors

### Row Hover States
- Entire row gets subtle background highlight (`surfaceHover`)
- Trash icon: gray → red on hover
- Paperclip icon: gray → blue on hover

### Click Behaviors
| Element | Action |
|---------|--------|
| Task name or notes area | Open Edit Task modal |
| Draft Due badge | Toggle draft completion |
| Final Due badge | Toggle final completion |
| Paperclip icon | Open Edit Task modal (focus attachments) |
| Trash icon | Delete with undo toast |
| Drag handle | Drag to reorder |
| Column header | Sort by that column |

### Completion Flow
1. Click Draft Due badge → turns green
2. Click Final Due badge → turns green
3. Both green → task moves to Completed page (with timestamp)
4. On Completed page: click green badge → un-completes
5. Task returns to Dashboard in appropriate month

### Drag & Drop
- Use drag handle (⋮⋮) on left of row
- Can reorder within a section
- Can drag from one month to another (updates dates)
- Sort order persists in `sortOrder` field

### Search/Filter
- Real-time filtering as user types
- Searches task name and notes fields
- Highlights matching text (optional)
- Shows "No tasks found" if no matches

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | Open Add New Task modal |
| `Cmd/Ctrl + K` | Focus search bar |
| `Escape` | Close modal |

---

## Recurring Tasks Logic

### Creation
- Set "Repeat" field in task modal
- Options: None | Daily | Weekly | Biweekly | Monthly | 15th of Month

### Generation Rules
- Recurring instances only spawn for months that have at least one non-recurring task
- If March has no regular tasks, no recurring tasks appear in March
- Same applies to Calendar view and PDF exports

### Display
- Recurring instances are regular tasks with `isRecurring: true`
- Can be edited/completed individually
- Deleting the parent recurring task stops future generation

### Implementation Approach
- Store recurring templates separately
- On app load / date change, generate instances for visible months
- Mark generated instances with `recurringParentId`

---

## Export Features

### CSV Export
```csv
task_name,notes,draft_due,final_due,draft_complete,final_complete,repeat,sort_order,created_at
Valentine's Email 1,,01/28/2026,02/04/2026,FALSE,FALSE,none,1,2026-01-10T08:00:00Z
Super Bowl Email,Promote the super bowl party,01/28/2026,02/04/2026,FALSE,FALSE,none,2,2026-01-10T08:00:00Z
Discuss Bonus plan,,,,,FALSE,none,3,2026-01-10T08:00:00Z
```

Also export monthly notes as separate section or file.

### CSV Import
- Parse CSV file
- Validate required fields (task_name)
- Add to existing tasks (merge, don't replace)
- Show success/error summary

### PDF - Flat
- Simple list format
- All tasks in order
- Columns: Task Name | Notes | Draft Due | Final Due
- Date badges in pill format with colors
- No monthly groupings

### PDF - Grouped
- Mirrors Dashboard Grouped view exactly
- Respects current Draft/Final toggle
- Respects manual sort order
- Includes monthly notes sections
- Includes Unscheduled section and notes
- Date badges in pill format with colors

### PDF - Calendar
- Triggered from Calendar view "Download PDF" button
- Landscape orientation
- One month per page
- Only includes months with non-recurring tasks
- Excludes unscheduled tasks
- Respects current filter (Draft/Final/All)

---

## File Structure

```
mission-control/
├── public/
│   ├── assets/
│   │   ├── mission-control-orange-logo.png
│   │   ├── mission-control-orange-favicon.png
│   │   ├── mission-control-wt-logo.png
│   │   └── mission-control-wt-favicon.png
│   └── index.html
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Layout.jsx
│   │   ├── tasks/
│   │   │   ├── TaskTable.jsx
│   │   │   ├── TaskRow.jsx
│   │   │   ├── TaskModal.jsx
│   │   │   ├── DateBadge.jsx
│   │   │   ├── MonthSection.jsx
│   │   │   └── MonthlyNotes.jsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.jsx
│   │   │   ├── CalendarGrid.jsx
│   │   │   └── CalendarTask.jsx
│   │   ├── files/
│   │   │   ├── FileCabinet.jsx
│   │   │   ├── FileGrid.jsx
│   │   │   ├── FileCard.jsx
│   │   │   └── FileUploader.jsx
│   │   ├── common/
│   │   │   ├── Modal.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── DatePicker.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   └── AttachmentThumbnail.jsx
│   │   └── export/
│   │       ├── PDFExport.jsx
│   │       ├── CSVExport.jsx
│   │       └── CSVImport.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Completed.jsx
│   │   └── FileCabinet.jsx
│   ├── services/
│   │   ├── storageService.js      ← Abstraction layer
│   │   ├── taskService.js
│   │   ├── fileService.js
│   │   └── exportService.js
│   ├── hooks/
│   │   ├── useTasks.js
│   │   ├── useFiles.js
│   │   ├── useTheme.js
│   │   └── useKeyboardShortcuts.js
│   ├── context/
│   │   ├── TaskContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── ToastContext.jsx
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── sortUtils.js
│   │   ├── csvUtils.js
│   │   └── pdfUtils.js
│   ├── styles/
│   │   └── themes.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Theme system with CSS variables
- [ ] Storage service abstraction layer
- [ ] Basic layout (Sidebar + Header + Main content area)
- [ ] Sidebar navigation with collapse functionality

### Phase 2: Core Task Features
- [ ] Task data model and storage
- [ ] Dashboard Grouped view with monthly sections
- [ ] Task table with all columns
- [ ] Add New Task modal
- [ ] Edit Task modal
- [ ] Date badge component with color logic
- [ ] Click date badge to toggle completion
- [ ] Monthly notes sections (editable textarea)
- [ ] Unscheduled section at bottom

### Phase 3: Task Interactions
- [ ] Row hover states
- [ ] Trash delete with undo toast (10 seconds)
- [ ] Drag and drop reordering within sections
- [ ] Drag between months (date update)
- [ ] Column sorting (click headers)
- [ ] Duplicate task functionality
- [ ] Completion flow (both green → Completed page)

### Phase 4: Additional Views
- [ ] Flat view (single list, unscheduled at bottom)
- [ ] Calendar view with monthly grid
- [ ] Calendar filter toggle (Draft/Final/All)
- [ ] Completed page (grouped by completion date)
- [ ] Draft/Final toggle for Grouped view

### Phase 5: Files & Attachments
- [ ] File upload component (drag & drop)
- [ ] Attachment thumbnails with hover overlay
- [ ] Expand/Download/Delete actions
- [ ] File Cabinet page with grid layout
- [ ] IndexedDB storage for file data

### Phase 6: Search & Polish
- [ ] Search bar with real-time filtering
- [ ] Overdue count badge on Dashboard nav
- [ ] Keyboard shortcuts (Cmd+N, Cmd+K, Esc)
- [ ] Date picker with quick shortcuts
- [ ] Paperclip icon in task rows (when attachments exist)

### Phase 7: Export/Import
- [ ] CSV Export (all task data + monthly notes)
- [ ] CSV Import with template download
- [ ] PDF - Flat export
- [ ] PDF - Grouped export (mirrors dashboard)
- [ ] PDF - Calendar export (landscape, months with tasks only)

### Phase 8: Recurring Tasks
- [ ] Repeat field in task modal
- [ ] Recurring task generation logic
- [ ] Only show in months with non-recurring tasks
- [ ] Handle in calendar/PDF exports

### Phase 9: Final Polish
- [ ] Theme toggle (3 themes)
- [ ] Responsive design adjustments
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Browser testing

---

## Success Criteria

The build is complete when:

1. **Dashboard Grouped View** displays tasks by month with working:
   - Draft/Final date toggle
   - Monthly notes sections
   - Add task buttons (header + per section)
   - Date badge completion clicks
   - Drag-drop reordering
   - Column sorting
   - Search filtering

2. **Dashboard Flat View** shows all tasks in single list

3. **Dashboard Calendar View** shows monthly calendar with tasks

4. **Completed Page** shows archived tasks grouped by completion date

5. **File Cabinet** allows upload, preview, download, delete of files

6. **Task Modal** supports create, edit, duplicate, attachments, repeat

7. **Export** produces correct PDF-Flat, PDF-Grouped, PDF-Calendar, CSV

8. **Import** accepts CSV and merges tasks

9. **All interactions** work: hover states, keyboard shortcuts, undo toast

10. **Theme toggle** switches between 3 color schemes

11. **Sidebar** collapses to icon-only view

12. **Overdue badge** shows count on Dashboard nav item

---

## Notes for Claude Code

- Start with Phase 1 and work sequentially
- Commit after each phase completion
- Test each feature before moving on
- Use the storage abstraction layer for ALL data operations
- Keep components small and focused
- Use Tailwind for styling (no separate CSS files except themes)
- Ensure the app works offline (localStorage/IndexedDB)

When all phases are complete and success criteria met, output:

<promise>MISSION_CONTROL_COMPLETE</promise>

---

## Ralph Wiggum Command

```bash
/ralph-loop "Build the Mission Control task management app according to the spec in mission-control-spec.md. Work through each implementation phase sequentially. Commit after each phase. Test features before moving on. When all success criteria are met, output <promise>MISSION_CONTROL_COMPLETE</promise>" --max-iterations 50 --completion-promise "MISSION_CONTROL_COMPLETE"
```

If blocked after 40 iterations:
- Document what's blocking progress
- List what was attempted
- Suggest alternative approaches
- Output <promise>BLOCKED</promise>
