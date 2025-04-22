// Mock data for feed mill stock
export interface Feed {
  id: number;
  name: string;
}

export interface FeedInComposition {
  feedId: number;
  weight: number;
}

export class Composition {
  id: number;
  name: string;
  feeds: FeedInComposition[];

  constructor(id: number, name: string, feeds: FeedInComposition[]) {
    this.id = id;
    this.name = name;
    this.feeds = feeds;
  }

  get totalWeight(): number {
    return this.feeds.reduce((sum, feed) => sum + feed.weight, 0);
  }
}

export const FEEDS: Feed[] = [
  { id: 1, name: 'Maize' },
  { id: 2, name: 'Corn' },
  { id: 3, name: 'DORB' },
  { id: 4, name: 'Rice' },
  { id: 5, name: 'Soybean Meal' },
  { id: 6, name: 'Sunflower Cake' },
  { id: 7, name: 'Groundnut Cake' },
  { id: 8, name: 'Fish Meal' },
  { id: 9, name: 'Salt' },
  { id: 10, name: 'Mineral Mix' },
  { id: 11, name: 'Limestone' },
  { id: 12, name: 'Wheat Bran' },
  // ...add more feeds as needed
];

export const COMPOSITIONS: Composition[] = [
  new Composition(1, 'Layer Starter', [
    { feedId: 5, weight: 20 },
    { feedId: 6, weight: 10 },
    { feedId: 9, weight: 2 },
    { feedId: 10, weight: 1 },
  ]),
  new Composition(2, 'Broiler Finisher', [
    { feedId: 7, weight: 15 },
    { feedId: 8, weight: 5 },
    { feedId: 11, weight: 3 },
    { feedId: 12, weight: 7 },
  ]),
  // ...add more compositions as needed
];

// Simulate async API
export const fetchFeeds = async (): Promise<Feed[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(FEEDS), 200));
};

export const fetchCompositions = async (): Promise<Composition[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(COMPOSITIONS), 200));
};

export const updateComposition = async (updatedComposition: Composition): Promise<Composition | undefined> => {
  const idx = COMPOSITIONS.findIndex(c => c.id === updatedComposition.id);
  if (idx !== -1) {
    COMPOSITIONS[idx] = new Composition(
      updatedComposition.id,
      updatedComposition.name,
      updatedComposition.feeds
    );
  }
  return new Promise((resolve) => setTimeout(() => resolve(COMPOSITIONS[idx]), 200));
};

export const addComposition = async (newComposition: Composition): Promise<Composition> => {
  COMPOSITIONS.push(newComposition);
  return new Promise((resolve) => setTimeout(() => resolve(newComposition), 200));
};

export const renameComposition = async (id: number, newName: string): Promise<Composition | undefined> => {
  const idx = COMPOSITIONS.findIndex(c => c.id === id);
  if (idx !== -1) {
    COMPOSITIONS[idx].name = newName;
  }
  return new Promise((resolve) => setTimeout(() => resolve(COMPOSITIONS[idx]), 200));
};
