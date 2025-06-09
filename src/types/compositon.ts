export interface FeedInComposition {
  feed_id: number;
  weight: number;
}

export interface CompositionResponse {
  id: number;
  name: string;
  feeds: FeedInComposition[];
}