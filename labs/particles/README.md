# 블룸 파티클·게임 이펙트 연구소 v3

**기존 40종 + 조합 6종을 유지하고, 수치·게이지·UI·보상·전술 표시 28종을 추가했습니다.** 총 74개 항목입니다. 실행 파일은 `BLOOM_Particle_Lab_v3_GameKit.html` 하나입니다. 인터넷·빌드·외부 이미지·폰트 파일 없이 브라우저에서 엽니다.

## 먼저 사용하기

HTML의 첫 화면은 **신규 28종**입니다. 분류를 ‘전체’로 바꾸면 기존 효과까지 나옵니다. 효과를 눌러 확대하면 **게임 입력 데이터**와 **계층형 컨피그**가 분리되어 있습니다. 실제 숫자는 입력 데이터에서, 모양·시간·색·표시 형식은 컨피그에서 바꿉니다. 비교 보관 버튼으로 최대 네 개의 설정을 비교합니다.

수입·연타 예제의 `data.events`는 시연용 시간표입니다. 수치 입력 적용 버튼을 누르면 이 시간표를 비우고 단일 값 표시로 바꿉니다. ‘데이터 JSON’에서는 시간표 자체를 편집할 수 있습니다. 실제 게임은 애니메이션의 시간표로 경제·전투를 처리하지 않고 **이미 판정된 결과**를 전달해야 합니다.

**게임에 가져가기**에서는 실행 모듈, 현재 데이터와 설정을 담은 JSON, 같은 모듈을 내장한 독립 HTML을 추출합니다. `examples/digit-roll-standalone.html`은 이 기능으로 실제 추출·실행한 예제입니다.

## 파일

- `bloom-effects.js`: DOM·네트워크·RAF를 소유하지 않는 재사용 ESM. 기존 효과, 새로운 숫자와 UI 모션이 모두 여기 있습니다.
- `vendor/device.js`, `vendor/presentation-events.js`: v2에서 사용한 GameKit 원본. 변경하지 않았습니다.
- `lab.js`, `example.js`, `lab-shell.html`, `build-lab.mjs`: 연구소 호스트 및 오프라인 HTML 생성기. 게임에는 필요하지 않습니다.
- `docs/REFERENCE.md`: 실제 읽은 저장소·파일 blob·함수·응용 범위.
- `docs/FEEDBACK.md`: 신규 28종과 데이터 계약.
- `tests/`, `validation/`: 단위검사, 실제 브라우저 검사, 설정 소비 감사와 결과. 가짜 디바이스 기반 검사와 실제 WebGL 검사를 구별합니다.

`examples/ui-hud-standalone.html`은 기존 DOM 지갑·한글 버튼과 WebGL 수치 연출을 같은 모듈로 연결한 작은 호스트입니다. 버튼을 연속해서 누르면 실제 합산·수치 재목표·버튼 탄성을 확인할 수 있습니다. 두 게임 자체를 수정한 예제가 아닙니다.

## GameKit 연결

```js
import { BloomEffects } from './bloom-effects.js';

// 기존 게임이 소유한 GameKit WebGLDevice를 전달합니다.
const effects = new BloomEffects({ device });

// 판정이 끝난 실제 피해량을 전달합니다. 이 코드는 HP를 바꾸지 않습니다.
const damage = effects.spawn('damage_number', {
  position: { x: 320, y: 180 },
  data: { to: 128 },
  config: {
    appearance: { color: '#ff9b94', scale: 1 },
    text: { fontSize: 25 },
    float: { risePx: 38, popScale: 1.22 },
    lifetime: { durationMs: 1300 }
  }
});

// 게임의 표현 프레임에서. deltaMs는 밀리초입니다.
effects.update(deltaMs);
// 기존 device.beginFrame(...)과 device.endFrame() 사이입니다.
effects.render({ width: cssWidth, height: cssHeight });

// 지속 효과는 소유자가 정리합니다. 일회성 효과는 수명 만료 시 정리됩니다.
// effects.stop(handle);
// 씬을 떠날 때 effects.dispose(); — 외부 device는 해제하지 않습니다.
```

기존 게임이 사용하는 캔버스·디바이스를 재사용하며 두 번째 WebGL 컨텍스트를 만들 필요가 없습니다. 단, 현재 게임의 디바이스가 여기서 사용한 **공개 API와 호환되는지**는 연결 시 확인해야 합니다. 이번 배포는 이전 연구소와 같은 GameKit 커밋 `421e04145c89b827d280f5774e8d502486cc3074`를 고정 사용합니다. 두 게임의 최신 SDK 버전으로 자동 업그레이드한 작업은 아닙니다.

### 카운트업과 끊기지 않는 목표 변경

```js
const wallet = effects.spawn('count_up', {
  position: { x: 500, y: 40 },
  data: { from: 1200, to: 1450, max: 5000 },
  config: {
    transition: { durationMs: 700, delayMs: 0, easing: 'outCubic' },
    format: { decimals: 0, grouping: true }
  }
});

// 새 목표가 와도 이전 목표에서 시작하지 않습니다.
// 현재 화면에 보이는 중간값에서 1800으로 이어집니다.
effects.retarget(wallet, 1800, { durationMs: 500 });

// 관찰 전용 쿼리. 게임의 실제 자원 원본으로 쓰지 않습니다.
const visible = effects.values(wallet).value;
```

`setData(handle, patch, {restart:true})`는 새 데이터로 처음부터 재생합니다. `retarget()`은 현재값 연속성을 보존하며 새 목표로 전환합니다. `configure(handle, patch)`는 스타일 설정만 바꿉니다. 각 인스턴스의 설정은 중첩 부분 병합되고 서로 공유되지 않습니다.

`transition.durationMs`는 값 변화 시간, `lifetime.durationMs`는 일회성 종료 시간입니다. 지속 숫자·게이지는 기본적으로 끝값을 유지합니다. `loop:false`를 명시하면 수명 뒤 제거됩니다. 연구소의 반복 재생은 **호스트의 미리보기 기능**으로 별도 처리합니다. 시간 곡선은 `linear`, `outCubic`, `inOutCubic`을 지원합니다. 쿨다운과 상태 만료의 기본 곡선은 일정 속도입니다.

### 수입 합산 채널

```js
import { NumberLabelChannel } from './bloom-effects.js';

const income = new NumberLabelChannel(effects, {
  effect: 'resource_number',
  mergeGapMs: 250,
  maxSpanMs: 480,
  maxVisible: 10,
  config: { format: { sign: 'always' } }
});

// 시뮬레이션/저장소에서 실제 수입을 확정한 뒤의 표현 콜백입니다.
income.emit({
  key: 'mineral:dropoff-7',
  value: 25,
  position: { x: 120, y: 240 }
});

// 한 프레임에 각 시계를 한 번씩 진행합니다.
income.update(deltaMs); // 채널의 합산 창만 진행, effects를 중복 진행하지 않음
// effects.update(deltaMs)는 위의 공통 표현 루프에서 한 번만 호출

// income.dispose()를 effects.dispose()보다 먼저 호출합니다.
```

키가 같고 시간 창 안이면 한 숫자로 합산합니다. 키는 게임이 엔티티·자원·위치 의미에 맞춰 정합니다. 공간 거리·화면 충돌 회피를 라이브러리가 추측하지 않습니다. 화면에 남길 숫자 수를 제한해도 실제 획득 자원은 줄이지 않습니다. `emit()`의 키 탐색/합산은 Map 기반 평균 O(1), `update()`는 표시 수 M에 대해 O(M)입니다. 이벤트 중복 제거는 이 채널이 아니라 기존 GameKit 이벤트 큐가 담당합니다.

### 실제 DOM UI에도 같은 모션 사용

```js
import { UiMotion, NumberTransition, formatNumber } from './bloom-effects.js';

const feedback = new UiMotion('button_spring', {
  ui: { damping: 6, frequencyHz: 3.5 }
});
const pose = {};
const number = new NumberTransition({
  from: 1200, to: 1500, startedAtMs: 0,
  durationMs: 800, easing: 'outCubic'
});

// 기존 UI 프레임에서의 예시입니다. 모듈은 자체 RAF를 만들지 않습니다.
feedback.sample(elapsedMs, pose);
button.style.transform = `scale(${pose.scaleX}, ${pose.scaleY})`;
walletElement.textContent = formatNumber(number.sample(elapsedMs));
```

`UiMotion`은 `button_spring`, `denied_shake`, `toast_slide`, `card_reveal`을 지원합니다. `x`, `y`, `scaleX`, `scaleY`, `opacity`, `front`, `progress`, `finished`를 계산합니다. 연구소 도형도 같은 계산 함수를 사용하므로 모션 수식을 복사할 필요가 없습니다. 기존 DOM의 transform이 있으면 그 소유자가 이 값을 합성해야 하며, 무조건 style 전체를 덮어쓰지 마세요. 카드의 앞·뒷면 내용 전환은 `front`로 호스트가 처리합니다. 버튼 반응은 종료 시 크기 1로 복귀합니다.

### 월드 숫자와 HUD 숫자

월드 공간과 화면 공간이 섞이면 패스를 나눕니다. `effects.render({ handles: worldHandles, project(x,y,out) { /* 게임의 투영값을 out.x/out.y에 */ }, ... })`와 `effects.render({ handles: hudHandles, ... })`를 동일 디바이스 프레임에서 순서대로 호출할 수 있습니다. 이펙트는 게임의 XYZ 카메라·높이·가림·시야 정책을 추측하지 않습니다. 투영 후 화면 밖인 숫자를 생략하거나 HUD를 최상단에 유지하는 정책은 해당 게임의 표현 호스트에서 처리하세요.

### 숫자 형식과 글자 범위

`format`은 `decimals`(0..6), `grouping`, `sign`(`auto/always/never`), `compact`, `prefix`, `suffix`, `tiny`를 제공합니다. `compact`는 K/M/B/T이며 단위가 올라가는 반올림을 처리합니다. 실제 0이 아닌 작은 값이 설정 자릿수에서 0으로 반올림되면 기본 `tiny:'scientific'`가 지수 표기를 사용합니다. 의도적으로 반올림 0을 표시할 때는 `tiny:'zero'`를 사용합니다. 자바스크립트 Number의 정밀도를 넘어서는 정확한 정수/금융 계산을 제공하는 모듈은 아닙니다.

새 WebGL 숫자는 직접 작성한 **숫자·영문 대문자·일부 기호의 벡터 도형**입니다. 한글 UI 문구는 연구소의 일반 DOM으로 표시합니다. 임의 한글을 WebGL 벡터 문자로 렌더하는 기능은 없으며 한글 문자열을 슬쩍 깨진 글자로 수용하지 않고 `data.label`에서 거부합니다. 게임의 기존 한글 HUD는 위 `UiMotion` / `NumberTransition`과 함께 그대로 사용할 수 있습니다. 외부 폰트·비트맵/스프라이트를 이 패키지가 추가하지 않습니다.

### GameKit 표현 이벤트

```js
import { createPresentationAdapter } from './bloom-effects.js';
const queue = new PresentationEventQueue({
  adapters: { vfx: createPresentationAdapter(effects) }
});
// 기존 GameKit 이벤트 identity 규칙에 따라 한 번씩 emit하고 confirm합니다.
queue.emit({
  tick: 100, sequence: 0, entityId: 'unit-7', generation: 1,
  kind: 'vfx', durationMs: 1300,
  payload: {
    effect: 'damage_number', data: { to: 128 },
    position: { x: 120, y: 240 }
  }
});
```

기존 게임이 이미 같은 이벤트를 큐에 보내고 있다면 두 번째 경로를 추가하지 말고 기존 어댑터에 연결합니다. 외부 시계 효과는 큐가 진행시키며 `effects.update()`가 중복 진행하지 않습니다. 예측 취소·교정 시 숫자도 취소·교정됩니다. `NumberLabelChannel`은 확정된 수입에 사용하는 것이 기본입니다. 서로 다른 예측 이벤트를 먼저 합산하면 부분 취소의 의미를 호스트가 별도로 관리해야 합니다.

## 검증과 범위

정확한 결과는 `validation/TEST-REPORT.md`, `browser-report.json`, `node-tests.txt`, `parameter-audit.json`을 보세요. 실제 Chromium에서 74종×5시점을 렌더했고, 새로운 28종의 화면을 직접 관찰했습니다. 모바일은 화면 크기/터치 에뮬레이션이지 실물 Android 검사가 아닙니다. 두 원본 게임 저장소의 코드 변경, 푸시, 실제 게임 플레이 통합은 하지 않았습니다.

## 재생성/테스트

```sh
node build-lab.mjs
node --test tests/runtime.test.mjs tests/feedback.test.mjs
node tests/parameter-audit.mjs
# Python Playwright와 Chromium/Xvfb가 설치된 Linux 검사 환경
xvfb-run -a python tests/browser.v3.py
# 모든 신규 화면 캡처까지 포함
BLOOM_CAPTURE=1 xvfb-run -a python tests/browser.v3.py
```

빌드 도구는 개발 편의용입니다. 완성된 HTML을 실행하는 사용자에게 Node/Python은 필요하지 않습니다.
