export interface BovansPerformance {
  age_weeks: number;
  livability_percent: number;
  lay_percent: number;
  eggs_per_bird_cum: number;
  feed_intake_per_day_g: number;
  feed_intake_cum_kg: number;
  body_weight_g: number;
}

export interface PaginatedBovansPerformanceResponse {
  data: BovansPerformance[];
  total_count: number;
}