export interface Medicine {
  id?: number;
  title: string;
  quantity: number;
  unit: string;
  createdDate: string;
  warningKGThreshold?: number;
  warningGramThreshold?: number;
}

export interface MedicineResponse {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  createdDate: string;
  warningKGThreshold?: number;
  warningGramThreshold?: number;
}