# EggRoomStock Component - User Manual

## View Report Section

The "View Report" section allows you to generate, view, and export reports based on egg room stock data within a specific date range.

### Features

1. **Date Selection**
   - **Start Date**: Select the beginning date for your report data
   - **End Date**: Select the ending date for your report data
   - The date picker includes month and year dropdowns for easy navigation
   - Dates are displayed in DD-MM-YYYY format

2. **Report Generation**
   - Click the "Get Report" button to fetch data for the selected date range
   - The button will show "Loading..." while processing your request
   - The button is disabled if:
     - Start date or end date is not selected
     - A report is currently loading
     - There's an error in the date range selection

3. **Export Options**
   - **Share as Image**: Generate and share the report as an image
     - Button shows "Generating..." while processing
     - Disabled when no report data is available
     - You can share specific egg types separately from their respective tabs
   - **Export to Excel**: Download the report data in Excel format
     - Disabled when no report data is available

### Report Sections

After generating a report, you'll see the data organized in the following tabs:

1. **Jumbo Eggs**
   - Displays statistics and information about jumbo-sized eggs
   - Includes visual representations like charts or graphs
   - Individual share button for jumbo eggs only

2. **Grade C Eggs**
   - Shows data for grade C eggs
   - Includes visual representations like charts or graphs
   - Individual share button for grade C eggs only

3. **Table View**
   - Presents all egg data in a tabular format
   - Allows for detailed comparison across different egg types
   - Can be shared as a complete table view

### How to Use

1. **Select Date Range**
   - Click on the "Start Date" field and select a date from the calendar
   - Click on the "End Date" field and select an end date
   - Note: The end date cannot be before the start date, and both dates must be valid

2. **Generate Report**
   - After selecting both dates, click the "Get Report" button
   - Wait for the report to load (button will show "Loading..." during this time)
   - The report will display below the controls once loaded

3. **Navigate Report Tabs**
   - Click on the desired tab (Jumbo, Grade C, or Table) to view specific data
   - Each tab contains its own visualization and data representation

4. **Export or Share**
   - Once the report is generated, you can:
     - Click "Share as Image" to generate an image of the current view
     - Use individual share buttons on specific tabs to share only that egg type
     - Click "Export to Excel" to download the data in Excel format
   - Each report tab (Jumbo, Grade C, Table) has its own share functionality

### Error Handling

- If you select an invalid date range (e.g., end date before start date), an error message will appear below the date fields
- The "Get Report" button will remain disabled until you correct the date range

### Tips

- The date picker allows you to navigate quickly through months and years using the dropdown menus
- For best performance, avoid selecting extremely large date ranges
- All export options require a report to be generated first
