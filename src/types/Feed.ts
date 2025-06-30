export interface Feed {
  id?: number;
  title: string;
  quantity: number;
  unit: string;
  createdDate: string;
  warningKgThreshold?: number;
  warningTonThreshold?: number;
}

export interface FeedResponse {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  createdDate: string;
  warningKgThreshold?: number;
  warningTonThreshold?: number;
}