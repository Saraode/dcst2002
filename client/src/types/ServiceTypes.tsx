
export type Review = {
  id: number;
  text: string;
  stars: number;
  submitterName: string | null;
  userId: number;
  created_date: string;
};

export type Subject = {
  id: string;
  name: string;
  fieldid: number;
  levelId: number;
  review: Review[];
  level?: string;
  description: string;
  view_count: number;
};

export type Campus = {
  campusId: number;
  name: string;
};

export type Level = {
  id: number;
  name: string;
};

export type ChangeHistoryEntry = {
  version_number: number;
  timestamp: string;
  user_name: string;
  action_type: string;
};

// Define type for Field
export type Field = {
  id: number;
  name: string;
};

export type CampusListState = {
  showHistory: boolean;
};

export type SearchResult = {
  id: string;
  name: string;
};
