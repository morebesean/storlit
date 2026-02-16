-- 스토리의 첫 번째 제시글을 저장하기 위한 seed_text 컬럼 추가
ALTER TABLE public.stories ADD COLUMN seed_text TEXT;

COMMENT ON COLUMN public.stories.seed_text IS '스토리의 첫 번째 제시글. 참여자들이 이 글을 읽고 이어서 작성한다.';
