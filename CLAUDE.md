# 라스트 네이버 (공포 웹게임)

- 사용자는 한국어를 씁니다. 답변도 한국어로, 쉽고 짧게.
- 결과물은 단일 HTML `index.html` (이미지·소리 base64 내장). 직접 고치지 말고 `src/`를 고친 뒤 `python3 build.py`로 다시 빌드합니다 (Pillow 필요).
- 스테이지 1·2 코드: `src/base.html` / 스테이지 3 코드: `src/stage3.js` (상단 `STAGE3` 객체에 난이도 값)
- 이미지: `src/assets/images/`, 소리: `src/assets/sounds/` (효과음은 build.py의 SOUND_DATA/SOUND_GAIN에 등록)
- 에셋(SOUND_DATA, 이미지 상수)은 메인 스크립트 뒤에 정의되므로 최상위 코드에서 쓰지 말고 함수 안에서만 참조.
- 16:9 화면에서는 이미지 좌우 약 12.5%가 잘리므로 클릭/아이템 위치는 가로 20~80% 안쪽에.
- 수정 후: 빌드 → 스크립트 문법 확인(node --check) → 가능하면 브라우저/jsdom으로 흐름 테스트.
- 커밋은 의미 있는 단위로, 사용자가 시킬 때 push.

## 랭킹 시스템 (구글 폼 방식)
- 설정: `src/ranking_form.json` (form=formResponse 주소, csv=시트 웹 게시 CSV 주소, entry=칸 번호). 없으면 랭킹 UI 숨김.
- 기록 전송은 폼 POST(no-cors, 응답 못 읽음), 순위표는 게시된 CSV를 읽어 클라이언트에서 정렬·검증(너무 빠른 기록 제외). 시트 열 이름: 닉네임/난이도/시간ms/사망/단계/시간.
- 클라이언트 코드는 build.py 끝부분 ranking 블록. 기록은 클라 시간이라 조작 가능, CSV는 반영에 몇 분 걸림.
- `server/ranking.gs`는 예전 Apps Script 방식(현재 미사용).
- 테스트: 모의 서버(page.route)로 확인, 실제 구글은 샌드박스에서 접근 불가.
