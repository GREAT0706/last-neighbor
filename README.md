# 라스트 네이버

Last Neighbor에서 영감을 받은 공포 웹게임 (바닐라 JS, 단일 HTML).

## 실행
`LastNeighbor.html`을 브라우저로 열면 됩니다.

## 구조
- `LastNeighbor.html` — 완성본 (이미지·소리가 base64로 들어 있음, 빌드 결과물)
- `build.py` — `src/`를 합쳐 `LastNeighbor.html`을 만드는 빌드 스크립트
- `src/base.html` — 스테이지 1·2 기본 파일
- `src/stage3.js` — 스테이지 3 코드
- `src/assets/` — 이미지, 소리

## 빌드
```
python3 build.py
```
(Pillow 필요: `pip install pillow`)

## 스테이지
1. 자물쇠 따기 + 복도 확인 + 플래시
2. 문 4개, ← → 로 돌아보고 SPACE 연타로 문 막기 (90초)
3. 열쇠 5개 중 진짜 찾기 + 장롱에 숨어 ENTER 연타

## 설정
시작·사망 화면 오른쪽 위에서 난이도(쉬움/보통/어려움), 볼륨, 밝기를 바꿀 수 있어요. 설정은 브라우저에 저장됩니다. 난이도 값은 `build.py`의 `DIFF_PRESET`에 있어요.
