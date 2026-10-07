# BLOOM Reference

BLOOM 개발 규칙, 알고리즘 설명, 시각 실험을 모아 둔 레퍼런스 저장소입니다. 문서와 실험의 원본은 각 HTML 파일이며, 같은 내용을 Markdown으로 중복 관리하지 않습니다.

## 바로 보기

| 자료 | 화면 열기 | HTML 원본 |
| --- | --- | --- |
| 공통 개발 규칙 · 비용 우선순위 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/rules/development.html) | [rules/development.html](rules/development.html) |
| 구체 개발규칙 · 알고리즘 레퍼런스 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/algorithms/index.html) | [algorithms/index.html](algorithms/index.html) |
| 파티클 연구소 · BLOOM | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/particles.html) | [labs/particles.html](labs/particles.html) |
| 그림체 실험실 · 스틱맨 / 블룸 탑다운 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/topdown-style.html) | [labs/topdown-style.html](labs/topdown-style.html) |
| 스케치 전투 · 동작과 실루엣 개선 | [바로 보기](https://htmlpreview.github.io/?https://github.com/byh-playground/bloom-reference/blob/main/labs/sketch-vfx.html) | [labs/sketch-vfx.html](labs/sketch-vfx.html) |

바로 보기 링크는 [HTML Share 사용 설명서](https://htmlpreview.github.io/?https://github.com/byh-playground/html-share/blob/main/docs/usage.html)와 같은 HTML Preview 방식을 사용합니다. 공개 저장소의 `main` 브랜치에 있는 HTML을 표시하며, 별도의 빌드나 서버 업로드는 필요하지 않습니다. 파일을 내려받아 브라우저로 직접 열 수도 있습니다. 파티클 프리셋은 현재 브라우저에 저장되므로 필요한 프리셋은 JSON으로 내보내 보관하세요.

## 역할과 경계

- `rules/`: 개발 원칙과 리뷰 기준
- `algorithms/`: 적용 조건, 비용, 대안과 예제를 설명하는 알고리즘 레퍼런스
- `labs/`: 표현 방식과 효과를 직접 비교하는 독립 HTML 실험
- [bloom-world](https://github.com/byh-playground/bloom-world): 세계관 설정의 기준 원본
- [bloom-gamekit](https://github.com/byh-playground/bloom-gamekit): 실제 런타임 코드, API와 실행 예제

세계관 설정과 런타임 구현은 각 저장소에서 관리합니다. 이곳에 복제하지 않으며, 실험용 코드를 게임 런타임의 정식 구현으로 간주하지 않습니다.

## 수록 원본

2026-10-07 기준으로 확인한 최신 자료를 아래 고정 경로에 수록했습니다. 날짜는 UTC 기준 원본 수정일입니다.

| 저장 경로 | 원본 파일 | 수정일 |
| --- | --- | --- |
| `rules/development.html` | `common-development-rules-priority-wiki-v14.html` | 2026-10-07 |
| `algorithms/index.html` | `specific-development-algorithm-wiki-v3.html` | 2026-10-07 |
| `labs/particles.html` | `BLOOM_Particle_Lab_v1.html` | 2026-10-06 |
| `labs/topdown-style.html` | `style_lab_bloom_topdown_v5.html` | 2026-10-06 |
| `labs/sketch-vfx.html` | `procedural_sketch_vfx_visual_review.html` | 2026-10-06 |

Topdown Style Lab v5에는 스틱맨 횡스크롤과 블룸 탑다운 예제가 함께 들어 있어 이전 스틱맨 전용 버전은 중복 수록하지 않았습니다. 갱신할 때는 고정 경로의 HTML과 위 원본 정보를 함께 바꾸고, 이전 내용은 Git 이력으로 확인합니다.
