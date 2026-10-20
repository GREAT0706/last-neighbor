# 라스트 네이버 (공포 웹게임)

- 사용자는 한국어를 씁니다. 답변도 한국어로, 쉽고 짧게.
- 결과물은 단일 HTML `LastNeighbor.html` (이미지·소리 base64 내장). 직접 고치지 말고 `src/`를 고친 뒤 `python3 build.py`로 다시 빌드합니다 (Pillow 필요).
- 스테이지 1·2 코드: `src/base.html` / 스테이지 3 코드: `src/stage3.js` (상단 `STAGE3` 객체에 난이도 값)
- 이미지: `src/assets/images/`, 소리: `src/assets/sounds/` (효과음은 build.py의 SOUND_DATA/SOUND_GAIN에 등록)
- 에셋(SOUND_DATA, 이미지 상수)은 메인 스크립트 뒤에 정의되므로 최상위 코드에서 쓰지 말고 함수 안에서만 참조.
- 16:9 화면에서는 이미지 좌우 약 12.5%가 잘리므로 클릭/아이템 위치는 가로 20~80% 안쪽에.
- 수정 후: 빌드 → 스크립트 문법 확인(node --check) → 가능하면 브라우저/jsdom으로 흐름 테스트.
- 커밋은 의미 있는 단위로, 사용자가 시킬 때 push.
