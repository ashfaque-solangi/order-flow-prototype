# StitchFlow: Production Planning & Order Management (Developer Guide)

StitchFlow is a dynamic, visual tool designed for production planning and order management. It provides a drag-and-drop interface to assign orders to production lines and a real-time timeline to visualize capacity and scheduling. This document serves as a comprehensive guide for developers building the application.

### Tech Stack

*   **Framework**: Next.js (with App Router)
*   **Language**: TypeScript
*   **UI Components**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **Drag & Drop**: `@dnd-kit/core`
*   **Date & Time**: `date-fns` for logic, `react-day-picker` for calendar UI.
*   **Icons**: `lucide-react`

---

## 1. Core Components

The application is divided into several key sections. Below is a breakdown of each component and its required functionality.

### 1.1. Header & Filters (`<AppHeader />`)

The header is the central control panel for navigating and filtering the application data.

*   **Title**: Displays "StitchFlow".
*   **Available Orders Badge**: Shows a real-time count of orders that have a `remaining` quantity greater than zero.
*   **Quick Filters**:
    *   **Customer Filter**: A dropdown (`Select`) populated with all unique customer names. Allows filtering by a single customer or "All Customers".
    *   **OC # Filter**: A dropdown (`Select`) populated with all unique order numbers. Allows filtering by a single order number or "All OC #".
    *   **ETD Date Filter**: A date picker (`Popover` with `Calendar` from `react-day-picker`). Allows filtering for orders with a specific ETD.
*   **Advanced Filters Button**:
    *   A "More Filters" button that opens a modal (`<FiltersModal />`).
*   **Timeline Navigation**:
    *   **Month Selector**: A dropdown (`Popover` with `Calendar` from `react-day-picker`) that allows the user to select a month and year to display on the timeline.
    *   **"Today" Button**: Resets the timeline view to the current month.
*   **Action Buttons**:
    *   **Reset Data**: A button that restores all application data (orders, units, assignments) to its initial state and shows a confirmation `Toast`.
    *   **Tentative Order**: A button that opens a modal (`<TentativeOrderModal />`) to create a new placeholder order.

### 1.2. Available Orders Section (`<OrdersSection />`)

This section displays a horizontal, scrollable list of all unassigned or partially assigned orders that match the current filter criteria.

*   **Component**: `<OrderCard />`
*   **Layout**: Uses a `ScrollArea` component for horizontal scrolling.
*   **Filtering**: Only displays orders where `order.qty.remaining > 0` and that pass all active filters from the header.
*   **Sorting**: Orders should be sorted by their `etd_date` in ascending order.
*   **Empty State**: If no orders match the criteria, a message like "No available orders match the current filters" should be displayed.

#### Order Card (`<OrderCard />`)

Each card represents a single order and is the draggable element for initiating an assignment.

*   **Draggable Element**: The entire card is draggable if `order.qty.remaining > 0`. This is implemented using the `useDraggable` hook from `@dnd-kit/core`.
*   **Styling**:
    *   Tentative orders (`order.tentative === true`) are styled with a dashed border to distinguish them visually.
    *   A `Move` icon in the footer serves as a visual cue for dragging.
*   **Content**:
    *   **Header**: Displays the `order_num`. If the order is tentative, a "Tentative" `Badge` is also shown.
    *   **Body**: A list of key-value pairs:
        *   Customer: `order.customer`
        *   Style: `order.style`
        *   Order Qty: `order.qty.total` (formatted with commas).
        *   ETD: `order.etd_date` (formatted).
    *   **Footer**:
        *   Displays `Planned` and `Remaining` quantities using `Badge` components for emphasis.
        *   The drag handle (`Move` icon) is located here.

### 1.3. Production Units Section (`<UnitsSection />`)

This section displays a horizontal, scrollable list of all production units, providing a summary of their overall load and assignments.

*   **Component**: `<UnitCard />`
*   **Layout**: Uses a `ScrollArea` component for horizontal scrolling.

#### Unit Card (`<UnitCard />`)

Each card represents a production unit and acts as a drop zone for orders.

*   **Droppable Element**: The entire card is a drop zone, implemented with the `useDroppable` hook from `@dnd-kit/core`. It accepts draggable items of `type: 'order'`.
*   **Content**:
    *   **Header**: Displays the `unit.name` and the total monthly capacity of the unit as a `Badge`.
    *   **Body**: A summary of `Planned` vs. `Remaining` capacity for the month.
    *   **Footer**: A scrollable list (`ScrollArea`) of all orders currently assigned to that unit's lines.
        *   Each item in the list shows the `order_num`, the `lineName`, the assigned `quantity` in a `Badge`, and an 'X' button to unassign the order.

### 1.4. Production Line Timeline (`<TimelineSection />`)

This is the core interactive grid for visualizing and managing the production schedule.

*   **Layout**: A CSS Grid layout.
    *   **Sticky Header Column**: The first column, displaying "Line Details", is sticky so it remains visible during horizontal scrolling. It is vertically centered.
    *   **Timeline Header Row**: The top row is sticky and displays the days of the month (e.g., 1, 2, 3) and the day of the week (e.g., Mon, Tue, Wed). The current day is highlighted.
*   **Rows (`<TimelineRow />`)**: Each row represents a single production line.
    *   **Row Header**: The first cell of each row displays the `line.name`, `unitName`, daily `capacity`, and total quantity `assigned` to that line.
    *   **Daily Capacity Indicator**: The background of each row contains a mini-chart (`<DailyCapacityIndicator />`) that visualizes capacity utilization for each day.
        *   **Color Coding**:
            *   **Green (0-70%)**: Ample capacity.
            *   **Yellow (70-90%)**: Approaching full capacity.
            *   **Red (90-100%)**: At or near full capacity.
            *   **Dark Red (>100%)**: Overbooked.
        *   **Tooltip**: Hovering over a day's capacity bar reveals a tooltip with precise `Assigned` quantity, total `Capacity`, and `Utilization %`.
*   **Assignments (`<TimelineAssignment />`)**:
    *   **Display**: Placed orders appear as colored bars on the timeline. The bar's length corresponds to the production duration, calculated in days. The bar spans the correct number of grid columns.
    *   **Label**: The bar displays the `order_num` and `quantity`.
    *   **Stacking (Tracks)**: If multiple orders are assigned to the same line during overlapping dates, they are stacked vertically in "tracks" within the same timeline row to avoid visual collision.
    *   **Tentative Style**: Tentative assignments have a distinct striped pattern to differentiate them from firm orders.
    *   **Draggable Element**: Each assignment bar is draggable using `@dnd-kit/core`, allowing users to move it.
    *   **Droppable Cells (`<TimelineCell />`)**: Each day cell within a timeline row is a droppable zone that accepts dragged assignments, enabling moves.

---

## 2. Key Functionalities & Scenarios

### 2.1. Drag-and-Drop System (`@dnd-kit/core`)

The drag-and-drop functionality is central to the user experience.

*   **Provider**: The main page is wrapped in a `<ClientOnlyDndProvider>` which initializes the `DndContext`.
*   **Drag Overlay**: A `<DragOverlay>` is used to render a custom, styled version of the item being dragged, providing clear visual feedback.
*   **Event Handling**:
    *   `onDragStart`: Identifies whether an `OrderCard` or a `TimelineAssignment` is being dragged and stores its data.
    *   `onDragEnd`: Determines the outcome of the drop.
        *   **Order to Unit**: If an `OrderCard` is dropped on a `UnitCard`, it opens the `<AssignOrderModal />`.
        *   **Assignment Move**: If a `TimelineAssignment` is dropped on a `<TimelineCell>`, it opens the `<MoveAssignmentModal />`.

### 2.2. Calendars (`react-day-picker` & `date-fns`)

Calendars are used extensively for date selection and navigation.

*   **Library**: `react-day-picker` is used for the calendar UI, wrapped in ShadCN's `Calendar` component. `date-fns` is used for all date calculations (e.g., `differenceInDays`, `format`, `addDays`, `startOfDay`).
*   **Usage**:
    *   **Single Date Selection**: Used in the header to filter by a single ETD.
    *   **Month Navigation**: Used in the header to change the visible month on the timeline. A `captionLayout="dropdown-buttons"` is used for easy year/month selection.
    *   **Date Range Selection**: Used in the `<AssignOrderModal />` and `<FiltersModal />` to select a `from` and `to` date. The calendar is shown with `mode="range"` and `numberOfMonths={2}` for a better user experience.

### 2.3. Assigning an Order

1.  **Drag an Order**: User drags an `OrderCard` from the "Available Orders" section.
2.  **Drop on a Unit**: User drops it onto a `UnitCard`.
3.  **Configure Assignment (`<AssignOrderModal />`)**: The "Assign Order" modal appears.
    *   The modal title clearly states which order is being assigned to which unit.
    *   **Date Selection**: The user selects a production date range using a `react-day-picker` calendar.
    *   **Line Assignment**: The user adds one or more production lines belonging to the target unit. For each line, a quantity is entered. The system can auto-suggest quantities based on line capacity.
4.  **Capacity Validation**: Before confirming, the system performs a **local calculation**:
    *   It determines the total available capacity on the target lines for the selected date range.
    *   It subtracts any capacity already consumed by other assignments within that same period.
    *   If the requested quantity exceeds the available capacity, the assignment is blocked, and an error message is displayed in the modal.
5.  **Confirm**: On success, the assignment appears on the timeline, and the order's `planned` and `remaining` quantities are updated.

### 2.4. Moving an Assignment

1.  **Drag an Assignment**: User drags an existing assignment bar on the timeline.
2.  **Drop on a New Cell**: User drops the assignment onto a new day in the same or a different production line.
3.  **Confirm the Move (`<MoveAssignmentModal />`)**: The "Move Assignment" modal appears.
    *   It summarizes the change (from/to line, original/new dates).
    *   The user can adjust the quantity being moved (allowing for partial moves).
    *   Capacity is validated on the target line for the new date range. The move is prevented if there isn't enough capacity.
4.  **Confirm**: The timeline is updated to reflect the new schedule.

### 2.5. Unassigning an Order

*   **From the Unit Card**: In the "Production Units" section, find the assigned order in the list on the `UnitCard`.
*   **Click 'X'**: Click the 'X' button next to the order to unassign it.
*   **Confirmation**: A `Toast` notification confirms the action. The assignment is removed from the timeline, and the order's quantity is returned to the `remaining` pool.

### 2.6. Creating a Tentative Order (`<TentativeOrderModal />`)

1.  **Click the Button**: User clicks the "Tentative Order" button in the header.
2.  **Fill the Form**: A modal appears. The user fills in details like Order Number, Style, Quantity, and ETD.
3.  **Create**: Upon creation, the new tentative order appears in the "Available Orders" section, clearly marked with a "Tentative" badge and a dashed border. It can be assigned to the timeline just like a regular order.

### 2.7. Filtering Orders (`<FiltersModal />`)

*   **Quick Filters**: Header dropdowns for fast filtering.
*   **Advanced Filters**: The "More Filters" modal allows for combined filtering by:
    *   OC number (text contains search).
    *   Quantity range (min/max).
    *   Order date range.
    *   Style (multi-select checkbox).
    *   Status (multi-select checkbox).
*   **Clearing Filters**: A button in the modal resets all applied filters to their default state.
