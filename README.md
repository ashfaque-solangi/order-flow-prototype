# StitchFlow: Production Planning & Order Management (Technical Specification)

## 1. Introduction & Project Goal

StitchFlow is a visual, web-based application for production planning and order management, specifically designed for manufacturing environments like stitching or cutting facilities. The primary goal is to provide planners with a drag-and-drop interface to assign production orders to specific manufacturing lines and to visualize the factory's schedule and capacity in a real-time timeline view.

This document serves as the complete technical specification for building the StitchFlow application. It is intended to be technology-agnostic and should be used as the definitive blueprint for development.

---

## 2. Core Data Models

The application revolves around three core data models: **Orders**, **Production Units**, and **Assignments**.

### 2.1. Order Model

Represents a customer's production order.

| Field Name     | Data Type             | Description                                                                                             | Required | Notes                               |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| `id`           | String / UUID         | A unique identifier for the order (e.g., `ord-1`).                                                      | Yes      | Primary Key.                        |
| `order_num`    | String                | The human-readable order number (e.g., "OC-1201A").                                                     | Yes      | Should be unique.                   |
| `qty`          | Object                | An object containing quantity details.                                                                  | Yes      |                                     |
| `qty.total`    | Integer               | The total number of units in the order.                                                                 | Yes      | Must be > 0.                        |
| `qty.assigned` | Integer               | The number of units that have been assigned to production lines.                                        | Yes      | Default: 0.                         |
| `qty.remaining`| Integer               | The number of units left to be assigned. Calculated as `total - assigned`.                              | Yes      | Default: `total`.                   |
| `customer`     | String                | The name of the customer.                                                                               | Yes      |                                     |
| `style`        | String                | The product style or SKU (e.g., "ST-001").                                                              | Yes      |                                     |
| `order_date`   | String (YYYY-MM-DD)   | The date the order was created.                                                                         | Yes      |                                     |
| `etd_date`     | String (YYYY-MM-DD)   | The **E**stimated **T**ime of **D**eparture for the order.                                                | Yes      |                                     |
| `status`       | String (Enum)         | The current status of the order. Must be one of: `Planned`, `Partially Assigned`, `Fully Assigned`.       | Yes      | Default: `Planned`.                 |
| `tentative`    | Boolean               | A flag to indicate if the order is a placeholder for planning purposes.                                 | Yes      | Default: `false`.                   |

### 2.2. Production Unit Model

Represents a logical grouping of production lines (e.g., a factory floor or department).

| Field Name | Data Type              | Description                                       | Required | Notes         |
| ---------- | ---------------------- | ------------------------------------------------- | -------- | ------------- |
| `id`       | String / UUID          | A unique identifier for the unit (e.g., `unit-1`). | Yes      | Primary Key.  |
| `name`     | String                 | The name of the production unit.                  | Yes      |               |
| `lines`    | Array of `Line` objects | The production lines contained within this unit.  | Yes      | See 2.2.1.    |

#### 2.2.1. Line (Sub-model)

Represents an individual production line within a Unit.

| Field Name    | Data Type                    | Description                                                   | Required | Notes        |
| ------------- | ---------------------------- | ------------------------------------------------------------- | -------- | ------------ |
| `id`          | String / UUID                | A unique identifier for the line (e.g., `line-1A`).           | Yes      | Primary Key. |
| `name`        | String                       | The name of the production line.                              | Yes      |              |
| `dailyCap`    | Integer                      | The maximum number of units this line can produce in one day. | Yes      |              |
| `assignments` | Array of `Assignment` objects | The orders currently assigned to this line.                   | Yes      | See 2.3.     |

### 2.3. Assignment Model

Represents a specific quantity of an **Order** being produced on a specific **Line** over a date range. This is the join model between Orders and Lines.

| Field Name   | Data Type           | Description                                                        | Required | Notes                                      |
| ------------ | ------------------- | ------------------------------------------------------------------ | -------- | ------------------------------------------ |
| `id`         | String / UUID       | A unique identifier for the assignment (e.g., `as-123`).           | Yes      | Primary Key.                               |
| `orderId`    | String / UUID       | The ID of the parent `Order`.                                      | Yes      | Foreign Key to `Order.id`.                 |
| `order_num`  | String              | The order number, denormalized for display purposes.               | Yes      | Copied from `Order.order_num`.             |
| `quantity`   | Integer             | The number of units assigned in this specific production run.      | Yes      |                                            |
| `startDate`  | String (YYYY-MM-DD) | The start date of the production run.                              | Yes      |                                            |
| `endDate`    | String (YYYY-MM-DD) | The end date of the production run.                                | Yes      |                                            |
| `tentative`  | Boolean             | A flag indicating if the parent order is tentative, for styling.   | No       | Copied from `Order.tentative`.             |

---

## 3. Application Layout & Core Components

The application UI is comprised of four main sections, presented in a single-page interface.

### 3.1. App Header

This is the main control panel, fixed at the top of the page.

*   **Title**: Display the application name, "StitchFlow".
*   **Available Orders Badge**: A badge that shows a real-time count of all `Orders` where `qty.remaining` is greater than 0.
*   **Quick Filters**:
    *   **Customer Filter**: A dropdown list populated with all unique customer names from the `Order` data. Includes an "All Customers" option.
    *   **OC # Filter**: A dropdown list populated with all unique `order_num` values. Includes an "All OC #" option.
    *   **ETD Date Filter**: A calendar popover for selecting a single date to filter orders by their `etd_date`.
*   **Advanced Filters Button**: A button labeled "More Filters" that opens the `<FiltersModal />`.
*   **Timeline Navigation**:
    *   **Month Selector**: A calendar popover that allows the user to select a month and year. This controls the date range displayed on the `<TimelineSection />`. It should provide dropdowns for month and year for quick navigation.
    *   **"Today" Button**: A button that resets the timeline's view to the current month.
*   **Action Buttons**:
    *   **Reset Data**: A button to restore all application data to its initial, default state. Should show a success notification upon completion.
    *   **Tentative Order**: A button that opens the `<TentativeOrderModal />` to create a new placeholder order.

### 3.2. Available Orders Section

A section displaying all orders that are available for assignment.

*   **Component**: This section renders a list of `<OrderCard />` components.
*   **Layout**: A horizontally-oriented grid that wraps to multiple rows. The entire section must be vertically scrollable with a fixed height, initially showing **two rows** of `OrderCard` components.
*   **Filtering Logic**:
    1.  Only display `Orders` where `qty.remaining > 0`.
    2.  The list must be dynamically filtered by all active filters from the App Header and the `<FiltersModal />`.
*   **Sorting Logic**: The displayed orders must be sorted by `etd_date` in ascending (chronological) order.
*   **Empty State**: If no orders match the filter criteria, a clear message (e.g., "No available orders match the current filters") must be displayed.

#### 3.2.1. Order Card Component

This component represents a single draggable `Order`.

*   **Draggability**: The entire card must be draggable **if and only if** `order.qty.remaining > 0`. This is the primary mechanism for initiating an order assignment. A `move` icon in the footer should serve as a visual drag handle.
*   **Styling**:
    *   If `order.tentative` is `true`, the card must have a distinct visual style (e.g., a dashed border) to differentiate it from firm orders.
*   **Content Display**:
    *   **Header**: Display the `order_num`. If the order is tentative, also display a "Tentative" badge.
    *   **Body**: Display the following key-value pairs:
        *   Customer: `order.customer`
        *   Style: `order.style`
        *   Order Qty: `order.qty.total` (formatted with commas).
        *   ETD: `order.etd_date` (formatted).
    *   **Footer**: Display `Planned` and `Remaining` quantities in prominent badges. Include the drag handle icon here.

### 3.3. Production Units Section

A horizontally scrollable section summarizing each production unit's load.

*   **Component**: This section renders a horizontal list of `<UnitCard />` components.
*   **Layout**: Must be horizontally scrollable to accommodate a variable number of units.

#### 3.3.1. Unit Card Component

This component represents a single `Production Unit` and acts as a drop zone.

*   **Droppability**: The entire card must be a droppable area that accepts dragged `<OrderCard />` components. Dropping an order card onto a unit card will trigger the `<AssignOrderModal />`.
*   **Content Display**:
    *   **Header**: Display the `unit.name` and the total monthly capacity of the unit as a badge.
    *   **Body**: Display a summary of `Planned` vs. `Remaining` capacity for the month.
    *   **Footer**: A vertically scrollable list of all orders currently assigned to that unit's lines. Each item in this list must show:
        *   `order_num`
        *   The name of the `Line` it's on (`lineName`).
        *   The assigned `quantity` in a badge.
        *   An "X" icon button to unassign that specific order. Clicking this will remove the assignment and update the parent order's quantities.

### 3.4. Production Line Timeline Section

The primary interactive grid for visualizing and managing the production schedule.

*   **Layout**: A CSS Grid.
    *   **Sticky Header Column**: The first column, displaying "Line Details," must be sticky so it remains visible during horizontal scrolling. It should be vertically centered within its cell.
    *   **Timeline Header Row**: The top row, displaying the days of the month (1, 2, 3...) and the day of the week (Mon, Tue, Wed...), must be sticky. The current day should be visually highlighted.
*   **Rows (`<TimelineRow />`)**: Each row represents a single `ProductionLine`.
    *   **Row Header**: The first cell of each row displays the `line.name`, the parent `unitName`, the line's daily `capacity`, and the total quantity `assigned` to that line.
    *   **Daily Capacity Indicator**: The background of each row must contain a mini-chart visualizing the capacity utilization for each day of the month.
        *   **Color-Coding Logic**: The color of the bar for each day should change based on utilization (`totalAssigned / dailyCapacity`):
            *   **Green (0-70%)**: Low utilization.
            *   **Yellow (70-90%)**: Approaching capacity.
            *   **Red (90-100%)**: At or near capacity.
            *   **Dark Red (>100%)**: Overbooked.
        *   **Tooltip**: Hovering over a day's capacity bar must reveal a tooltip with the exact `Assigned` quantity, total `Capacity`, and `Utilization %`.
*   **Assignments (`<TimelineAssignment />`)**:
    *   **Display**: Assigned orders appear as colored bars on the timeline. The bar's length must correspond to the production duration in days.
    *   **Label**: The bar should display the `order_num` and the assigned `quantity`.
    *   **Stacking (Tracks)**: If multiple orders are assigned to the same line during overlapping dates, they must be stacked vertically in separate "tracks" within the same timeline row to avoid visual collision.
    *   **Styling**: If an assignment's `tentative` flag is `true`, it must have a distinct visual style (e.g., a striped pattern).
    *   **Draggability**: Each assignment bar must be draggable to allow users to reschedule it.
    *   **Droppability**: Each day cell within a timeline row must be a droppable zone that accepts dragged assignments, enabling moves.

#### 3.4.1. **Rendering Logic: Assignment Bar Placement**

This is the most critical part of the timeline's implementation. It must be implemented using CSS Grid.

1.  **Grid Structure**: The main timeline area (excluding the sticky header column) is a single CSS Grid container.
    *   **Columns**: The grid's columns must be defined to have one column for each day of the selected month (e.g., `repeat(31, 1fr)`).
    *   **Rows**: The grid's rows for each line should be determined by the number of "tracks" needed to display overlapping assignments.

2.  **Calculating Position and Span**: For each `Assignment`, the following calculations must be performed:
    *   **Start Index**: Calculate the day index where the bar begins. This is the difference in days between the assignment's `startDate` and the first day of the visible month.
    *   **Duration**: Calculate the total length of the assignment in days (`endDate - startDate + 1`).

3.  **Applying Grid Styles**:
    *   The assignment bar must be placed on the grid using `grid-column: <start-line> / span <duration>`.
    *   `<start-line>` is the calculated start index + 1 (since CSS grid lines are 1-based).
    *   `<duration>` is the calculated duration in days.

4.  **Handling Month Boundaries (Clamping)**: The rendering logic must gracefully handle assignments that start before the visible month or end after it.
    *   If an assignment starts *before* the first day of the month, its rendered start position must be clamped to the first column.
    *   If an assignment ends *after* the last day of the month, its rendered span must be clamped to not exceed the grid's boundaries.
    *   The visual bar should only represent the portion of the assignment that falls within the visible month.

5.  **Stacking in Tracks**:
    *   A layout algorithm must process all assignments for a given line and sort them into non-overlapping "tracks".
    *   Each track is rendered on a new implicit row within the main grid row for that line. This is achieved by setting the `grid-row` property for each assignment to its calculated track index.

---

## 4. Key Functionalities & Modals

### 4.1. Drag-and-Drop System

*   **Required Library**: `@dnd-kit/core` (or an equivalent robust, modern library).
*   **Drag Overlay**: A drag overlay must be used to render a floating, visually identical copy of the item being dragged. This provides clear user feedback.
*   **Event Handling**:
    *   **Drag Start**: Must identify whether an `<OrderCard>` or a `<TimelineAssignment>` is being dragged and store its data.
    *   **Drag End**: This is the core logic handler.
        *   **Scenario A: Order Card -> Unit Card**: If an `<OrderCard>` is dropped on a `<UnitCard>`, it must trigger the `<AssignOrderModal />`, pre-selecting the target unit.
        *   **Scenario B: Timeline Assignment -> Timeline Cell**: If a `<TimelineAssignment>` is dropped on a new day cell in the timeline, it must trigger the `<MoveAssignmentModal />`.

### 4.2. Calendars

*   **Required Libraries**: `date-fns` for all date logic and `react-day-picker` (or equivalent) for the UI.
*   **Usage Scenarios**:
    *   **Single Date Selection (ETD Filter)**: A calendar in single-date selection mode.
    *   **Month Navigation**: A calendar with dropdowns for month and year.
    *   **Date Range Selection (Assign/Filter Modals)**: A calendar in date-range selection mode, showing **two months** simultaneously to facilitate planning across month-ends.

### 4.3. Modal: Assign Order

Triggered by dropping an `<OrderCard>` on a `<UnitCard>`.

*   **UI Components**:
    *   **Header**: "Assign Order: [Order Number] to [Unit Name]". Must display the order's `remaining` quantity.
    *   **Step 1: Production Dates**: A two-month calendar for selecting a date range (`from` and `to`).
    *   **Step 2: Line Assignments**: A dynamic list of assignment rows.
        *   An "Add Line" button adds a new row.
        *   Each row contains:
            *   A dropdown to select a `ProductionLine` from the target unit.
            *   A number input for the `quantity` for that line.
            *   A `CapacityBar` to visualize the line's capacity utilization *with the proposed quantity*.
            *   A "Delete" icon to remove the row.
    *   **Summary Section**:
        *   `Production Days`: Calculated from the selected date range.
        *   `Total to Assign`: Sum of all quantities from the line inputs.
        *   `Order Qty After Assign`: (`order.qty.remaining - Total to Assign`). This value **must turn red if it becomes negative**.
    *   **Footer**: "Cancel" and "Confirm Assignment" buttons.

*   **Functional Scenarios**:
    *   **Success**: User fills the form with valid data, confirms, the modal closes, the timeline updates, order quantities are updated, and a success notification appears.
    *   **Failure (Capacity Exceeded)**: On confirm, if the quantity for any line exceeds its available capacity for the selected dates, the assignment is blocked. An alert must appear *inside the modal* explaining the issue.
    *   **Failure (Over-assigning Order)**: If `Total to Assign` > `order.qty.remaining`, the summary text turns red. On confirm, an alert appears in the modal, and the assignment is blocked.
    *   **Failure (Invalid Form)**: The "Confirm" button must be disabled if no dates are selected, no lines are added, or total quantity is zero.

### 4.4. Modal: Move Assignment

Triggered by dragging a `<TimelineAssignment>` to a new location.

*   **UI Components**:
    *   **Header**: "Move Assignment: [Order Number]".
    *   **Summary**: A grid showing `From Line`, `To Line`, `Original Dates`, and `New Dates`.
    *   **Quantity to Move**: A number input, pre-filled with the assignment's total quantity. The user can edit this to perform a partial move (split). The input must not allow a value greater than the original quantity.
    *   **Capacity Visualization**: A `CapacityBar` showing the `targetLine`'s capacity utilization for the new date range, including the quantity being moved.
    *   **Footer**: "Cancel" and "Confirm Move" buttons.

*   **Functional Scenarios**:
    *   **Full Move**: User confirms the move with the full quantity. The original assignment's position and line are updated.
    *   **Partial Move (Split)**: User reduces the quantity to move. On confirm, the original assignment's quantity is reduced, and a *new* assignment is created at the target location with the split-off quantity.
    *   **Failure (Insufficient Capacity)**: If the move exceeds the target line's capacity, an alert must appear in the modal, and the move is blocked.

### 4.5. Modal: Create Tentative Order

Triggered by the "Tentative Order" button in the header.

*   **UI Components**: A simple form with fields for `order_num`, `customer` (defaults to "Planning Dept"), `style`, `qty`, and `etd_date`.
*   **Functionality**: On submission, a new `Order` is created with `tentative: true` and added to the "Available Orders" list. The new card must have the distinctive tentative styling. All fields are required.

### 4.6. Modal: Advanced Filters

Triggered by the "More Filters" button.

*   **UI Components**: A multi-column layout for various filter options:
    *   **OC Number Contains**: Text input for partial string matching.
    *   **Quantity Range**: Min and Max number inputs.
    *   **Order Date**: A two-month date range calendar.
    *   **By Style**: A scrollable list of checkboxes for every unique style.
    *   **By Status**: A scrollable list of checkboxes for every unique status.
*   **Functionality**: Filters are applied instantly as the user interacts with the controls. A "Clear All Filters" button resets all filter states (in both the modal and the main header).
