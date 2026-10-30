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

> **판단 공식:**
> 우선순위 ≈ **나중에 구조를 뜯어고쳐야 하는 비용 × 발생 빈도**.
> 예시가 바로 떠오르지 않는 원칙은 일단 아래로 내리고, 실제 반복 사례가 생겼을 때 승격한다.
