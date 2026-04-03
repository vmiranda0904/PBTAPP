export type AthleteRecord = {
  id: string;
  name: string;
  position: string | null;
  score?: number | null;
  highlight_url?: string | null;
};

export type StatsRecord = {
  id?: string;
  athlete_id: string;
  spikes: number;
  sets: number;
  serves: number;
  errors: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
};
