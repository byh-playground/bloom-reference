---
title: BLOOM 에이전트 작업 규칙
kicker: Agent Entry Document
subtitle: 에이전트가 작업 전에 통째로 읽는 진입 문서. 매번 따라야 하는 규칙 줄 54개와 상세 문서 링크.
brand_small: 진입 문서
badges: AGENTS.md*, 규칙 줄 54개, 상세 문서 3개, 통용 용어 병기
search_placeholder: 규칙 검색 (예: SSOT, Given-When-Then, Signal, 180초)
footer: BLOOM Reference · 진입 문서. 원본은 저장소 루트의 AGENTS.md.
---

> [!NOTE] **이 문서 사용법**
> 이 파일은 BLOOM 저장소들의 에이전트 진입 문서다. 작업 시작 시 전체를 읽는다. 규칙 1개는 `- [ID][우선순위] **통용 용어** — 조건→행동. 위반 판별: …` 1줄이고, 용어 정의·이유·예시·사례는 끝의 [상세] 링크가 가리키는 절에 있다. 규칙 위반과 적용을 보고할 때는 ID로 지정한다(예: `DEV-001 위반`). 규칙 줄은 상세 문서의 같은 줄과 문장이 같아야 하며 `tools/build-rules.py`가 다르면 실패시킨다. 규칙을 고칠 때는 상세 문서와 이 파일을 같은 PR에서 고친다. 우선순위 `P0/P1/P2`는 구조 규칙의 나중 수정 비용 순서이고, `-`는 우선순위가 없는 규칙이다.

## 대전제 {#terminology}

모든 규칙·문서 작성에 먼저 적용한다. 원본: [AI 개발 규칙 · 대전제](rules/ai-development.md#terminology).

- [AI-000][-] **Ubiquitous Language · Shared Vocabulary** — 규칙·문서를 쓸 때 사용자가 설명한 내용과 같은 뜻을 가진 통용 용어나 해시태그(SSOT, KISS, MECE, YAGNI 등)가 있으면 그 용어를 규칙 줄 앞에 함께 적는다. 용어가 뜻을 전부 덮지 못하면 용어 뒤에 차이를 한 절로 적는다. 위반 판별: 같은 뜻의 통용 용어가 있는데 규칙에 용어가 없거나, 뜻이 다른 용어를 붙였다. [상세](rules/ai-development.md#terminology)

## 작업 순서 {#ai}

AI 작업의 순서와 판단 기준. 원본: [AI 개발 규칙](rules/ai-development.md).

- [AI-001][-] **XY Problem 회피 · Specification by Example** — 작업 순서는 의도 정리 → 최소 한 번 검색·비교 → 구체 동작 확정 → 구현 → 같은 사례로 검증이며, 용어가 맞았다는 이유로 사용자 의도를 이해했다고 간주하지 않는다. 위반 판별: 검색·비교 기록이나 확정한 동작 사례 없이 구현을 시작했다. [상세](rules/ai-development.md#principle)
- [AI-002][-] **Given-When-Then · YAGNI** — 구현 전에 "누가 어떤 상황에서 무엇을 하면 어떤 결과"를 적고, 요청에 없는 동작을 확정 사양으로 추가하지 않는다. 위반 판별: 기대 결과 문장이 없거나 요청에 없는 기능이 사양에 들어 있다. [상세](rules/ai-development.md#given-when-then)
- [AI-003][-] **Prior Art 조사 · Primary Source** — 요청 기능의 일반적 처리 방식과 공식 문서·일차 자료를 최소 한 번 검색해 실제 내용을 읽고, 현재 API·구현과 대조한다. 위반 판별: 검색어나 결과 제목만 보고 검토를 끝냈다. [상세](rules/ai-development.md#prior-art)
- [AI-004][-] **ADR (Decision Record)** — 사용자 요구 / 조사로 확인한 관례·기술 제약 / 이번에 적용할 동작을 나눠 비교하고 출처·조회 기준·가정을 남긴다. 위반 판별: 세 항목 중 하나가 기록에 없다. [상세](rules/ai-development.md#decision-record)
- [AI-005][-] **Happy Path / Edge Case · Example Mapping** — 정상 사례와 해석이 갈리는 반례의 기대 결과를 구현 전에 확정한다. 위반 판별: 반례 사례가 0개다. [상세](rules/ai-development.md#examples)
- [AI-006][-] **One-way / Two-way Door** — 명확한 요청이나 기존 합의로 정할 수 있으면 근거를 적고 진행하고, 해석에 따라 결과가 달라지는 미결정만 선택지와 차이를 붙여 질문한다. 이미 정한 내용을 반복 승인받지 않는다. 위반 판별: 기존 합의로 정해진 사항을 다시 물었거나, 결과가 갈리는 미결정을 묻지 않고 임의로 정했다. [상세](rules/ai-development.md#two-way-door)
- [AI-007][-] **Known Unknowns · Fail Loudly** — 검색이 막히거나 근거를 확보하지 못하면 검토 완료로 꾸미지 않고 미확인 범위와 영향을 먼저 알린다. 위반 판별: 미확인 범위 없이 "확인됨"으로 보고했다. [상세](rules/ai-development.md#known-unknowns)
- [AI-008][-] **No Magic Number · SSOT(기준값)** — 미지정 수치 초안은 사용자 지정값·확정 계약을 우선하고, 새 값은 100·50·25·1·0.5·0.25·0.1처럼 비교하기 쉬운 값을 후보로, 연관 수치는 기준값 하나에서 배율로 파생한다. 이미 합의·구현된 수치는 요청 없이 재정규화하지 않는다. 위반 판별: 서로 독립된 임의 상수가 연관 수치로 추가되었거나, 기존 수치가 요청 없이 바뀌었다. [상세](rules/ai-development.md#numeric-drafts)
- [AI-009][-] **Upstream First · Rule of Three** — 공통 모듈의 한계·버그를 만나면 원인과 최소 재현을 확보하고, 재사용성·API 책임 범위·하위 호환·비용을 기준으로 공통 개선 여부를 스스로 판단해 끝까지 반영한다. 공통이면 모듈 수정 → 회귀 검증 → 버전 판정·배포 → 소비 게임 반영·검증, 게임 고유면 제품 계층에 두고 근거를 기록한다. 위반 판별: 제약만 보고하고 멈췄거나 게임 쪽 임시 우회로 끝냈다. [상세](rules/ai-development.md#shared-modules)
- [AI-010][-] **SSOT(원본) · Derived Artifact 비커밋 · Memoization** — SVG 정적 벡터 아트는 원본 SVG만 자산으로 포함하고, 공통 브라우저 로더가 시작 시 1회 컴파일·캐시하며, 생성된 메시를 배포물에 넣지 않고, 원본과 렌더를 나란히 비교한다. 위반 판별: Base64 메시나 generated resources가 번들에 있거나, 프레임마다 SVG를 파싱한다. [상세](rules/ai-development.md#svg-assets)
- [AI-011][-] **Dirty Flag · Debounce(maxWait) · Profile Before Optimizing** — 자동 저장은 지속 상태의 revision/dirty가 바뀔 때만 묶어서(maxWait 상한 포함) 하고, 직렬화·검증과 전체 복원을 분리하며, 큰 직렬화와 동기 I/O를 렌더 경로에서 호출하지 않고, 비용을 실측한다. 위반 판별: 프레임 함수에서 변경 확인 없이 전체 스냅샷 직렬화나 localStorage.setItem을 호출한다. [상세](rules/ai-development.md#autosave)
- [AI-012][-] **Fixed Timestep / Sub-stepping · Functional ≠ Non-functional** — 논리 틱은 총 dt로 1회 갱신하고 이동·충돌처럼 세분화가 필요한 작업만 물리 하위 단계로 반복하며, 빈도 × 대상 수 × 중첩으로 총량을 계산하고 실측한다. 기능 E2E 통과를 성능 근거로 쓰지 않는다. 위반 판별: AI·생성/소멸·전체 인덱스 재구축이 물리 하위 단계 횟수만큼 반복된다. [상세](rules/ai-development.md#simulation-cadence)
- [AI-013][-] **Acceptance Test · Moving the Goalposts 금지** — 구현 전 확정한 정상·반례 시나리오를 그대로 실행해 관찰 결과를 비교하고, 기대 동작·실제 결과·환경·커밋·실패·미실행 범위를 보고하며, 기대 결과를 구현에 맞춰 바꾸지 않는다. 위반 판별: 함수명·수식 확인만으로 검증 완료라고 보고했거나 미실행 범위 기록이 없다. [상세](rules/ai-development.md#verification)
- [AI-014][-] **Definition of Done · Docs as Code** — 새로 확정된 계약은 해당 기능의 원본 문서와 PR에 남기고, 검증 완료와 병합·공개 완료를 각각 확인한다. 위반 판별: 계약 변경이 PR 본문과 원본 문서에 없다. [상세](rules/ai-development.md#verification)

## 구조 규칙 {#dev}

코드 구조·설계 원칙. 나중 수정 비용이 큰 순서(P0 → P1 → P2). 원본: [공통 개발 규칙](rules/development.md).

#### P0 — 초기에 반드시 잡기

- [DEV-001][P0] **SSOT · Single Ownership** — 같은 의미의 상태·공식·판정 로직은 한 곳에서만 정의하고, 그 상태를 생성·수정·삭제하는 주체는 1개만 둔다. 위반 판별: 같은 필드를 2곳 이상에서 대입하거나 같은 공식이 2개 이상 모듈에 있다. [상세](rules/development.md#ownership)
- [DEV-002][P0] **Make Illegal States Unrepresentable · State Machine** — 동시에 성립할 수 있는 상태는 독립 boolean으로, 상호배타적인 택 1 상태는 enum/state machine으로 정의한다. 위반 판별: 서로 배타적이어야 하는 boolean 필드가 2개 이상 있다. [상세](rules/development.md#state-machine)
- [DEV-003][P0] **IS-A / HAS-A / CAN-BE · Composition over Inheritance** — 객체 관계를 IS-A(상속)·HAS-A(composition)·CAN-BE(mixin/trait)로 먼저 구분하고 그 관계에 맞는 구현을 쓴다. CAN-BE capability는 자기 상태와 로직을 mixin이 직접 소유하고, Host가 이미 소유한 HAS-A 객체를 다시 만들지 않는다. 위반 판별: 기능 조합을 상속 계층으로 표현했거나, 단순 capability를 component 배열·registry를 거쳐 호출하거나, mixin이 Host 소유 객체를 중복 생성한다. [상세](rules/development.md#composition)
- [DEV-004][P0] **Capability-based Design** — 로직 분기는 유닛명·타입명·ID·맵 이름이 아니라 capability 보유 여부와 데이터로 한다. 위반 판별: `type === "..."` 또는 맵 이름 비교로 행동이 갈린다. [상세](rules/development.md#capability)
- [DEV-005][P0] **Instance Configuration** — 같은 behavior를 쓰는 인스턴스마다 독립된 parameter를 가질 수 있어야 한다. 위반 판별: 정적 필드나 공유 객체 하나로 모든 인스턴스의 값이 강제된다. [상세](rules/development.md#instance)
- [DEV-006][P0] **Dependency Inversion** — 도메인/게임 로직은 네트워크·렌더러·저장소·프레임워크 API를 직접 호출하지 않고 교체 가능한 경계(transport 등)를 거친다. 위반 판별: 게임 로직 파일이 peer/renderer/storage API를 직접 import하거나 호출한다. [상세](rules/development.md#dependency)
- [DEV-007][P0] **Signal Ownership · Observer** — "내게 이런 일이 일어났다"는 통지는 발생 주체가 소유한 public Signal로 노출하고, 발신자는 구독자를 모른다. 위반 판별: 전역 이벤트 버스에 문자열 이벤트명으로 emit하거나, 발생 주체가 점수·VFX·UI 시스템을 직접 호출한다. [상세](rules/development.md#signal)

#### P1 — 자주 발생하는 개발 작업

- [DEV-008][P1] **CQS (Command-Query Separation)** — 값을 읽는 함수는 상태를 바꾸지 않는다. 위반 판별: get*/is* 함수 안에 대입이나 재계산 호출이 있다. [상세](rules/development.md#cqs)
- [DEV-009][P1] **Encapsulation** — 외부에서 다른 객체의 내부 자료구조를 직접 조작하지 않고 의미 있는 메서드를 거친다. 위반 판별: 다른 객체의 Map/Array 필드를 외부에서 직접 add/delete한다. [상세](rules/development.md#encapsulation)
- [DEV-010][P1] **Semantic API · Intention-Revealing Name** — API 이름은 구현 방법이 아니라 도메인 의미를 나타낸다. 위반 판별: 함수 이름에 자료구조나 알고리즘 단계(updateArrayAndCalculate…)가 들어 있다. [상세](rules/development.md#semantic)
- [DEV-011][P1] **Locality of Change · Open-Closed** — 기능 하나를 추가·변경할 때 수정 위치를 최소로 하고, 새 capability는 구현 + 등록으로 끝낸다. 위반 판별: 기능 하나를 추가하려고 3개 이상 파일의 switch/if 분기를 고친다. [상세](rules/development.md#locality)
- [DEV-012][P1] **SRP · High Cohesion / Low Coupling** — 변경 이유가 다른 코드(판정·VFX·사운드·네트워크)는 한 함수에 섞지 않고 각자 책임에서 반응한다. 위반 판별: 한 함수가 게임 판정과 표현·전송 호출을 함께 가진다. [상세](rules/development.md#srp)
- [DEV-013][P1] **Data-Driven Design** — behavior는 코드로, 그 behavior의 수치(시간·거리·개수)는 설정 데이터로 둔다. 설정에 없는 독립 행동을 임의 플래그로 흉내 내지 않는다. 위반 판별: 타입별 if문 안에 수치 상수가 박혀 있다. [상세](rules/development.md#data-driven)
- [DEV-014][P1] **Lifecycle · Dispose Pattern** — 객체·효과는 생성·활성·종료·정리 단계를 명시하고, dispose에서 타이머·구독·registry 참조를 모두 해제한다. 위반 판별: active=false만 바꾸고 구독·타이머가 남아 있다. [상세](rules/development.md#lifecycle)

#### P2 — 방치하면 쌓이는 구조 부채

- [DEV-015][P2] **No Dead Code** — consumer가 없는 코드·설정·필드는 삭제하고, 다시 필요해지면 현재 구조로 구현한다. 위반 판별: 참조가 0인 필드·옵션·함수가 남아 있다. [상세](rules/development.md#dead)
- [DEV-016][P2] **No Legacy Fallback** — 이관 검증이 끝나면 구 구현 fallback을 제거한다. 위반 판별: `if (!newSystem()) legacySystem()` 형태의 분기가 남아 있다. [상세](rules/development.md#legacy)
- [DEV-017][P2] **DRY** — 같은 지식(공식·판정 규칙)은 한 곳에만 둔다. 코드 모양이 같다는 이유만으로 합치지 않는다. 위반 판별: 같은 공식이 2개 이상 모듈에 복사되어 있다. [상세](rules/development.md#dry)
- [DEV-018][P2] **YAGNI · Rule of Three · KISS** — 사용처가 1개인 동안에는 추상화·factory·registry를 만들지 않고, 실제 반복이 생길 때 공통화한다. 위반 판별: 구현체가 1개뿐인 인터페이스·추상 클래스·전략 어댑터가 있다. [상세](rules/development.md#yagni)
- [DEV-019][P2] **Ubiquitous Language** — 같은 개념에는 코드 전체에서 같은 이름을 쓴다. 위반 판별: 같은 뜻의 필드가 attackDelay/fireDelay/cooldown처럼 서로 다른 이름으로 존재한다. [상세](rules/development.md#language)
- [DEV-020][P2] **Hierarchical Naming · Semantic Namespace** — 같은 기능에 속하는 상태는 접두어 반복 대신 기능 단위 namespace 객체로 묶고, 단위는 leaf 이름(Ms, Rad, Px)에 남긴다. 계층은 기능·소유권·하위 개념을 구분하는 데 필요한 만큼만 만든다. 위반 판별: 같은 접두어 필드가 3개 이상 평평하게 나열되거나, 의미 없는 wrapper 계층이 있다. [상세](rules/development.md#hierarchical-naming)
- [DEV-021][P2] **Single Level of Abstraction** — 한 함수 안에서는 같은 추상화 수준의 호출만 둔다. 위반 판별: 도메인 단계 호출 사이에 저수준 API(gl.bindBuffer 등) 호출이 섞여 있다. [상세](rules/development.md#abstraction)
- [DEV-022][P2] **Replace, Don't Layer · Refactor for Changeability** — 특수 케이스 분기가 반복되면 분기를 덧대지 않고 공통 capability/contract로 구조를 교체한다. 위반 판별: 같은 함수에 특수 케이스 else-if가 4개 이상이다. [상세](rules/development.md#replace)

#### JavaScript Mixin 구현 규약

- [DEV-023][-] **Subclass Factory · No Mixin Base** — Mixin은 Base를 받아 `class extends Base`를 반환하는 Subclass Factory로 만들고, Mixin 전용 공통 Base 클래스를 두지 않는다. 위반 판별: MixinBase 같은 클래스를 상속해야만 mixin을 쓸 수 있다. [상세](rules/development.md#mixin-base)
- [DEV-024][-] **Composable Mixins** — 조합 API는 `mixin(Base, ...Mixins)`와 `mixin(...Mixins)` 두 형태만 쓰고, 항상 함께 필요한 Mixin은 상위 Mixin 안에서 조합해 사용처가 선행 Mixin을 반복해서 적지 않게 한다. 위반 판별: 사용처가 Position, LinearPhysics처럼 선행 Mixin을 매번 나열한다. [상세](rules/development.md#mixin-helper)
- [DEV-025][-] **Mixin Requirements · Dedupe · Super Chain** — Mixin constructor는 `super(...args)`로 인자를 그대로 전달하고, 같은 Mixin은 함수 identity 기준으로 한 번만 적용하며, 조합으로 해결되지 않는 Host 필드·메서드 요구만 Requires.*로 검증하고, 같은 public method를 우연히 덮어쓰지 않는다. 위반 판별: Base constructor 시그니처를 가정하거나, 같은 Mixin이 두 번 적용되거나, super 체인 없이 메서드를 덮어쓴다. [상세](rules/development.md#mixin-requirements)
- [DEV-026][-] **Mixin Granularity** — Mixin은 실제로 따로 쓰이는 최소 capability 단위로만 나눈다. 위반 판별: 단독 사용처가 없는 Mixin이 있다. [상세](rules/development.md#mixin-examples)

## PR·버전·검증·배포 {#pm}

개발 외 운영 규칙. 원본: [공통 프로젝트 관리 규칙](rules/project-management.md).

- [PM-001][-] **SemVer (제품 세대 기준 MAJOR)** — 버전 판정은 제품 세대 변경 → MAJOR, 비호환 변경 → MINOR, 호환되는 의미 있는 변경 → PATCH, 외부 동작·계약이 같은 내부 정리 → 버전 유지 순서로 한다. 위반 판별: 순수 리팩터링·문서 수정에 PATCH를 올렸거나, 비호환 변경에 PATCH만 올렸다. [상세](rules/project-management.md#version-decision)
- [PM-002][-] **Single Version · KISS** — 기능·모듈별 별도 버전을 만들지 않고 메인 버전 하나만 둔다. 런타임 호환성 판정에 반드시 필요한 기술 식별자만 메인 버전과 분리해 둔다. 위반 판별: Consumer가 없는 `*_VERSION` 상수가 있다. [상세](rules/project-management.md#version-split)
- [PM-003][-] **SSOT · Baseline** — 작업 시작 시 기준본은 사용자 지정본 → 현재 Stable → 최근 Validated → Candidate 순서로 하나만 확정하고, 기억보다 실제 저장소·커밋 상태를 우선한다. 위반 판별: 기준 커밋·태그를 적지 않고 작업을 시작했다. [상세](rules/project-management.md#ssot)
- [PM-004][-] **Replace, Then Clean Up · No Legacy Fallback** — 마이그레이션은 구 구조를 새 구조로 교체하고 구 참조·호환 계층·Legacy를 정리해야 완료다. 호환 계층은 대상·Consumer·사유·범위·제거 조건을 적은 명시적 예외만 둔다. 위반 판별: 요청 없는 fallback·adapter·alias가 남아 있다. [상세](rules/project-management.md#migration)
- [PM-005][-] **Immutable Tags · Release Channels** — 전시용 릴리즈는 Git 태그가 가리키는 HTML 스냅샷을 직접 프리뷰한다. Nightly는 `main` 푸시마다 자동 태그이고, Stable은 커밋 SHA·제품 버전·검증 승인을 명시할 때만 만들며, 과거 태그를 재지정·삭제하지 않는다. 위반 판별: 태그를 다른 커밋으로 옮겼거나 Nightly를 Stable로 표시했다. [상세](rules/project-management.md#tag-preview)
- [PM-006][-] **Branch-PR Flow · Merge on Verified** — 작업 브랜치에서 `main` 대상 PR을 만들고, 검증을 마친 PR은 별도 승인을 묻지 않고 머지한다. 작업 전 실제 Git 상태를 확인하고, 병합된 PR·Draft·CI 실패 상태를 Stable로 착각하지 않는다. 위반 판별: 검증이 끝난 PR의 머지를 질문으로 미뤘거나, Git 상태 확인 없이 브랜치를 만들었다. [상세](rules/project-management.md#git)
- [PM-007][-] **Conventional Commits (한국어·대괄호 prefix)** — 커밋 메시지는 한국어로 쓰고, 첫 줄에 `[bug-fix]`·`[feature]`·`[refactor]`·`[performance]`·`[docs]`·`[test]`·`[build]` prefix와 변경 목적을 적는다. 위반 판별: prefix가 없거나 첫 줄에 목적이 없다. [상세](rules/project-management.md#commit)
- [PM-008][-] **Verified Deliverable** — 최종본으로 전달하는 파일은 검증이 끝난 것이어야 하고, Nightly·중간본은 미검증 상태를 명시할 때만 공개한다. 위반 판별: 검증 기록 없는 파일을 최종본으로 전달했다. [상세](rules/project-management.md#delivery)
- [PM-009][-] **Scenario E2E Only · Time Box 180s** — 단위 테스트는 개발 중 임시 검증에만 쓰고 완료 시 실행 목록에서 제거하며, 영구 테스트는 고정 사용자 시나리오 E2E만 유지한다. 한 번의 버그 검증 실행 전체는 180초를 넘기지 않고, 벤치마크는 별도 명령으로 분리한다. 위반 판별: 버그마다 회귀 테스트가 누적되거나, 검증 실행이 180초를 넘는다. [상세](rules/project-management.md#verification-policy)
- [PM-010][-] **Evidence-based Verification · Done ≠ Released** — 검증 기록에는 환경(커밋·브라우저/기기·로드한 라이브러리·mock/fallback 여부), 실패 단계, PASS·FAIL·미실행·환경 차단 범위를 적고, mock·소프트웨어 renderer 통과를 실제 경로의 성공으로 보고하지 않는다. 구현 완료·검증 완료·Stable 승격·배포 완료를 같은 것으로 취급하지 않는다. 위반 판별: 미실행 범위 없이 전체 PASS로 보고했다. [상세](rules/project-management.md#verification-evidence)
- [PM-011][-] **Handoff Document** — 작업 공간을 옮길 때는 기준본·메인 버전·커밋·완료/진행/남은 작업·중요 결정·폐기 방향·검증 결과·다음 작업 순서를 담은 핸드오프를 쓴다. 위반 판별: 요약만 있고 다음 작업 순서나 기준 커밋이 없다. [상세](rules/project-management.md#handoff)
- [PM-012][-] **Definition of Done · Docs as Code** — 작업 완료에는 변경된 API·사용법·실행 명령·운영 정책의 원본 문서 동기화가 포함되며, 정책 원문을 여러 문서에 복제하지 않는다. 위반 판별: 코드 변경 PR에 해당 원본 문서 갱신이 없다. [상세](rules/project-management.md#docs)
- [PM-013][-] **KISS · Minimal Complexity** — 관리 계층(버전·호환 계층·문서·분기)은 실제 문제를 해결하는 경우에만 추가한다. 위반 판별: 사용처 없는 관리 요소가 추가되었다. [상세](rules/project-management.md#complexity)

## 상황별 레퍼런스 {#refs}

아래 문서는 해당 작업을 할 때만 읽는다. 원본은 각 HTML이다.

| 언제 | 문서 |
| --- | --- |
| UI·화면·모바일 레이아웃을 만들거나 고칠 때 | [공통 UI/UX 레퍼런스](rules/visual-ux.html) — P1–P10 우선순위, URL·상태·생명주기, 시각 피드백 |
| 게임 규칙·재미·해금·수치 초안을 기획할 때 | [게임 기획 가이드](rules/game-design.html) — 연쇄 반응, 해금, 규칙 단순화, 수치 초안 정규화 |
| 타격감·접촉·반동·피격 연출을 만들 때 | [타격감 종합 가이드](rules/impact-feel.html) |
| 스탯 이름·단위·계산식을 정할 때 | [공통 STAT 사전](rules/stats.html) |
| 예약 버그 탐지·자동 수정 운영을 다룰 때 | [예약 버그 탐지](rules/scheduled-bug-qa.html) |
| 알고리즘 선택·비용·대안을 볼 때 | [알고리즘 레퍼런스](algorithms/index.html), [절차적 지형 생성](algorithms/terrain-generation.html) |
