// Types for Egg Room Report API
export interface EggRoomStockEntry {
  // id?: number;
  report_date: string; // Changed from 'date' to 'report_date' for consistency
  table_opening: number;
  table_received: number;
  table_transfer: number;
  table_damage: number;
  table_out: number;
  table_closing: number;
  grade_c_opening: number;
  grade_c_shed_received: number;
  grade_c_room_received: number;
  grade_c_transfer: number;
  grade_c_labour: number;
  grade_c_waste: number;
  grade_c_closing: number;
  jumbo_opening: number;
  jumbo_received: number;
  jumbo_transfer: number;
  jumbo_waste: number;
  jumbo_in: number;
  jumbo_closing: number;
}

// For single entry responses
export interface EggRoomSingleReportResponse extends EggRoomStockEntry {
  // 'report_date' is now inherited from EggRoomStockEntry, so no need to declare here.
  // If the API explicitly sends 'report_date' again, it will just match.
}

// For multiple entries (if needed)
export interface EggRoomReportResponse extends EggRoomStockEntry {
  // If this truly represents a single entry but with a different top-level structure for lists.
  // Given that getReports returns EggRoomReportResponse[], it implies it's a list of EggRoomStockEntry-like objects.
  // The 'entries?: never;' was problematic. If it's a list response wrapper:
  entries?: EggRoomStockEntry[]; // If this is for a response that wraps multiple entries.
}

export interface EggRoomReportCreate {
  report_date: string; // Changed from 'date' to 'report_date'
  // entries: EggRoomStockEntry[]; // Or single entry if that's what your API expects
}

export interface EggRoomReportUpdate {
  report_date: string; // Changed from 'date' to 'report_date'
  table_opening: number;
  table_received: number;
  table_transfer: number;
  table_damage: number;
  table_out: number;
  table_closing: number;
  grade_c_opening: number;
  grade_c_shed_received: number;
  grade_c_room_received: number;
  grade_c_transfer: number;
  grade_c_labour: number;
  grade_c_waste: number;
  grade_c_closing: number;
  jumbo_opening: number;
  jumbo_received: number;
  jumbo_transfer: number;
  jumbo_waste: number;
  jumbo_in: number;
  jumbo_closing: number;
}