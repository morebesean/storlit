import { create } from 'zustand';

interface Submission {
  id: string;
  content: string;
  vote_count: number;
  user_id: string;
}

interface RoundStore {
  submissions: Submission[];
  myVoteIds: Set<string>;

  setSubmissions: (submissions: Submission[]) => void;
  setMyVotes: (voteIds: string[]) => void;
  toggleVoteOptimistic: (submissionId: string) => void;
}

export const useRoundStore = create<RoundStore>((set) => ({
  submissions: [],
  myVoteIds: new Set(),

  setSubmissions: (submissions) => set({ submissions }),
  setMyVotes: (voteIds) => set({ myVoteIds: new Set(voteIds) }),

  toggleVoteOptimistic: (submissionId) =>
    set((state) => {
      const newVoteIds = new Set(state.myVoteIds);
      const isVoted = newVoteIds.has(submissionId);

      if (isVoted) {
        newVoteIds.delete(submissionId);
      } else {
        newVoteIds.add(submissionId);
      }

      const newSubmissions = state.submissions.map((s) =>
        s.id === submissionId
          ? { ...s, vote_count: s.vote_count + (isVoted ? -1 : 1) }
          : s
      );

      return { myVoteIds: newVoteIds, submissions: newSubmissions };
    }),
}));
