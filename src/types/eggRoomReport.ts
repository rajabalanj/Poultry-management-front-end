// Types for Egg Room Report API
export interface EggRoomStockEntry {
  // id?: number;
  report_date: string; // Changed from 'date' to 'report_date' for consistency
  table_opening: number;
  table_received: number;
  table_transfer: number;
  table_damage: number;
  table_out: number;
  table_in: number; // Added to match EggRoomStockEntry
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
  jumbo_out: number; // Added to match EggRoomStockEntry
  jumbo_closing: number;
}

// For single entry responses
export interface EggRoomSingleReportResponse extends EggRoomStockEntry {
  // 'report_date' is now inherited from EggRoomStockEntry, so no need to declare here.
  // If the API explicitly sends 'report_date' again, it will just match.
}

export interface EggRoomSummary {
  table_opening: number;
  jumbo_opening: number;
  grade_c_opening: number;
  table_closing: number;
  jumbo_closing: number;
  grade_c_closing: number;
  total_table_received: number;
  total_table_transfer: number;
  total_table_damage: number;
  total_table_out: number;
  total_table_in: number;
  total_jumbo_received: number;
  total_jumbo_transfer: number;
  total_jumbo_waste: number;
  total_jumbo_in: number;
  total_jumbo_out: number;
  total_grade_c_shed_received: number;
  total_grade_c_room_received: number;
  total_grade_c_transfer: number;
  total_grade_c_labour: number;
  total_grade_c_waste: number;
}

export interface EggRoomReportResponse {
  details: EggRoomStockEntry[];
  summary: EggRoomSummary;
}

export interface EggRoomReportCreate {
  report_date: string;
  table_opening: number;
  table_received: number;
  table_transfer: number;
  table_damage: number;
  table_out: number;
  table_in: number;
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
  jumbo_out: number;
  jumbo_closing: number;
}

export interface EggRoomReportUpdate {
  report_date: string; // Changed from 'date' to 'report_date'
  table_opening: number;
  table_received: number;
  table_transfer: number;
  table_damage: number;
  table_out: number;
  table_in: number;
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
  jumbo_out: number;

}