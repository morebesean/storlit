export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  genre: string | null;
  status: 'in_progress' | 'completed';
  total_rounds: number;
  seed_text: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Round {
  id: string;
  story_id: string;
  round_number: number;
  started_at: string;
  ends_at: string;
  status: 'active' | 'voting' | 'completed';
  winning_submission_id: string | null;
}

export interface Submission {
  id: string;
  round_id: string;
  user_id: string;
  content: string;
  vote_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  submission_id: string;
  user_id: string;
  created_at: string;
}
