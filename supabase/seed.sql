-- =============================================
-- Storlit 더미 데이터
-- 사용자 A: bf92e8d9-a720-4f85-91fa-8064c2600569
-- 사용자 B: c10aee06-87fc-4f0b-9b5d-daaab6e637da
--
-- 구성:
--   스토리 1 (22222...): 완성됨, 2일 전 (아카이브)
--   스토리 2 (33333...): 완성됨, 어제 (아카이브)
--   스토리 3 (11111...): 진행 중, 오늘 (홈 화면)
-- =============================================

-- seed_text 컬럼이 없으면 추가 (003 migration 미실행 시)
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS seed_text TEXT;

-- 기존 active 라운드를 모두 completed로 변경 (.single() 충돌 방지)
UPDATE public.rounds SET status = 'completed' WHERE status = 'active';

-- 기존 더미 데이터 정리 (재실행 시)
-- FK 순서: winning_submission_id NULL → votes → submissions → rounds → stories
UPDATE public.rounds SET winning_submission_id = NULL WHERE story_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
DELETE FROM public.votes WHERE submission_id IN (
  SELECT s.id FROM public.submissions s
  JOIN public.rounds r ON s.round_id = r.id
  WHERE r.story_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  )
);
DELETE FROM public.submissions WHERE round_id IN (
  SELECT id FROM public.rounds WHERE story_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  )
);
DELETE FROM public.rounds WHERE story_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
DELETE FROM public.stories WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- =============================================================================
-- 스토리 1: 완성됨 (2일 전) — 아카이브용
-- =============================================================================

INSERT INTO public.stories (id, title, genre, status, total_rounds, seed_text, started_at, completed_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '깊은 숲속의 우체통',
  '미스터리',
  'completed',
  13,
  '아무도 오지 않는 숲속 오솔길 끝에 빨간 우체통이 하나 서 있었다. 우체부도, 집배원도 없는 이곳에 누가 편지를 넣는 것일까. 오늘도 우체통 안에는 누군가의 편지가 들어 있었다.',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '14 hours'
);

-- 13개 완료 라운드
INSERT INTO public.rounds (id, story_id, round_number, started_at, ends_at, status) VALUES
  ('aa010001-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1,  NOW() - INTERVAL '2 days',               NOW() - INTERVAL '2 days' + INTERVAL '1 hour',  'completed'),
  ('aa010000-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 2,  NOW() - INTERVAL '2 days' + INTERVAL '1 hour',  NOW() - INTERVAL '2 days' + INTERVAL '2 hours', 'completed'),
  ('aa010000-0003-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 3,  NOW() - INTERVAL '2 days' + INTERVAL '2 hours', NOW() - INTERVAL '2 days' + INTERVAL '3 hours', 'completed'),
  ('aa010000-0004-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 4,  NOW() - INTERVAL '2 days' + INTERVAL '3 hours', NOW() - INTERVAL '2 days' + INTERVAL '4 hours', 'completed'),
  ('aa010000-0005-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 5,  NOW() - INTERVAL '2 days' + INTERVAL '4 hours', NOW() - INTERVAL '2 days' + INTERVAL '5 hours', 'completed'),
  ('aa010000-0006-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 6,  NOW() - INTERVAL '2 days' + INTERVAL '5 hours', NOW() - INTERVAL '2 days' + INTERVAL '6 hours', 'completed'),
  ('aa010000-0007-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 7,  NOW() - INTERVAL '2 days' + INTERVAL '6 hours', NOW() - INTERVAL '2 days' + INTERVAL '7 hours', 'completed'),
  ('aa010000-0008-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 8,  NOW() - INTERVAL '2 days' + INTERVAL '7 hours', NOW() - INTERVAL '2 days' + INTERVAL '8 hours', 'completed'),
  ('aa010000-0009-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 9,  NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '9 hours', 'completed'),
  ('aa010000-0010-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 10, NOW() - INTERVAL '2 days' + INTERVAL '9 hours', NOW() - INTERVAL '2 days' + INTERVAL '10 hours', 'completed'),
  ('aa010000-0011-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 11, NOW() - INTERVAL '2 days' + INTERVAL '10 hours', NOW() - INTERVAL '2 days' + INTERVAL '11 hours', 'completed'),
  ('aa010000-0012-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 12, NOW() - INTERVAL '2 days' + INTERVAL '11 hours', NOW() - INTERVAL '2 days' + INTERVAL '12 hours', 'completed'),
  ('aa010000-0013-0000-0000-000000000013', '22222222-2222-2222-2222-222222222222', 13, NOW() - INTERVAL '2 days' + INTERVAL '12 hours', NOW() - INTERVAL '2 days' + INTERVAL '13 hours', 'completed');

-- 13개 채택작
INSERT INTO public.submissions (id, round_id, user_id, content, vote_count, created_at) VALUES
  ('bb010000-0001-0000-0000-000000000001', 'aa010001-0001-0000-0000-000000000001', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '편지를 꺼내 펼치자 잉크 냄새가 코끝을 찔렀다. "나를 기억하는 사람에게. 이 편지가 도착했다면, 당신은 이미 숲의 일부입니다."', 18, NOW() - INTERVAL '47 hours'),
  ('bb010000-0002-0000-0000-000000000002', 'aa010000-0002-0000-0000-000000000002', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '나뭇잎 사이로 바람이 불었다. 편지지가 손에서 날아가 우체통 위에 내려앉았다. 그 순간 우체통이 미세하게 흔들리더니, 안에서 종소리가 울렸다.', 22, NOW() - INTERVAL '46 hours'),
  ('bb010000-0003-0000-0000-000000000003', 'aa010000-0003-0000-0000-000000000003', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '우체통의 뚜껑이 스스로 열렸다. 안쪽은 보통 우체통이 아니었다. 끝이 보이지 않는 깊은 통로가 아래로 뻗어 있었고, 희미한 푸른 빛이 올라왔다.', 15, NOW() - INTERVAL '45 hours'),
  ('bb010000-0004-0000-0000-000000000004', 'aa010000-0004-0000-0000-000000000004', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '용기를 내어 우체통 안으로 손을 넣었다. 차가운 금속 대신 따뜻한 바람이 손끝을 감쌌다. 눈을 감자 발밑의 땅이 사라지는 느낌이 들었다.', 20, NOW() - INTERVAL '44 hours'),
  ('bb010000-0005-0000-0000-000000000005', 'aa010000-0005-0000-0000-000000000005', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '눈을 떴을 때, 그곳은 편지들로 가득한 방이었다. 벽도, 천장도, 바닥도 모두 편지 봉투로 이루어져 있었다. 각 편지에서 속삭이는 목소리가 들렸다.', 17, NOW() - INTERVAL '43 hours'),
  ('bb010000-0006-0000-0000-000000000006', 'aa010000-0006-0000-0000-000000000006', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '"보내지 못한 편지들의 무덤입니다." 뒤에서 목소리가 들렸다. 소녀가 서 있었다. 하얀 원피스에 맨발, 그리고 손에는 만년필 한 자루.', 24, NOW() - INTERVAL '42 hours'),
  ('bb010000-0007-0000-0000-000000000007', 'aa010000-0007-0000-0000-000000000007', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '"이 편지들을 전달해야 해요." 소녀가 만년필을 건넸다. "이 펜으로 받는 사람의 이름을 쓰면, 편지가 전달됩니다. 하지만 하나만 기억하세요—"', 19, NOW() - INTERVAL '41 hours'),
  ('bb010000-0008-0000-0000-000000000008', 'aa010000-0008-0000-0000-000000000008', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '"이름을 쓸 때마다, 당신의 기억 하나가 사라집니다." 소녀의 눈이 슬프게 빛났다. "저도 그렇게 이름을 잃었거든요."', 21, NOW() - INTERVAL '40 hours'),
  ('bb010000-0009-0000-0000-000000000009', 'aa010000-0009-0000-0000-000000000009', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '첫 번째 편지를 집어 들었다. 누렇게 바랜 봉투에 "어머니에게"라고 적혀 있었다. 펜을 들자 갑자기 어린 시절의 기억이 떠올랐다. 아직은 잃고 싶지 않은 기억이었다.', 16, NOW() - INTERVAL '39 hours'),
  ('bb010000-0010-0000-0000-000000000010', 'aa010000-0010-0000-0000-000000000010', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '그래도 이름을 적었다. 편지가 빛나며 손에서 날아올랐다. 동시에 머릿속에서 무언가가 희미해졌다. 하지만 편지 속의 누군가는 이 말을 듣게 될 것이다.', 23, NOW() - INTERVAL '38 hours'),
  ('bb010000-0011-0000-0000-000000000011', 'aa010000-0011-0000-0000-000000000011', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '열 번째 편지를 보냈을 때, 더 이상 자신의 이름이 기억나지 않았다. 하지만 이상하게도 후회는 없었다. 편지들이 전해질 때마다 방 안의 빛이 밝아졌으니까.', 25, NOW() - INTERVAL '37 hours'),
  ('bb010000-0012-0000-0000-000000000012', 'aa010000-0012-0000-0000-000000000012', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '"마지막 편지입니다." 소녀가 빈 봉투를 내밀었다. "이건 당신이 직접 써야 해요. 당신이 가장 전하고 싶은 말을." 펜이 손에서 떨렸다.', 20, NOW() - INTERVAL '36 hours'),
  ('bb010000-0013-0000-0000-000000000013', 'aa010000-0013-0000-0000-000000000013', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '빈 편지지 위에 천천히 적었다. "나를 기억하는 사람에게. 나는 이름을 잃었지만, 당신의 이야기를 전했습니다." 편지가 날아오르자, 숲속 우체통이 마지막으로 한 번 울렸다.', 28, NOW() - INTERVAL '35 hours');

-- winning_submission_id 설정
UPDATE public.rounds SET winning_submission_id = 'bb010000-0001-0000-0000-000000000001' WHERE id = 'aa010001-0001-0000-0000-000000000001';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0002-0000-0000-000000000002' WHERE id = 'aa010000-0002-0000-0000-000000000002';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0003-0000-0000-000000000003' WHERE id = 'aa010000-0003-0000-0000-000000000003';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0004-0000-0000-000000000004' WHERE id = 'aa010000-0004-0000-0000-000000000004';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0005-0000-0000-000000000005' WHERE id = 'aa010000-0005-0000-0000-000000000005';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0006-0000-0000-000000000006' WHERE id = 'aa010000-0006-0000-0000-000000000006';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0007-0000-0000-000000000007' WHERE id = 'aa010000-0007-0000-0000-000000000007';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0008-0000-0000-000000000008' WHERE id = 'aa010000-0008-0000-0000-000000000008';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0009-0000-0000-000000000009' WHERE id = 'aa010000-0009-0000-0000-000000000009';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0010-0000-0000-000000000010' WHERE id = 'aa010000-0010-0000-0000-000000000010';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0011-0000-0000-000000000011' WHERE id = 'aa010000-0011-0000-0000-000000000011';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0012-0000-0000-000000000012' WHERE id = 'aa010000-0012-0000-0000-000000000012';
UPDATE public.rounds SET winning_submission_id = 'bb010000-0013-0000-0000-000000000013' WHERE id = 'aa010000-0013-0000-0000-000000000013';


-- =============================================================================
-- 스토리 2: 완성됨 (어제) — 아카이브용
-- =============================================================================

INSERT INTO public.stories (id, title, genre, status, total_rounds, seed_text, started_at, completed_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '마지막 열차의 승객들',
  'SF',
  'completed',
  13,
  '자정이 지난 플랫폼에 열차 한 대가 멈춰 섰다. 시간표에 없는 열차였다. 문이 열리자 안에는 한 명의 승객도 없었다. 하지만 좌석마다 누군가 앉아 있었던 흔적—아직 따뜻한 커피 잔, 펼쳐진 책, 반쯤 뜬 노트북—이 남아 있었다.',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '14 hours'
);

-- 13개 완료 라운드
INSERT INTO public.rounds (id, story_id, round_number, started_at, ends_at, status) VALUES
  ('aa020000-0001-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 1,  NOW() - INTERVAL '1 day',               NOW() - INTERVAL '1 day' + INTERVAL '1 hour',  'completed'),
  ('aa020000-0002-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 2,  NOW() - INTERVAL '1 day' + INTERVAL '1 hour',  NOW() - INTERVAL '1 day' + INTERVAL '2 hours', 'completed'),
  ('aa020000-0003-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 3,  NOW() - INTERVAL '1 day' + INTERVAL '2 hours', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', 'completed'),
  ('aa020000-0004-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 4,  NOW() - INTERVAL '1 day' + INTERVAL '3 hours', NOW() - INTERVAL '1 day' + INTERVAL '4 hours', 'completed'),
  ('aa020000-0005-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 5,  NOW() - INTERVAL '1 day' + INTERVAL '4 hours', NOW() - INTERVAL '1 day' + INTERVAL '5 hours', 'completed'),
  ('aa020000-0006-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 6,  NOW() - INTERVAL '1 day' + INTERVAL '5 hours', NOW() - INTERVAL '1 day' + INTERVAL '6 hours', 'completed'),
  ('aa020000-0007-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', 7,  NOW() - INTERVAL '1 day' + INTERVAL '6 hours', NOW() - INTERVAL '1 day' + INTERVAL '7 hours', 'completed'),
  ('aa020000-0008-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 8,  NOW() - INTERVAL '1 day' + INTERVAL '7 hours', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', 'completed'),
  ('aa020000-0009-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', 9,  NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '9 hours', 'completed'),
  ('aa020000-0010-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 10, NOW() - INTERVAL '1 day' + INTERVAL '9 hours', NOW() - INTERVAL '1 day' + INTERVAL '10 hours', 'completed'),
  ('aa020000-0011-0000-0000-000000000011', '33333333-3333-3333-3333-333333333333', 11, NOW() - INTERVAL '1 day' + INTERVAL '10 hours', NOW() - INTERVAL '1 day' + INTERVAL '11 hours', 'completed'),
  ('aa020000-0012-0000-0000-000000000012', '33333333-3333-3333-3333-333333333333', 12, NOW() - INTERVAL '1 day' + INTERVAL '11 hours', NOW() - INTERVAL '1 day' + INTERVAL '12 hours', 'completed'),
  ('aa020000-0013-0000-0000-000000000013', '33333333-3333-3333-3333-333333333333', 13, NOW() - INTERVAL '1 day' + INTERVAL '12 hours', NOW() - INTERVAL '1 day' + INTERVAL '13 hours', 'completed');

-- 13개 채택작
INSERT INTO public.submissions (id, round_id, user_id, content, vote_count, created_at) VALUES
  ('bb020000-0001-0000-0000-000000000001', 'aa020000-0001-0000-0000-000000000001', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '플랫폼에 서 있던 나는 열차에 올라탔다. 3번 좌석의 커피를 만졌다. 뜨거웠다. 방금 전까지 누군가 여기 있었다는 뜻이다. 그런데 창밖을 보니, 플랫폼이 사라지고 있었다.', 14, NOW() - INTERVAL '23 hours'),
  ('bb020000-0002-0000-0000-000000000002', 'aa020000-0002-0000-0000-000000000002', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '열차가 움직이기 시작했다. 나는 탑승 버튼을 누른 적이 없다. 차장실 문이 열려 있었고, 그 안에는 누군가의 목소리가 녹음된 레코더가 반복 재생되고 있었다.', 19, NOW() - INTERVAL '22 hours'),
  ('bb020000-0003-0000-0000-000000000003', 'aa020000-0003-0000-0000-000000000003', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '"다음 정차역은 기억입니다." 스피커에서 자동 안내 음성이 흘러나왔다. 창밖에는 수천 개의 사진이 바람에 날리고 있었다. 모두 낯선데 어딘가 익숙한 얼굴들이었다.', 16, NOW() - INTERVAL '21 hours'),
  ('bb020000-0004-0000-0000-000000000004', 'aa020000-0004-0000-0000-000000000004', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '열차가 멈추자 7번 좌석에 앉아 있던 노트북이 스스로 켜졌다. 화면에는 타이핑이 진행되고 있었다. "도움이 필요합니다. 우리는 아직 여기 있습니다."', 21, NOW() - INTERVAL '20 hours'),
  ('bb020000-0005-0000-0000-000000000005', 'aa020000-0005-0000-0000-000000000005', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '노트북에 답을 타이핑했다. "당신들은 누구입니까?" 잠시 후 답이 왔다. "우리는 이 열차의 이전 승객들입니다. 우리는 내리지 못했습니다."', 18, NOW() - INTERVAL '19 hours'),
  ('bb020000-0006-0000-0000-000000000006', 'aa020000-0006-0000-0000-000000000006', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '열차의 끝 칸으로 걸어갔다. 마지막 문 너머에는 거대한 시계가 있었다. 바늘이 거꾸로 돌고 있었다. 시계 아래에 "출구"라고 적힌 표지판이 깜빡이고 있었다.', 15, NOW() - INTERVAL '18 hours'),
  ('bb020000-0007-0000-0000-000000000007', 'aa020000-0007-0000-0000-000000000007', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '시계 바늘을 정방향으로 돌리자 열차가 진동했다. 좌석마다 희미한 형체들이 나타났다. 투명한 승객들이 각자의 자리에 앉아 서로를 바라보고 있었다.', 20, NOW() - INTERVAL '17 hours'),
  ('bb020000-0008-0000-0000-000000000008', 'aa020000-0008-0000-0000-000000000008', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '한 형체가 다가와 손을 내밀었다. 잡는 순간 기억이 밀려왔다. 이 사람의 삶이, 웃음이, 눈물이 머릿속에 스며들었다. 그 사람의 이름이 기억났다.', 17, NOW() - INTERVAL '16 hours'),
  ('bb020000-0009-0000-0000-000000000009', 'aa020000-0009-0000-0000-000000000009', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '한 명씩 이름을 불러주었다. 이름이 불릴 때마다 형체에 색이 돌아왔다. 사라졌던 승객들이 다시 실체를 얻었다. 열차 안이 사람들의 온기로 채워졌다.', 22, NOW() - INTERVAL '15 hours'),
  ('bb020000-0010-0000-0000-000000000010', 'aa020000-0010-0000-0000-000000000010', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '"다음 정차역은 현실입니다." 안내 음성이 다시 울렸다. 이번에는 따뜻한 목소리였다. 창밖에 도시의 불빛이 보이기 시작했다.', 19, NOW() - INTERVAL '14 hours'),
  ('bb020000-0011-0000-0000-000000000011', 'aa020000-0011-0000-0000-000000000011', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '열차가 멈추자 문이 열렸다. 승객들이 하나씩 내렸다. 각자 돌아갈 곳이 있는 사람들이었다. 마지막으로 내리려는 순간, 소녀가 말했다. "고마워요."', 24, NOW() - INTERVAL '13 hours'),
  ('bb020000-0012-0000-0000-000000000012', 'aa020000-0012-0000-0000-000000000012', 'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '플랫폼에 발을 디딘 순간, 열차가 사라졌다. 자정이 지난 텅 빈 역. 하지만 주머니에서 종이 한 장이 만져졌다. 승객들의 이름이 빼곡히 적힌 명단이었다.', 18, NOW() - INTERVAL '12 hours'),
  ('bb020000-0013-0000-0000-000000000013', 'aa020000-0013-0000-0000-000000000013', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '며칠 후 뉴스에서 기이한 소식을 접했다. 실종 신고된 사람들이 동시에 자신의 집으로 돌아왔다는 것이다. 아무도 무슨 일이 있었는지 기억하지 못했다. 하지만 모두 같은 말을 했다. "누군가 내 이름을 불러주었어요."', 27, NOW() - INTERVAL '11 hours');

-- winning_submission_id 설정
UPDATE public.rounds SET winning_submission_id = 'bb020000-0001-0000-0000-000000000001' WHERE id = 'aa020000-0001-0000-0000-000000000001';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0002-0000-0000-000000000002' WHERE id = 'aa020000-0002-0000-0000-000000000002';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0003-0000-0000-000000000003' WHERE id = 'aa020000-0003-0000-0000-000000000003';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0004-0000-0000-000000000004' WHERE id = 'aa020000-0004-0000-0000-000000000004';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0005-0000-0000-000000000005' WHERE id = 'aa020000-0005-0000-0000-000000000005';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0006-0000-0000-000000000006' WHERE id = 'aa020000-0006-0000-0000-000000000006';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0007-0000-0000-000000000007' WHERE id = 'aa020000-0007-0000-0000-000000000007';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0008-0000-0000-000000000008' WHERE id = 'aa020000-0008-0000-0000-000000000008';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0009-0000-0000-000000000009' WHERE id = 'aa020000-0009-0000-0000-000000000009';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0010-0000-0000-000000000010' WHERE id = 'aa020000-0010-0000-0000-000000000010';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0011-0000-0000-000000000011' WHERE id = 'aa020000-0011-0000-0000-000000000011';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0012-0000-0000-000000000012' WHERE id = 'aa020000-0012-0000-0000-000000000012';
UPDATE public.rounds SET winning_submission_id = 'bb020000-0013-0000-0000-000000000013' WHERE id = 'aa020000-0013-0000-0000-000000000013';


-- =============================================================================
-- 스토리 3: 진행 중 (오늘) — 홈 화면용
-- =============================================================================

INSERT INTO public.stories (id, title, genre, status, total_rounds, seed_text)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '낡은 서점의 비밀',
  '판타지',
  'in_progress',
  13,
  '어두운 밤, 낡은 서점의 문이 삐걱거리며 열렸다. 먼지 냄새와 함께 오래된 종이 향이 코끝을 스쳤다. 누군가 이곳에 숨겨둔 이야기가 있다는 소문을 듣고 찾아온 것이다.'
);

-- 완료된 라운드 10개 + 현재 active 라운드 1개
INSERT INTO public.rounds (id, story_id, round_number, started_at, ends_at, status) VALUES
  ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 1,  NOW() - INTERVAL '11 hours', NOW() - INTERVAL '10 hours', 'completed'),
  ('aaaa0002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 2,  NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours',  'completed'),
  ('aaaa0003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 3,  NOW() - INTERVAL '9 hours',  NOW() - INTERVAL '8 hours',  'completed'),
  ('aaaa0004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 4,  NOW() - INTERVAL '8 hours',  NOW() - INTERVAL '7 hours',  'completed'),
  ('aaaa0005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 5,  NOW() - INTERVAL '7 hours',  NOW() - INTERVAL '6 hours',  'completed'),
  ('aaaa0006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 6,  NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '5 hours',  'completed'),
  ('aaaa0007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 7,  NOW() - INTERVAL '5 hours',  NOW() - INTERVAL '4 hours',  'completed'),
  ('aaaa0008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 8,  NOW() - INTERVAL '4 hours',  NOW() - INTERVAL '3 hours',  'completed'),
  ('aaaa0009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 9,  NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '2 hours',  'completed'),
  ('aaaa0010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 10, NOW() - INTERVAL '2 hours',  NOW() - INTERVAL '1 hour',   'completed');

-- 현재 active 라운드 11 (1시간 후 종료)
INSERT INTO public.rounds (id, story_id, round_number, started_at, ends_at, status)
VALUES (
  'aaaa0011-0000-0000-0000-000000000011',
  '11111111-1111-1111-1111-111111111111',
  11,
  NOW(),
  NOW() + INTERVAL '1 hour',
  'active'
);

-- 채택작 (라운드 1~10)
INSERT INTO public.submissions (id, round_id, user_id, content, vote_count, created_at) VALUES
  ('bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
   'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '서점 주인은 안경 너머로 낯선 손님을 바라보았다. "찾는 게 있으신가요?" 그의 목소리는 마치 오래된 책장을 넘기는 소리처럼 바스락거렸다.',
   15, NOW() - INTERVAL '10 hours 30 minutes'),
  ('bbbb0002-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000002',
   'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '그녀는 서점 구석에 놓인 낡은 일기장을 발견했다. 표지에는 금색 글씨로 "이것을 읽는 자에게"라고 적혀 있었다. 손가락이 떨리며 첫 페이지를 펼쳤다.',
   22, NOW() - INTERVAL '9 hours 30 minutes'),
  ('bbbb0003-0000-0000-0000-000000000003', 'aaaa0003-0000-0000-0000-000000000003',
   'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '일기장의 글씨가 눈앞에서 빛나기 시작했다. 글자들이 종이에서 떠올라 공중에서 춤을 추었다. 서점의 모든 책이 동시에 펄럭이며 바람이 불었다.',
   18, NOW() - INTERVAL '8 hours 30 minutes'),
  ('bbbb0004-0000-0000-0000-000000000004', 'aaaa0004-0000-0000-0000-000000000004',
   'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '빛이 사라지자, 서점은 더 이상 서점이 아니었다. 끝없이 펼쳐진 도서관이 그녀 앞에 나타났다. 천장은 보이지 않을 만큼 높았고, 책장은 하늘까지 뻗어 있었다.',
   25, NOW() - INTERVAL '7 hours 30 minutes'),
  ('bbbb0005-0000-0000-0000-000000000005', 'aaaa0005-0000-0000-0000-000000000005',
   'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '"환영합니다, 이야기의 수호자여." 어둠 속에서 목소리가 울려 퍼졌다. 은빛 여우 한 마리가 책장 사이에서 모습을 드러냈다. 꼬리 끝이 잉크처럼 번지고 있었다.',
   20, NOW() - INTERVAL '6 hours 30 minutes'),
  ('bbbb0006-0000-0000-0000-000000000006', 'aaaa0006-0000-0000-0000-000000000006',
   'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '여우가 안내한 곳에는 빈 책 한 권이 놓여 있었다. "이 책에 이야기를 채워야 합니다. 그래야 이 세계가 무너지지 않습니다." 페이지를 펼치자 바람이 불어왔다.',
   17, NOW() - INTERVAL '5 hours 30 minutes'),
  ('bbbb0007-0000-0000-0000-000000000007', 'aaaa0007-0000-0000-0000-000000000007',
   'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '그녀가 첫 문장을 쓰자 도서관이 흔들렸다. 글자가 종이 위에서 살아 움직이며 작은 세계를 만들어냈다. 미니어처 같은 마을이 책 위에 피어올랐다.',
   23, NOW() - INTERVAL '4 hours 30 minutes'),
  ('bbbb0008-0000-0000-0000-000000000008', 'aaaa0008-0000-0000-0000-000000000008',
   'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '하지만 마을에 어둠이 밀려들었다. 검은 잉크가 페이지 모서리부터 번지기 시작했다. "이야기를 삼키는 자가 깨어났습니다." 여우의 목소리가 떨렸다.',
   19, NOW() - INTERVAL '3 hours 30 minutes'),
  ('bbbb0009-0000-0000-0000-000000000009', 'aaaa0009-0000-0000-0000-000000000009',
   'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '검은 잉크 속에서 거대한 형체가 일어섰다. 눈도 없고 입도 없었지만, 모든 이야기를 집어삼킬 수 있는 존재였다. 도서관의 책들이 하나씩 빛을 잃어갔다.',
   21, NOW() - INTERVAL '2 hours 30 minutes'),
  ('bbbb0010-0000-0000-0000-000000000010', 'aaaa0010-0000-0000-0000-000000000010',
   'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '그녀는 펜을 꽉 쥐었다. "이야기는 끝나지 않아." 손끝에서 빛이 피어올랐다. 빈 책의 페이지가 스스로 펄럭이며, 아직 쓰이지 않은 무한한 가능성을 보여주었다.',
   26, NOW() - INTERVAL '1 hours 30 minutes');

-- winning_submission_id 설정
UPDATE public.rounds SET winning_submission_id = 'bbbb0001-0000-0000-0000-000000000001' WHERE id = 'aaaa0001-0000-0000-0000-000000000001';
UPDATE public.rounds SET winning_submission_id = 'bbbb0002-0000-0000-0000-000000000002' WHERE id = 'aaaa0002-0000-0000-0000-000000000002';
UPDATE public.rounds SET winning_submission_id = 'bbbb0003-0000-0000-0000-000000000003' WHERE id = 'aaaa0003-0000-0000-0000-000000000003';
UPDATE public.rounds SET winning_submission_id = 'bbbb0004-0000-0000-0000-000000000004' WHERE id = 'aaaa0004-0000-0000-0000-000000000004';
UPDATE public.rounds SET winning_submission_id = 'bbbb0005-0000-0000-0000-000000000005' WHERE id = 'aaaa0005-0000-0000-0000-000000000005';
UPDATE public.rounds SET winning_submission_id = 'bbbb0006-0000-0000-0000-000000000006' WHERE id = 'aaaa0006-0000-0000-0000-000000000006';
UPDATE public.rounds SET winning_submission_id = 'bbbb0007-0000-0000-0000-000000000007' WHERE id = 'aaaa0007-0000-0000-0000-000000000007';
UPDATE public.rounds SET winning_submission_id = 'bbbb0008-0000-0000-0000-000000000008' WHERE id = 'aaaa0008-0000-0000-0000-000000000008';
UPDATE public.rounds SET winning_submission_id = 'bbbb0009-0000-0000-0000-000000000009' WHERE id = 'aaaa0009-0000-0000-0000-000000000009';
UPDATE public.rounds SET winning_submission_id = 'bbbb0010-0000-0000-0000-000000000010' WHERE id = 'aaaa0010-0000-0000-0000-000000000010';

-- 현재 라운드(11)에 제출글 2개
INSERT INTO public.submissions (id, round_id, user_id, content, vote_count, created_at) VALUES
  ('dddd0001-0000-0000-0000-000000000001', 'aaaa0011-0000-0000-0000-000000000011',
   'bf92e8d9-a720-4f85-91fa-8064c2600569',
   '키 큰 인물이 서점 문 앞에 섰다. 무지갯빛 넝마를 걸친 채, 어둠 속 조명을 흡수하는 것 같았다. "그 일기장을 내려놓으시오." 낮고 단호한 목소리가 울렸다.',
   12, NOW() - INTERVAL '45 minutes'),
  ('dddd0002-0000-0000-0000-000000000002', 'aaaa0011-0000-0000-0000-000000000011',
   'c10aee06-87fc-4f0b-9b5d-daaab6e637da',
   '냉각수에서 아이 같은 형체가 떠올랐다. 투명한 눈동자가 그녀를 바라보며 속삭였다. "이 이야기는 끝나지 않아. 네가 마지막 페이지를 쓸 때까지."',
   9, NOW() - INTERVAL '38 minutes');

-- 투표 데이터
INSERT INTO public.votes (submission_id, user_id) VALUES
  ('dddd0001-0000-0000-0000-000000000001', 'c10aee06-87fc-4f0b-9b5d-daaab6e637da'),
  ('dddd0002-0000-0000-0000-000000000002', 'bf92e8d9-a720-4f85-91fa-8064c2600569');
