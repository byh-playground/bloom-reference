---
title: 공통 개발 규칙
kicker: Development Rules
subtitle: 유지보수성과 확장성을 위한 비용 우선순위판. 특정 프로젝트에 종속되지 않는 구조·코딩 원칙.
brand_small: 구조 원칙 SSOT
badges: 개발 규칙 SSOT*, P0 → P1 → P2, IS-A / HAS-A / CAN-BE
search_placeholder: 규칙 검색 (예: SSOT, Mixin, Signal)
footer: 공통 개발 규칙 — 비용 우선순위판. 특정 프로젝트에 종속되지 않는 유지보수·확장 개발용 기준.
---

함께 읽기: [AI 개발 규칙 · 의도·검색·동작 확정](ai-development.md) · [공통 UI/UX 레퍼런스](visual-ux.html) · [공통 STAT 사전](stats.html) · [절차적 지형 생성](../algorithms/terrain-generation.html). 이 문서는 구조 원칙을, 각 전문 문서는 정보 우선순위·수치 계약·생성 파이프라인을 소유한다.

> [!NOTE] **정렬 기준**
> “얼마나 멋진 원칙인가”가 아니라 **초기에 방치했을 때 나중에 고치는 비용이 얼마나 커지는가**로 순서를 정한다. 즉, 구조를 뒤엎어야 하는 문제일수록 위에 둔다. 나쁜 예와 좋은 예를 바로 만들 수 없는 원칙은 우선순위를 낮춘다. 적용 장면이 명확하지 않다면 아직 추상적이라는 뜻이다.

| 우선순위 | 뜻 | 방치했을 때 |
| --- | --- | --- |
| P0 — 초기 구조 | 초기에 잡아야 하는 구조 결정 | 데이터 구조·API·의존성 전체를 다시 뜯어야 한다 |
| P1 — 일상 개발 | 기능 추가·수정 때 매우 자주 마주치는 규칙 | 변경 범위가 넓어진다 |
| P2 — 누적 부채 | 즉시 치명적이지 않은 정리 규칙 | 코드베이스가 서서히 굳고 유지보수 비용이 커진다 |

## P0 — 초기에 반드시 잡기 {#p0}

초기 설계를 잘못하면 나중에 단순 리팩터링이 아니라 데이터 구조와 호출 관계를 다시 설계해야 하는 항목들이다.

### 하나의 상태에는 하나의 진실과 하나의 소유자 {#ownership}

- [DEV-001][P0] **SSOT · Single Ownership** — 같은 의미의 상태·공식·판정 로직은 한 곳에서만 정의하고, 그 상태를 생성·수정·삭제하는 주체는 1개만 둔다. 위반 판별: 같은 필드를 2곳 이상에서 대입하거나 같은 공식이 2개 이상 모듈에 있다.

태그: #SSOT #SingleOwnership #SingleWriter

빈도: 매우 높음 · 나중 수정비용: 매우 큼

같은 의미의 상태·공식·판정 로직을 여러 곳에서 따로 관리하지 않는다. mutable state는 누가 생성·수정·삭제하는지 하나로 정한다.

**나쁜 예**

```js
unit.hp -= damage;
hud.hp = unit.hp;
network.hp = unit.hp;

// 다른 곳에서도 각각 hp 수정
hud.hp -= 10;
```

**좋은 예**

```js
unit.applyDamage(damage);

// HUD/Network는 unit의 결과를 읽거나
// unit이 발행한 상태 변화만 구독
```

### Checkbox 상태와 Radio 상태를 구조적으로 구분 {#state-machine}

- [DEV-002][P0] **Make Illegal States Unrepresentable · State Machine** — 동시에 성립할 수 있는 상태는 독립 boolean으로, 상호배타적인 택 1 상태는 enum/state machine으로 정의한다. 위반 판별: 서로 배타적이어야 하는 boolean 필드가 2개 이상 있다.

태그: #StateMachine #MakeIllegalStatesUnrepresentable

빈도: 높음 · 나중 수정비용: 매우 큼

동시에 성립 가능한 상태는 flag로, 상호배타적인 택 1 상태는 enum/state machine으로 정의한다. 택 1 상태를 여러 boolean을 켜고 끄는 방식으로 구현하지 않는다.

**나쁜 예**

```js
isIdle = false;
isMoving = true;
isAttacking = true;
isStunned = true;
```
존재하면 안 되는 조합이 구조적으로 가능하다.

**좋은 예**

```js
state = UnitState.MOVING;

isSelected = true;
isPoisoned = true;
```
Radio 상태는 하나만, Checkbox 상태는 독립 flag로 둔다.

### 관계의 종류에 따라 구현 방식을 구분한다 {#composition}

- [DEV-003][P0] **IS-A / HAS-A / CAN-BE · Composition over Inheritance** — 객체 관계를 IS-A(상속)·HAS-A(composition)·CAN-BE(mixin/trait)로 먼저 구분하고 그 관계에 맞는 구현을 쓴다. CAN-BE capability는 자기 상태와 로직을 mixin이 직접 소유하고, Host가 이미 소유한 HAS-A 객체를 다시 만들지 않는다. 위반 판별: 기능 조합을 상속 계층으로 표현했거나, 단순 capability를 component 배열·registry를 거쳐 호출하거나, mixin이 Host 소유 객체를 중복 생성한다.

태그: #IS_A_HAS_A_CAN_BE #CompositionOverInheritance #Mixin #CapabilityOwnership

빈도: 높음 · 나중 수정비용: 매우 큼

모든 재사용을 composition 하나로 해결하지 않는다. 객체 관계의 의미를 먼저 구분하고, 그 의미에 가장 자연스러운 구현 방식을 사용한다.

| 관계       | 질문                                         | 기본 구현                                   | 대표 예                |
|------------|----------------------------------------------|---------------------------------------------|------------------------|
| **IS-A**   | “이것은 본질적으로 저것의 한 종류인가?”      | 상속 / 공통 base type                       | `Dragon IS-A Unit`     |
| **HAS-A**  | “이것이 독립적인 부품/객체를 가지고 있는가?” | Composition                                 | `Unit HAS-A Weapon`    |
| **CAN-BE** | “필요하면 이 능력/성질을 가질 수 있는가?”    | Mixin / Trait / capability method injection | `Unit CAN-BE Jumpable` |

> **핵심:** Composition은 기본값이 아니라 **HAS-A 관계의 기본값**이다. CAN-BE까지 전부 component 배열로 밀어 넣으면 호출 깊이와 간접성이 커져 코드가 오히려 비직관적일 수 있다.

#### IS-A → 상속

도메인적으로 정말 같은 종류이고, base contract가 작고 안정적일 때만 사용한다.

**나쁜 예 — 기능을 상속 계층으로 표현**

```text
FlyingPoisonEliteRangedUnit
  extends FlyingRangedUnit
    extends RangedUnit
      extends Unit
```

**좋은 예 — 본질적인 타입 관계만 상속**

```js
class Unit {
  update() {}
  destroy() {}
}

class Dragon extends Unit {
  // Dragon도 본질적으로 Unit
}
```

#### HAS-A → Composition

독립적인 상태와 생명주기를 가진 부품, 교체 가능한 객체, 별도 소유권이 필요한 경우 composition을 사용한다.

**나쁜 예 — 부품을 상속으로 표현**

```js
class SwordUnit extends Unit {
  // Sword 때문에 새로운 Unit 타입 생성
}
```

**좋은 예 — 부품을 소유**

```js
class Unit {
  constructor(weapon) {
    this.weapon = weapon;
  }

  attack(target) {
    this.weapon.attack(target);
  }
}
```

#### CAN-BE → Mixin / Trait

객체의 본질적인 타입도 아니고, 독립 부품을 소유하는 것도 아니지만 선택적으로 “할 수 있는 것”이라면 mixin/trait 계열이 더 직접적일 수 있다.

**나쁜 예 — 모든 능력을 component 배열 순회로 처리**

```text
unit.components = [
  movement,
  jump,
  shield,
  poison,
  capture
];

for (const c of unit.components) {
  c.update?.(dt);
}

// 실제 jump 호출 위치를 찾으려면
// registry → component → handler를 계속 따라가야 함
```

**좋은 예 — 능력이 객체 API에 직접 드러남**

```js
const Jumpable = Base => class extends Base {
  jump() {
    this.velocity.z = this.jump.power;
  }
};

class Unit {
  move() {}
}

class Flea extends Jumpable(Unit) {}

flea.jump();
```

이 방식의 장점은 호출부가 `unit.jump()`처럼 평평하고 직관적이라는 것이다. 능력 하나를 실행하기 위해 `components[]`를 찾고 순회하거나 중간 registry를 통과할 필요가 없다.

#### CAN-BE를 Composition으로 써도 되는 경우

Mixin을 무조건 쓰는 것도 아니다. 다음 조건이면 composition이 더 적합하다.

- 능력 자체가 큰 상태를 가진다.
- 별도의 lifecycle이 있다.
- 런타임에 교체/탈착되어야 한다.
- 동일 capability를 여러 구현으로 갈아끼워야 한다.

**나쁜 예 — Unit이 capability 내부 구조를 직접 소유/중계**

```js
class Unit {
  constructor(jumpAbility) {
    this.jumpAbility = jumpAbility;
  }

  jump() {
    this.jumpAbility.execute(this);
  }
}
```
`Unit`이 Jump의 component 존재와 호출 방법을 알아야 하므로 상태·로직 소유권이 분산된다.

**좋은 예 — 단순 capability는 Mixin이 직접 상태와 로직을 소유**

```js
const Jumpable = Base => class extends Base {
  constructor(...args) {
    super(...args);

    this.jump.power = 12;
    this.jump.cooldown.durationMs = 800;
    this.jump.cooldown.leftMs = 0;
  }

  jump() {
    if (this.jump.cooldown.leftMs > 0) return false;

    this.velocity.z = this.jump.power;
    this.jump.cooldown.leftMs = this.jump.cooldown.durationMs;
    return true;
  }

  updateJump(dt) {
    this.jump.cooldown.leftMs = Math.max(
      0,
      this.jump.cooldown.leftMs - dt
    );
  }
};

class Unit {
  move() {}
}

class Flea extends Jumpable(Unit) {}

flea.jump();
```
점프 자체가 하나의 capability이므로 별도 `JumpAbility` component를 만들지 않는다. 점프 전용 상태와 로직은 `Jumpable` 안에 바로 둔다.

**규칙:** CAN-BE capability는 가능한 한 **자기 상태와 로직을 Mixin/Trait 자체에 직접 가진다.** 단순 capability 안에 또 capability용 component를 만들어 한 단계 더 감싸지 않는다.

```text
Jumpable Mixin
 ├─ jump.power
 ├─ jump.cooldown.durationMs
 ├─ jump()
 └─ updateJump()

// Jumpable 안에 JumpAbility를 또 넣지 않음
```
Mixin이 커져서 내부를 다시 component로 쪼개고 싶어질 정도라면, 우선 그 Mixin 자체가 여러 capability를 떠안고 있는지 본다. 그렇다면 **하위 composition을 추가하기보다 capability를 더 작은 Mixin/Trait으로 분리**한다.

**나쁜 예 — 비대해진 Mixin 안에 다시 내부 component 계층 생성**

```text
Jumpable
 ├─ JumpPhysics
 ├─ JumpCooldown
 ├─ JumpLanding
 └─ JumpEffects
```

**좋은 방향 — 독립 capability로 분리**

```text
Unit
 ├─ Jumpable
 ├─ Landable
 └─ AirControl
```
각 capability가 자기 상태와 로직을 직접 소유한다.

```text
Unit
 ├─ weapon               ← Unit이 정당하게 소유하는 HAS-A composition
 │    └─ Sword
 │
 └─ SwordTechnique Mixin ← sword 전용 CAN-BE capability
      └─ base.weapon 참조
```
이미 Host가 정당하게 소유하는 composition이 있다면 Mixin이 그것을 참조해 특수 기능을 정의할 수 있다. 이 경우 Mixin이 `weapon` 자체를 다시 소유하거나 중복 생성하지 않는다.

**나쁜 예 — 같은 하위 상태를 이중 소유**

```js
class Unit {
  constructor() {
    this.weapon = new Sword();
  }
}

const SwordTechnique = Base => class extends Base {
  constructor(...args) {
    super(...args);
    this.sword = new Sword(); // 중복 소유
  }

  parry() {
    this.sword.parry();
  }
};
```

**좋은 예 — 기존 HAS-A를 이용해 새로운 capability를 추가**

```js
class Unit {
  constructor(weapon) {
    this.weapon = weapon;
  }
}

const SwordMastery = Base => class extends Base {
  constructor(...args) {
    super(...args);
    this.swordComboStep = 0;
  }

  iaiSlash(target) {
    if (!(this.weapon instanceof Sword)) {
      throw new Error("Sword required");
    }

    const damage =
      this.weapon.getBaseDamage() * 2.5;

    this.weapon.consumeDurability(1);
    target.takeDamage(damage);

    this.swordComboStep = 0;
  }

  advanceSwordCombo() {
    this.swordComboStep =
      (this.swordComboStep + 1) % 3;
  }
};

class SwordMaster extends SwordMastery(Unit) {}

const unit = new SwordMaster(new Sword());
unit.iaiSlash(enemy);
```
`SwordMastery`는 `weapon.attack()`을 다시 감싸지 않는다. 기존 `weapon`을 재료로 사용해 **발도베기·콤보처럼 Unit에 원래 없던 capability**를 추가하고, 그 capability 전용 상태도 Mixin이 소유한다.

즉 **HAS-A의 소유권은 그대로 유지**하고, **CAN-BE는 그 소유 객체를 재료로 사용해 기존 객체에는 없던 새로운 능력·규칙·상태를 추가**한다. 단순 forwarding/wrapping만 하는 Mixin은 만들지 않는다.

**Flat API**와 함께 중요한 것은 **Single Ownership**이다. Mixin은 자신이 추가한 capability의 상태와 로직을 직접 소유한다. 기존 HAS-A 객체를 활용할 수는 있지만 그 객체의 소유권을 복제하지 않는다. Mixin이 비대해져 내부 계층이 필요해지면 먼저 capability 분리를 검토한다.

#### 결정 순서

```text
1. 본질적으로 같은 종류인가?
   → YES: IS-A → 작은 base type / 상속

2. 독립적인 객체·상태·생명주기를 소유하는가?
   → YES: HAS-A → Composition

3. 선택적으로 가질 수 있는 능력/성질인가?
   → YES: CAN-BE → Mixin / Trait 우선 검토

4. CAN-BE 자체가 단순한 capability인가?
   → YES: Mixin/Trait이 상태와 로직을 직접 소유
   → 내부에 같은 의미의 Ability component를 또 만들지 않음

5. Mixin이 너무 커져 내부 하위 계층이 필요해졌는가?
   → YES: 먼저 capability 자체를 더 작은 Mixin/Trait으로 분리
   → 내부 component nesting은 최후 수단

6. CAN-BE가 기존 HAS-A 객체를 이용하는가?
   → YES: 기존 owner의 객체를 참조해 새 capability를 정의
   → 객체 소유권은 기존 owner에 그대로 유지

7. 외부 호출은?
   → 의미 있는 Flat API로 노출
   → 같은 상태/객체의 owner는 끝까지 하나만 유지
```

### 이름이 아니라 능력으로 분기 {#capability}

- [DEV-004][P0] **Capability-based Design** — 로직 분기는 유닛명·타입명·ID·맵 이름이 아니라 capability 보유 여부와 데이터로 한다. 위반 판별: `type === "..."` 또는 맵 이름 비교로 행동이 갈린다.

태그: #CapabilityBasedDesign

빈도: 매우 높음 · 나중 수정비용: 큼

특정 유닛명·타입명·ID가 로직 분기의 핵심이 되지 않게 한다.

보스·맵도 같다. 돌진·소환·단계 전환은 각각 재사용 가능한 capability로 구현하고, 보스별 구성은 능력 조합과 설정으로 표현한다. 맵 이름을 검사해 충돌·스폰을 갈라 놓지 말고 지형 데이터와 이동·스폰 규약을 사용한다. 단, 실제로 행동이 다른 경우에는 새 capability가 필요하며 모든 차이를 거대한 설정 분기로 숨기지 않는다.

**나쁜 예**

```js
if (unit.type === "shadowFlea") {
    jump();
}
```

**좋은 예**

```js
if (unit.hasCapability("jump")) {
    unit.jump();
}
```

### 같은 기능도 인스턴스마다 다른 값을 가질 수 있게 {#instance}

- [DEV-005][P0] **Instance Configuration** — 같은 behavior를 쓰는 인스턴스마다 독립된 parameter를 가질 수 있어야 한다. 위반 판별: 정적 필드나 공유 객체 하나로 모든 인스턴스의 값이 강제된다.

태그: #InstanceConfiguration #ConfigOverride

빈도: 높음 · 나중 수정비용: 큼

코드 재사용이 값 공유를 의미하지 않게 한다. 같은 behavior를 사용하더라도 각 인스턴스가 독립적인 parameter를 가질 수 있어야 한다.

**나쁜 예**

```js
PoisonAttack.damage = 10;

// 모든 독 공격 유닛이
// 같은 damage를 강제로 공유
```

**좋은 예**

```js
new PoisonAttack({
  damage: 25,
  duration: 8
});
```

```text
Default Configuration
        ↓
Type Configuration
        ↓
Instance Configuration
```

### Core가 구체 기술을 직접 알지 않게 {#dependency}

- [DEV-006][P0] **Dependency Inversion** — 도메인/게임 로직은 네트워크·렌더러·저장소·프레임워크 API를 직접 호출하지 않고 교체 가능한 경계(transport 등)를 거친다. 위반 판별: 게임 로직 파일이 peer/renderer/storage API를 직접 import하거나 호출한다.

태그: #DependencyInversion #SeparationOfConcerns

빈도: 중간 · 나중 수정비용: 매우 큼

도메인/게임 로직이 특정 네트워크, 렌더러, 저장소, 프레임워크 API에 직접 종속되지 않게 한다.

**나쁜 예**

```js
game.attack(() => {
  peer.send(packet);
});
```

**좋은 예**

```js
game.attack(command);
transport.send(command);
```
`transport` 뒤 구현은 교체 가능하다.

### Signal은 사건을 발생시키는 당사자가 소유 {#signal}

- [DEV-007][P0] **Signal Ownership · Observer** — "내게 이런 일이 일어났다"는 통지는 발생 주체가 소유한 public Signal로 노출하고, 발신자는 구독자를 모른다. 위반 판별: 전역 이벤트 버스에 문자열 이벤트명으로 emit하거나, 발생 주체가 점수·VFX·UI 시스템을 직접 호출한다.

태그: #SignalPattern #SignalOwnership

빈도: 높음 · 나중 수정비용: 큼

“내게 이런 일이 일어났다”는 통지는 발생 주체의 public signal로 노출한다. 발신자는 subscriber를 알지 않는다.

**나쁜 예**

```js
globalSignals.emit("unitDied", unit);

// 또는
unit.die() {
  scoreSystem.addKill(this);
  vfxSystem.spawn(this);
  ui.remove(this);
}
```

**좋은 예**

```js
class Unit {
  constructor() {
    this.onDied = new Signal();
  }

  die() {
    this.onDied.emit({
      unitId: this.id,
      position: this.position
    });
  }
}

unit.onDied.on(scoreSystem.handle);
unit.onDied.on(vfxSystem.handle);
```

| 의도                    | 방식                      |
|-------------------------|---------------------------|
| 무언가 해줘             | 직접 호출 / Command       |
| 값을 알려줘             | Query                     |
| 내게 이런 일이 일어났다 | 그 당사자가 소유한 Signal |

## P1 — 자주 발생하는 개발 작업 {#p1}

기능을 추가하거나 버그를 고칠 때 반복적으로 마주치는 규칙들이다. 구조 전체를 뒤엎을 정도는 아니어도, 지키지 않으면 매 수정의 비용이 커진다.

### 읽기와 쓰기를 분리 {#cqs}

- [DEV-008][P1] **CQS (Command-Query Separation)** — 값을 읽는 함수는 상태를 바꾸지 않는다. 위반 판별: get*/is* 함수 안에 대입이나 재계산 호출이 있다.

태그: #CommandQuerySeparation

빈도: 매우 높음 · 나중 수정비용: 중간

**나쁜 예**

```js
getHp() {
  this.recalculateBuffs();
  return this.hp;
}
```

**좋은 예**

```js
getHp() {
  return this.hp;
}

refreshBuffs() {
  ...
}
```

### 내부 자료구조를 외부에서 직접 만지지 않기 {#encapsulation}

- [DEV-009][P1] **Encapsulation** — 외부에서 다른 객체의 내부 자료구조를 직접 조작하지 않고 의미 있는 메서드를 거친다. 위반 판별: 다른 객체의 Map/Array 필드를 외부에서 직접 add/delete한다.

태그: #Encapsulation

빈도: 매우 높음 · 나중 수정비용: 중간

**나쁜 예**

```js
combat.units.delete(id);
```

**좋은 예**

```js
combat.removeUnit(id);
```

### 구현 방법이 아니라 의미를 API로 표현 {#semantic}

- [DEV-010][P1] **Semantic API · Intention-Revealing Name** — API 이름은 구현 방법이 아니라 도메인 의미를 나타낸다. 위반 판별: 함수 이름에 자료구조나 알고리즘 단계(updateArrayAndCalculate…)가 들어 있다.

태그: #SemanticAPI

빈도: 매우 높음 · 나중 수정비용: 중간

**나쁜 예**

```text
updateArrayAndCalculateValue(...)
```

**좋은 예**

```text
applyDamage(target, payload)
```

### 기능 하나의 변경은 가능한 적은 위치에서 끝내기 {#locality}

- [DEV-011][P1] **Locality of Change · Open-Closed** — 기능 하나를 추가·변경할 때 수정 위치를 최소로 하고, 새 capability는 구현 + 등록으로 끝낸다. 위반 판별: 기능 하나를 추가하려고 3개 이상 파일의 switch/if 분기를 고친다.

태그: #LocalityOfChange

빈도: 높음 · 나중 수정비용: 중간~큼

**나쁜 예**

```text
// 새 능력 추가 시
Unit.js
Combat.js
UI.js
AI.js
Renderer.js
Network.js

// 6곳 switch 수정
```

**좋은 예**

```js
// 새 capability 구현 + 등록
abilities.register(
  "burrow",
  new BurrowAbility(...)
);
```

### 변경 이유가 다른 코드는 분리 {#srp}

- [DEV-012][P1] **SRP · High Cohesion / Low Coupling** — 변경 이유가 다른 코드(판정·VFX·사운드·네트워크)는 한 함수에 섞지 않고 각자 책임에서 반응한다. 위반 판별: 한 함수가 게임 판정과 표현·전송 호출을 함께 가진다.

태그: #SingleResponsibilityPrinciple #HighCohesionLowCoupling

빈도: 높음 · 나중 수정비용: 중간

**나쁜 예**

```js
attack() {
  calculateDamage();
  drawMuzzleFlash();
  playSound();
  sendNetworkPacket();
}
```

**좋은 예**

```js
attack() {
  return combat.resolveAttack(...);
}

// VFX/Sound/Network는
// 각자 자기 책임에서 반응
```

### Behavior는 코드, Parameters는 데이터 {#data-driven}

- [DEV-013][P1] **Data-Driven Design** — behavior는 코드로, 그 behavior의 수치(시간·거리·개수)는 설정 데이터로 둔다. 설정에 없는 독립 행동을 임의 플래그로 흉내 내지 않는다. 위반 판별: 타입별 if문 안에 수치 상수가 박혀 있다.

태그: #DataDrivenDesign

같은 돌진 행동의 경고 시간·거리, 같은 지형 생성기의 주파수·통로 폭처럼 **값이 다른 부분**은 설정으로 둔다. 설정에 없는 독립 행동까지 임의 플래그로 흉내 내지는 않는다.

```js
// 개념 예시. 특정 런타임 API나 공통 기본값을 강제하지 않는다.
const encounter = {
  boss: {
    capabilities: ["charge", "summon"],
    charge: { warning: { duration: 0.8 }, travel: { distance: 12 } },
    summon: { capacity: 3 }
  },
  map: {
    generator: { id: "island", version: "1" },
    terrain: { noise: { frequency: 0.03 } },
    traversal: { minimumWidth: 3 },
    spawn: { safeRadius: 5 }
  }
};
```
예시 단위는 시간=초, 거리=프로젝트 월드 단위다. 보스의 능력 상태와 지형 생성 결과는 각 owner가 소유한다. 실제 STAT은 [STAT 사전과 활성 게임 프로필](stats.html), 지형 설정·결정론은 [지형 생성 규약](../algorithms/terrain-generation.html)을 따른다.

빈도: 높음 · 나중 수정비용: 중간

**나쁜 예**

```js
if (type === "A") damage = 10;
if (type === "B") damage = 25;
```

**좋은 예**

```js
const config = {
  A: { damage: 10 },
  B: { damage: 25 }
};
```

### 생성·활성·종료·정리를 명확히 {#lifecycle}

- [DEV-014][P1] **Lifecycle · Dispose Pattern** — 객체·효과는 생성·활성·종료·정리 단계를 명시하고, dispose에서 타이머·구독·registry 참조를 모두 해제한다. 위반 판별: active=false만 바꾸고 구독·타이머가 남아 있다.

태그: #Lifecycle

빈도: 중간 · 나중 수정비용: 중간

**나쁜 예**

```js
effect.active = false;
// 구독/타이머/참조는 남아 있음
```

**좋은 예**

```js
effect.dispose();
// timer 해제
// signal unsubscribe
// registry 제거
```

### 예외는 원본 그대로 올린다 {#exception}

- [DEV-027][P1] **Fail Fast · Preserve the Original Exception** — 발생한 예외는 원본 그대로 호출 스택 위로 올리고, 새 Error로 감싸 던지거나 이벤트·콜백에 문자열로 바꿔 알리거나 삼키지 않는다. 새 예외는 내 로직이 직접 오류 조건을 판정한 경우에만 던지고, catch는 그 자리에서 실제로 복구할 수 있을 때만 쓴다. 위반 판별: catch나 이벤트 처리에서 원본 예외 대신 `new Error(...)`를 만들어 올렸거나, 원본의 이름·메시지·스택이 최상위 로그에 남지 않는다.

태그: #FailFast #ExceptionTransparency #PreserveStackTrace

빈도: 높음 · 나중 수정비용: 중간

예외의 이름·메시지·스택은 원인을 찾는 유일한 단서다. 호출 스택 중간에서 새 `Error`로 감싸면 스택이 감싼 지점의 것으로 바뀌어 "어디서 잡았는지"만 남고 "무엇이 던졌는지"는 사라진다. 로그에는 감싼 메시지(`fatal` 같은 이름)만 보이고, 그 뒤에 원본이 다시 올라와도 이미 실패 처리가 끝나 있으면 조용히 버려진다.

| 상황 | 하는 일 |
| --- | --- |
| 호출한 코드가 예외를 던졌고 그 자리에서 복구할 수 없다 | 잡지 않는다. 그대로 올라가게 둔다(정리는 `finally`) |
| 그 자리에서 실제로 복구할 수 있다 | 잡아서 복구한다. 복구했으면 예외는 끝난 것이다 |
| 내 로직이 오류 조건을 직접 판정했다(잘못된 입력·깨진 불변식) | 새 오류를 던진다. 이때만 새 `Error`를 만든다 |
| 이벤트·콜백으로 실패를 알려야 한다 | 원본 예외 객체를 그대로 넘기고, 받는 쪽이 문자열로 바꿔 새 오류를 만들지 않는다 |

**나쁜 예**

```js
// 단계가 던진 예외를 다시 던지기 전에 이벤트로 알린다
catch (error) {
  this.onEvent({ type: 'fatal', error });
  throw error;
}
// 받는 쪽: 이벤트를 받자마자 문자열로 바꿔 먼저 실패 처리한다 → 뒤따라 올라온 원본은 `if (failed) return`에서 버려진다
onEvent(event) {
  if (event.type === 'fatal') fail(new Error(event.reason || event.type)); // 로그에는 "Error: fatal"만 남는다
}
```

**좋은 예**

```js
// 받는 쪽은 감싸지 않는다. 원본이 던져지는 경로가 있으면 그 예외가 최상위 로그에 이름·메시지·스택 그대로 남는다.
onEvent(event) {
  if (event.type === 'desync-unrecoverable') fail(new Error(event.reason)); // 던져진 예외가 없어 내 로직이 직접 만든 오류
}
```

`cause`로 원본을 붙여 감싸는 것도 같은 규칙으로 막는다. 감싼 스택이 로그의 맨 앞에 오기 때문이다. 사례: 도장깨기 경기 중 단계 예외가 `Error: fatal`로 감싸져 원인을 알 수 없었다(bloom-takraw v0.15.9에서 감싸기를 제거).

### 플레이 중 처음 쓰는 순간에 로드하지 않는다 {#preload}

- [DEV-032][P1] **Preload Before Play · No In-game First-use Load** — 플레이 중 처음 쓰이는 순간에 셰이더 프로그램 컴파일·링크, 텍스처 GPU 업로드, 오디오 디코딩, GPU 자원(렌더 타깃·복사 텍스처) 할당이 일어나지 않게 한다. 플레이에 쓰이는 것은 로딩 단계에서 실제 사용 상태(조명·그림자·안개·톤 매핑 등 변종 키가 같은 조건)로 미리 컴파일·업로드·할당하고, 플레이 중 재질의 define을 바꿔 재컴파일이 일어나게 하지 않고 uniform으로 바꾼다. 화면 크기 변경 같은 플레이 밖 동작의 재할당은 예외다. 변경이 경기 중 컴파일·업로드를 만들 수 있으면 왜 만들지 않는지(예: 새 재질이 미리 준비 목록에 들어가는 위치)를 코드로 PR에 적고, 게임에 이미 있는 진단 수단으로 한 번 읽을 수 있을 때만 실제 횟수를 덧붙인다. 반복 측정은 요청받았을 때만 한다. 위반 판별: 로딩 완료 이후 플레이 중에 새 셰이더 프로그램이 컴파일되거나(렌더러의 프로그램 목록이 늘거나 `linkProgram` 호출이 생긴다), 새 이펙트의 첫 사용 프레임이 이후 프레임보다 눈에 띄게 길다.

태그: #PreloadBeforePlay #NoInGameLoad #ShaderWarmup #FirstUseHitch

빈도: 높음 · 나중 수정비용: 중간

셰이더 컴파일·링크, 텍스처 GPU 업로드, 오디오 디코딩, 렌더 타깃 할당은 한 번 일어나는 큰 동기 작업이다. 플레이 중 처음 쓰이는 순간에 일어나면 그 프레임 하나가 길어지고, 이후 프레임은 정상이라 평균 프레임 시간에는 거의 드러나지 않는다. 성능을 평균으로만 재면 통과하고, 기기에서 첫 사용 때만 끊기는 문제는 놓친다.

| 자원 | 로딩 단계에서 하는 일 |
| --- | --- |
| 셰이더 프로그램 | 실제 사용 상태(조명 수·그림자·안개·톤 매핑·클리핑 등 프로그램 변종 키가 같은 조건)의 장면·카메라로 컴파일한다. 변종 키가 다르면 같은 재질이어도 다시 컴파일된다 |
| 후처리 패스 | 패스의 재질과 렌더 타깃을 로딩 때 만들고, 처음 켜지는 때에 새로 만들지 않는다 |
| 텍스처·오디오 | GPU 업로드와 디코딩을 로딩 때 끝낸다 |
| 복사 텍스처·렌더 타깃 | 로딩 때 생성하고 플레이 중에는 재사용한다 |
| 재질 define | 플레이 중 바꾸면 재컴파일된다. 켜고 끄는 값은 uniform으로 둔다 |

예외는 화면 크기 변경처럼 플레이 밖에서 사용자가 일으키는 동작의 재할당이다.

**나쁜 예**

```js
// 쇼크웨이브 패스의 셰이더가 경기 중 첫 접촉 때 renderer.render 안에서 처음 컴파일된다
onFirstContact() {
  this.shockwavePass.enabled = true; // 다음 render에서 컴파일·링크 + 복사 텍스처 할당
}
```

**좋은 예**

```js
// 로딩 단계: 패스를 켠 상태로 미리 컴파일하고 복사 텍스처도 미리 만든다
async load() {
  this.shockwavePass.enabled = true;
  await renderer.compileAsync(scene, camera); // 실제 조명·그림자·안개 조건 그대로
  this.shockwavePass.enabled = false;
  this.copyTexture = new THREE.WebGLRenderTarget(width, height); // 플레이 중에는 재사용
}
onFirstContact() {
  this.shockwavePass.enabled = true; // 켜는 값만 바꾼다. 새 컴파일 없음
  this.shockwavePass.uniforms.strength.value = 1; // define이 아니라 uniform
}
```

확인 방법은 새 재질·후처리·입자를 넣는 PR마다 아래 두 가지를 먼저 코드로 따져 PR 본문에 적는 것이다. 새 재질이 미리 준비 목록에 들어가는 위치, 플레이 중 define이 바뀌지 않는다는 점, 복사 텍스처·렌더 타깃이 로딩 때 만들어진다는 점을 코드 줄로 가리킨다. 아래 값을 게임의 진단 수단으로 한 번 읽을 수 있으면 실제 횟수로 덧붙이고(의무 아님), 첫 사용 프레임 시간 비교 같은 반복 측정은 요청받았을 때만 한다. 코드로 판단이 안 되면 먼저 그렇게 말하고 동의를 받는다. 보고에는 "코드로 판단, 미측정"과 "측정함"을 구분한다.

- **로딩 완료 이후 플레이 중 새 프로그램 컴파일 0회.** 읽을 수 있을 때 렌더러의 프로그램 목록(three.js의 `renderer.info.programs.length`)이 로딩 완료 시점과 플레이 중 이펙트를 모두 한 번씩 쓴 뒤에 같은지, 또는 `linkProgram` 호출 횟수가 늘지 않는지 본다.
- **첫 사용 프레임 시간.** 요청받았을 때 이펙트를 처음 쓰는 프레임과 이후 프레임의 시간을 비교한다. 평균 프레임 시간만으로 통과시키지 않는다. 평균은 첫 사용 프레임 하나를 가린다.

이 확인은 영구 성능 시험으로 넣지 않는다. 영구 시험은 고정 시나리오 E2E만 두고([PM-009](project-management.md#verification-policy)), 성능·프레임 시간을 재는 로직은 머지 전 검사에 넣지 않는다([PM-014](project-management.md#verification-policy)). 기능 검증과 성능 검증을 구분하는 이유는 [AI-012](ai-development.md#simulation-cadence)와 같다.

사례: bloom-takraw 0.17.4에서 화면 왜곡 쇼크웨이브 후처리 패스를 넣으면서 그 셰이더가 경기 중 첫 접촉 때 처음 컴파일되게 두었고, 성능은 평균 프레임 시간만 재서 첫 사용 프레임은 보지 않은 채 통과시켰다. 이후 휴대폰에서 렉이 제보됐다. 원인은 조사 중이며 이 컴파일이 주원인인지는 아직 확정되지 않았다.

### 렌더 제출량(드로우콜)을 언제든 읽을 수 있게 한다 {#draw-call-visibility}

- [DEV-033][P1] **Draw Call Visibility · Submission Count First** — 실행 중인 게임에서 프레임당 렌더 제출량(드로우콜 수, 가능하면 셰이더 프로그램 수·텍스처 수·삼각형 수)을 디버그 수단으로 언제든 읽을 수 있게 유지한다. 새 재질·메시·입자·후처리·UI 레이어나 배칭 조건처럼 렌더 경로에 영향을 주는 변경은 새 물체가 어느 묶음(인스턴스·병합·배치)에 들어가고 왜 드로우콜이 늘지 않는지(또는 얼마나 느는지)를 코드로 PR 본문에 적는다. 같은 진단 수단으로 대표 장면의 전후 값을 한 번 읽을 수 있을 때만 덧붙이고 의무는 아니며, 반복 측정·분포·프레임 시간·전용 하네스는 요청받았을 때만 한다. 정적 분석으로 판단이 안 되면 먼저 그렇게 말하고 동의를 받는다. 보고에는 "코드로 판단, 미측정"과 "측정함"을 구분해 적는다. 성능 문제를 조사할 때는 원인을 추측하기 전에 제출량을 먼저 읽고 개편 전 값과 비교한다. 드로우콜을 줄이는 구현은 공통 모듈(bloom-gamekit)의 수단을 쓰고 게임마다 새로 만들지 않는다. 위반 판별: 실행 중인 게임에서 드로우콜 수를 읽을 방법이 없거나, 렌더 변경 PR에 묶음 위치·증감의 코드 근거가 없거나, 성능 문제 보고에 제출량 수치 없이 원인이 단정돼 있다.

태그: #DrawCallVisibility #SubmissionCountFirst #RenderStats #PerfTriage

빈도: 높음 · 나중 수정비용: 중간

드로우콜을 줄이는 기법(배칭·인스턴싱·텍스처 아틀라스)은 공통 모듈에 이미 있다. 이 규칙은 그 기법을 다시 쓰라는 것이 아니라, **렌더가 느려졌을 때 제출량부터 읽어 원인 범위를 좁힐 수 있게** 하는 규칙이다. 제출량을 읽을 수 없으면 "후처리 때문일 것이다", "그림자 때문일 것이다" 같은 추측으로 조사가 시작되고, 틀린 쪽을 먼저 고친다. 렌더 제출량은 프레임 시간과 달리 같은 장면이면 기기와 무관하게 거의 같게 재현되는 숫자라서 개발 PC에서 읽은 값을 제보 기기의 증상과 맞대 볼 수 있다.

| 읽을 값 | three.js | bloom-gamekit |
| --- | --- | --- |
| 드로우콜 수 | `renderer.info.render.calls` | `WebGLDevice.stats.drawCalls`(프레임 값, `beginFrame()`에서 초기화), 메시 경로는 `context.stats().mesh.draws` |
| 삼각형 수 | `renderer.info.render.triangles` | `WebGLDevice.stats.vertices`(인스턴스를 포함한 제출 정점 수) |
| 셰이더 프로그램 수 | `renderer.info.programs.length` | `WebGLDevice.stats.pipelineCount` |
| 텍스처 수 | `renderer.info.memory.textures` | `WebGLDevice.stats.textureCount` |
| 배칭이 끊긴 이유 | 없음. 재질·텍스처·블렌딩 상태가 다른 경계를 직접 센다 | `context.stats().mesh.flushReasons`, `drawDispatchReasons` |

- three.js의 `renderer.info.render`는 `render()` 호출마다 초기화된다. 후처리처럼 한 프레임에 `render()`를 여러 번 부르면 마지막 패스만 남으므로, `renderer.info.autoReset = false`로 두고 프레임 시작에서 `renderer.info.reset()`을 직접 부른다.
- 자체 2D 렌더러라면 `draw` 호출 한 곳에 제출 횟수 카운터를 두고 프레임 시작에 0으로 만든다. 게임마다 새 렌더러를 만들기 전에 공통 모듈의 장치·컨텍스트 통계를 쓴다([AI-021](ai-development.md#module-first)).
- 같은 프레임의 CPU 단계 시간과 함께 보관하려면 debug-tools의 `FrameMetrics` 카운터에 등록한다. 오류 진단 복사(`DiagnosticRing`·`copyDiagnostic`)에 이 숫자를 한 줄 넣어 두면 제보 기기에서도 읽을 수 있다.
- 이 숫자는 제출 횟수이지 GPU 시간이 아니다. 드로우콜 수만으로 GPU 비용을 판정하지 않는다([A064](../algorithms/index.html) Render Batching의 주의).

**대표 장면.** 아래 세 가지를 고정된 장면(`?debug=1&scene=…` 같은 주소 장면이 있으면 그것)으로 읽는다.

1. 가장 무거운 장면(유닛·이펙트·UI가 최대로 겹치는 때).
2. 가장 흔한 장면(평소 플레이 화면).
3. 이번에 바꾼 요소가 화면에 처음 나오는 장면.

**수치가 늘었을 때 보는 순서.**

1. 배치가 깨졌는가. 재질·텍스처·셰이더·블렌딩 상태가 객체마다 달라졌는지, 같은 재질을 인스턴스 하나로 묶지 못했는지 본다(gamekit이면 `flushReasons`).
2. 투명·정렬 때문에 끊겼는가. 반투명 객체의 그리기 순서가 서로 다른 재질을 번갈아 오가는지 본다.
3. 패스가 늘었는가. 후처리 패스, 그림자 맵, 렌더 타깃 전환, 화면 복사가 프레임마다 몇 번인지 센다. 패스 하나는 화면 크기만큼의 픽셀 비용을 더하므로 드로우콜이 거의 그대로여도 느려질 수 있다.

제출량이 그대로인데 느리면 정점·픽셀(fill) 비용이나 처음 쓰는 순간의 로드([DEV-032](#preload))를 의심한다. 제출량이 같다는 것은 제출 횟수가 원인이 아니라는 뜻이지, 렌더가 원인이 아니라는 뜻이 아니다.

**PR에 적는 모양.** 기본은 코드 근거 한 줄이다. 새 물체가 들어가는 묶음과 드로우콜이 늘지 않는(또는 느는) 이유를 적는다. 예: `새 이펙트 입자는 기존 이펙트 InstancedMesh(effects.js)의 인스턴스로 들어가 드로우콜 변화 없음. 코드로 판단, 미측정`. 위 수단으로 한 번 읽을 수 있으면 읽은 값을 덧붙인다(의무 아님). 예: `측정함: 대표 장면 3곳 드로우콜 41→42, 프로그램 12→13, 삼각형 변화 없음`. 반복 측정·분포·프레임 시간·전용 하네스는 요청받았을 때만 하고, 정적 분석으로 판단이 안 되면 먼저 그렇게 말하고 동의를 받는다.

이 확인에서 드로우콜 수 상한을 영구 시험이나 합격 기준으로 넣지 않는다. 영구 시험은 고정 시나리오 E2E만 두고([PM-009](project-management.md#verification-policy)), 성능 수치를 재는 로직은 머지 전 검사에 넣지 않는다([PM-014](project-management.md#verification-policy)). 기능 검증과 성능 검증을 구분하는 이유는 [AI-012](ai-development.md#simulation-cadence)와 같다.

사례: bloom-takraw 0.17.4에서 화면 왜곡 후처리 패스(풀스크린 패스 1회)를 포함한 이펙트 개편을 넣은 뒤 휴대폰에서 렉이 제보됐고, 원인은 조사 중이다. 드로우콜이 원인이라는 근거는 없다. 다만 조사 시점의 main에서 게임 안에서 `renderer.info`를 읽는 화면이 없어, 개편 전후의 제출량을 같은 장면에서 맞대 볼 수 없었다. 제출량을 읽을 수 없으면 이런 제보에서 첫 단계인 범위 좁히기부터 추측에 의존하게 된다.

### 드로우콜은 개체 수·종류 수가 아니라 렌더 상태 묶음 수로 정한다 {#count-independent-draw-calls}

- [DEV-034][P1] **Count-independent Draw Calls · Batch by Render State** — 프레임당 드로우콜 수는 화면에 있는 개체의 수나 콘텐츠 종류의 수가 아니라 렌더 상태 묶음의 수(셰이더·블렌드·레이어·패스의 조합)로 정해지게 한다. 텍스처는 텍스처 배열 하나로 묶어 그리므로 텍스처 장수는 묶음을 가르는 기준이 아니다. 같은 종류의 개체가 늘어도, 새 종류(유닛·탄·이펙트·아이템)가 추가돼도 드로우콜은 늘지 않거나 미리 정한 상태 묶음 수만큼만 늘어야 한다. 종류의 차이는 재질이 아니라 데이터(텍스처 배열 레이어·아틀라스 영역, 인스턴스 속성, 팔레트·uniform 배열)로 표현한다. 위반 판별: 대표 장면에서 개체를 N개에서 N+10개(또는 2N개)로 늘렸을 때 드로우콜이 그 수에 비례해 늘거나, 종류를 하나 추가할 때마다 드로우콜이 하나씩 늘거나, 텍스처(아틀라스 페이지) 수가 늘 때 드로우콜이 늘거나, 개체마다 고유 재질·텍스처·캔버스·uniform 묶음을 만들어 개별로 그린다.

태그: #CountIndependentDrawCalls #BatchByRenderState #Instancing #TextureArray

빈도: 높음 · 나중 수정비용: 큼

[DEV-033](#draw-call-visibility)은 드로우콜을 **읽을 수 있어야 한다**는 규칙이고, 이 규칙은 드로우콜이 **어떻게 늘어나면 안 되는가**를 정한다. 개체 수는 게임이 진행되면서 늘어나는 값이고 콘텐츠 종류는 개발이 진행되면서 늘어나는 값이다. 드로우콜이 둘 중 하나에 비례하면 지금은 괜찮아도 나중에 반드시 터진다. 렌더 상태 묶음의 수는 설계로 고정할 수 있는 값이다. 개체마다 Mesh·재질·캔버스를 하나씩 두는 구조는 개체 코드 곳곳에 퍼져 있어서 나중에 고치려면 렌더 경로 전체를 다시 짜야 한다.

**판단식.**

```
드로우콜 = 렌더 상태 묶음 수 × 패스 수 + 고정분
```

- 렌더 상태 묶음은 셰이더·블렌드·레이어(그리는 순서가 의미를 갖는 단위)·패스의 조합이다. 텍스처는 텍스처 배열 하나로 묶으므로 기준에 들어가지 않는다.
- 개체 수 N과 종류 수 K가 식에 들어가면 위반이다. 개체 10개를 더했을 때 드로우콜 증가분(기울기)이 0이어야 한다.

**텍스처 장수는 드로우콜을 늘리는 이유가 아니다.** 이미지가 여러 장이어도 텍스처 배열(레이어 번호를 인스턴스·정점 속성으로 넘긴다)에 담아 한 번 바인딩해 그린다. 텍스처(아틀라스 페이지) 수에 비례해 드로우콜이 늘면 위반이다. 배열 하나에 담기지 않는 경우는 "허용되는 증가"가 아니라 자산 구성의 문제로 고친다. 크기를 통일하고 상한 안에 담는다.

- bloom-gamekit의 `device.textureAtlas`는 `TEXTURE_2D_ARRAY` 하나(기본 2048×1024, 레이어 2장)이고 영역마다 레이어 번호와 `uvRect`를 가진다. 크기가 다른 이미지도 선반 배치로 한 레이어 안에 담는다. 영역은 한 레이어 안에 들어가야 한다.
- 레이어 수는 `WebGLDevice` 생성 옵션 `textureAtlas: { width, height, layers }`이고 `MAX_ARRAY_TEXTURE_LAYERS` 이하여야 한다. 가득 차면 `allocate()`가 `Texture atlas array is full` 오류를 던진다. 늘어나는 한도는 배칭이 아니라 이 상한이므로, 이미지 총량을 상한 안에 두거나 그 옵션의 레이어 수를 키운다.
- `flushReasons`에는 텍스처 동일성을 이유로 한 항목이 없다. 아틀라스 영역이 달라도 배칭이 끊기지 않는다. 포즈 텍스처가 다르면 `poseBackend`(네이티브 경로)나 `state`(순서 있는 경로)로 끊긴다.
- three.js를 직접 쓰는 게임(bloom-takraw)에도 같은 원칙이 적용된다. 같은 지오메트리는 `InstancedMesh`, 여러 이미지는 `DataArrayTexture`와 인스턴스 속성(레이어 번호)으로 묶는다.

**허용되는 증가.** 애매한 경계는 아래로 정한다.

- 새 렌더 상태가 정말 필요한 경우(새 블렌드 방식, 새 셰이더, 새 패스)는 종류가 아니라 상태가 늘어난 것이므로 허용한다. 단 상태 묶음 목록을 한곳에 두고 그 수를 의식적으로 관리한다.
- 그리는 순서가 의미를 갖는 경우(반투명 정렬, 레이어)는 끊김이 레이어 수에 묶여야 하고 개체 수에 묶이면 위반이다. 순서를 지키면서 묶는 수단(gamekit의 `orderedMeshQuads`)을 쓴다.
- 배치 버퍼 용량(인스턴스 수·정점·command 상한)에 닿아 나뉘는 경우는 허용한다. `flushReasons`의 `capacity`이며 드로우콜이 개체 수가 아니라 `ceil(N / 용량)`으로 늘기 때문이다. 이 증가는 용량 단위(MeshRenderer 기본 `maxInstances` 2048)이고, 용량을 키울 수 있으면 키운다.
- 수가 설계상 고정이고 작은 경우(정해진 인원의 선수, 화면에 하나뿐인 보스·플레이어)는 개체 수가 변수가 아니므로 이 규칙의 대상이 아니다. 다만 "지금은 적다"는 이유로 변하는 수량을 고정이라고 주장하지 않는다. 상한이 규칙·설계로 고정돼 있어야 한다.

**흔한 위반 형태와 고치는 방향.**

| 위반 형태 | 고치는 방향 |
| --- | --- |
| 개체마다 Mesh/Sprite 하나씩 | 인스턴싱·배칭 |
| 종류마다 재질 하나씩 | 공유 재질 + 텍스처 배열 레이어/아틀라스 영역/인스턴스 속성 |
| 이미지(아틀라스 페이지)마다 드로우콜을 따로 냄 | 텍스처 배열 하나에 담고 레이어 번호를 속성으로 전달 |
| 개체마다 체력바·이름표를 따로 그림(캔버스·DOM 포함) | 한 배치로 |
| 개체마다 색만 다른 재질 복제 | 인스턴스 색 |
| 개체별 그림자·외곽선 패스 | 한 패스로 |
| 종류마다 다른 블렌드 | 프리멀티플라이 등으로 통일 |

**확인 방법.** 1회성 관찰이며 영구 시험이 아니다.

1. 기본은 코드 근거다. 개체 수 N이 드로우콜 식에 들어가지 않는 이유(같은 인스턴스·병합 묶음에 들어간다 등)를 코드로 PR에 적는다. 이미 있는 [DEV-033](#draw-call-visibility)의 수단으로 대표 장면에서 개체 수를 두 값(N, N+10 또는 2N)으로 놓고 한 번 읽을 수 있을 때만 덧붙인다(의무 아님). 모양: `N=… → draw …, N+10=… → draw …`.
2. 종류를 추가하는 PR은 새 종류가 어느 상태 묶음의 데이터로 들어가는지 코드로 적고, 읽을 수 있으면 추가 전후 값을 덧붙인다. 늘었으면 어느 상태 묶음이 늘었는지 적는다. gamekit이면 `context.stats().mesh.flushReasons`와 `drawDispatchReasons`의 사유(`mesh`, `clip`, `depthState`, `projection`, `poseBackend`, `capacity` 등)를 본다.
3. 반복 측정·분포·전용 하네스는 요청받았을 때만 한다. 이 확인에 드로우콜 수 상한을 영구 시험이나 합격 기준으로 넣지 않는다([PM-009](project-management.md#verification-policy)·[PM-014](project-management.md#verification-policy)).

구현은 공통 모듈(bloom-gamekit)의 수단을 쓰고 게임마다 새로 만들지 않는다. 배칭·인스턴싱의 기법과 비용은 [A072](../algorithms/index.html) GPU Instancing과 [A064](../algorithms/index.html) Render Batching에 있다. 드로우콜 감소만으로 GPU 비용이 줄었다고 판정하지 않는다(A064의 주의).

사례: budmori-io `docs/performance-diagnostics.md`의 기록에서 `orderedMeshQuads`를 켜기 전후 드로우콜 평균이 밀 882마리 장면에서 1765 → 17, 혼합 1,000마리 장면에서 608 → 18이 됐다. Chromium·SwiftShader(소프트웨어 GPU)의 한 환경에서 잰 값이고, 같은 기록에서 GPU 시간은 이 환경에서 크게 줄지 않았다.

### 시간은 ms로 적고 틱 수는 한 곳에서만 정한다 {#time-in-ms}

- [DEV-035][P1] **Time in Milliseconds · Tick Rate Is One Knob** — 시간의 뜻을 가진 값(지속·주기·지연·창·쿨다운·유지 시간)은 틱·프레임 개수가 아니라 ms로 적고 이름 끝에 `Ms`를 붙인다([DEV-020](#hierarchical-naming)). 시뮬레이션 틱 수는 설정 한 곳에서만 정하고, ms 값을 틱 개수로 반올림하지 않고 경과 시간을 정수 단위로 쌓아 나머지를 이월한다. `1/60`·`60`·"N틱마다"·"N프레임 동안"처럼 틱 수를 전제한 리터럴을 코드에 쓰지 않고, 스텝마다 곱하는 감쇠·보간 계수는 dt로 계산한다. 틱 번호 자체가 뜻인 값(롤백 틱 인덱스, 리플레이의 틱 위치, 결정론 재현용 장면 파라미터 `tick=`)과 프로토콜이 틱 단위로 정한 필드는 예외다. 위반 판별: 틱 수 설정 하나만 바꿨을 때 지속·주기·지연의 실제 시간이 달라지는 곳이 있거나, 시간 값을 틱·프레임 개수로 적은 설정이 있거나, ms 값을 틱 개수로 반올림해 쓰는 곳이 있다(경계 예외 제외).

태그: #TimeInMilliseconds #TickRateOneKnob #SSOT #NoMagicNumber

빈도: 높음 · 나중 수정비용: 큼

틱 수(시뮬레이션 주기)는 성능과 정밀도를 맞추려고 바꾸는 값이다. 지속·주기·지연 같은 시간 값이 틱 개수로 적혀 있거나 물리에 `1/60`이 박혀 있으면 틱 수를 바꿀 때 게임의 실제 시간 동작이 함께 바뀌어, 한 줄 변경이어야 할 일이 시간 값 전체를 찾아 고치는 일이 된다. 시간 값은 ms로 적고 경과 시간을 쌓아 판정하면 틱 수는 설정 하나가 된다. ms를 틱 개수로 반올림하면 66ms가 1틱(초당 20번, 32% 빠름)이나 2틱(초당 10번, 34% 느림)이 되어 틱 수에 따라 주기가 어긋나므로, 나머지를 버리지 않고 이월한다. [DEV-017](#dry)(같은 지식은 한 곳)·[DEV-013](#data-driven)(수치는 설정 데이터)과 같은 뿌리다. 틱·서브스텝·물리 해상도·보간·프레임의 뜻은 [AI-012 용어 표](ai-development.md#simulation-terms)에 한 곳으로 정의한다.

**나쁜 예 · 좋은 예**

```js
// as-is: 설정이 틱 개수이고, 환산은 반올림이라 틱 수가 바뀌면 주기가 어긋난다
ai: { everyTicks: 4 }, rollbackWindowTicks: 24, shortJumpHold: 1 / tickRate
if (tick % Math.round((intervalMs * tickRate) / 1000) === 0) think();
// to-be: 설정은 ms, 판정은 나머지를 쌓는다(정수)
ai: { intervalMs: 66 }, rollbackWindowMs: 400, shortJumpHoldMs: 17
state.thinkAcc += 1000;                       // 한 틱 = 1000 / tickRate ms → ms × tickRate 단위로 1000
while (state.thinkAcc >= intervalMs * tickRate) {
    state.thinkAcc -= intervalMs * tickRate;  // 0으로 지우지 않고 나머지를 남긴다
    think();
}
```

- 이름은 `Ms`로 끝난다(`intervalMs`, `holdMs`, `cooldownMs`). 틱 개수는 설정에 두지 않는다.
- **주기**: 틱마다 누적값에 한 틱의 시간을 더하고, 누적값이 주기 이상이면 실행한 뒤 **주기만큼 빼서 나머지를 남긴다**(0으로 초기화하지 않는다). 20틱(50ms)에서 66ms 주기는 실행 틱이 2, 3, 4, 6, 7, 8…로 흩어지고 평균은 정확히 초당 약 15.15번이다. 반올림은 1틱마다(초당 20번) 또는 2틱마다(초당 10번)가 되어 32~34% 어긋난다.
- **지속·지연·쿨다운**: 시작한 뒤 경과 ms를 쌓아 `경과 ≥ 값`으로 판정한다. 값이 틱 간격으로 나누어떨어지지 않아도 다음 틱에 끝나며 오차가 쌓이지 않는다.
- **한 틱에 주기가 여러 번 들어갈 때**(주기 < 틱 간격): `while`로 들어간 횟수만큼 실행하거나, 값의 뜻에 따라 한 번만 실행하고 나머지를 유지한다. 어느 쪽인지는 값의 뜻(발사 횟수처럼 놓치면 안 되는 사건인지, 최신 상태만 필요한 갱신인지)으로 정하고 코드에 적는다.
- **결정론**: 한 틱의 시간(1000 / 틱 수)은 정수가 아닐 수 있으므로 부동소수로 쌓지 않고 정수 단위로 쌓는다. 위 예시는 틱마다 `1000`을 더하고 문턱을 `intervalMs * tickRate`(단위 = ms × 틱 수)로 비교한다. 누적값은 시뮬레이션 상태이므로 스냅샷·롤백·상태 해시에 포함한다. 빠뜨리면 롤백 뒤 실행 시점이 달라진다.
- 스텝마다 곱하는 감쇠·보간 계수(`v *= 0.9`)는 주기를 전제한 값이다. `Math.pow(base, dt)`나 `1 - Math.exp(-k * dt)`처럼 dt로 계산한다.
- **경계 예외**: 외부 API나 프로토콜이 틱 개수를 요구하는 값(롤백 창, 입력 지연 틱 등)은 설정은 ms로 적고 경계에서 한 번 올림(`Math.ceil`)해 넘긴다. 창·지연이 의도보다 짧아지면 안 되므로 반올림이 아니라 올림이다. 이 환산은 경계 한 곳에만 둔다.
- 예외: 틱 번호 자체가 뜻인 값(롤백 틱 인덱스, 리플레이의 틱 위치, 결정론 재현용 장면 파라미터 `tick=`)과 프로토콜이 틱 단위로 정한 필드. 이 값은 틱 수를 바꾸면 의미가 바뀌는 것이 맞다.

**확인 방법.** 코드 근거로 한다. 시간 값을 담은 설정 이름이 `Ms`로 끝나는지, `1/60`·`60`·`Ticks`·`Frames` 리터럴이 경계 환산 밖에 없는지, `Math.round`·`Math.floor`로 ms를 틱 개수로 바꾸는 곳이 없는지 검색하고, 주기 판정의 누적값이 정수이며 스냅샷·상태 해시에 들어 있는지, 틱 수 설정이 한 곳인지 본다. 틱 수를 바꾸는 PR은 바뀐 줄이 설정 한 줄뿐이라는 점을 PR에 적는다. 실제 시간이 유지되는지의 반복 측정은 요청받았을 때만 한다. 논리 틱과 물리 하위 단계의 주기 소유는 [AI-012](ai-development.md#simulation-cadence)를 따른다.

사례: bloom-takraw에서 시뮬레이션 틱을 60에서 20으로 낮추려 했으나 AI 판단 주기(4틱마다)·짧은 점프 유지(1틱)·온라인 롤백 창(24틱)·하이라이트 길이·따라잡기 한도가 틱 개수로 적혀 있고 물리에 `1/60` 리터럴이 있어 설정 한 줄 변경이 되지 않았다.

## P2 — 방치하면 쌓이는 구조 부채 {#p2}

당장 기능을 막지는 않지만, 계속 누적되면 코드를 읽고 바꾸는 비용이 빠르게 증가한다. 주기적으로 정리한다.

### 사용하지 않는 코드·설정·필드 제거 {#dead}

- [DEV-015][P2] **No Dead Code** — consumer가 없는 코드·설정·필드는 삭제하고, 다시 필요해지면 현재 구조로 구현한다. 위반 판별: 참조가 0인 필드·옵션·함수가 남아 있다.

태그: #NoDeadCode

**나쁜 예**

```js
legacySpeed = 2;
oldRecoveryMode = true;
// consumer 없음
```

**좋은 예**

```text
// consumer가 없으면 삭제.
// 다시 필요할 때 현재 구조로 구현.
```

### 이관 완료 후 구 구현을 fallback으로 남기지 않기 {#legacy}

- [DEV-016][P2] **No Legacy Fallback** — 이관 검증이 끝나면 구 구현 fallback을 제거한다. 위반 판별: `if (!newSystem()) legacySystem()` 형태의 분기가 남아 있다.

태그: #NoLegacyFallback

**나쁜 예**

```js
if (!newSystem()) {
  legacySystem();
}
```

**좋은 예**

```js
newSystem();
// 이관 검증 후 legacy 제거
```

### 코드 모양보다 지식의 중복 제거 {#dry}

- [DEV-017][P2] **DRY** — 같은 지식(공식·판정 규칙)은 한 곳에만 둔다. 코드 모양이 같다는 이유만으로 합치지 않는다. 위반 판별: 같은 공식이 2개 이상 모듈에 복사되어 있다.

태그: #DRY

**나쁜 예**

```text
// 세 모듈에 동일한
// 방어력 계산식 복사
```

**좋은 예**

```text
damageResolver.applyArmor(...)
```

### 미래를 예상한 추상화를 먼저 만들지 않기 {#yagni}

- [DEV-018][P2] **YAGNI · Rule of Three · KISS** — 사용처가 1개인 동안에는 추상화·factory·registry를 만들지 않고, 실제 반복이 생길 때 공통화한다. 위반 판별: 구현체가 1개뿐인 인터페이스·추상 클래스·전략 어댑터가 있다.

태그: #YAGNI #RuleOfThree #KISS

**나쁜 예**

```text
// 사용처 1개인데
AbstractGenericEffectFactory
EffectProviderRegistry
EffectStrategyAdapter...
```

**좋은 예**

```js
class PoisonEffect {
  ...
}

// 실제 반복이 생길 때 공통화
```

### 같은 개념에는 같은 이름 {#language}

- [DEV-019][P2] **Ubiquitous Language** — 같은 개념에는 코드 전체에서 같은 이름을 쓴다. 위반 판별: 같은 뜻의 필드가 attackDelay/fireDelay/cooldown처럼 서로 다른 이름으로 존재한다.

태그: #UbiquitousLanguage

**나쁜 예**

```text
attackDelay
fireDelay
attackInterval
cooldown
// 모두 같은 뜻
```

**좋은 예**

```text
attackCooldownMs
```

### 긴 접두어 변수보다 의미 단위 계층으로 상태를 묶는다 {#hierarchical-naming}

- [DEV-020][P2] **Hierarchical Naming · Semantic Namespace** — 같은 기능에 속하는 상태는 접두어 반복 대신 기능 단위 namespace 객체로 묶고, 단위는 leaf 이름(Ms, Rad, Px)에 남긴다. 계층은 기능·소유권·하위 개념을 구분하는 데 필요한 만큼만 만든다. 위반 판별: 같은 접두어 필드가 3개 이상 평평하게 나열되거나, 의미 없는 wrapper 계층이 있다.

태그: #HierarchicalNaming #SemanticNamespace #ScopeVisibleNaming

빈도: 매우 높음 · 나중 수정비용: 중간

서로 같은 기능에 속하는 상태를 `jump.cooldown.leftMs`, `jump.power`, `jumpDurationMs`처럼 평평한 이름으로 늘어놓기보다, **기능 단위 namespace 아래에 계층적으로 묶어 스코프와 소유권을 코드 모양 자체로 드러낸다.**

**나쁜 예 — 접두어를 반복하는 Flat Naming**

```js
this.jumpPower = 12;
this.jumpCooldownDurationMs = 800;
this.jumpCooldownLeftMs = 0;
this.jumpDurationMs = 250;
```
`jumpDurationMs`처럼 기능명과 하위 의미를 변수명에 계속 이어 붙이면, 필드가 늘수록 이름이 길어지고 스코프와 계층이 문자열 접두어에만 의존하게 된다.

**좋은 예 — 기능 단위 계층**

```js
this.jump = {
  power: 12,

  cooldown: {
    durationMs: 800,
    leftMs: 0
  },

  durationMs: 250
};
```
`Jump.*`만 봐도 어느 기능의 상태인지 바로 알 수 있고, 하위 상태도 의미 단위로 묶인다.

#### 단위까지 계층 안에서 명확하게

```text
jump.cooldown.durationMs
jump.cooldown.leftMs

linear.velocity.x
linear.velocity.y

angular.velocity
angular.angleRad

rect.width
rect.height
```
단위가 중요한 값은 `Ms`, `Rad`, `Px`처럼 leaf 이름에 단위를 남긴다. 계층을 만든다고 단위 정보를 숨기지 않는다.

#### Mixin 소유권과도 맞춘다

Mixin이 소유하는 상태는 해당 Mixin의 namespace 아래에 둔다.

```js
const Jump = Base =>
  class Jump extends Base {
    constructor(...args) {
      super(...args);

      this.jump = {
        power: 12,
        cooldown: {
          durationMs: 800,
          leftMs: 0
        }
      };
    }

    jump() {
      if (this.jump.cooldown.leftMs > 0) {
        return false;
      }

      this.velocity.z = this.jump.power;
      this.jump.cooldown.leftMs =
        this.jump.cooldown.durationMs;

      return true;
    }
  };
```
이렇게 하면 상태 이름만 봐도 **어느 capability가 소유하는 상태인지**가 드러난다.

#### 과도한 계층은 피한다

**나쁜 예 — 의미 없이 너무 깊은 계층**

```text
Unit.State.Physics.Linear
  .Movement.Velocity.Current.x
```

**좋은 예 — 실제 의미 경계까지만**

```text
linear.velocity.x
jump.cooldown.leftMs
Weapon.reload.leftMs
```

**규칙:** 계층은 기능/소유권/하위 개념을 구분하는 데 필요한 만큼만 만든다. 단순히 “정리돼 보이게” 하기 위한 wrapper 계층은 추가하지 않는다.

> **판단 기준**
> 같은 접두어가 2~3개 이상 반복되기 시작한다 → namespace 후보.
> 같은 기능의 상태가 함께 생성·변경·삭제된다 → 같은 namespace에 묶기.
> 서로 다른 owner의 상태라면 같은 namespace에 억지로 넣지 않기.

### 한 함수에서는 같은 추상화 수준 유지 {#abstraction}

- [DEV-021][P2] **Single Level of Abstraction** — 한 함수 안에서는 같은 추상화 수준의 호출만 둔다. 위반 판별: 도메인 단계 호출 사이에 저수준 API(gl.bindBuffer 등) 호출이 섞여 있다.

태그: #SingleLevelOfAbstraction #ExplicitOverImplicit

**나쁜 예**

```js
updateCombat() {
  acquireTargets();
  gl.bindBuffer(...);
  resolveDeaths();
}
```

**좋은 예**

```js
updateCombat() {
  acquireTargets();
  executeAttacks();
  resolveDeaths();
}
```

### 특수 케이스가 반복되면 구조를 교체 {#replace}

- [DEV-022][P2] **Replace, Don't Layer · Refactor for Changeability** — 특수 케이스 분기가 반복되면 분기를 덧대지 않고 공통 capability/contract로 구조를 교체한다. 위반 판별: 같은 함수에 특수 케이스 else-if가 4개 이상이다.

태그: #ReplaceNotLayer #RefactorForChangeability

**나쁜 예**

```text
if (specialA) ...
else if (specialB) ...
else if (specialC) ...
else if (specialD) ...
```

**좋은 예**

```text
// 반복되는 특수 케이스의
// 공통 capability/contract를 추출
```

## JavaScript Mixin 구현 규약 {#js-mixin}

일반 원칙과 달리 이 섹션은 JavaScript에서 실제로 사용할 Mixin 형태를 구체화한다. 구현은 표준 JavaScript의 **Subclass Factory** 패턴을 기반으로 하고, 프로젝트에서는 읽기 쉬운 `mixin(...)` 헬퍼 하나만 공개한다.

> **핵심 공식**
> `Mixin = Base Class → Base를 extends한 Subclass를 반환하는 함수`
> Mixin끼리도 조합할 수 있고, 조합된 결과 역시 다시 Mixin으로 사용한다.

### 별도 Mixin 전용 Base를 만들지 않는다 {#mixin-base}

- [DEV-023][-] **Subclass Factory · No Mixin Base** — Mixin은 Base를 받아 `class extends Base`를 반환하는 Subclass Factory로 만들고, Mixin 전용 공통 Base 클래스를 두지 않는다. 위반 판별: MixinBase 같은 클래스를 상속해야만 mixin을 쓸 수 있다.

태그: #SubclassFactory #NoMixinBase

**나쁜 예**

```js
class MixinBase {}
class Unit extends MixinBase {}
```
Mixin 사용을 위해 불필요한 공통 상속축이 생긴다.

**좋은 예 — 공식적인 Subclass Factory 형태**

```js
const Position = Base =>
  class Position extends Base {
    constructor(...args) {
      super(...args);
      this.position = {
        x: 0,
        y: 0
      };
    }
  };
```
Mixin은 어떤 기존 Base Class에도 적용 가능하다.

### 공개 조합 API는 mixin(...) 하나로 통일 {#mixin-helper}

- [DEV-024][-] **Composable Mixins** — 조합 API는 `mixin(Base, ...Mixins)`와 `mixin(...Mixins)` 두 형태만 쓰고, 항상 함께 필요한 Mixin은 상위 Mixin 안에서 조합해 사용처가 선행 Mixin을 반복해서 적지 않게 한다. 위반 판별: 사용처가 Position, LinearPhysics처럼 선행 Mixin을 매번 나열한다.

태그: #mixin #ComposableMixins

외부에서 알아야 할 조합 문법은 두 형태뿐이다.

```text
// Base Class + Mixins → 최종 Class
mixin(BaseClass, MixinA, MixinB)

// Mixins만 → Composite Mixin
mixin(MixinA, MixinB)
```
#### Mixin 자체 정의

```js
const RectSize = Base =>
  class RectSize extends Base {
    constructor(...args) {
      super(...args);
      this.rect = {
        width: 0,
        height: 0
      };
    }
  };
```
#### Mixin이 다른 Mixin을 포함

```js
const LinearPhysics = mixin(
  Position,

  Base => class LinearPhysics extends Base {
    constructor(...args) {
      super(...args);
      this.linear = {
        velocity: {
          x: 0,
          y: 0
        }
      };
    }

    updateLinear(dt) {
      this.position.x +=
        this.linear.velocity.x * dt;

      this.position.y +=
        this.linear.velocity.y * dt;
    }
  }
);
```
의미는 단순하다.

```text
LinearPhysics
=
Position
+
LinearPhysics 자체 기능
```
#### 여러 Mixin을 실제 Class에 적용

```js
class Unit {}

class Projectile extends mixin(
  Unit,
  LinearPhysics
) {}

class Crate extends mixin(
  Unit,
  LinearPhysics,
  AngularPhysics,
  RectSize
) {}
```
`LinearPhysics`가 이미 `Position`을 포함하므로 최종 사용자는 prerequisite를 반복해서 적지 않는다.

### 구현 시 지켜야 할 최소 규칙 {#mixin-requirements}

- [DEV-025][-] **Mixin Requirements · Dedupe · Super Chain** — Mixin constructor는 `super(...args)`로 인자를 그대로 전달하고, 같은 Mixin은 함수 identity 기준으로 한 번만 적용하며, 조합으로 해결되지 않는 Host 필드·메서드 요구만 Requires.*로 검증하고, 같은 public method를 우연히 덮어쓰지 않는다. 위반 판별: Base constructor 시그니처를 가정하거나, 같은 Mixin이 두 번 적용되거나, super 체인 없이 메서드를 덮어쓴다.

태그: #MixinRequirements #DedupingMixin #SuperChain

| 규칙                     | 내용                                                                                                                       |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------|
| **Base → Subclass**      | Mixin은 Base를 받고 `class extends Base`를 반환한다.                                                                       |
| **super(...args)**       | Mixin constructor를 정의하면 Base의 constructor signature를 가정하지 말고 인자를 그대로 전달한다.                          |
| **Mixin Composition**    | 항상 필요한 다른 capability는 Mixin 내부에서 다른 Mixin을 조합해 표현한다.                                                 |
| **Deduplication**        | 같은 Mixin이 여러 의존 경로에서 들어와도 한 번만 적용한다. 문자열 이름보다 Mixin 함수 identity를 기준으로 처리한다.        |
| **Host Requirement**     | Mixin 조합으로 해결할 수 없는 Host 필드·타입·메서드 요구사항만 별도 `Requires.*` 검증 대상으로 둔다.                       |
| **Silent Override 금지** | 우연히 같은 public method를 덮어쓰는 구조는 피한다. 의도적인 lifecycle/override 조합은 `super` 체인을 명시적으로 사용한다. |

**나쁜 예 — prerequisite를 매번 직접 나열**

```js
class Projectile extends mixin(
  Unit,
  Position,
  LinearPhysics
) {}
```

**좋은 예 — Mixin 조합으로 prerequisite 압축**

```js
const LinearPhysics = mixin(
  Position,
  LinearPhysicsCore
);

class Projectile extends mixin(
  Unit,
  LinearPhysics
) {}
```

### 실제 분리 기준 {#mixin-examples}

- [DEV-026][-] **Mixin Granularity** — Mixin은 실제로 따로 쓰이는 최소 capability 단위로만 나눈다. 위반 판별: 단독 사용처가 없는 Mixin이 있다.

태그: #MixinGranularity #IS_A_HAS_A_CAN_BE

Mixin은 “개념적으로 더 쪼갤 수 있다”는 이유로 나누지 않는다. **실제로 따로 사용하는 경우가 있는 최소 capability**만 분리한다.

```text
Position
RectSize
LinearPhysics
AngularPhysics
```
예를 들면:

```js
// 위치만
class Marker extends mixin(
  Unit,
  Position
) {}

// 위치 + 사각형 크기
class Panel extends mixin(
  Unit,
  Position,
  RectSize
) {}

// 위치 + 선형 물리
class Projectile extends mixin(
  Unit,
  LinearPhysics
) {}

// 위치 + 선형 물리 + 각속도 물리
class Crate extends mixin(
  Unit,
  LinearPhysics,
  AngularPhysics
) {}
```

> **판단 기준**
> 따로 실제 사용된다 → 별도 Mixin 유지.
> 항상 같이 필요하다 → 상위 Mixin이 하위 Mixin을 조합해서 압축.
> Host가 이미 소유한 객체가 필요하다 → 소유권은 Host에 두고 Requirement만 명시.

### 참고 문서

태그: #References

| 문서                                                                                                                                                      | 참고 포인트                                                        |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| [MDN — JavaScript Classes / Mix-ins](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) | Base를 받아 Subclass를 반환하는 JavaScript Class Mixin 기본 패턴   |
| [TypeScript Handbook — Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)                        | Class expression 기반 Mixin, constrained mixin, Base 타입 요구조건 |
| [Lit — Mixins](https://lit.dev/docs/v2/composition/mixins/)                                                     | Subclass Factory 설명, lifecycle override에서 `super` 호출 관행    |
| [Open Web Components — Dedupe Mixin](https://open-wc.org/docs/development/dedupe-mixin/)                        | Mixin 의존성 중복 적용 문제와 deduplication 필요성                 |

프로젝트의 `mixin(Base, ...Mixins)` 문법은 위 Subclass Factory 패턴을 더 읽기 쉽게 사용하기 위한 얇은 조합 helper이며, JavaScript 자체의 별도 언어 기능은 아니다.

## 코드 포맷팅과 정적 검사 {#code-formatting}

이 규약은 모든 BLOOM 게임 저장소에 공통 적용한다. **원본 무빌드 배포 정책은 유지한다.** 실제 설정의 복사 가능한 기준본은 [code-quality 템플릿](../examples/code-quality/README.md)에 둔다.

- [DEV-028][-] **Prettier · Single Formatting Authority** — 관리 대상 JS·HTML(인라인 script/style 포함)·CSS·JSON·Markdown은 공통 Prettier 설정(100자·공백 4칸·세미콜론·작은따옴표·trailing comma all·중괄호 공백·화살표 인수 괄호·LF)으로 포맷팅하고, 스타일 검사 규칙을 ESLint에 중복 정의하지 않는다. 위반 판별: 대상 파일에 다른 포맷이 적용됐거나 서로 다른 포맷터가 충돌한다.

- [DEV-029][-] **ESLint Recommended · Inline Script Coverage** — 브라우저 ESM에 ESLint recommended를 적용하고 HTML 안의 일반 JavaScript script도 실제로 검사하며, Node 도구 스코프와 브라우저 전역을 구별한다. 저장 시 가능한 ESLint fix를 적용한다. 위반 판별: HTML 내부 JS의 미정의 변수가 검출되지 않거나 브라우저·Node 전역이 무분별하게 섞인다.

- [DEV-030][-] **Incremental Formatting · Changed Files** — 기존 저장소는 수정한 파일부터 해당 파일 전체를 포맷팅하고, PR CI는 변경된 관리 대상 파일의 Prettier 위반과 ESLint error에서 실패한다. warning은 보고만 하고 CI는 소스를 자동 수정하지 않는다. 위반 판별: 변경하지 않은 기존 파일 때문에 PR을 차단하거나 CI가 임의 커밋을 만든다.

- [DEV-031][-] **Generated Artifact Exclusion · Tooling Isolation** — GLSL·WGSL·자동 생성 파일·외부 소스는 포맷터·린터에서 제외하고, HTML/JS 안의 셰이더 영역은 국소 ignore로 보존한다. 검사 도구는 프로젝트별 devDependencies와 lockfile로 고정하고 게임 실행·배포에 빌드를 추가하지 않는다. 위반 판별: 생성 자산이 재포맷되거나 검사 도구가 게임 런타임에 포함된다.

- 대상: JS·MJS·CJS·HTML·HTM·CSS·JSON·MD·Markdown. ESLint는 JS·MJS·CJS와 HTML 내부 일반 JavaScript를 검사한다.
- 별도 GLSL·WGSL, minified 파일, 자동 생성 자산과 외부 소스는 제외한다. 셰이더가 HTML/JS 안에 있으면 가능한 최소 영역만 ignore한다.
- 변경 파일의 **파일 전체**를 포맷팅한다. 전체 레거시 저장소의 일괄 포맷팅은 별도 작업이다.
- CI는 PR 변경 파일만 검사하며 ESLint warning은 통과한다. 검사 도구는 개발 전용으로만 설치하고 게임 빌드·런타임에 추가하지 않는다.

## 빠른 리뷰 순서 {#review}

코드 리뷰나 새 기능 설계 때 아래 순서로 본다. 위일수록 늦게 발견했을 때 더 비싸다.

검증 코드의 보존과 3분 실행 상한, 작업 완료 시 문서 동기화는 [공통 프로젝트 관리 규칙의 검증 정책](project-management.md#verification)을 따른다. 개발 규칙에 같은 정책 원문을 중복하지 않는다.

| 순서 | 질문 | 대표 태그 |
| --- | --- | --- |
| 1    | 같은 상태의 진실/소유자가 여러 곳에 퍼져 있나?                                                                    | #SSOT #SingleOwnership                          |
| 2    | 불가능한 상태 조합을 자료구조가 허용하나?                                                                         | #StateMachine #MakeIllegalStatesUnrepresentable |
| 3    | 관계를 IS-A / HAS-A / CAN-BE로 구분했나? CAN-BE의 내부 component까지 Host가 소유하거나 중계하고 있지 않나?        | #IS_A_HAS_A_CAN_BE #Mixin #CapabilityOwnership |
| 4    | 객체 이름으로 behavior를 분기하나?                                                                                | #CapabilityBasedDesign                           |
| 5    | 같은 behavior의 인스턴스가 다른 값을 가질 수 있나?                                                                | #InstanceConfiguration                           |
| 6    | Core가 구체 라이브러리를 직접 알고 있나?                                                                          | #DependencyInversion                             |
| 7    | Signal을 사건 당사자가 소유하나?                                                                                  | #SignalPattern #SignalOwnership                 |
| 8 | Mixin이 Host 요구사항(Requires.*)을 명시하고, 같은 public method를 우연히 덮어쓰지 않나? | #MixinRequirements #SuperChain |
| 9 | 항상 필요한 Mixin 의존성을 상위 Mixin 조합(Composite Mixin)으로 압축했나? 반복 조합을 상속 Base로 굳히지 않았나? | #ComposableMixins #NoMixinBase |
| 10 | 기능 하나의 변경이 여러 파일로 퍼지나? | #LocalityOfChange |
| 11 | 읽기/쓰기와 내부/외부 API가 섞여 있나? | #CQS #Encapsulation #SemanticAPI |
| 12 | 같은 접두어의 상태가 평평하게 늘어나고 있나? 기능/소유권 단위 namespace로 묶을 수 있나? | #HierarchicalNaming #SemanticNamespace |
| 13 | 죽은 코드·레거시·중복·과추상화가 쌓이고 있나? | #NoDeadCode #YAGNI #DRY |
| 14 | 예외를 감싸 새로 던지거나 삼켜서 원본의 이름·스택이 로그에서 사라지나? | #FailFast #PreserveStackTrace |
| 15 | 플레이 중 처음 쓰이는 순간에 셰이더 컴파일·텍스처 업로드·오디오 디코딩·GPU 자원 할당이 일어나나? 첫 사용 프레임 시간을 봤나? | #PreloadBeforePlay #NoInGameLoad |
| 16 | 렌더 제출량(드로우콜·프로그램·삼각형)을 실행 중 읽을 수 있나? 렌더 변경 PR에 묶음 위치·증감의 코드 근거가 있나? | #DrawCallVisibility #SubmissionCountFirst |
| 17 | 개체를 10개 늘리거나 종류·텍스처를 하나 추가했을 때 드로우콜이 함께 늘어나나? | #CountIndependentDrawCalls #BatchByRenderState |
| 18 | 틱 수 설정 하나를 바꾸면 지속·주기·지연의 실제 시간이 달라지나? 시간 값이 틱·프레임 개수로 적혀 있나? | #TimeInMilliseconds #TickRateOneKnob |

> **판단 공식:**
> 우선순위 ≈ **나중에 구조를 뜯어고쳐야 하는 비용 × 발생 빈도**.
> 예시가 바로 떠오르지 않는 원칙은 일단 아래로 내리고, 실제 반복 사례가 생겼을 때 승격한다.
