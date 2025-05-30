export interface FeedInComposition {
  feedId: number;
  weight: number;
}

export interface CompositionResponse {
  id: number;
  name: string;
  feeds: FeedInComposition[];
}