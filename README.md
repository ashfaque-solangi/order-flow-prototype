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

#### **Rendering Logic: How Assignment Bars are Placed**

The placement and length of the assignment bars are critical to the timeline's functionality. This is achieved through a combination of date calculations and CSS Grid properties.

1.  **Grid Structure**: The main timeline area (excluding the header column) is a single CSS Grid container.
    *   Its columns are defined by `gridTemplateColumns: repeat(${days.length}, minmax(48px, 1fr))`. This creates one column for each day of the selected month.
    *   Its rows are defined by `gridAutoRows: ${trackHeight}px`. Each track for an assignment gets a fixed height.

2.  **Calculating Position and Span**: Inside the `<TimelineRow />` component, for each `assignment`, the following calculations are performed:
    *   **Start Date Index**: The code calculates the difference in days between the assignment's start date and the first day of the visible month (`differenceInDays(startDate, monthStart)`). This determines the grid column where the bar should begin. For example, if an assignment starts on the 5th of the month, its `startDayIndex` will be `4` (since it's a zero-based index).
    *   **Duration**: The total length of the assignment in days is calculated: `differenceInDays(endDate, startDate) + 1`.

3.  **Applying Grid Styles**:
    *   The assignment bar (a `div` wrapping the `<TimelineAssignment />` component) is then placed on the grid using an inline style for the `gridColumn` property.
    *   The style is set as: `gridColumn: `${startDayIndex + 1} / span ${duration}``.
        *   `startDayIndex + 1`: CSS grid columns are 1-based, so we add 1 to the index. This tells the grid which vertical line the assignment should start on.
        *   `span ${duration}`: This tells the grid item to span across a specific number of columns, which is equal to the assignment's duration in days.

4.  **Handling Overflows (Clamping)**: The logic also gracefully handles assignments that start before the visible month or end after it.
    *   It "clamps" the start and end positions to ensure that only the visible portion of the assignment bar is rendered.
    *   `clampedStart = Math.max(startDayIndex, 0)`: If an assignment starts before the month begins, its starting column is set to the first day (index 0).
    *   `clampedEnd = Math.min(startDayIndex + duration, monthDays)`: If an assignment extends beyond the month, its ending column is capped at the last day of the month.
    *   The final `clampedDuration` is used in the `gridColumn` style, ensuring the bar renders perfectly within the visible grid boundaries.

5.  **Stacking in Tracks**:
    *   The `getAssignmentLayout` function is responsible for preventing visual overlap. It processes all assignments for a line and sorts them into "tracks" (arrays of non-overlapping assignments).
    *   Each track is rendered on a new row within the timeline's grid for that specific line. The `gridRow` style is set to `${trackIndex + 1}` for each assignment, placing it in the correct horizontal track.

This combination of date logic and dynamic CSS Grid styling allows for a flexible and accurate visual representation of the production schedule.

---

## 2. Key Functionalities & Modals

### 2.1. Drag-and-Drop System (`@dnd-kit/core`)

The drag-and-drop functionality is central to the user experience.

*   **Provider**: The main page is wrapped in a `<ClientOnlyDndProvider>` which initializes the `DndContext`. This provider is essential for the drag-and-drop system to work.
*   **Drag Overlay**: A `<DragOverlay>` is used to render a custom, styled version of the item being dragged, providing clear visual feedback to the user. This ensures the dragged item looks identical to the source item and moves smoothly across the screen.
*   **Event Handling**:
    *   `onDragStart`: This event handler identifies whether an `OrderCard` or a `TimelineAssignment` is being dragged and stores its data in the component's state. This allows the application to know what kind of item is active.
    *   `onDragEnd`: This handler determines the outcome of the drop based on the source and target.
        *   **Order to Unit**: If an `OrderCard` is dropped on a `UnitCard`, it opens the `<AssignOrderModal />`, pre-selecting the target unit.
        *   **Assignment Move**: If a `TimelineAssignment` is dropped on a `<TimelineCell />` (a day cell in the timeline), it opens the `<MoveAssignmentModal />`, pre-populating the details of the move.

### 2.2. Calendars (`react-day-picker` & `date-fns`)

Calendars are used extensively for date selection and navigation. The consistent use of these libraries is crucial for a predictable user experience.

*   **Library**: `react-day-picker` is used for rendering the calendar UI. It is wrapped in ShadCN's `Calendar` component for styling consistency. All date logic, such as calculating differences, formatting, and adding days, is handled by the `date-fns` library.
*   **Usage Scenarios**:
    *   **Single Date Selection**: In the main header, a calendar is used to filter orders by a single **ETD (Estimated Time of Departure)**. This calendar is in `mode="single"`.
    *   **Month Navigation**: In the header, a calendar is used to change the visible month on the timeline. It is configured with `captionLayout="dropdown-buttons"` to allow for easy selection of both month and year, providing a much better UX than simple next/previous arrows.
    *   **Date Range Selection**: In the `<AssignOrderModal />` and `<FiltersModal />`, calendars are used for selecting a `from` and `to` date. These are configured with `mode="range"` and `numberOfMonths={2}` to give the user a two-month view, which is essential for production planning that spans across month boundaries.

### 2.3. Modal: Assign Order (`<AssignOrderModal />`)

This modal is the primary interface for creating a new production assignment. It is designed to be a step-by-step guide for the user.

*   **Trigger**: Dragging an `OrderCard` and dropping it onto a `UnitCard`.
*   **Content**:
    *   **Header**: Displays "Assign Order: [Order Number] to [Unit Name]" and shows the order's remaining assignable quantity as a key piece of information.
    *   **Step 1: Production Dates**:
        *   A `Popover` containing a `Calendar` from `react-day-picker`.
        *   The calendar **must** be in `mode="range"` and show `numberOfMonths={2}`.
        *   The user selects a `from` and `to` date for the production run.
    *   **Step 2: Line Assignments**:
        *   A dynamic section where users can add one or more production lines from the target unit.
        *   An "Add Line" button adds a new assignment row.
        *   Each row contains:
            *   A `Select` dropdown to choose a specific `ProductionLine` from the target unit. The dropdown only shows lines that haven't been added yet.
            *   An `Input` field to enter the `quantity` for that line.
            *   A `CapacityBar` to visualize the line's monthly capacity utilization after this potential assignment. This provides instant visual feedback.
            *   A `Trash2` icon button to remove that specific line assignment.
    *   **Summary Section**:
        *   Displays the total `Production Days` calculated from the selected date range.
        *   Shows the `Total to Assign` (the sum of quantities from all line inputs).
        *   Shows the `Order Qty After Assign` (the order's remaining quantity minus the total to assign). This value **must** turn red if it becomes negative to alert the user.
    *   **Footer**: Contains "Cancel" and "Confirm Assignment" buttons. The confirm button is disabled if no lines are added, the total quantity is zero, or the form is otherwise invalid.

*   **Functional Scenarios**:
    *   **Scenario 1: Successful Assignment**:
        1.  User selects a valid date range.
        2.  User adds one or more lines and enters quantities for each.
        3.  The total assigned quantity is less than or equal to the order's remaining quantity.
        4.  The entered quantity for each line is within the available capacity of that line for the selected date range.
        5.  User clicks "Confirm Assignment".
        6.  The modal closes, the assignment appears on the timeline, the order's `planned` and `remaining` quantities are updated, and a success `Toast` is shown.
    *   **Scenario 2: Capacity Exceeded**:
        1.  User enters a quantity for a line that exceeds its available capacity for the chosen dates.
        2.  User clicks "Confirm Assignment".
        3.  The assignment is blocked. An `Alert` appears inside the modal explaining which line is over capacity and by how much. The modal remains open for the user to correct the quantity.
    *   **Scenario 3: Over-assigning Order Quantity**:
        1.  The user enters quantities across lines that sum up to more than the order's `remaining` quantity.
        2.  The "Order Qty After Assign" summary text turns red.
        3.  If the user clicks "Confirm", an `Alert` is displayed in the modal, and the assignment is blocked.
    *   **Scenario 4: Incomplete Form**:
        1.  User clicks "Confirm" without selecting dates or adding any lines.
        2.  An `Alert` is displayed, prompting the user to complete the required fields.

### 2.4. Modal: Move Assignment (`<MoveAssignmentModal />`)

This modal handles the logic for moving or splitting an existing assignment on the timeline.

*   **Trigger**: Dragging a `TimelineAssignment` bar and dropping it onto a different `TimelineCell`.
*   **Content**:
    *   **Header**: Displays "Move Assignment: [Order Number]".
    *   **Summary Section**: A grid showing:
        *   From Line: `sourceLine.name`
        *   To Line: `targetLine.name`
        *   Original Dates: `startDate` to `endDate`
        *   New Dates: `newStartDate` to `newEndDate`
    *   **Quantity to Move**:
        *   An `Input` field pre-filled with the assignment's total quantity. The user can edit this to perform a partial move (split). The input **must** have a `max` attribute set to the original quantity.
    *   **Capacity Visualization**:
        *   A `CapacityBar` showing the capacity utilization on the `targetLine` for the new date range, including the quantity being moved. This provides immediate feedback on the validity of the move.
    *   **Footer**: "Cancel" and "Confirm Move" buttons.

*   **Functional Scenarios**:
    *   **Scenario 1: Full Move Successful**:
        1.  User drags an assignment to a new location with sufficient capacity.
        2.  The modal opens, showing the full quantity to be moved.
        3.  User clicks "Confirm Move".
        4.  The assignment is removed from the old location and appears in the new one. A success `Toast` is displayed.
    *   **Scenario 2: Partial Move (Split)**:
        1.  User drags an assignment.
        2.  In the modal, the user reduces the "Quantity to Move".
        3.  User clicks "Confirm Move".
        4.  The original assignment on the timeline is updated with the reduced quantity. A new assignment appears in the target location with the "split" quantity.
    *   **Scenario 3: Move Fails (Insufficient Capacity)**:
        1.  User attempts to move an assignment to a location with insufficient capacity.
        2.  The `CapacityBar` in the modal turns red/yellow, and the available capacity text indicates a deficit.
        3.  User clicks "Confirm Move".
        4.  The move is blocked. An `Alert` appears in the modal explaining the capacity issue. The modal remains open for correction.
    *   **Scenario 4: Invalid Quantity**:
        1.  User enters a quantity greater than the original assignment's quantity or less than or equal to zero.
        2.  An `Alert` is displayed, and the "Confirm Move" button is disabled until a valid quantity is entered.

### 2.5. Modal: Create Tentative Order (`<TentativeOrderModal />`)

This modal allows for the quick creation of placeholder orders for planning purposes.

*   **Trigger**: Clicking the "Tentative Order" button in the `<AppHeader />`.
*   **Content**:
    *   **Header**: "Create Tentative Order".
    *   **Form Fields** (with validation):
        *   `order_num`: Text input.
        *   `customer`: Text input, defaults to "Planning Dept".
        *   `style`: Text input.
        *   `qty`: Number input (must be > 0).
        *   `etd_date`: Date input.
    *   **Footer**: "Cancel" and "Create Order" buttons.

*   **Functional Scenarios**:
    *   **Scenario 1: Successful Creation**:
        1.  User fills out all required fields with valid data.
        2.  User clicks "Create Order".
        3.  The modal closes. A new `Order` object is created with `tentative: true`.
        4.  The new order card appears in the "Available Orders" section, styled with a dashed border and a "Tentative" badge.
    *   **Scenario 2: Invalid Data**:
        1.  User leaves a required field blank or enters invalid data (e.g., quantity of 0).
        2.  Form validation messages appear below the respective fields. The submission is blocked until all fields are valid.

### 2.6. Modal: Advanced Filters (`<FiltersModal />`)

This modal provides a powerful interface for filtering the "Available Orders" list based on multiple criteria.

*   **Trigger**: Clicking the "More Filters" button in the `<AppHeader />`.
*   **Content**:
    *   **Header**: "More Filters".
    *   **Layout**: A three-column grid for better organization.
    *   **Column 1: By Details**:
        *   `OC Number Contains`: A text input for partial string matching on the order number.
        *   `Quantity Range`: Two number inputs for `min` and `max` quantity.
        *   `Order Date`: A `Popover` with a `react-day-picker` `Calendar` in `range` mode to filter by order creation date.
    *   **Column 2: By Style**:
        *   A `ScrollArea` containing a list of `Checkbox` components for every unique style. Users can select multiple styles to filter by.
    *   **Column 3: By Status**:
        *   A `ScrollArea` containing a list of `Checkbox` components for each status type (`Planned`, `Partially Assigned`, etc.).
    *   **Footer**:
        *   "Clear All Filters" button: Resets all filters in the modal and in the header to their default state.
        *   "Apply & Close" button: Closes the modal. The filters are applied automatically as they are changed.

*   **Functional Scenarios**:
    *   **Scenario 1: Applying Filters**:
        1.  User opens the modal and interacts with any filter control (e.g., types in a quantity range, checks a style box).
        2.  The application state for filters is updated instantly. The "Available Orders" section re-renders in the background to show only orders that match all active criteria (from both the header and the modal).
    *   **Scenario 2: Clearing Filters**:
        1.  User clicks "Clear All Filters".
        2.  All filter states are reset to their default values. The "Available Orders" section updates to show all available orders again.
    *   **Scenario 3: Closing the Modal**:
        1.  User clicks "Apply & Close" or the 'X' button.
        2.  The modal closes. The last applied filter state remains active and continues to filter the orders.