# BLOOM Reference

BLOOM 개발·프로젝트 관리 규칙, 알고리즘 설명, 공통 UI/UX 기준과 시각 실험을 모아 둔 레퍼런스 저장소입니다. 규칙 문서는 Markdown이 원본이고 위키 HTML은 변환기 생성물입니다(아래 "규칙 문서 원본과 생성물"). 나머지 문서와 실험의 원본은 각 HTML 파일이며, 같은 내용을 Markdown으로 중복 관리하지 않습니다.

## 규칙 문서 원본과 생성물

- 원본: 저장소 루트 `AGENTS.md`(진입 문서, 규칙 줄 전부 + 상세 링크)와 `rules/*.md` 3개(`ai-development.md`, `development.md`, `project-management.md`). 사람과 AI는 이 파일만 고칩니다. 에이전트는 `AGENTS.md`를 통째로 읽고(Claude Code는 `CLAUDE.md`의 `@AGENTS.md` import로 같은 내용을 읽음) 필요한 절만 상세 문서에서 읽습니다. 규칙 절의 첫 줄 `- [ID][우선순위] 문장`이 규칙 줄이며, 위반 보고는 이 ID로 합니다.
- 생성물: `rules/index.html`(진입 문서)과 같은 이름의 `rules/*.html`. `tools/build-rules.py`가 `tools/wiki-template.html`(목차·검색·테마)에 본문을 넣어 만듭니다. 직접 수정하지 않습니다.
- 갱신: 원본이나 변환기가 바뀐 push마다 `.github/workflows/rules-build.yml`이 HTML을 다시 생성해 같은 브랜치에 커밋합니다. 로컬 미리 보기는 `pip install -r tools/requirements.txt && python3 tools/build-rules.py`, 일치 확인은 `--check`입니다.
- 표기 규약(4개)과 검사 항목은 `tools/build-rules.py` 머리말에 있습니다.

## 바로 보기

| 자료 | 화면 열기 | HTML 원본 |
| --- | --- | --- |
| **에이전트 진입 문서** · 규칙 줄 53개(AI·DEV·PM) + 상세 링크 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/index.html) | [AGENTS.md](AGENTS.md) (원본) · [HTML 생성물](rules/index.html) |
| 공통 개발 규칙 · 비용 우선순위 · 규칙 줄 DEV-001~026 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/development.html) | [rules/development.md](rules/development.md) (원본) · [HTML 생성물](rules/development.html) |
| AI 개발 규칙 · 요구 해석·공통 모듈 개선·SVG 자산·자동 저장 비용·검증 · 규칙 줄 AI-001~014 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/ai-development.html) | [rules/ai-development.md](rules/ai-development.md) (원본) · [HTML 생성물](rules/ai-development.html) |
| 공통 프로젝트 관리 규칙 · 버전·Stable/Nightly·Git·원본 무빌드 배포 · 규칙 줄 PM-001~013 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/project-management.html) | [rules/project-management.md](rules/project-management.md) (원본) · [HTML 생성물](rules/project-management.html) |
| 공통 UI/UX 레퍼런스 · P1–P10 우선순위·URL·상태·모바일·시각 피드백 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/visual-ux.html) | [rules/visual-ux.html](rules/visual-ux.html) |
| 게임 기획 가이드 · 연쇄 반응·해금·규칙 단순화·수치 초안 정규화 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/game-design.html) | [rules/game-design.html](rules/game-design.html) |
| 타격감 종합 가이드 · 바운코·영상·접촉/반동/피격·멀티/롤백 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/impact-feel.html) | [rules/impact-feel.html](rules/impact-feel.html) |
| 공통 STAT 사전 · 의미·단위·계산 계약·게임 프로필 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/stats.html) | [rules/stats.html](rules/stats.html) |
| 절차적 지형 생성 · FastNoise·유형별 선택·검증 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/algorithms/terrain-generation.html) | [algorithms/terrain-generation.html](algorithms/terrain-generation.html) |
| 예약 버그 탐지 · 자동 수정 범위·전체 이력 10줄 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/scheduled-bug-qa.html) | [rules/scheduled-bug-qa.html](rules/scheduled-bug-qa.html) |
| 구체 개발규칙 · 알고리즘 레퍼런스 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/algorithms/index.html) | [algorithms/index.html](algorithms/index.html) |
| 파티클 연구소 v3 · 74종·수치·UI | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/particles.html) | [labs/particles.html](labs/particles.html) |
| 파티클 UI·HUD 예제 v3 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/particles-ui-hud.html) | [labs/particles-ui-hud.html](labs/particles-ui-hud.html) |
| 그림체 실험실 v9 · 털실 포함 9종 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/topdown-style.html) | [labs/topdown-style.html](labs/topdown-style.html) |
| 스케치 전투 · 동작과 실루엣 개선 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/sketch-vfx.html) | [labs/sketch-vfx.html](labs/sketch-vfx.html) |

바로 보기 링크는 [HTML Share 사용 설명서](https://htmlpreview.github.io/?https://github.com/byh-playground/html-share/blob/main/docs/usage.html)와 같은 HTML Preview 방식을 사용합니다. 공개 저장소의 `main` 브랜치에 있는 HTML을 표시하며, 별도의 빌드나 서버 업로드는 필요하지 않습니다. 파일을 내려받아 브라우저로 직접 열 수도 있습니다. 파티클 연구소는 WebGL을 사용할 수 있는 브라우저가 필요합니다. 파티클 프리셋은 현재 브라우저에 저장되므로 필요한 프리셋은 JSON으로 내보내 보관하세요.

2026-10-11 공통 UI/UX 문서는 기존 `rules/visual-ux.html`을 확장했습니다. URL·상태·생명주기부터 모바일·트리·전투·보상·소개까지 후변경 비용과 체감 효과에 따른 P1–P10 순서이며, 사용자 확정 원칙과 게임별 사례·새 권장안을 구별합니다. 기존 목차 앵커와 관련 링크를 유지합니다. 병합 전 리뷰는 바로 보기 주소의 `main`을 PR head commit SHA로 바꾸고, 병합 후에는 위 main 링크를 사용합니다.

2026-10-14 게임 기획 가이드 `rules/game-design.html`을 추가했습니다. 첫 주제는 바운코의 충돌·후속 돌진과 털실 대소동의 동등 티어 합체를 대표 사례로 정리한 연쇄 반응의 재미입니다. 기존 위키형 목차·검색·테마 형식을 재사용하고 구현 확인·사용자 기획 방향·설계 가설을 구별합니다. 두 번째 주제는 다음 지역·스테이지·기능 해금이며, Nintendo(원더·메트로이드 드레드)와 Wube(Factorio: Space Age)의 공식 자료를 연결합니다. 이후 기획 팁은 독립 주제로 확장합니다. 2026-10-16 미지정 수치 초안의 정규화와 기준값 기반 파생 원칙을 AI 개발 규칙에 추가하고, 게임 기획 가이드에서 단일 원본으로 연결했습니다. 예시·기존 프로젝트 값의 임의 변경은 하지 않습니다. 같은 날 SVG 정적 벡터 아트의 원본 유지·브라우저 시작 시 1회 컴파일·캐시 재사용 규칙과 Farm의 과대 생성 메시 번들 사례도 AI 개발 규칙에 기록했습니다. Farm 0.6.1 저장 경로를 코드 기준으로 확인해 변경 없는 전체 직렬화·복원과 렌더 경로의 동기 I/O를 구분하는 자동 저장 안티패턴도 기록했습니다. 짧은 주기 자체를 금지하거나 기기 지연의 유일 원인으로 과장하지 않습니다.

2026-10-20 게임 기획 가이드 `rules/game-design.html`에 세 번째 주제로 규칙 단순화를 추가했습니다. 수치를 뺀 한두 줄 메인 규칙과 한 줄씩의 예외로 규칙을 설명하는 구조, 소환수 시험판 예시, 맞지 않을 때의 리팩토링 기준과 체크리스트를 담았습니다. 기존 수치 초안·사례 근거 장은 번호만 4·5장으로 밀렸고 앵커는 그대로입니다.

## 역할과 경계

- `rules/`: 개발 원칙·리뷰 기준과 별도 프로젝트 관리 규칙
- `algorithms/`: 적용 조건, 비용, 대안과 예제를 설명하는 알고리즘 레퍼런스
- `labs/`: 표현 방식과 효과를 직접 비교하는 독립 HTML 실험
- [bloom-world](https://github.com/byh-playground/bloom-world): 세계관 설정의 기준 원본
- [bloom-gamekit](https://github.com/byh-playground/bloom-gamekit): 실제 런타임 코드, API와 실행 예제

세계관 설정과 정식 GameKit 런타임은 각 저장소에서 관리합니다. 이곳의 파티클 모듈은 연구소 v3에서 추출한 재사용 예제이며, 게임 런타임의 정식 배포나 두 게임에 적용한 결과로 간주하지 않습니다.

## 수록 원본

2026-10-07에 수록한 자료와 이후 추가한 공통·운영 레퍼런스를 아래 고정 경로에서 관리합니다. 기존 원본의 수정일은 UTC 기준이며 새 운영 레퍼런스는 조사·작성일을 표시합니다.

| 저장 경로 | 원본 파일 | 수정일 |
| --- | --- | --- |
| `rules/development.md` → `rules/development.html` (생성물) | `common-development-rules-priority-wiki-v14.html` (2026-10-30 Markdown 원본으로 전환, 규칙 줄 추가, 리뷰 순서 표 번호 재부여) | 2026-10-30 |
| `rules/ai-development.md` → `rules/ai-development.html` (생성물) | AI 요청 해석·검색 비교·공통 모듈 개선·소비 게임 적용 규칙 (이 저장소에서 작성, 2026-10-30 Markdown 원본으로 전환, 규칙 줄 추가) | 2026-10-30 |
| `AGENTS.md` → `rules/index.html` (생성물) | 에이전트 진입 문서 (이 저장소에서 작성, 규칙 줄은 상세 문서와 동일 문장) | 2026-10-30 |
| `rules/project-management.md` → `rules/project-management.html` (생성물) | `common_project_management_rules.html` (원본 무빌드 배포·main/Nightly·Stable 기준선 갱신, 2026-10-30 Markdown 원본으로 전환, 규칙 줄 추가) | 2026-10-30 |
| `rules/visual-ux.html` | 공통 UI/UX 레퍼런스 (기존 시각·UX 확장) | 2026-10-11 |
| `rules/game-design.html` | 게임 기획 가이드 (이 저장소에서 작성) | 2026-10-14 |
| `rules/stats.html` | 공통 STAT 의미·계약 사전 (이 저장소에서 작성) | 2026-10-10 |
| `algorithms/terrain-generation.html` | FastNoise 공식 원문 기반 지형 생성 조사 (이 저장소에서 작성) | 2026-10-10 |
| `rules/scheduled-bug-qa.html` | 예약 버그 탐지·자동 수정 운영 조사 (이 저장소에서 작성) | 2026-10-08 |
| `algorithms/index.html` | `specific-development-algorithm-wiki-v3.html` | 2026-10-07 |
| `labs/particles.html` | `BLOOM_Particle_Lab_v3_GameKit.html` | 2026-10-07 |
| `labs/particles-ui-hud.html` | `BLOOM_UI_HUD_Example_v3.html` | 2026-10-07 |
| `labs/topdown-style.html` | `style_lab_bloom_knit_v9.html` | 2026-10-07 |
| `labs/sketch-vfx.html` | `procedural_sketch_vfx_visual_review.html` | 2026-10-06 |

Style Lab v9는 기존 8종 스타일·스틱맨 횡스크롤·블룸 탑다운 예제를 유지하면서 털실/손뜨개 스타일과 재질 비교를 추가한 완료본입니다. 같은 고정 경로를 갱신했으며 이전 중간본은 중복 수록하지 않았습니다. 갱신할 때는 고정 경로의 HTML과 위 원본 정보를 함께 바꾸고, 이전 내용은 Git 이력으로 확인합니다.

2026-10-07 런타임 이관에 맞춰 `algorithms/index.html`의 Rollback 계약 링크 한 곳을 bloom-gamekit의 `modules/rollback-netcode/CONTRACT.md`로 갱신했습니다. 원본 자료의 설명·알고리즘·화면과 다른 링크는 바꾸지 않았습니다.

2026-10-10에는 나무위키형 목차·검색·테마를 갖춘 공통 시각·UX 규칙, STAT 사전, 지형 생성 문서를 추가했습니다. 기존 개발·관리 규칙에는 재사용 capability/config 예시, 전문 문서 연결, 실제 의존성·mock·fallback·RTC 및 실패 단계 구분만 보강했습니다. 180초 버그 검증 상한은 유지합니다. 새 문서의 원칙·계산 예시는 프로젝트 설계 규약이며 모든 게임에 모든 STAT이나 고정 수치를 강제하지 않습니다. 지형 기술 출처는 [FastNoiseLite](https://github.com/Auburn/FastNoiseLite), [FastNoise2](https://github.com/Auburn/FastNoise2), [Jordan Peck](https://jordanpeck.me) 및 각 HTML의 출처 절에서 관리합니다. 게임 산출물·런타임·SDK 적용 결과는 포함하지 않습니다.

## 파티클 v3 모듈과 소스

- [전체 원본 소스 ZIP 내려받기](labs/particles/source-v3.zip?raw=true): `BLOOM_Particle_GameKit_v3_Source.zip`의 원본 바이트입니다. 압축을 풀면 README의 상대 경로·예제·검사를 함께 사용할 수 있습니다.
- [BloomEffects ESM 코드 보기](labs/particles/bloom-effects.js): ZIP 안의 `bloom-effects.js`와 바이트가 같은 열람용 사본입니다. 별도로 수정하거나 배포하는 런타임 포크가 아닙니다.
- [모듈 사용법](labs/particles/README.md) · [원본 버전·해시](labs/particles/provenance.json)

기존 46종에 수치 애니메이션·게이지·UI·보상·전술 표시 28종을 더한 총 74종입니다. 실제 값 `data`와 계층형 표현 `config`를 분리하며 `BloomEffects`, `NumberTransition`, `NumberLabelChannel`, `UiMotion`을 재사용할 수 있습니다. HTML의 내보내기에서도 모듈·설정 JSON·독립 실행 HTML을 얻을 수 있습니다.

이 자료는 GameKit 원본 커밋 `421e04145c89b827d280f5774e8d502486cc3074`를 고정 사용합니다. 더 최신 GameKit으로 바꾼 자료가 아니며, 버드모리·랠리 프론티어 저장소와 정식 GameKit 모듈은 이번 레퍼런스 갱신으로 수정하지 않습니다. 단위·브라우저 검사 상세는 원본 ZIP의 `validation/TEST-REPORT.md`에 포함되어 있습니다.

HTML Preview가 script의 type 속성을 보존하지 않아, 파티클 연구소와 UI·HUD HTML은 내장 JSON 저장 태그와 비동기 시작 래퍼만 실행 가능한 형태로 포장했습니다. 내장 ESM 소스·효과·설정은 원본과 동일하고, 전체 소스 ZIP과 열람용 ESM은 원본 바이트를 유지합니다.

