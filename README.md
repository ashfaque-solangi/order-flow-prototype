# StitchFlow: User Guide

## 1. Introduction

Welcome to StitchFlow, your visual command center for production planning and order management. Designed for dynamic manufacturing environments, StitchFlow provides a powerful drag-and-drop interface to schedule orders, visualize your production timeline in real-time, and ensure your facility is always running at optimal capacity.

This guide will walk you through all the features and functionalities of the StitchFlow application.

---

## 2. Understanding the Core Concepts

StitchFlow is built around a few key ideas:

*   **Orders**: These are your customer's production requests. Each order has a total quantity, and the system tracks how much of that quantity has been assigned to production.
*   **Production Units**: These are logical groups of production lines, like "Stitching Unit 1" or "Cutting Unit A". They give you a high-level overview of a department's workload.
*   **Production Lines**: These are the individual lines within a unit where the actual work happens. Each line has a specific `dailyCap` (daily capacity).
*   **Assignments**: This is what happens when you schedule a specific quantity of an **Order** to be produced on a specific **Line** over a set date range.

---

## 3. Application Layout

The StitchFlow interface is a single-page dashboard divided into four main sections.

### 3.1. App Header (Control Panel)

This is your main command center, fixed at the top of the page.

*   **Quick Filters**: Quickly narrow down the "Available Orders" list by `Customer`, `OC #`, or a specific `ETD Date`.
*   **More Filters**: Opens a modal with advanced filtering options, including quantity range, order date, style, and status.
*   **Timeline Navigation**:
    *   **Month/Year Selector**: Click the date to open a calendar and jump to any month.
    *   **Prev/Next Month Buttons**: Use the arrow buttons to move the timeline view one month at a time.
    *   **Today Button**: Instantly resets the timeline to the current month.
*   **Action Buttons**:
    *   **Reset Data**: Restores all orders and assignments to their initial state.
    *   **Tentative Order**: Opens a modal to create a new placeholder order for planning purposes.
    *   **Auto-Plan**: Opens a powerful wizard to automatically schedule multiple orders based on available capacity.

### 3.2. Available Orders Section

This section displays all orders that have a remaining quantity to be scheduled (`qty.remaining > 0`).

*   **Draggable Order Cards**: Each card represents an order. If it has a remaining quantity, you can drag it onto a "Production Unit" card to start the assignment process.
*   **Card Details**: Shows key information like the order number, customer, style, total quantity, and remaining quantity.
*   **Tentative Orders**: Orders marked as `tentative` have a distinct dashed border, making them easy to identify.

### 3.3. Production Units Section

This horizontally scrollable section provides a high-level summary of each production unit's workload.

*   **Droppable Zone**: Each unit card is a drop zone. Drop an "Order Card" here to open the "Assign Order" modal.
*   **Unit Summary**: Displays the unit's name, its total assigned quantity, and its remaining capacity for the month.
*   **Assigned Orders List**: Shows a grouped list of all orders assigned to that unit.
    *   **Aggregated Quantity**: Displays the total quantity for each unique order number within that unit.
    *   **Unassign Button (X)**: Click the 'X' next to an order group to unassign **all** assignments for that order from that specific unit in a single action.

### 3.4. Production Line Timeline

This is the heart of StitchFlow—an interactive grid for visualizing and managing your production schedule.

*   **Sticky Headers**: The line details on the left and the day/date headers at the top remain visible as you scroll.
*   **Capacity Visualization**: The background of each line row features a color-coded chart showing daily capacity utilization. Hover over any day to see a detailed tooltip.
    *   **Green (0-70%)**: Low utilization.
    *   **Yellow (70-90%)**: Approaching capacity.
    *   **Red (90-100%)**: At or near capacity.
    *   **Dark Red (>100%)**: **Overbooked**. The system's validation prevents this, but the color is there for clarity.
*   **Assignment Bars**: These colored bars represent scheduled production runs.
    *   **Length**: The length of the bar corresponds to its start and end dates.
    *   **Label**: Displays the order number and quantity.
    *   **Draggable & Droppable**: You can drag these bars to reschedule them.
    *   **Unassign Button (X)**: Hover over an assignment to reveal an 'X' button. Click it to remove just that specific assignment from the timeline.
    *   **Stacking**: If multiple orders overlap on the same line, they are automatically stacked into separate tracks to prevent visual clutter.

---

## 4. How-To Guide: Core Functionality

### 4.1. Assigning an Order to a Line

1.  Find the desired order in the **Available Orders** section.
2.  Click and drag the **Order Card** onto one of the cards in the **Production Units** section.
3.  The **Assign Order Modal** will appear.
4.  Select a **start and end date** for the production run.
5.  Click **"Add Line"** to choose a specific production line from that unit. You can add multiple lines.
6.  Enter the **quantity** to be produced on each line. The system will automatically suggest a quantity based on the line's capacity and the order's remaining quantity.
7.  **Capacity Validation**: The system will **not** let you confirm the assignment if the quantity you enter exceeds the line's available capacity for **any single day** in the selected date range. You will receive a specific error message if this happens.
8.  Click **"Confirm Assignment"**. The new assignment will appear on the timeline.

### 4.2. Rescheduling an Assignment

1.  In the **Production Line Timeline**, find the assignment you want to move.
2.  Click and drag the assignment bar to a new date on either the same line or a different line.
3.  The **Move Assignment Modal** will appear, pre-filled with the move details.
4.  You can perform a **full move** or a **partial move (split)** by adjusting the "Quantity to Move".
5.  **Capacity Validation**: The system will block the move if the target location does not have sufficient capacity for the quantity you are trying to move.
6.  Click **"Confirm Move"**. The timeline will update with the new schedule.

### 4.3. Unassigning an Order

You have two ways to unassign an order:

*   **From the Timeline (Granular)**: Hover over any assignment bar on the timeline and click the **'X'** icon. This removes only that specific assignment.
*   **From the Unit Card (Bulk)**: In the "Production Units" section, find the order you want to remove from a unit and click the **'X'** icon next to its name. This removes **all** assignments for that order within that unit.

In both cases, the quantity is returned to the parent order, which will re-appear in the "Available Orders" section if it has a remaining quantity.

### 4.4. Using the Auto-Plan Wizard

1.  Click the **"Auto-Plan"** button in the header.
2.  **Step 1: Select Orders**: A modal will appear showing **all** available orders, regardless of current filters. Check the box next to each order you want to schedule.
3.  **Step 2: Configure Plan**:
    *   Review the quantities to assign for each selected order. You can adjust these if needed.
    *   Select the **planning period** (start and end dates) for the auto-scheduler to work within.
4.  Click **"Run Auto-Plan"**.
5.  **Smart Scheduling Logic**: The system will intelligently place each order by:
    *   Finding the least utilized production lines first.
    *   Searching for a continuous block of days with enough **daily capacity** for the order's production run.
    *   It will **never** assign an order if it violates the daily capacity on any line for any day.

The timeline will instantly update with all successfully planned assignments. If an order cannot be placed due to capacity constraints, you will be notified.
