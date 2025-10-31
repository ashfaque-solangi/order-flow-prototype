# StitchFlow: Production Planning & Order Management

StitchFlow is a dynamic, visual tool designed for production planning and order management in stitching, cutting, or other manufacturing operations. It provides a drag-and-drop interface to assign orders to production lines and a real-time timeline to visualize capacity and scheduling.

## Table of Contents

1.  [Core Components](#core-components)
    *   [Header & Filters](#header--filters)
    *   [Available Orders Section](#available-orders-section)
    *   [Production Units Section](#production-units-section)
    *   [Production Line Timeline](#production-line-timeline)
2.  [Key Functionalities & Scenarios](#key-functionalities--scenarios)
    *   [Assigning an Order](#assigning-an-order)
    *   [Moving an Assignment](#moving-an-assignment)
    *   [Unassigning an Order](#unassigning-an-order)
    *   [Creating a Tentative Order](#creating-a-tentative-order)
    *   [Filtering Orders](#filtering-orders)
    *   [Resetting Application Data](#resetting-application-data)

---

## Core Components

The application is divided into several key sections, each serving a specific purpose in the planning workflow.

### Header & Filters

The header at the top of the page is the central control panel for navigating and filtering the application data.

-   **Quick Filters**: Quickly filter available orders by **Customer**, **OC #**, or a specific **ETD Date**.
-   **More Filters**: Opens a modal with advanced filtering options, including by style, quantity range, order date, and status.
-   **Timeline Navigation**: Use the month selector to navigate the timeline. The **Today** button quickly returns you to the current month.
-   **Actions**:
    -   **Reset Data**: Restores all orders and units to their initial state.
    -   **Tentative Order**: Opens a modal to create a new placeholder order for planning purposes.

### Available Orders Section

This section displays a horizontal list of all unassigned or partially assigned orders that match the current filter criteria.

-   **Order Card**: Each card provides key details about an order:
    -   Order Number, Customer, and Style.
    -   **Badges**: `Planned` and `Remaining` quantities are clearly displayed using badges.
    -   **Drag Handle**: A move icon indicates that the card can be dragged to assign it.
-   **Tentative Orders**: Tentative orders are clearly marked with a "Tentative" badge and a dashed border, distinguishing them from firm orders.

### Production Units Section

This section displays a card for each production unit, giving a summary of its overall load and assignments.

-   **Unit Card**:
    -   Displays the total monthly capacity of the unit.
    -   Shows a summary of `Planned` vs. `Remaining` capacity.
    -   Contains a scrollable list of all orders assigned to that unit's lines.
    -   Each assigned order shows its quantity and can be unassigned by clicking the **'X'** button.
-   **Drop Zone**: You can drag an order card from the "Available Orders" section and drop it onto a unit card to initiate the assignment process.

### Production Line Timeline

This is the core of the application—a detailed, interactive grid for visualizing and managing your production schedule.

-   **Grid Layout**:
    -   **Rows**: Each row represents a single production line, showing its name, unit, and daily capacity.
    -   **Columns**: Each column represents a day of the selected month.
-   **Daily Capacity Indicator**: The background of each row contains a mini-chart that visualizes the capacity utilization for each day.
    -   **Color Coding**:
        -   **Green (0-70%)**: Ample capacity available.
        -   **Yellow (70-90%)**: Approaching full capacity.
        -   **Red (90-100%)**: At or near full capacity.
        -   **Dark Red (>100%)**: Overbooked.
    -   **Tooltip**: Hovering over any day's capacity bar reveals a tooltip with the precise `Assigned` quantity, total `Capacity`, and `Utilization %` for that day.
-   **Assignment Bars**: Placed orders appear as colored bars on the timeline.
    -   The bar's length corresponds to the production duration.
    -   The label shows the order number and quantity.
    -   **Tentative Assignments** have a distinct striped pattern, making them easy to identify as placeholders.
    -   Hovering over an assignment shows a tooltip with full details.

---

## Key Functionalities & Scenarios

### Assigning an Order

1.  **Drag an Order**: Click and drag an `OrderCard` from the "Available Orders" section.
2.  **Drop on a Target**:
    -   Drop it onto a `UnitCard` to assign it to that unit.
    -   Drop it directly onto a day cell in the `Timeline` to assign it to that specific line and start date.
3.  **Configure Assignment**: The "Assign Order" modal will appear.
    -   Select the production date range.
    -   Add one or more production lines.
    -   Input the quantity to assign to each line. The system can auto-suggest quantities based on line capacity and the production duration.
4.  **AI-Powered Validation**: Before confirming, the system uses an AI model to validate if the target lines have enough capacity for the requested quantity. If capacity is exceeded, the assignment will be blocked, and a reason will be provided.
5.  **Confirm**: Once confirmed, the assignment appears on the timeline, and the order's "Planned" and "Remaining" quantities are updated.

### Moving an Assignment

1.  **Drag an Assignment**: Click and drag an existing assignment bar on the timeline.
2.  **Drop on a New Cell**: Drop the assignment onto a new day in the same or a different production line.
3.  **Confirm the Move**: The "Move Assignment" modal appears, summarizing the change.
    -   You can adjust the quantity being moved (allowing for partial moves).
    -   The modal checks the target line's capacity for the new date range and will prevent the move if there isn't enough space.
4.  **Confirm**: The timeline is updated to reflect the new schedule.

### Unassigning an Order

-   **From the Unit Card**: In the "Production Units" section, find the assigned order in the list on the `UnitCard`.
-   **Click 'X'**: Click the 'X' button next to the order you wish to unassign.
-   **Confirmation**: A toast notification will confirm that the order has been unassigned. The assignment is removed from the timeline, and the order's quantity is returned to the "Remaining" pool.

### Creating a Tentative Order

1.  **Click the Button**: Click the "Tentative Order" button in the header.
2.  **Fill the Form**: A modal will appear. Fill in the required details like Order Number, Style, Quantity, and ETD. The customer is pre-filled as "Planning Dept" but can be changed.
3.  **Create**: Upon creation, the new tentative order appears in the "Available Orders" section, clearly marked with a "Tentative" badge and a dashed border. It can be assigned to the timeline just like a regular order.

### Filtering Orders

-   **Quick Filters**: Use the dropdowns in the header for fast filtering by Customer or OC number, or use the date picker to find orders with a specific ETD.
-   **Advanced Filters**: Click the "More Filters" button to open a modal with more options:
    -   Search by OC number text.
    -   Filter by a quantity range.
    -   Select a range for the order date.
    -   Filter by one or more styles or statuses.
-   **Clearing Filters**: All applied filters can be reset at once from within the advanced filters modal.

### Resetting Application Data

-   If you want to start over or revert to the initial demo state, click the **"Reset Data"** button in the header. This will restore all orders and production unit assignments to their original state.
