export interface Feed {
  id?: number;
  title: string;
  quantity: number;
  unit: string;
  createdDate: string;
}

export interface FeedResponse {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  createdDate: string;
}