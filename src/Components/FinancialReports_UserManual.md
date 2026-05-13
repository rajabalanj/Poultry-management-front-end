# FinancialReports Component - User Manual

## Financial Reports

The Financial Reports section allows you to generate, view, and analyze various financial reports for your poultry business. You can access different types of financial statements and ledgers through an intuitive tabbed interface.

### Features

1. **Report Selection**
   - Navigate between different financial reports using tabs
   - Available reports: Financial Summary, Profit & Loss, Balance Sheet, General Ledger, Purchase Ledger, Sales Ledger, and Inventory Ledger
   - On mobile devices, reports can be selected using a dropdown menu

2. **Date Selection**
   - **Date Range Selection**: For reports requiring date ranges (Financial Summary, Profit & Loss)
     - **Start Date**: Select the beginning date for your report data
     - **End Date**: Select the ending date for your report data
   - **Single Date Selection**: For reports requiring a specific date (Balance Sheet)
     - **As of Date**: Select the specific date for the balance sheet snapshot
   - The date picker includes month and year dropdowns for easy navigation
   - Dates are displayed in DD-MM-YYYY format

3. **Report Generation**
   - Click the respective "Get Report" button to fetch data for the selected date range
   - The button will show "Generating..." while processing your request
   - The button is disabled if:
     - Required dates are not selected
     - A report is currently loading
     - There's an error in the date range selection

### Report Sections

The Financial Reports component provides access to the following reports:

1. **Financial Summary**
   - Displays key financial metrics in a card-based layout
   - Includes information about egg production, sales, costs, and financial position
   - Shows metrics such as:
     - Eggs produced and sold
     - Cost per egg and selling price per egg
     - Net margin per egg
     - Cash balance, receivables, and payables

2. **Profit & Loss**
   - Shows the company's financial performance over a selected period
   - Displays revenue, cost of goods sold, gross profit, operating expenses, and net income
   - Includes a "View Details" link for operational expenses
   - Operational expenses can be viewed in a detailed modal with date, expense type, and amount

3. **Balance Sheet**
   - Presents the company's financial position as of a specific date
   - Shows assets (cash, accounts receivable, inventory)
   - Displays liabilities (accounts payable)
   - Includes total equity

4. **Ledger Reports**
   - **General Ledger**: View all financial transactions
   - **Purchase Ledger**: Track all purchase-related transactions
   - **Sales Ledger**: Monitor all sales transactions
   - **Inventory Ledger**: Review inventory-related transactions

### How to Use

1. **Select a Report Type**
   - Click on the desired tab (Financial Summary, Profit & Loss, Balance Sheet, or any Ledger) to view specific data
   - On mobile devices, use the dropdown menu to select a report type

2. **Select Date(s)**
   - For Financial Summary and Profit & Loss:
     - Click on the "Start Date" field and select a date from the calendar
     - Click on the "End Date" field and select an end date
   - For Balance Sheet:
     - Click on the "As of Date" field and select a specific date
   - Note: The end date cannot be before the start date, and all dates must be valid

3. **Generate Report**
   - After selecting the required date(s), click the respective "Get Report" button
   - Wait for the report to load (button will show "Generating..." during this time)
   - The report will display below the controls once loaded

4. **View Additional Details**
   - In the Profit & Loss report, click "View Details" next to Operating Expenses to see a breakdown
   - Use the modal to view detailed operational expense information
   - Close the modal when finished viewing

### Error Handling

- If you select an invalid date range (e.g., end date before start date), an error message will appear
- The "Get Report" button will remain disabled until you correct the date selection
- If there's an error fetching data, a notification will appear with details

### Tips

- The date picker allows you to navigate quickly through months and years using the dropdown menus
- For best performance, avoid selecting extremely large date ranges
- Your selected report type and date ranges are saved in session storage for convenience
- Each report type maintains its own date range settings
