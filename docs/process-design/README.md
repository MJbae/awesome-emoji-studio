# 프로세스별 디자인 비교

[비교 갤러리 열기](index.html) — 단계, 웹/모바일, 변경 전/후를 선택하고 이미지를 확대할 수 있습니다. PNG는 스크롤을 포함한 전체 페이지입니다.

오프라인 ZIP에는 갤러리·원본 스크린샷·비교 이미지·기록이 포함됩니다. 모의 그림 생성 스크립트와 처리 산출물은 프로젝트 폴더에서 확인할 수 있습니다.

## 캡처 조건

- 원본: `3a4eb67`의 별도 worktree. 변경 후: 현재 작업 트리의 실제 화면.
- 웹: 1440×1000px. 모바일: 390×844px의 반응형 브라우저 화면. 실제 모바일 기기 촬영은 아닙니다.
- 한국어 UI. 같은 ‘퇴근요정 귤리’ 컨셉과 참고 이미지, 45개 모의 이모지, 한국어·영어 각각 3개의 메타데이터 안을 사용했습니다.
- Gemini HTTP 응답만 모의 데이터로 대체했습니다. 화면은 실제 앱을 버튼·입력으로 진행해 캡처했습니다. 강제 단계 이동이나 store 값 변경은 없습니다.
- 이미지 후처리와 6개 플랫폼용 ZIP 생성은 실제 구현으로 실행했습니다. 처리한 이미지 45개, 메타데이터 6안, ZIP 파일 284개 항목을 확인했고 원본·변경본의 산출물 데이터 해시가 일치합니다.
- 실제 Gemini 생성 결과나 API 연동 성공을 증명하는 자료가 아닙니다. 캡처에 표시되는 API 연결은 테스트용 가짜 키를 모의 검증한 상태입니다.

## 주요 프로세스 비교 이미지

각 이미지는 왼쪽이 변경 전, 오른쪽이 변경 후입니다. 웹 이미지는 원래 해상도에 가깝게 배치했고, 긴 모바일 페이지도 생략하지 않았습니다. 확대해서 확인하세요.

| 과정 | 웹 전후 | 모바일 전후 |
| --- | --- | --- |
| 1. 컨셉·참고 이미지 입력 | [보기](comparisons/desktop/input.png) | [보기](comparisons/mobile/input.png) |
| 2. 전략 분석 결과 | [보기](comparisons/desktop/strategy.png) | [보기](comparisons/mobile/strategy.png) |
| 3. 캐릭터·외형 명세 | [보기](comparisons/desktop/character.png) | [보기](comparisons/mobile/character.png) |
| 4. 이모지 45개 생성 결과 | [보기](comparisons/desktop/stickers.png) | [보기](comparisons/mobile/stickers.png) |
| 5. 배경 제거·외곽선 결과 | [보기](comparisons/desktop/postprocess.png) | [보기](comparisons/mobile/postprocess.png) |
| 6. 한·영 메타데이터 결과 | [보기](comparisons/desktop/metadata.png) | [보기](comparisons/mobile/metadata.png) |
| 7. 6개 플랫폼 내보내기 완료 | [보기](comparisons/desktop/export.png) | [보기](comparisons/mobile/export.png) |

추가 화면: [API 설정 웹](comparisons/desktop/setup.png) · [모바일](comparisons/mobile/setup.png) · [언어 선택 웹](comparisons/desktop/metadata-languages.png) · [모바일](comparisons/mobile/metadata-languages.png)

## 산출물과 재현

- `screenshots/`: 실제 앱의 원본 PNG 36장.
- `comparisons/`: 원본 PNG를 나란히 배치한 비교 이미지 18장. 화면 내용을 편집하거나 대체하지 않았습니다.
- `fixtures/`: 직접 작성한 SVG 기반 모의 그림과 시나리오 데이터. `fixtures.json`에 모의 데이터임을 명시합니다.
- `outputs/`: 실제 처리된 PNG, 메타데이터, 전략 JSON, 6개 플랫폼 ZIP.
- `manifest.json`: 캡처 크기·파일 해시·요청 개수·산출물 개수·전후 데이터 일치 기록.

저장소 루트에서 다음 명령으로 재현합니다. 원본 앱 서버와 변경 후 앱 서버를 먼저 실행해야 합니다.

```sh
node scripts/design-review-artwork.mjs
DESIGN_BEFORE_URL=http://127.0.0.1:5195 DESIGN_AFTER_URL=http://127.0.0.1:5190 node scripts/capture-design-review.mjs
node scripts/render-design-comparisons.mjs
python3 -m http.server 5199 --bind 127.0.0.1 --directory docs/process-design
```

브라우저에서 `http://127.0.0.1:5199/`를 열거나 `index.html`을 직접 열어도 됩니다. 오프라인 갤러리는 같은 폴더의 `screenshots`가 함께 있어야 합니다.
