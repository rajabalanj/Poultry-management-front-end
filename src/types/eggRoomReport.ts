// Types for Egg Room Report API
export interface EggRoomStockEntry {
  id?: number;
  date: string;
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

export interface EggRoomReportResponse {
  id: number;
  date: string;
  entries: EggRoomStockEntry[];
}

export interface EggRoomReportCreate {
  report_date: string;
  entries: Omit<EggRoomStockEntry, 'id'>[];
}

export interface EggRoomReportUpdate {
  entries: Partial<Omit<EggRoomStockEntry, 'id'>>[];
}
