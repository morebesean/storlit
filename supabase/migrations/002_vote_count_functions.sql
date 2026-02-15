-- vote_count 원자적 증가 (SECURITY DEFINER: RLS 우회하여 vote_count 업데이트)
CREATE OR REPLACE FUNCTION increment_vote_count(p_submission_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.submissions
  SET vote_count = vote_count + 1
  WHERE id = p_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- vote_count 원자적 감소
CREATE OR REPLACE FUNCTION decrement_vote_count(p_submission_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.submissions
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = p_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 라운드당 여러 제출 허용 (UNIQUE 제약 해제)
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_round_id_user_id_key;
