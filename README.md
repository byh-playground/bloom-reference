# BLOOM Reference

BLOOM 개발 규칙, 알고리즘 설명, 시각 실험을 모아 둔 레퍼런스 저장소입니다. 문서와 실험의 원본은 각 HTML 파일이며, 같은 내용을 Markdown으로 중복 관리하지 않습니다.

## 바로 보기

| 자료 | 화면 열기 | HTML 원본 |
| --- | --- | --- |
| 공통 개발 규칙 · 비용 우선순위 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/development.html) | [rules/development.html](rules/development.html) |
| 구체 개발규칙 · 알고리즘 레퍼런스 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/algorithms/index.html) | [algorithms/index.html](algorithms/index.html) |
| 파티클 연구소 v3 · 74종·수치·UI | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/particles.html) | [labs/particles.html](labs/particles.html) |
| 파티클 UI·HUD 예제 v3 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/particles-ui-hud.html) | [labs/particles-ui-hud.html](labs/particles-ui-hud.html) |
| 그림체 실험실 v9 · 털실 포함 9종 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/topdown-style.html) | [labs/topdown-style.html](labs/topdown-style.html) |
| 스케치 전투 · 동작과 실루엣 개선 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/sketch-vfx.html) | [labs/sketch-vfx.html](labs/sketch-vfx.html) |

바로 보기 링크는 [HTML Share 사용 설명서](https://htmlpreview.github.io/?https://github.com/byh-playground/html-share/blob/main/docs/usage.html)와 같은 HTML Preview 방식을 사용합니다. 공개 저장소의 `main` 브랜치에 있는 HTML을 표시하며, 별도의 빌드나 서버 업로드는 필요하지 않습니다. 파일을 내려받아 브라우저로 직접 열 수도 있습니다. 파티클 연구소는 WebGL을 사용할 수 있는 브라우저가 필요합니다. 파티클 프리셋은 현재 브라우저에 저장되므로 필요한 프리셋은 JSON으로 내보내 보관하세요.

## 역할과 경계

- `rules/`: 개발 원칙과 리뷰 기준
- `algorithms/`: 적용 조건, 비용, 대안과 예제를 설명하는 알고리즘 레퍼런스
- `labs/`: 표현 방식과 효과를 직접 비교하는 독립 HTML 실험
- [bloom-world](https://github.com/byh-playground/bloom-world): 세계관 설정의 기준 원본
- [bloom-gamekit](https://github.com/byh-playground/bloom-gamekit): 실제 런타임 코드, API와 실행 예제

세계관 설정과 정식 GameKit 런타임은 각 저장소에서 관리합니다. 이곳의 파티클 모듈은 연구소 v3에서 추출한 재사용 예제이며, 게임 런타임의 정식 배포나 두 게임에 적용한 결과로 간주하지 않습니다.

## 수록 원본

2026-10-07 기준으로 확인한 최신 자료를 아래 고정 경로에 수록했습니다. 날짜는 UTC 기준 원본 수정일입니다.

| 저장 경로 | 원본 파일 | 수정일 |
| --- | --- | --- |
| `rules/development.html` | `common-development-rules-priority-wiki-v14.html` | 2026-10-07 |
| `algorithms/index.html` | `specific-development-algorithm-wiki-v3.html` | 2026-10-07 |
| `labs/particles.html` | `BLOOM_Particle_Lab_v3_GameKit.html` | 2026-10-07 |
| `labs/particles-ui-hud.html` | `BLOOM_UI_HUD_Example_v3.html` | 2026-10-07 |
| `labs/topdown-style.html` | `style_lab_bloom_knit_v9.html` | 2026-10-07 |
| `labs/sketch-vfx.html` | `procedural_sketch_vfx_visual_review.html` | 2026-10-06 |

Style Lab v9는 기존 8종 스타일·스틱맨 횡스크롤·블룸 탑다운 예제를 유지하면서 털실/손뜨개 스타일과 재질 비교를 추가한 완료본입니다. 같은 고정 경로를 갱신했으며 이전 중간본은 중복 수록하지 않았습니다. 갱신할 때는 고정 경로의 HTML과 위 원본 정보를 함께 바꾸고, 이전 내용은 Git 이력으로 확인합니다.

2026-10-07 런타임 이관에 맞춰 `algorithms/index.html`의 Rollback 계약 링크 한 곳을 bloom-gamekit의 `modules/rollback-netcode/CONTRACT.md`로 갱신했습니다. 원본 자료의 설명·알고리즘·화면과 다른 링크는 바꾸지 않았습니다.

## 파티클 v3 모듈과 소스

- [전체 원본 소스 ZIP 내려받기](labs/particles/source-v3.zip?raw=true): `BLOOM_Particle_GameKit_v3_Source.zip`의 원본 바이트입니다. 압축을 풀면 README의 상대 경로·예제·검사를 함께 사용할 수 있습니다.
- [BloomEffects ESM 코드 보기](labs/particles/bloom-effects.js): ZIP 안의 `bloom-effects.js`와 바이트가 같은 열람용 사본입니다. 별도로 수정하거나 배포하는 런타임 포크가 아닙니다.
- [모듈 사용법](labs/particles/README.md) · [원본 버전·해시](labs/particles/provenance.json)

기존 46종에 수치 애니메이션·게이지·UI·보상·전술 표시 28종을 더한 총 74종입니다. 실제 값 `data`와 계층형 표현 `config`를 분리하며 `BloomEffects`, `NumberTransition`, `NumberLabelChannel`, `UiMotion`을 재사용할 수 있습니다. HTML의 내보내기에서도 모듈·설정 JSON·독립 실행 HTML을 얻을 수 있습니다.

이 자료는 GameKit 원본 커밋 `421e04145c89b827d280f5774e8d502486cc3074`를 고정 사용합니다. 더 최신 GameKit으로 바꾼 자료가 아니며, 버드모리·랠리 프론티어 저장소와 정식 GameKit 모듈은 이번 레퍼런스 갱신으로 수정하지 않습니다. 단위·브라우저 검사 상세는 원본 ZIP의 `validation/TEST-REPORT.md`에 포함되어 있습니다.
