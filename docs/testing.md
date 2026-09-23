# 디자인 변경 검증

브라우저·데스크톱 회귀 시나리오는 통과했지만, **공유/웹 전체 소스의 E2E 브랜치 커버리지 100% 완료 조건은 아직 충족하지 못했습니다.** 임계값은 100%로 유지하며 미달 시 검증 명령이 실패합니다. 아래의 데스크톱 단위 테스트 100%는 별도의 제한된 범위이며 전체 프로젝트 E2E 100%를 뜻하지 않습니다.

## 원본과 변경본 비교

원본은 `3a4eb67`의 별도 worktree에서 실행했습니다. 테스트·계측 설정만 복사했고 `packages/shared/src`, `packages/web/src`의 원본 diff가 비어 있음을 확인했습니다. 두 작업공간은 같은 설치 의존성과 API 응답 fixture를 사용했습니다.

| 검증 | 원본 | 디자인 변경 후 |
| --- | --- | --- |
| 웹 기존 기능 E2E | 64/64 통과 | 동일 64/64 통과 |
| 새 디자인/접근성/수출 대기 E2E | 원본 미적용 | 15/15 통과 |
| 웹 전체 E2E | 64/64 통과 | **79/79 통과** |
| 공유/웹 E2E 소스 브랜치 | 636/807 (**78.81%**) | 646/812 (**79.55%**) |
| 공유/웹 E2E statements / functions / lines | 85.65% / 84.71% / 86.97% | 85.90% / 84.97% / 87.37% |
| Electron E2E | 15/15 통과 | 15/15 통과 |
| Electron 단위 테스트 | 57/57 통과 | 57/57 통과 |
| Electron main/preload/adapter 단위 브랜치 | 108/108 (100%) | 108/108 (100%) |
| 전체 공유/웹 소스 브랜치 100% 게이트 | **미달** | **미달: 166개 branch arm 미실행** |

최종 변경본의 웹 빌드, 웹 단위 테스트 1/1, 웹·Electron E2E TypeScript 검사도 통과했습니다. ESLint는 오류 0개이며 기존 React hook 경고 3개가 남습니다. Electron 빌드와 15개 E2E 및 57개 단위 테스트는 모달·내보내기 대기 수정 후 소스로 다시 통과했습니다.

최종 변경본에서 `coverage:e2e:check`가 예상대로 exit code 1을 반환함을 확인했습니다. 테스트 79건 통과와 요청된 소스 분기 100% 달성은 별개의 결과입니다. 원본 기능에 동일한 64개 시나리오를 적용했고, 추가된 15개 시나리오는 접근성/반응형 13건과 native 공유 대기/취소 2건입니다.

기계 판독 결과: [원본](verification/baseline.json), [변경본](verification/redesign.json). 각 파일에 전체 소스별 수치와 미실행 분기의 원본 TypeScript 위치를 기록합니다. 변경본의 추가 테스트는 새로 개선한 접근성·모달·수출 대기 동작이므로 원본 비교에서 `design-*.spec.ts`만 제외합니다.

## 유지한 기능과 검증 경로

| 영역 | 검증한 동작 |
| --- | --- |
| 설정/입력 | API 키 최소 길이·검증 오류·재입력·표시 토글·Enter·저장·재로드, 기존 컨셉을 보존하며 설정 변경, 다섯 대상 시장, 참조 이미지와 생성 생략 |
| 전략/캐릭터 | 전문가 펼침/닫힘, 생성·재생성·뒤로 이동, 일차/대체 모델 실패, 빈 전문가·합성·캐릭터·스타일·명세 응답과 복구 |
| 스티커 | 45장 전체 생성, 배치 대기, 진행률, 대기/실행/성공/실패, 개별 재시도·재생성·프롬프트 수정/취소 |
| 이미지 처리 | 실제 Canvas의 배경 제거, 투명 경계·반투명 잔여색·닫힌 영역 보존, 흰/검은 윤곽선·굵기·불투명도, 0값·1픽셀·가로/세로 이미지 |
| 메타데이터 | 여섯 언어, 언어 선택/해제, 생성/재생성/빈 결과/실패, 추천 선택·해제, 클립보드 거부, 메타데이터 없는 ZIP |
| 내보내기 | 여섯 플랫폼 개별/통합 ZIP, 실제 파일명·PNG 픽셀/크기·여백·순서·main/tab·메타데이터, 손상된 이미지 실패, 처리 전 원본 이미지 ZIP |
| 공개 API | `window.emoticon` 전체/후처리 파이프라인, 진행/완료 이벤트, 구독 해제, 취소, 실패, 없는 작업, 최대 10개 이력, 미구현 granular endpoint의 기존 오류 |
| 새 UI | 키보드 포커스 고정/복원, Escape, 본문 바로가기, 동작 줄이기, 텍스트 대비, 6개 언어의 320/390/768/1024px 모든 단계, 짧은 화면의 모달, 키 검증 중 포커스 |
| 데스크톱 | 실제 Electron 시작/종료와 브리지, 키 저장·삭제·이관, 실제 파일 시스템 저장·열기·ZIP, 메뉴·업데이트·윈도 생명주기 |

Google API는 HTTP 경계에서 고정 응답으로 대체하며 실제 키나 `.env`를 읽지 않습니다. UI 회귀는 버튼·폼으로 진행하고, 공개 API 테스트는 제품이 제공하는 `window.emoticon`을 호출합니다. 단계를 강제로 이동하거나 store를 조작하지 않습니다. 이미지 처리·ZIP 생성·다운로드는 실제 구현을 실행합니다. 45장 배치 사이의 10초 대기는 Playwright 브라우저 시계로 가속합니다.

새 내보내기 테스트는 운영체제 공유 창을 나타내는 `navigator.share` 경계에서 대기를 재현합니다. 공유 성공·사용자 취소 후 다운로드 대체 동작까지 확인했습니다. 기존 코드가 `isExporting = true` 직후 `resetExport()`로 다시 false를 만들던 순서를 수정하여 작업 중 중복 클릭과 뒤로 이동을 막습니다.

## 커버리지 범위와 남은 분기

Istanbul은 `packages/shared/src`, `packages/web/src`의 **모든 런타임 TS/TSX**를 분모에 포함합니다. 테스트·타입 선언·MSW 테스트 지원 코드만 제외하며 방문하지 않은 생산 모듈은 0으로 계산합니다. 생산 분기 제외 주석이나 임계값 하향은 사용하지 않았습니다. E2E 서버의 HMR을 끄고 source map으로 원본 TypeScript에 대응시켜 React 개발 도우미 분기를 제외합니다.

남은 분기가 전부 검증 불가능하다는 뜻은 아닙니다. 미실행 목록 전체를 보존했으며 다음은 현재 제품 경로에서 호출되지 않거나 조건상 도달하지 않는 구체적인 예입니다.

| 파일/위치 | 남은 이유 |
| --- | --- |
| [FileUpload](../packages/shared/src/components/ui/FileUpload.tsx), [SelectionGrid](../packages/shared/src/components/ui/SelectionGrid.tsx) | 컴포넌트는 존재하지만 현재 앱과 공개 API가 렌더링하지 않습니다. |
| [usePipeline](../packages/shared/src/hooks/usePipeline.ts), [useApiKey](../packages/shared/src/hooks/useApiKey.ts) | 현재 앱에서 호출하지 않는 hook입니다. |
| [platforms.ts:85](../packages/shared/src/constants/platforms.ts#L85) | `calculateRequiredStickers`의 8개 분기는 현재 호출 경로가 없습니다. 여섯 플랫폼 파일명 함수와 실제 수출 테스트는 별도로 실행됩니다. |
| [export.ts:25](../packages/shared/src/services/image/export.ts#L25) | 바로 앞 `status === 'done' && imageUrl` 필터를 통과한 항목에 다시 `!imageUrl`을 검사하는 방어 분기입니다. |
| [generationPipeline.ts:242](../packages/shared/src/services/pipeline/generationPipeline.ts#L242) | 같은 아이디어 배열로 만든 스티커에서 해당 ID를 못 찾는 방어 분기입니다. 정상 스키마의 응답으로는 발생하지 않습니다. |
| [fullPipeline.ts:43](../packages/shared/src/services/pipeline/fullPipeline.ts#L43) | 외부 AbortSignal 결합 기능을 공개 API가 전달하지 않습니다. 공개 취소 경로는 별도로 검증했습니다. |
| [orchestrator.ts:286](../packages/shared/src/services/gemini/orchestrator.ts#L286) | 현재 호출자가 전달하지 않는 `useFlash = true` 선택입니다. |
| [App.tsx](../packages/shared/src/App.tsx) | 비활성화된 단계 클릭, 존재하지 않는 스티커 ID, 잘못된 stage 등 UI가 차단하는 상태의 방어 분기가 남습니다. |

Electron의 단위 커버리지는 `src/main/**/*.ts`, `src/preload/**/*.ts`, 공유 `platform/adapter.ts`를 포함하며 명시적 제외 목록은 없습니다. 브라우저 커버리지와 합산하여 전체 100%로 표시하지 않습니다. 검증 환경은 macOS이며 다른 OS의 설치 패키지 실행 결과를 주장하지 않습니다.

## 다시 실행하기

```sh
npm install
npx playwright install chromium
npm run test:e2e
npm -w @emoji/web run test:e2e:typecheck
npm -w @emoji/electron run test:coverage
npm run test:e2e:electron
npm run verify:design
```

`test:e2e`는 시나리오 성공 여부와 커버리지 보고서를 생성합니다. `test:e2e:coverage`와 `verify:design`의 마지막 단계는 **브랜치 100% 미달 시 실패**합니다. 이미 실행한 보고서의 임계값만 다시 검사하려면 `npm -w @emoji/web run coverage:e2e:check`를 사용합니다.

실행 보고서는 `packages/web/coverage/e2e/index.html`, 실패 위치는 `uncovered-branches.json`, 임계값 판정은 `gate.json`, 스크린샷·trace는 `packages/web/test-results/`에 생성됩니다. 세부 fixture/실행 설명은 [웹 E2E 안내](../packages/web/e2e/README.md)에 있습니다.
