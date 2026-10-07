const TAU = Math.PI * 2, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t, fract = x => x - Math.floor(x), ease = x => 1 - Math.pow(1 - clamp(x), 3), smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); }, mod = (x, m) => ((x % m) + m) % m;
function rand(i, seed = 2718) { let x = (Math.imul(i + 1, 1597334677) ^ Math.imul(seed | 0, 3812015801)) | 0; x = Math.imul(x ^ (x >>> 16), 2246822507); x = Math.imul(x ^ (x >>> 13), 3266489909); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; }
const hexCache = new Map();
function rgb(hex) { if (Array.isArray(hex))
    return hex; if (hexCache.has(hex))
    return hexCache.get(hex); const a = [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]; if (hexCache.size >= 512)
    hexCache.delete(hexCache.keys().next().value); hexCache.set(hex, a); return a; }
function blend(a, b, t) { a = rgb(a); b = rgb(b); return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t]; }
/**
 * BLOOM Effects · GameKit extension, schema 3.
 * No DOM, network, RAF, simulation state or private GameKit access.
 * The caller owns WebGLDevice and its frame. This module owns only its VFX resources.
 * Public clocks use milliseconds. Authored shape samplers convert to seconds once.
 */
export const provenance = Object.freeze({
    repository: 'byh-playground/bloom-gamekit',
    commit: '421e04145c89b827d280f5774e8d502486cc3074',
    renderingSource: 'modules/rendering/device.js',
    renderingBlob: 'b4c2e81eca8b9abc7627b3af44bdda6ce01ca63c',
    presentationSource: 'modules/presentation-events/index.js',
    presentationBlob: 'c6ab77207be1e8b36eeba281f435b31d18da4918',
    schema: 3
});
const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);
const plain = value => value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
export function cloneData(value) {
    if (Array.isArray(value))
        return value.map(cloneData);
    if (plain(value)) {
        const result = {};
        for (const key of Object.keys(value)) {
            if (blockedKeys.has(key))
                throw new TypeError(`금지된 설정 키: ${key}`);
            result[key] = cloneData(value[key]);
        }
        return result;
    }
    if (value === null || ['string', 'boolean'].includes(typeof value) ||
        typeof value === 'number' && Number.isFinite(value))
        return value;
    throw new TypeError('설정은 유한한 숫자·문자열·불리언·배열·일반 객체만 지원합니다.');
}
function freezeData(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        for (const child of Object.values(value))
            freezeData(child);
        Object.freeze(value);
    }
    return value;
}
function mergeInto(target, patch) {
    if (!plain(patch))
        throw new TypeError('부분 설정은 일반 객체여야 합니다.');
    for (const key of Object.keys(patch)) {
        if (blockedKeys.has(key))
            throw new TypeError(`금지된 설정 키: ${key}`);
        const value = patch[key];
        if (plain(value)) {
            if (!plain(target[key]))
                target[key] = {};
            mergeInto(target[key], value);
        }
        else
            target[key] = cloneData(value);
    }
    return target;
}
/** Immutable by convention inside sampling; public snapshots are recursively frozen. */
function withPatch(base, patch) {
    const result = { ...base };
    for (const key of Object.keys(patch))
        result[key] = plain(patch[key]) ? withPatch(base[key] || {}, patch[key]) : patch[key];
    return result;
}
export function getPath(object, path) { return path.split('.').reduce((value, key) => value?.[key], object); }
export function patchAt(path, value) {
    const result = {};
    let node = result;
    const parts = path.split('.');
    for (let index = 0; index < parts.length; index++) {
        const key = parts[index];
        if (!key || blockedKeys.has(key))
            throw new TypeError('유효하지 않은 설정 경로입니다.');
        if (index === parts.length - 1)
            node[key] = value;
        else
            node = node[key] = {};
    }
    return result;
}
function finite(value, name, min = -Infinity, max = Infinity) {
    if (!Number.isFinite(value) || value < min || value > max)
        throw new RangeError(`${name}: ${min}..${max} 범위의 유한한 숫자가 필요합니다.`);
    return value;
}
function vector(value, fallback = { x: 0, y: 0 }) {
    value ??= fallback;
    if (!plain(value))
        throw new TypeError('좌표는 { x, y } 객체여야 합니다.');
    return { x: finite(value.x, 'position.x'), y: finite(value.y, 'position.y') };
}
/* Shared parameter vocabulary. UI ranges are suggestions, never runtime clamps. */
const parameterSpecs = {
    size: ['appearance.scale', '전체 크기', 1, .35, 2, .05, 0, Infinity, '×'],
    amount: ['emission.density', '입자·구조 밀도', 1, 0, 2.5, .05, 0, Infinity, '×'],
    duration: ['lifetime.durationMs', '전체 재생 길이', 3000, 200, 12000, 50, 1, Infinity, 'ms'],
    opacity: ['appearance.opacity', '불투명도', 1, 0, 1, .05, 0, 1, ''],
    velocity: ['motion.speedScale', '초기·흐름 속도', 1, 0, 2, .05, 0, Infinity, '×'],
    spread: ['emission.spreadScale', '방출 각도', 1, 0, 2, .05, 0, Infinity, '×'],
    gravity: ['motion.gravityScale', '중력 · 0은 무중력', 1, 0, 2, .05, -Infinity, Infinity, '×'],
    drag: ['motion.dragPerSec', '공기 저항', .65, 0, 2, .05, 0, Infinity, '/s'],
    wind: ['motion.windScale', '바람', 0, -2, 2, .05, -Infinity, Infinity, '×'],
    turbulence: ['motion.turbulenceScale', '흔들림·난류', 1, 0, 2, .05, 0, Infinity, '×'],
    rotation: ['motion.rotationScale', '회전 속도', 1, -2, 2, .05, -Infinity, Infinity, '×'],
    tail: ['trail.lengthScale', '꼬리·잔상 길이', 1, 0, 2, .05, 0, Infinity, '×'],
    branches: ['branch.count', '분기 수', 3, 0, 8, 1, 0, 64, '개'],
    thickness: ['shape.thicknessScale', '선·면 두께', 1, .1, 2.5, .05, 0, Infinity, '×'],
    radius: ['shape.radiusScale', '표면 반경', 1, .1, 2, .05, 0, Infinity, '×'],
    waveSpeed: ['wave.speedScale', '파동 속도', 1, 0, 2, .05, 0, Infinity, '×'],
    arc: ['swing.arcScale', '검격 호의 범위', 1, .1, 2, .05, 0, Infinity, '×'],
    endSize: ['particle.endSizeRatio', '수명 끝 크기 비율', .35, 0, 2, .05, 0, Infinity, ''],
    swingStart: ['swing.startRad', '스윙 시작 각도', -2.7, -Math.PI, Math.PI, .05, -Infinity, Infinity, 'rad'],
    swingSweep: ['swing.sweepRad', '스윙 회전 범위', 4.6, -TAU, TAU, .05, -Infinity, Infinity, 'rad'],
    pathArc: ['trajectory.arcHeight', '비행 경로 높이', 28, -80, 80, 1, -Infinity, Infinity, '단위']
};
const privateDefaults = {
    appearance: { scale: 1, opacity: 1, color: '#a5f1ce', glow: true, fireOnly: false },
    emission: { density: 1, spreadScale: 1 },
    lifetime: { durationMs: 3000 },
    motion: { speedScale: 1, gravityScale: 1, dragPerSec: .65, windScale: 0, turbulenceScale: 1, rotationScale: 1 },
    trail: { lengthScale: 1 }, branch: { count: 3 },
    shape: { thicknessScale: 1, radiusScale: 1 }, wave: { speedScale: 1 },
    swing: { arcScale: 1, startRad: -2.7, sweepRad: 4.6 },
    particle: { endSizeRatio: .35 }, trajectory: { arcHeight: 28 }
};
/**
 * Presentation-only scalar feedback. No wallet/HP mutation, DOM, timers or randomness.
 * Referenced: Rally FloatingTextPresentationDefinition/floatFx; Budmori resourceGain.
 * Text is procedural vector geometry: digits, Latin labels and common numeric symbols.
 */
const FEEDBACK_SPECS = {
 fontSize:['text.fontSize','글자 높이',25,10,48,1,1,160,'px'],
 fontStroke:['text.strokePx','글자 두께',2.3,.8,5,.1,.1,12,'px'],
 textOutline:['text.outlinePx','어두운 외곽선',1.1,0,3,.1,0,8,'px'],
 rise:['float.risePx','떠오르는 거리',38,0,85,1,-200,200,'px'],
 drift:['float.driftPx','가로 이동',8,-60,60,1,-300,300,'px'],
 pop:['float.popScale','등장 확대',1.22,1,1.8,.02,1,4,'×'],
 transitionTime:['transition.durationMs','값 전환 시간',900,50,2400,25,1,60000,'ms'],
 transitionDelay:['transition.delayMs','값 전환 대기',250,0,1500,25,0,60000,'ms'],
 width:['gauge.widthPx','게이지 폭',166,70,220,1,10,1000,'px'],
 height:['gauge.heightPx','게이지 높이',12,3,28,1,1,120,'px'],
 gaugeRadius:['gauge.radiusPx','원형 반경',42,18,72,1,2,500,'px'],
 segments:['gauge.segments','게이지 칸 수',10,2,20,1,1,64,'개'],
 gap:['gauge.gapPx','칸 사이 간격',3,0,8,.5,0,20,'px'],
 trailDelay:['gauge.trailDelayMs','피해 잔상 대기',450,0,1400,25,0,60000,'ms'],
 trailTime:['gauge.trailDurationMs','잔상 추격 시간',950,50,2000,25,1,60000,'ms'],
 travel:['ui.travelPx','UI 이동 거리',45,0,100,1,0,300,'px'],
 damping:['ui.damping','탄성 감쇠',6,1,14,.25,.1,50,''],
 frequency:['ui.frequencyHz','흔들림·탄성 빈도',3.5,1,8,.1,.1,20,'Hz'],
 shake:['ui.shakePx','거부 흔들림',9,0,24,.5,0,80,'px'],
 rewardCount:['reward.count','보상 조각 수',12,1,28,1,1,64,'개'],
 rewardSpread:['reward.spreadPx','보상 펼침 반경',35,0,90,1,0,300,'px'],
 rewardFlight:['reward.flightMs','회수 비행 시간',900,200,1800,25,1,60000,'ms'],
 warningRadius:['indicator.radiusPx','표식 반경',50,15,88,1,1,1000,'px'],
 warningAngle:['indicator.sweepRad','예고 부채꼴 각도',1.7,.2,6.28,.05,.05,TAU,'rad'],
 turn:['indicator.rotationRad','표식 방향',-.7,-3.14,3.14,.05,-1e6,1e6,'rad']
};
const FEEDBACK_BASE = {
 text:{fontSize:25,strokePx:2.3,outlinePx:1.1},
 float:{risePx:38,driftPx:8,popScale:1.22},
 transition:{durationMs:900,delayMs:250},
 gauge:{widthPx:166,heightPx:12,radiusPx:42,segments:10,gapPx:3,trailDelayMs:450,trailDurationMs:950},
 ui:{travelPx:45,damping:6,frequencyHz:3.5,shakePx:9},
 reward:{count:12,spreadPx:35,flightMs:900},
 indicator:{radiusPx:50,sweepRad:1.7,rotationRad:-.7}
};
const TEXT_KEYS=['fontSize','fontStroke','textOutline'];
function feedback(id,cat,name,sub,keys,demo,opts={}) {
 return {id,cat,name,sub,tech:opts.tech||'수치 데이터 · 표현 전용',color:opts.color||'#a5f1ce',
  type:opts.type||'burst',durationMs:opts.durationMs||2800,family:'feedback',
  desc:opts.desc||sub+' 게임이 전달한 값만 표시하며 판정·경제 상태를 수정하지 않습니다.',
  parts:opts.parts||['입력 데이터','시간·형태 설정','공통 GameKit 배치'],keys,
  demo,patch:opts.patch||{},reference:opts.reference||'확장 설계'};
}
const FEEDBACK_DEFINITIONS = [
 feedback('damage_number','numbers','피해 숫자','접점 위로 짧게 튀고 사라지는 실제 피해량',[...TEXT_KEYS,'rise','drift','pop'],{from:0,to:128,max:1000},{durationMs:1300,color:'#ff9b94',reference:'랠리 · FloatingTextPresentationDefinition',patch:{format:{sign:'auto'}}}),
 feedback('critical_number','numbers','치명타 숫자','큰 확대·비대칭 별빛으로 강한 한 번의 타격 강조',[...TEXT_KEYS,'rise','drift','pop'],{from:0,to:1840,max:3000},{durationMs:1650,color:'#ffd17c',patch:{float:{popScale:1.65}},reference:'랠리 피해 표시에서 확장'}),
 feedback('healing_number','numbers','회복 숫자','초록 십자와 완만한 상승으로 피해와 구별',[...TEXT_KEYS,'rise','drift','pop'],{from:0,to:75,max:1000},{durationMs:1500,color:'#a2efc2',patch:{format:{sign:'always'},float:{driftPx:0}},reference:'버드모리 · healingCredit / 실제 HP 증가'}),
 feedback('resource_number','numbers','수입 합산 숫자','짧게 들어온 여러 수입을 하나의 표시로 합산',[...TEXT_KEYS,'rise','drift','pop'],{from:0,to:0,max:1000,events:[{atMs:100,value:25},{atMs:330,value:50},{atMs:560,value:25}]},{durationMs:1950,color:'#ffdc78',patch:{format:{sign:'always'},float:{risePx:18,driftPx:0}},reference:'랠리 income 병합 · 버드모리 resourceGain'}),
 feedback('count_up','numbers','카운트업·다운','현재 보이는 값에서 새 목표값까지 부드럽게 전환',[...TEXT_KEYS,'transitionTime','transitionDelay'],{from:850,to:12500,max:20000},{type:'continuous',color:'#b9eacb',reference:'두 게임 자원 HUD에서 확장'}),
 feedback('digit_roll','numbers','자릿수 롤링','변하는 자릿수만 위아래로 넘어가는 계기판',[...TEXT_KEYS,'transitionTime','transitionDelay'],{from:998,to:1205,max:10000},{type:'continuous',color:'#c3d9ff',reference:'자원·점수 HUD 확장'}),
 feedback('delta_number','numbers','증감 비교','이전 값과 새 값·차이·방향을 함께 보여주는 변화',[...TEXT_KEYS,'transitionTime','transitionDelay'],{from:250,to:375,max:1000},{type:'continuous',color:'#a8e6bc',reference:'버드모리 성장 수치 before → after'}),
 feedback('combo_counter','numbers','연속 합계·배율','연속 타격의 누적 숫자와 횟수에 맞춘 재강조',[...TEXT_KEYS,'pop'],{from:0,to:0,max:5000,events:[{atMs:100,value:120},{atMs:480,value:145},{atMs:900,value:320},{atMs:1350,value:640}]},{durationMs:3200,color:'#edb6ff',reference:'다중 피해 합계 확장'}),
 feedback('health_trail','gauges','체력·피해 잔상','실제 체력은 즉시 줄고 잔상 막대는 늦게 따라감',[...TEXT_KEYS,'width','height','trailDelay','trailTime'],{from:100,to:38,max:100},{type:'continuous',color:'#f19a91',reference:'두 게임 HP HUD에서 확장',patch:{text:{fontSize:17}}}),
 feedback('shield_gauge','gauges','체력·보호막 계층','체력과 별도 보호막 용량을 겹치지 않게 표시',[...TEXT_KEYS,'width','height','transitionTime','transitionDelay'],{from:25,to:60,max:100,secondary:72},{type:'continuous',color:'#a8d8ff',reference:'랠리 hitGuard · 버드모리 shield',patch:{text:{fontSize:16}}}),
 feedback('radial_cooldown','gauges','원형 쿨다운','남은 시간과 원형 진행이 같은 값으로 감소',[...TEXT_KEYS,'gaugeRadius','transitionTime','transitionDelay'],{from:5,to:0,max:5},{type:'continuous',color:'#b3d0ff',durationMs:5000,patch:{transition:{durationMs:3800},format:{decimals:1,suffix:'S'}}}),
 feedback('segmented_gauge','gauges','분할 충전 칸','연속 수치를 칸 단위로 읽을 수 있는 충전 표시',[...TEXT_KEYS,'segments','gap','width','height','transitionTime','transitionDelay'],{from:1,to:8,max:10},{type:'continuous',color:'#b9e78a',reference:'버드모리 progressTrack에서 확장'}),
 feedback('capture_meter','gauges','거점 점령 진행','점령 퍼센트와 지면 고리를 함께 채우는 진행',[...TEXT_KEYS,'gaugeRadius','transitionTime','transitionDelay'],{from:0,to:100,max:100},{type:'continuous',color:'#9be1db',reference:'랠리 capturePoints.progress',patch:{format:{suffix:'%'},transition:{durationMs:1650}}}),
 feedback('xp_level','gauges','경험치·레벨 넘김','임계값을 넘으면 게이지가 돌아가고 레벨이 증가',[...TEXT_KEYS,'width','height','transitionTime','transitionDelay'],{from:80,to:230,max:100,count:7},{type:'continuous',color:'#d9b3ff',reference:'버드모리 성장·합성에서 확장',patch:{text:{fontSize:17},transition:{durationMs:1750}}}),
 feedback('button_spring','interface','버튼 탄성 반응','눌림 → 반동 → 안정의 감쇠된 확대·축소',['damping','frequency'],{to:1},{color:'#b5e3cd',durationMs:1800}),
 feedback('attention_ping','interface','배지·새 알림','작은 숫자 배지에 바깥 고리로 새 알림을 전달',[...TEXT_KEYS,'warningRadius'],{to:3},{color:'#ffb2a4',patch:{text:{fontSize:17},indicator:{radiusPx:36}}}),
 feedback('toast_slide','interface','알림 슬라이드','등장·유지·퇴장으로 끝나는 한 줄 알림',[...TEXT_KEYS,'travel'],{to:250,label:'REWARD'},{durationMs:3000,color:'#badfc9'}),
 feedback('denied_shake','interface','부족·실패 피드백','가로 흔들림과 경고 테두리로 실패를 알려줌',[...TEXT_KEYS,'shake','damping','frequency'],{to:75,label:'NEED'},{durationMs:1850,color:'#ffaaa3',reference:'자원 부족·불가 명령의 UI 확장'}),
 feedback('card_reveal','interface','카드 뒤집기 공개','카드 폭이 줄었다 펴지며 앞면과 등급을 공개',[...TEXT_KEYS,'transitionTime','transitionDelay'],{to:4,label:'RARE'},{durationMs:2900,color:'#c9b5ff',reference:'버드모리 성장 카드 · 랠리 전술 보상'}),
 feedback('focus_brackets','interface','선택·포커스 모서리','네 모서리가 다가와 선택 대상을 고정',['warningRadius','travel'],{to:1},{durationMs:2200,color:'#b5edcf',reference:'랠리 selectedBuilding overlay'}),
 feedback('loot_transfer','rewards','보상 → 지갑 회수','펼친 보상 조각이 목표 좌표에 닿을 때만 숫자 반영',[...TEXT_KEYS,'rewardCount','rewardSpread','rewardFlight'],{from:1200,to:1500,max:5000},{durationMs:3600,color:'#ffcf77',reference:'버드모리 지갑 강조에서 확장',patch:{text:{fontSize:15}}}),
 feedback('level_up','rewards','레벨업 선언','레벨 숫자·상승 화살표·방사 광선의 한 번의 축하',[...TEXT_KEYS,'rewardCount','warningRadius'],{from:7,to:8,max:100},{durationMs:2600,color:'#c7efa2',reference:'버드모리 성장 연출 확장'}),
 feedback('unlock_burst','rewards','잠금 해제','잠금 고리가 열리고 해방된 조각이 퍼짐',['rewardCount','warningRadius'],{to:1},{durationMs:2400,color:'#b8dfed',reference:'지역·시설·병종 해금'}),
 feedback('rarity_beacon','rewards','희귀 보상 표식','지면 링과 세로 빛기둥으로 드랍 위치를 강조',['warningRadius','rewardCount'],{to:1},{type:'continuous',color:'#d4b1ff',reference:'아이템·중립 오브젝트 표식 확장'}),
 feedback('attack_warning','tactics','범위 공격 예고','부채꼴 위험 영역과 채워지는 시전 진행',['warningRadius','warningAngle','turn','transitionTime','transitionDelay'],{from:0,to:1,max:1},{durationMs:2800,color:'#ffb176',reference:'버드모리 정예·보스 공격 예고'}),
 feedback('direction_indicator','tactics','목표 방향 안내','현재 위치에서 목표 방향으로 정렬되는 흐름 화살표',['warningRadius'],{to:1},{type:'continuous',color:'#b7e3d8',reference:'집결·이동 목표 안내'}),
 feedback('rally_marker','tactics','집결·이동 명령','명령 지점을 깃발과 지면 확산 링으로 확인',['warningRadius'],{to:1},{durationMs:2300,color:'#a7d5ff',reference:'랠리 집결 깃발·flagFx'}),
 feedback('buff_stack','tactics','상태 스택·만료','스택 숫자와 남은 시간 링을 같은 표식에 표시',[...TEXT_KEYS,'gaugeRadius','transitionTime','transitionDelay'],{from:1,to:0,max:1,count:4},{type:'continuous',durationMs:4200,color:'#dbbeff',patch:{transition:{durationMs:3300},text:{fontSize:22}},reference:'회복·보호막·강화 상태 표현 확장'})
].map((e,i)=>({...e,index:47+i}));

// All supported glyphs are authored geometry, not an image/texture/font dependency.
const GLYPHS = {
 '0':[[.16,.06,.42,0,.62,.12,.7,.33,.7,.72,.57,.96,.28,1,.09,.84,.03,.57,.04,.28,.16,.06]],
 '1':[[.12,.22,.38,.02,.38,1],[.13,1,.65,1]],
 '2':[[.06,.18,.22,.03,.48,.02,.67,.18,.68,.35,.54,.51,.12,.84,.05,1,.7,1]],
 '3':[[.06,.1,.3,.02,.57,.05,.68,.23,.61,.4,.4,.49],[.34,.49,.56,.53,.69,.68,.67,.86,.52,.98,.25,1,.05,.87]],
 '4':[[.55,1,.55,0,.04,.7,.74,.7]],
 '5':[[.66,.02,.11,.02,.08,.47,.41,.44,.63,.54,.71,.72,.64,.91,.47,1,.23,1,.05,.9]],
 '6':[[.62,.05,.43,.02,.2,.17,.06,.42,.05,.76,.17,.94,.42,1,.65,.9,.7,.7,.6,.53,.39,.47,.15,.53,.06,.64]],
 '7':[[.03,.02,.72,.02,.32,1]],
 '8':[[.36,.01,.13,.07,.04,.24,.12,.42,.36,.51,.62,.4,.7,.22,.6,.06,.36,.01],[.36,.51,.12,.61,.04,.8,.17,.98,.45,1,.66,.91,.7,.73,.56,.58,.36,.51]],
 '9':[[.65,.46,.47,.56,.2,.53,.05,.35,.07,.14,.28,.01,.52,.04,.67,.2,.68,.55,.54,.86,.31,1,.12,.98]],
 '+':[[.08,.51,.64,.51],[.36,.23,.36,.81]],'-':[[.08,.52,.64,.52]],
 '.':[[.32,.95,.36,.99]],',':[[.39,.89,.3,1.11]],':':[[.34,.28,.37,.31],[.34,.77,.37,.8]],
 '/':[[.06,1,.66,0]],'%':[[.03,.96,.69,.04],[.1,.03,.23,.03,.27,.17,.19,.28,.06,.22,.04,.09,.1,.03],[.54,.73,.67,.75,.7,.89,.62,1,.49,.94,.48,.81,.54,.73]],
 'A':[[0,1,.34,0,.72,1],[.13,.65,.58,.65]],'B':[[.06,1,.06,0,.43,0,.66,.12,.66,.34,.45,.49,.06,.49],[.4,.49,.68,.62,.68,.84,.46,1,.06,1]],
 'C':[[.69,.13,.51,.01,.24,.01,.04,.21,.04,.77,.24,.98,.51,.98,.69,.84]],
 'D':[[.06,1,.06,0,.37,0,.66,.18,.7,.5,.65,.82,.39,1,.06,1]],
 'E':[[.68,0,.06,0,.06,1,.68,1],[.06,.49,.54,.49]],'F':[[.06,1,.06,0,.68,0],[.06,.49,.55,.49]],
 'G':[[.69,.14,.49,.01,.24,.01,.04,.23,.04,.77,.24,.99,.58,.95,.69,.78,.69,.54,.4,.54]],
 'H':[[.05,0,.05,1],[.69,0,.69,1],[.05,.5,.69,.5]],'I':[[.09,0,.63,0],[.36,0,.36,1],[.09,1,.63,1]],
 'J':[[.08,0,.68,0,.68,.77,.53,.98,.25,.98,.06,.8]],'K':[[.06,0,.06,1],[.68,0,.06,.53,.7,1]],
 'L':[[.06,0,.06,1,.68,1]],'M':[[.03,1,.03,0,.36,.56,.71,0,.71,1]],'N':[[.05,1,.05,0,.69,1,.69,0]],
 'O':[[.26,0,.48,0,.68,.2,.69,.79,.49,1,.25,1,.05,.78,.05,.22,.26,0]],
 'P':[[.06,1,.06,0,.48,0,.68,.18,.66,.4,.48,.51,.06,.51]],
 'Q':[[.25,0,.48,0,.68,.2,.68,.77,.48,1,.24,1,.05,.78,.05,.2,.25,0],[.43,.7,.76,1.08]],
 'R':[[.06,1,.06,0,.47,0,.68,.2,.63,.4,.45,.49,.06,.49],[.37,.49,.7,1]],
 'S':[[.68,.1,.45,0,.2,.02,.04,.18,.08,.4,.6,.6,.7,.8,.56,.98,.26,1,.05,.88]],
 'T':[[.01,0,.72,0],[.36,0,.36,1]],'U':[[.05,0,.05,.77,.22,.99,.5,.99,.69,.78,.69,0]],
 'V':[[.02,0,.35,1,.71,0]],'W':[[0,0,.16,1,.36,.45,.55,1,.74,0]],
 'X':[[.03,0,.69,1],[.69,0,.03,1]],'Y':[[.02,0,.36,.53,.71,0],[.36,.53,.36,1]],
 'Z':[[.03,0,.7,0,.03,1,.7,1]],'!':[[.36,0,.36,.7],[.36,.95,.37,1]],
 '(': [[.49,0,.29,.25,.25,.7,.47,1]],')':[[.25,0,.45,.25,.49,.7,.27,1]],' ':[]
};
function textSupported(value){return typeof value==='string'&&value.length<=32&&[...value.toUpperCase()].every(c=>GLYPHS[c]||'×−'.includes(c));}
function clippedLine(g,x1,y1,x2,y2,w,color,a,clip){
 if(clip){let t0=0,t1=1; const dx=x2-x1,dy=y2-y1;
  for(const [p,q] of [[-dx,x1-clip[0]],[dx,clip[2]-x1],[-dy,y1-clip[1]],[dy,clip[3]-y1]]){
   if(p===0){if(q<0)return;}else{const t=q/p;if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);}
  } if(t0>t1)return;const ax=x1,ay=y1;x1=ax+dx*t0;y1=ay+dy*t0;x2=ax+dx*t1;y2=ay+dy*t1;
 }
 g.line(x1,y1,x2,y2,w,color,a);
}
export function drawVectorText(g,text,x,y,{size=24,color='#ffffff',alpha=1,stroke=2.2,outline=0,align='center',maxWidth=230,clip=null}={}){
 text=String(text).toUpperCase().replaceAll('×','X').replaceAll('−','-');
 if(text.length>64)text=text.slice(0,64);
 const rawWidth=Math.max(0,text.length*.88-.16)*size,fit=Math.min(1,maxWidth/Math.max(1,rawWidth)),s=size*fit;
 const width=Math.max(0,text.length*.88-.16)*s,ox=x-(align==='left'?0:align==='right'?width:width/2),oy=y-s/2;
 function pass(w,c){for(let i=0;i<text.length;i++){
  const glyph=GLYPHS[text[i]]||GLYPHS['!'];for(const path of glyph){
   for(let j=0;j<path.length-2;j+=2)clippedLine(g,ox+(i*.88+path[j])*s,oy+path[j+1]*s,ox+(i*.88+path[j+2])*s,oy+path[j+3]*s,w*fit,c,alpha,clip);
   for(let j=0;j<path.length;j+=2){const px=ox+(i*.88+path[j])*s,py=oy+path[j+1]*s,r=w*fit*.5;if(!clip||px-r>=clip[0]&&px+r<=clip[2]&&py-r>=clip[1]&&py+r<=clip[3])g.disc(px,py,r,c,alpha);}
  }
 }}
 if(outline>0)pass(stroke+outline*2,'#101b25');pass(stroke,color);return width;
}
const FORMAT_DEFAULT={decimals:0,grouping:true,sign:'auto',compact:false,prefix:'',suffix:'',tiny:'scientific'};
function validateFormat(f){
 if(!['scientific','zero'].includes(f.tiny))throw new TypeError('format.tiny: scientific / zero');
 if(!Number.isInteger(f.decimals)||f.decimals<0||f.decimals>6)throw new RangeError('format.decimals는 0..6 정수입니다.');
 if(!['auto','always','never'].includes(f.sign))throw new TypeError('format.sign: auto / always / never');
 for(const k of ['grouping','compact'])if(typeof f[k]!=='boolean')throw new TypeError('format.'+k+'는 boolean입니다.');
 for(const k of ['prefix','suffix'])if(!textSupported(f[k]))throw new TypeError('format.'+k+': 벡터 숫자·영문·기호 32자 이내입니다.');
}
export function formatNumber(value,options={}){
 finite(value,'value'); const f={...FORMAT_DEFAULT,...options};validateFormat(f);
 let n=Math.abs(value),unit='';
 if(f.compact&&n>=1000){for(const [threshold,u]of [[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']])if(n>=threshold){n/=threshold;unit=u;break;}}
 let body;
 if(n>=1e21)body=n.toExponential(f.decimals).toUpperCase();
 else{body=n.toFixed(f.decimals);if(f.compact&&Number(body)>=1000&&unit&&unit!=='T'){n/=1000;unit={K:'M',M:'B',B:'T'}[unit];body=n.toFixed(f.decimals);}
  if(f.grouping&&!unit){let [whole,frac]=body.split('.');whole=whole.replace(/\B(?=(\d{3})+(?!\d))/g,',');body=whole+(frac===undefined?'':'.'+frac);}}
 let roundedZero=Number(body.replaceAll(',',''))===0;
 if(roundedZero&&value!==0&&f.tiny==='scientific'){body=Math.abs(value).toExponential(Math.max(1,f.decimals)).toUpperCase();unit='';roundedZero=false;}
 const sign=f.sign==='never'?'':(value<0&&!roundedZero?'-':f.sign==='always'?'+':'');
 return f.prefix+sign+body+unit+f.suffix;
}
/** A reusable absolute-time scalar transition, also suitable for DOM HUD consumers. */
export class NumberTransition {
 constructor({from=0,to=from,startedAtMs=0,durationMs=900,delayMs=0,easing='outCubic'}={}){this.reset({from,to,startedAtMs,durationMs,delayMs,easing});}
 reset({from=0,to=from,startedAtMs=0,durationMs=900,delayMs=0,easing='outCubic'}={}){
  for(const[k,v]of Object.entries({from,to,startedAtMs,durationMs,delayMs}))finite(v,k,k==='from'||k==='to'?-Infinity:0);
  if(durationMs===0)throw new RangeError('durationMs는 양수입니다.');
  if(!['linear','outCubic','inOutCubic'].includes(easing))throw new TypeError('easing: linear / outCubic / inOutCubic');
  this.easing=easing;this.from=from;this.to=to;this.startedAtMs=startedAtMs;this.durationMs=durationMs;this.delayMs=delayMs;return this;
 }
 sample(timeMs){finite(timeMs,'timeMs',0);const t=clamp((timeMs-this.startedAtMs-this.delayMs)/this.durationMs);const p=this.easing==='linear'?t:this.easing==='inOutCubic'?(t<.5?4*t*t*t:1-(-2*t+2)**3/2):ease(t);return this.from*(1-p)+this.to*p;}
 retarget(to,timeMs,{durationMs=this.durationMs,delayMs=0,easing=this.easing}={}){const from=this.sample(timeMs);return this.reset({from,to,startedAtMs:timeMs,durationMs,delayMs,easing});}
 snapshot(){return Object.freeze({from:this.from,to:this.to,startedAtMs:this.startedAtMs,durationMs:this.durationMs,delayMs:this.delayMs,easing:this.easing});}
}
const UI_MOTION_EFFECTS=new Set(['button_spring','toast_slide','denied_shake','card_reveal']);
function uiMotionInto(effect,ms,c,out){
 const time=ms/1000,u=clamp(ms/c.lifetime.durationMs);
 out.x=0;out.y=0;out.scaleX=1;out.scaleY=1;out.front=true;out.progress=clamp(ms/c.lifetime.durationMs);out.opacity=effect==='toast_slide'?1-smooth((u-.73)/.27):1;out.finished=ms>=c.lifetime.durationMs;
 if(effect==='button_spring')out.scaleX=out.scaleY=1-.22*Math.exp(-c.ui.damping*time)*Math.cos(TAU*c.ui.frequencyHz*time);
 else if(effect==='denied_shake')out.x=Math.sin(time*TAU*c.ui.frequencyHz)*c.ui.shakePx*Math.exp(-time*c.ui.damping);
 else if(effect==='toast_slide')out.x=(-1+ease(ms/320)-smooth((u-.69)/.25))*c.ui.travelPx;
 else if(effect==='card_reveal'){const p=clamp((ms-c.transition.delayMs)/c.transition.durationMs);out.progress=p;out.scaleX=Math.max(.02,Math.abs(Math.cos(p*Math.PI)));out.front=p>.5;}
 if(out.finished&&['button_spring','denied_shake'].includes(effect)){out.x=0;out.scaleX=out.scaleY=1;}
 return out;
}
/** Reuse the exact lab motion on an existing DOM button/card; no RAF or DOM dependency. */
export class UiMotion {
 constructor(effect,config={}){if(!UI_MOTION_EFFECTS.has(effect))throw new TypeError('UI 모션: button_spring / toast_slide / denied_shake / card_reveal');this.effect=effect;this.config=resolveConfig(effect,config);}
 sample(timeMs,out={}){finite(timeMs,'timeMs',0);return uiMotionInto(this.effect,timeMs,this.config,out);}
 configure(patch){this.config=resolveConfig(this.effect,this.config,patch);return this.config;}
}
export function normalizeFeedbackData(value={},prior={}){
 if(!plain(value))throw new TypeError('data는 수치 입력 객체입니다.');
 const base={from:0,to:0,max:100,secondary:0,count:1,label:'',events:[],...prior};
 const allowed=new Set(Object.keys(base));for(const key of Object.keys(value)){if(!allowed.has(key)||blockedKeys.has(key))throw new TypeError('지원하지 않는 data.'+key);base[key]=value[key];}
 for(const key of ['from','to','max','secondary','count'])finite(base[key],'data.'+key);
 if(!Number.isFinite(base.to-base.from))throw new RangeError('수치 변화 범위가 너무 큽니다.');
 if(base.max<=0)throw new RangeError('data.max는 양수입니다.');
 if(!Number.isInteger(base.count)||base.count<0||base.count>1e6)throw new RangeError('data.count는 0..1000000 정수입니다.');
 if(!textSupported(base.label))throw new TypeError('data.label은 벡터 영문·기호 32자 이내입니다.');
 if(!Array.isArray(base.events)||base.events.length>64)throw new RangeError('data.events는 최대 64개입니다.');
 let last=-1,sum=base.from;base.events=base.events.map(ev=>{if(!plain(ev)||Object.keys(ev).some(k=>!['atMs','value'].includes(k)))throw new TypeError('이벤트는 {atMs,value}입니다.');finite(ev.atMs,'event.atMs',0);finite(ev.value,'event.value');if(ev.atMs<last)throw new RangeError('이벤트 시간은 오름차순입니다.');last=ev.atMs;sum+=ev.value;finite(sum,'이벤트 합계');return Object.freeze({atMs:ev.atMs,value:ev.value});});
 return freezeData({...base});
}
function sampleEventData(data,timeMs){let value=data.to,count=data.count,last=0; if(data.events.length){value=data.from;count=0;for(const ev of data.events){if(ev.atMs>timeMs)break;value+=ev.value;count++;last=ev.atMs;}}return {value,count,last};}
function feedbackTime(record){const d=record.config.lifetime.durationMs;return record.loop&&record.definition.type!=='continuous'?mod(record.ageMs,d):record.ageMs;}
function rewardProgress(c,index,timeMs){return clamp((timeMs-(180+index*34))/c.reward.flightMs);}
function rewardArrival(c,data,timeMs){let arrived=0;for(let i=0;i<c.reward.count;i++)if(rewardProgress(c,i,timeMs)>=1)arrived++;const ratio=arrived/c.reward.count;return {value:ratio===1?data.to:data.from+(data.to-data.from)*ratio,arrived};}
function feedbackValues(record,timeMs=feedbackTime(record)){
 const d=record.input.data,t=record.valueTransition;
 if(record.definition.id==='loot_transfer'){const a=rewardArrival(record.config,d,timeMs);return {value:a.value,from:d.from,to:d.to,max:d.max,secondary:d.secondary,count:a.arrived,label:d.label};}
 if(d.events.length&&['resource_number','combo_counter','damage_number','healing_number','critical_number'].includes(record.definition.id)){const ev=sampleEventData(d,timeMs);return {value:ev.value,from:d.from,to:d.to,max:d.max,secondary:d.secondary,count:ev.count,label:d.label};}
 return {value:t?t.sample(timeMs):d.to,from:t?.from??d.from,to:t?.to??d.to,max:d.max,secondary:d.secondary,count:d.count,label:d.label};
}
function paintFeedback(g,record){
 const id=record.definition.id,c=record.config,d=record.input.data,ms=feedbackTime(record),time=ms/1000,
 duration=c.lifetime.durationMs,u=clamp(ms/duration),v=feedbackValues(record,ms),color=c.appearance.color,
 muted='#7c93a3',ink='#e5f0f5',dark='#162631',panel='#223743',gold='#ffcf77';
 const fade=record.definition.type==='continuous'?1:(1-smooth((u-.73)/.27));
 const fmt=(n,override={})=>formatNumber(n,{...(c.format||FORMAT_DEFAULT),...override});
 const txt=(s,x=0,y=0,scale=1,col=color,a=1,other={})=>drawVectorText(g,s,x,y,{size:(c.text?.fontSize||20)*scale,stroke:(c.text?.strokePx||2)*scale,outline:c.text?.outlinePx||0,color:col,alpha:a,maxWidth:225,...other});
 const bg=(x,y,w,h,a=1)=>{g.quad(x,y,w/2,h/2,panel,a);g.line(x-w/2,y+h/2,x+w/2,y+h/2,1,'#466474',a);};
 const check=(x,y,s,col=color,a=1)=>{g.line(x-s*.7,y,x-s*.15,y+s*.45,3,col,a);g.line(x-s*.15,y+s*.45,x+s*.8,y-s*.5,3,col,a);};
 const spark=(x,y,r,col=color,a=1)=>{g.line(x-r,y,x+r,y,1.6,col,a);g.line(x,y-r,x,y+r,1.6,col,a);};
 const oldAlpha=g.alpha;g.alpha*=fade;
 try{
  if(['damage_number','critical_number','healing_number','resource_number'].includes(id)){
   const ev=sampleEventData(d,ms),age=Math.max(0,ms-ev.last),entry=clamp(age/170),pop=1+(c.float.popScale-1)*Math.sin(entry*Math.PI)*Math.exp(-entry*.5);
   const x=c.float.driftPx*u,y=12-c.float.risePx*ease(u),n=ev.value;
   if(id==='critical_number'){for(let i=0;i<8;i++){const a=i*TAU/8+.2,r=18+ease(clamp(ms/320))*48;g.line(Math.cos(a)*r,Math.sin(a)*r*.5,Math.cos(a)*(r+12),Math.sin(a)*(r+12)*.5,2,color,(1-clamp(ms/700))*.8);}txt('CRIT',x,y-27,.4,color,.8);}
   if(id==='healing_number'){for(let i=0;i<3;i++)spark(x-46+i*44,y+8-Math.sin(i+u*3)*16,3,color,.7);}
   if(id==='resource_number'){g.shard(x-64,y,7,Math.PI/4,gold,.9); if(d.events.length)txt('X'+ev.count,x,y+27,.35,muted);}
   g.glowAt(x,y,55,color,.13);g.scope(x,y,pop,()=>txt(fmt(n),0,0,1));
  }else if(id==='count_up'){
   bg(0,0,230,66);g.line(-115,34,-115+230*clamp(v.value/d.max),34,2,color,.7);txt(fmt(v.value),0,0);txt(d.label||'TOTAL',0,-48,.34,muted);
  }else if(id==='digit_roll'){
   bg(0,0,230,65);const value=v.value,abs=Math.abs(value),f=c.format;
   let unit=1;if(f.compact&&abs>=1000)for(const n of [1e12,1e9,1e6,1e3]){if(abs>=n){unit=n;break;}}
   const factor=10**f.decimals/unit,scaled=value*factor,whole=Math.floor(scaled),fraction=scaled-whole;
   const finished=ms>=record.valueTransition.startedAtMs+record.valueTransition.delayMs+record.valueTransition.durationMs;
   const beforeStart=ms<=record.valueTransition.startedAtMs+record.valueTransition.delayMs;
   const stationary=finished||beforeStart||!Number.isFinite(scaled)||whole===whole+1||v.to===v.from;
   const lo=stationary?fmt(value):fmt(whole/factor),hi=stationary?lo:fmt((whole+1)/factor),len=Math.max(lo.length,hi.length),low=lo.padStart(len),high=hi.padStart(len);
   const size=Math.min(c.text.fontSize,208/(Math.max(len,1)*.88)),width=(len*.88-.16)*size,left=-width/2,dir=v.to>=v.from?1:-1,scroll=dir>0?fraction:1-fraction;
   for(let i=0;i<len;i++){const x=left+i*.88*size+size*.36,a=dir>0?low[i]:high[i],b=dir>0?high[i]:low[i];
    if(a!==b&&!stationary&&(/\d/.test(a)||/\d/.test(b))){const clip=[-112,-size*.65,112,size*.65];txt(a,x,-dir*scroll*size*1.3,size/c.text.fontSize,color,1,{maxWidth:40,clip});txt(b,x,dir*(1-scroll)*size*1.3,size/c.text.fontSize,color,1,{maxWidth:40,clip});}
    else txt(fraction<.5?low[i]:high[i],x,0,size/c.text.fontSize,color,1,{maxWidth:40});
   }
   g.line(-110,-23,110,-23,1,'#385364',.8);g.line(-110,24,110,24,1,'#385364',.8);txt('DIGITS',0,-48,.32,muted);
  }else if(id==='delta_number'){
   txt(fmt(v.from),-61,-19,.58,muted);txt(fmt(v.value),54,-19,.82);g.line(-10,-19,10,-19,1.8,color);g.line(3,-25,10,-19,1.8,color);g.line(3,-13,10,-19,1.8,color);
   const positive=v.to>=v.from;txt(fmt(v.to-v.from,{sign:'always'}),0,24,.58,positive?'#a5e4ba':'#ff9d91');
  }else if(id==='combo_counter'){
   const ev=sampleEventData(d,ms),pulse=1+(c.float.popScale-1)*Math.exp(-Math.max(0,ms-ev.last)/160);
   g.scope(0,0,pulse,()=>{txt(fmt(ev.value),0,-4,1.2);txt('X'+ev.count,0,34,.48);});g.ring(0,0,64,1,color,.24);g.glowAt(0,0,78,color,.15);
  }else if(id==='health_trail'){
   const q=c.gauge,w=q.widthPx,h=q.heightPx,to=clamp(d.to/d.max),from=clamp(d.from/d.max),lag=mix(from,to,ease((ms-q.trailDelayMs)/q.trailDurationMs));
   bg(0,4,w+8,h+8);g.quad(-w/2+w*lag/2,4,w*lag/2,h/2,gold,.85);g.quad(-w/2+w*to/2,4,w*to/2,h/2,color,1);
   txt(fmt(d.to)+' / '+fmt(d.max),0,-26,.85,ink);txt(fmt(d.to-d.from,{sign:'always'}),w/2,29,.62,color,1,{align:'right'});
  }else if(id==='shield_gauge'){
   const q=c.gauge,w=q.widthPx,h=q.heightPx;bg(0,-6,w+8,h+8);bg(0,20,w+8,h+8);
   const hp=clamp(d.secondary/d.max),sh=clamp(v.value/d.max);g.quad(-w/2+w*hp/2,-6,w*hp/2,h/2,'#b2d993');g.quad(-w/2+w*sh/2,20,w*sh/2,h/2,color);
   txt('HP '+fmt(d.secondary),0,-35,.7,ink);txt('SH '+fmt(v.value),0,46,.7);
  }else if(['radial_cooldown','capture_meter','buff_stack'].includes(id)){
   const r=c.gauge.radiusPx,p=clamp(v.value/d.max),sy=id==='capture_meter'?.48:1;
   g.ring(0,0,r,5,panel,1,sy);if(p>0)g.ring(0,0,r,4,color,1,sy,-Math.PI/2,-Math.PI/2+TAU*p,80);
   if(id==='capture_meter'){g.disc(0,0,r*.55,color,.12,r*.55*sy);txt(fmt(v.value),0,-39,.75);if(p>=.999)check(0,-1,12);}
   else if(id==='buff_stack'){g.shard(0,0,r*.45,Math.PI/4,color,.9);txt('X'+fmt(d.count),0,r+20,.6);}
   else{txt(fmt(v.value),0,0,.84);if(p<=.001){g.glowAt(0,0,r*1.5,color,.2);txt('READY',0,r+20,.36);}}
  }else if(id==='segmented_gauge'){
   const q=c.gauge,w=q.widthPx,h=q.heightPx,gap=Math.min(q.gapPx,w/q.segments*.75),slot=w/q.segments,filled=clamp(v.value/d.max)*q.segments;
   for(let i=0;i<q.segments;i++){const x=-w/2+slot*(i+.5);g.quad(x,0,(slot-gap)/2,h/2,panel,1);const p=clamp(filled-i);if(p>0)g.quad(x-(slot-gap)*(1-p)/2,0,(slot-gap)*p/2,h/2,color);}
   txt(fmt(v.value)+' / '+fmt(d.max),0,33,.64,ink);
  }else if(id==='xp_level'){
   const q=c.gauge,w=q.widthPx,h=q.heightPx,p=mod(v.value,d.max)/d.max,level=d.count+Math.floor(v.value/d.max)-Math.floor(d.from/d.max);
   bg(0,15,w+8,h+8);g.quad(-w/2+w*p/2,15,w*p/2,h/2,color);txt('LV '+level,0,-25,1);txt(fmt(mod(v.value,d.max))+' / '+fmt(d.max),0,44,.66,muted);
   g.glowAt(-w/2+w*p,15,16,color,.24);
  }else if(id==='button_spring'){
   const s=uiMotionInto(id,ms,c,record.motionPose).scaleX;g.scope(0,0,s,()=>{bg(0,0,142,55);g.line(-71,-28,71,-28,2,color,.8);check(0,0,12);});
  }else if(id==='attention_ping'){
   const r=c.indicator.radiusPx;bg(0,7,112,56);g.disc(48,-20,18,color,1);txt(fmt(d.to),48,-20,.76,dark);for(let i=0;i<2;i++){const p=mod(time*.65+i*.5,1);g.ring(48,-20,18+r*p,1.6,color,(1-p)*.6);}g.line(-31,0,12,0,2,muted);g.line(-31,12,-5,12,2,muted);
  }else if(id==='toast_slide'){
   const x=uiMotionInto(id,ms,c,record.motionPose).x;g.scope(x,0,1,()=>{bg(0,0,218,57);g.quad(-106,0,2,28,color);check(-80,0,10);txt(d.label||'REWARD',-48,-8,.44,muted,1,{align:'left',maxWidth:148});txt(fmt(d.to),-48,12,.68,color,1,{align:'left',maxWidth:148});});
  }else if(id==='denied_shake'){
   const x=uiMotionInto(id,ms,c,record.motionPose).x;g.scope(x,0,1,()=>{bg(0,0,178,58);g.line(-89,29,89,29,2,color);g.line(-73,-7,-59,7,2.5,color);g.line(-73,7,-59,-7,2.5,color);txt((d.label||'NEED')+' '+fmt(d.to),14,0,.64,color,1,{maxWidth:130});});
  }else if(id==='card_reveal'){
   const pose=uiMotionInto(id,ms,c,record.motionPose),p=pose.progress,s=pose.scaleX,front=pose.front;
   g.stretch(s,1,()=>{bg(0,0,99,130);g.line(-50,-65,50,-65,2,color);if(front){g.shard(0,-17,26,Math.PI/4,color);txt(d.label||'RARE',0,24,.52,color,1,{maxWidth:86});txt(fmt(d.to),0,45,.48,ink,1,{maxWidth:86});}else{g.ring(0,0,27,2,muted,.6);g.shard(0,0,12,0,muted,.6);}});
   if(p>.5)g.glowAt(0,0,82,color,.16*(1-p));
  }else if(id==='focus_brackets'){
   const r=c.indicator.radiusPx+c.ui.travelPx*(1-ease(ms/500)),length=13;g.disc(0,0,15,color,.18);for(const sx of [-1,1])for(const sy of [-1,1]){g.line(sx*r,sy*r,sx*(r-length),sy*r,2.5,color);g.line(sx*r,sy*r,sx*r,sy*(r-length),2.5,color);}
  }else if(id==='loot_transfer'){
   const a=record.context.source,b=record.context.target,q=c.reward;let landed=0;
   g.ring(a.x,a.y,18,1,color,.4);bg(b.x,b.y,68,46);g.shard(b.x,b.y,9,Math.PI/4,color);
   for(let i=0;i<q.count;i++){const delay=180+i*34,p=rewardProgress(c,i,ms),burst=clamp(ms/220),angle=rand(i,record.seed)*TAU;
    if(ms<delay){const rr=q.spreadPx*ease(burst);g.shard(a.x+Math.cos(angle)*rr,a.y+Math.sin(angle)*rr*.65,4.5,Math.PI/4,color,1);continue;}
    if(p>=1){landed++;continue;}const e=smooth(p),sx=a.x+Math.cos(angle)*q.spreadPx,sy=a.y+Math.sin(angle)*q.spreadPx*.65,x=mix(sx,b.x,e),y=mix(sy,b.y,e)-Math.sin(p*Math.PI)*q.spreadPx;
    g.shard(x,y,4.5,Math.PI/4,color);g.glowAt(x,y,12,color,.25);
   }
   txt(fmt(v.value),b.x,b.y+38,.82,ink,1,{maxWidth:100});if(landed)g.ring(b.x,b.y,22+Math.sin(time*10)*3,1,color,.35);
  }else if(id==='level_up'){
   const p=ease(ms/650),r=c.indicator.radiusPx;for(let i=0;i<c.reward.count;i++){const a=i*TAU/c.reward.count;g.line(Math.cos(a)*(r+5),Math.sin(a)*(r+5),Math.cos(a)*(r+5+20*p),Math.sin(a)*(r+5+20*p),2,color,(1-u)*.6);}
   g.ring(0,0,r,2,color,.6);txt('LV '+fmt(d.to),0,4,.88);g.poly([[-8,-r+9],[0,-r-2],[8,-r+9]],color,.9);g.glowAt(0,0,r*1.6,color,.18);
  }else if(id==='unlock_burst'){
   const p=ease(ms/700),r=c.indicator.radiusPx;bg(0,16,46,37);g.ring(0,-8,16,4,color,1,1,Math.PI,TAU-p*.65);g.line(-16,-8,-16,5,4,color);g.disc(0,15,3,color);
   for(let i=0;i<c.reward.count;i++){const a=rand(i,record.seed)*TAU,rr=28+r*p;g.shard(Math.cos(a)*rr,Math.sin(a)*rr,3*(1-u),a,color,(1-u)*.8);}
  }else if(id==='rarity_beacon'){
   const r=c.indicator.radiusPx;for(let i=0;i<7;i++)g.quad(0,-28,r*(.14+i*.055),52,color,.02+(6-i)*.005);
   g.ring(0,28,r,2,color,.65,.32);g.ring(0,28,r*.66,1,color,.35,.32);g.shard(0,14+Math.sin(time*2)*3,12,Math.PI/4,color);
   for(let i=0;i<c.reward.count;i++){const p=mod(time*.2+rand(i,record.seed),1),x=(rand(i+100,record.seed)-.5)*r;g.disc(x,25-p*85,1.3,color,(1-p)*.7);}g.glowAt(0,20,r,color,.2);
  }else if(id==='attack_warning'){
   const q=c.indicator,p=clamp(v.value/d.max),start=q.rotationRad-q.sweepRad/2,end=start+q.sweepRad;
   for(let i=0;i<28;i++){const a=start+q.sweepRad*i/28,b=start+q.sweepRad*(i+1)/28;g.tri(0,0,Math.cos(a)*q.radiusPx,Math.sin(a)*q.radiusPx,Math.cos(b)*q.radiusPx,Math.sin(b)*q.radiusPx,color,.12);if(p>0)g.tri(0,0,Math.cos(a)*q.radiusPx*p,Math.sin(a)*q.radiusPx*p,Math.cos(b)*q.radiusPx*p,Math.sin(b)*q.radiusPx*p,color,.28);}
   g.ring(0,0,q.radiusPx,1.8,color,.85,1,start,end);for(const a of [start,end])g.line(0,0,Math.cos(a)*q.radiusPx,Math.sin(a)*q.radiusPx,1,color,.7);g.disc(0,0,5,color);if(p>=1)g.ring(0,0,q.radiusPx,4,color,.5);
  }else if(id==='direction_indicator'){
   const a=record.context.source,b=record.context.target,ang=Math.atan2(b.y-a.y,b.x-a.x),r=c.indicator.radiusPx;
   g.rotate(ang,()=>{for(let i=0;i<3;i++){const p=mod(time*.6+i/3,1),x=-r+p*r*2;g.line(x-8,-10,x,0,3,color,p);g.line(x,0,x-8,10,3,color,p);}});g.ring(0,0,r+10,1,color,.15);
  }else if(id==='rally_marker'){
   const r=c.indicator.radiusPx;g.line(0,15,0,-40,2.2,color);g.poly([[1,-40],[28,-33],[1,-21]],color,.95);for(let i=0;i<3;i++){const p=clamp((ms-i*220)/1200);if(p>0&&p<1)g.ring(0,18,7+r*p,2,color,1-p,.35);}g.disc(0,18,4,color);
  }
 }finally{g.alpha=oldAlpha;}
}

Object.assign(parameterSpecs,FEEDBACK_SPECS);
Object.assign(privateDefaults,FEEDBACK_BASE);
export const catalog = freezeData([
    ...FEEDBACK_DEFINITIONS,
    {
        "id": "slash",
        "cat": "hit",
        "name": "베기 검격",
        "sub": "휘두른 면이 남기는 날카로운 호",
        "tech": "리본 · 곡선 면",
        "color": "#a4f5d3",
        "type": "burst",
        "desc": "곡선 띠의 앞부분은 날카롭게, 뒤쪽은 얇게 소멸합니다. 궤적 자체의 면적과 진행 방향을 관찰하세요.",
        "parts": [
            "폭이 있는 곡선 면",
            "초승달형 끝단",
            "미세 절삭 파편"
        ],
        "durationMs": 1750,
        "index": 1
    },
    {
        "id": "thrust",
        "cat": "hit",
        "name": "찌르기",
        "sub": "한 점을 향해 압축되는 관통",
        "tech": "쐐기 · 방향선",
        "color": "#ffe0a0",
        "type": "burst",
        "desc": "넓은 원형 폭발이 아니라, 공격 방향으로 긴 쐐기를 만들고 접촉점에서만 짧은 파편을 터뜨립니다.",
        "parts": [
            "쐐기형 전진",
            "직선 속도선",
            "접점 스파크"
        ],
        "durationMs": 1650,
        "index": 2
    },
    {
        "id": "smash",
        "cat": "hit",
        "name": "둔기 강타",
        "sub": "눌림 뒤에 퍼지는 무거운 충격",
        "tech": "충격 면 · 지면 먼지",
        "color": "#ffc095",
        "type": "burst",
        "desc": "충돌 순간의 짧은 압축과 발 접점에서 퍼지는 먼지를 분리했습니다. 원점을 옮겨도 지면 효과가 따라갑니다.",
        "parts": [
            "접점 압축",
            "지면 파동",
            "중력 파편"
        ],
        "durationMs": 2300,
        "index": 3
    },
    {
        "id": "sparks",
        "cat": "hit",
        "name": "금속 충돌 스파크",
        "sub": "부딪힌 방향으로 튀는 불꽃",
        "tech": "속도 정렬 선분",
        "color": "#ffcb84",
        "type": "burst",
        "desc": "빠른 입자는 길게, 느려진 입자는 짧게 그립니다. 중력과 감속을 바꾸면 용접 불꽃과 도탄을 비교할 수 있습니다.",
        "parts": [
            "방향성 방출",
            "속도 비례 길이",
            "중력 낙하"
        ],
        "durationMs": 1900,
        "index": 4
    },
    {
        "id": "explosion",
        "cat": "burst",
        "name": "화염 폭발",
        "sub": "빛·화구·연기가 이어지는 폭발",
        "tech": "화구 · 연기 셰이더",
        "color": "#ff8c4d",
        "type": "burst",
        "desc": "첫 섬광 이후 불규칙한 화구가 팽창하고 검은 연기로 넘어갑니다. 밝기만 높이지 않고 큰 덩어리의 변화를 사용합니다.",
        "parts": [
            "초기 섬광",
            "팽창 화구",
            "식는 연기"
        ],
        "durationMs": 3200,
        "index": 5
    },
    {
        "id": "debris",
        "cat": "burst",
        "name": "파편 비산",
        "sub": "회전하며 떨어지는 단단한 조각",
        "tech": "각진 면 · 탄도",
        "color": "#c5b39b",
        "type": "burst",
        "desc": "불규칙한 다각형이 서로 다른 각속도로 회전합니다. 지면에 닿으면 낮게 튀고, 더 이상 바닥 아래로 내려가지 않습니다.",
        "parts": [
            "다각형 조각",
            "탄도 운동",
            "바닥 반발"
        ],
        "durationMs": 3100,
        "index": 6
    },
    {
        "id": "shockwave",
        "cat": "burst",
        "name": "확산 충격파",
        "sub": "지면 위를 훑는 얇은 파동",
        "tech": "타원 링 · 굴절선",
        "color": "#b7eaff",
        "type": "burst",
        "desc": "바닥에 붙은 타원형 링이 퍼집니다. 원점 표시와 얕은 먼지 띠로 발생 위치를 명확하게 표현합니다.",
        "parts": [
            "지면 투영 링",
            "얇은 선단",
            "방사 먼지"
        ],
        "durationMs": 2400,
        "index": 7
    },
    {
        "id": "fissure",
        "cat": "burst",
        "name": "지면 파열",
        "sub": "접점에서 가지치며 자라는 균열",
        "tech": "분기 폴리라인",
        "color": "#ffb26b",
        "type": "burst",
        "desc": "균열이 끝까지 한 번에 나타나지 않고, 중심에서 바깥으로 성장합니다. 어두운 틈과 밝은 내부를 겹쳐 바닥의 파열을 표현합니다.",
        "parts": [
            "성장형 균열",
            "균열 내부광",
            "땅 조각"
        ],
        "durationMs": 3500,
        "index": 8
    },
    {
        "id": "flame",
        "cat": "fire",
        "name": "지속 화염",
        "sub": "말리며 위로 타오르는 불길",
        "tech": "절차적 화염 면",
        "color": "#ff994a",
        "type": "continuous",
        "desc": "넓은 밑동과 가늘어지는 혀 모양의 화염을 겹칩니다. 화염의 큰 형태와 주변 불씨의 움직임을 따로 관찰하세요.",
        "parts": [
            "화염 혀",
            "밝은 내염",
            "상승 불씨"
        ],
        "durationMs": 4000,
        "index": 9
    },
    {
        "id": "flamethrower",
        "cat": "fire",
        "name": "화염 분사",
        "sub": "한 방향으로 이어지는 화염류",
        "tech": "방향성 입자 스트림",
        "color": "#ff9b45",
        "type": "continuous",
        "desc": "시작점에서 표적 방향으로 연속 방출합니다. 분사각을 넓히면 끝부분의 밀도가 낮아지는 원뿔형 흐름이 됩니다.",
        "parts": [
            "연속 화구 입자",
            "원뿔 방출",
            "열 잔광"
        ],
        "durationMs": 4000,
        "index": 10
    },
    {
        "id": "smoke",
        "cat": "fire",
        "name": "상승 연기",
        "sub": "느리게 말리며 커지는 덩어리",
        "tech": "절차적 노이즈 면",
        "color": "#b2bcc5",
        "type": "continuous",
        "desc": "시간에 따라 커지는 연기 덩어리에 절차적 노이즈를 적용합니다. 외부 텍스처 없이 명암과 가장자리의 흐림을 만듭니다.",
        "parts": [
            "팽창하는 덩어리",
            "가장자리 노이즈",
            "상승·측풍"
        ],
        "durationMs": 5000,
        "index": 11
    },
    {
        "id": "embers",
        "cat": "fire",
        "name": "불씨",
        "sub": "가볍게 흔들리는 고온 입자",
        "tech": "상승 입자 · 짧은 꼬리",
        "color": "#ffb76c",
        "type": "continuous",
        "desc": "큰 화구 없이 가는 입자가 위로 떠오릅니다. 입자별 밝기와 흔들림을 달리해 불꽃 주위의 공기감을 만듭니다.",
        "parts": [
            "부력형 상승",
            "미세 흔들림",
            "밝기 감소"
        ],
        "durationMs": 5000,
        "index": 12
    },
    {
        "id": "splash",
        "cat": "water",
        "name": "물보라",
        "sub": "얇은 물막이 물방울로 분리",
        "tech": "물막 · 탄도 방울",
        "color": "#72d7ff",
        "type": "burst",
        "desc": "접점에서 얇은 물막이 잠깐 솟고, 길쭉한 물방울이 분리되어 떨어집니다. 착수 위치에 작은 파문이 생깁니다.",
        "parts": [
            "초기 물막",
            "포물선 방울",
            "착수 파문"
        ],
        "durationMs": 2700,
        "index": 13
    },
    {
        "id": "ripple",
        "cat": "water",
        "name": "수면 파문",
        "sub": "간격을 유지하며 번지는 동심원",
        "tech": "다중 타원 링",
        "color": "#7adbf5",
        "type": "burst",
        "desc": "여러 파면이 시간 차를 두고 바깥으로 퍼집니다. 선 두께와 파면 간격을 바꾸어 물방울과 큰 수면 진동을 비교하세요.",
        "parts": [
            "시간차 동심원",
            "수면 투영",
            "감쇠"
        ],
        "durationMs": 3600,
        "index": 14
    },
    {
        "id": "frost",
        "cat": "water",
        "name": "서리 확산",
        "sub": "표면을 덮는 결정의 가지",
        "tech": "육각 분기 성장",
        "color": "#a8e8ff",
        "type": "burst",
        "desc": "표면을 따라 육각 방향의 가지가 순서대로 성장합니다. 연무가 아니라 결정 구조가 핵심입니다.",
        "parts": [
            "육각 가지",
            "말단 결정",
            "성장 후 소멸"
        ],
        "durationMs": 4000,
        "index": 15
    },
    {
        "id": "ice",
        "cat": "water",
        "name": "얼음 결정 파열",
        "sub": "각진 결정이 깨져 날리는 순간",
        "tech": "결정 면 · 파편",
        "color": "#9cd9ff",
        "type": "burst",
        "desc": "큰 결정의 분할 면을 먼저 보여준 뒤, 각진 조각을 방출합니다. 밝은 면과 어두운 면으로 두께를 표현합니다.",
        "parts": [
            "다면 결정",
            "각진 파편",
            "얼음 가루"
        ],
        "durationMs": 3000,
        "index": 16
    },
    {
        "id": "lightning",
        "cat": "energy",
        "name": "지점 간 번개",
        "sub": "두 지점을 잇는 갈라진 방전",
        "tech": "분기 선 · 고휘도 코어",
        "color": "#a5bbff",
        "type": "burst",
        "desc": "시작점과 끝점을 끌어 번개 경로를 바꿀 수 있습니다. 분기 수·꺾임·선 두께를 개별로 조절하세요.",
        "parts": [
            "고정 양끝",
            "결정론적 분기",
            "외곽광·코어"
        ],
        "durationMs": 2200,
        "index": 17
    },
    {
        "id": "chain",
        "cat": "energy",
        "name": "연쇄 번개",
        "sub": "표적에서 다음 표적으로 전이",
        "tech": "표적 연결 · 순차 점화",
        "color": "#beadff",
        "type": "burst",
        "desc": "표적마다 순서대로 점화됩니다. 하나의 번개를 크게 그리는 대신, 개별 타격점과 연결 순서가 읽히도록 구성했습니다.",
        "parts": [
            "다중 표적",
            "순차 연결",
            "표적 피격"
        ],
        "durationMs": 3200,
        "index": 18
    },
    {
        "id": "laser",
        "cat": "energy",
        "name": "지속 레이저",
        "sub": "유지되는 빔과 접점의 반응",
        "tech": "다층 직선 빔",
        "color": "#ff8eb2",
        "type": "continuous",
        "desc": "연속 광선의 중심과 외곽광을 분리하고, 끝점에서만 스파크를 생성합니다. 시작점과 끝점을 움직여도 접점이 유지됩니다.",
        "parts": [
            "선명한 빔 코어",
            "흐르는 에너지",
            "끝점 스파크"
        ],
        "durationMs": 3500,
        "index": 19
    },
    {
        "id": "charge",
        "cat": "energy",
        "name": "에너지 차징",
        "sub": "중심으로 빨려드는 에너지",
        "tech": "나선 흡입 · 코어",
        "color": "#90eddf",
        "type": "burst",
        "desc": "입자가 바깥에서 안쪽으로 나선 이동하며 코어를 키웁니다. 방출 방향의 폭발과 반대되는 운동을 관찰하세요.",
        "parts": [
            "수렴 나선",
            "코어 성장",
            "완충 링"
        ],
        "durationMs": 3100,
        "index": 20
    },
    {
        "id": "projectile",
        "cat": "motion",
        "name": "투사체 꼬리",
        "sub": "이동 경로를 그대로 남기는 꼬리",
        "tech": "경로 샘플 · 테이퍼",
        "color": "#ffd38d",
        "type": "burst",
        "desc": "현재 위치 뒤로 이전 경로를 샘플링합니다. 직선뿐 아니라 휘어진 경로에서도 꼬리가 진행 방향을 따릅니다.",
        "parts": [
            "곡선 경로",
            "길이 감쇠 꼬리",
            "밝은 선두"
        ],
        "durationMs": 2800,
        "index": 21
    },
    {
        "id": "weapon",
        "cat": "motion",
        "name": "무기 궤적",
        "sub": "휘두른 구간이 면으로 남는 스윙",
        "tech": "손잡이·날끝 리본",
        "color": "#a0e2ff",
        "type": "burst",
        "desc": "무기의 안쪽과 바깥쪽 끝을 각각 기록해 그 사이를 띠로 연결합니다. 무기와 잔여 궤적을 함께 보여줍니다.",
        "parts": [
            "회전하는 무기",
            "양끝 기반 리본",
            "시간순 투명도"
        ],
        "durationMs": 2200,
        "index": 22
    },
    {
        "id": "dash",
        "cat": "motion",
        "name": "돌진 잔상",
        "sub": "이전 자세가 남기는 이동감",
        "tech": "캐릭터 잔상",
        "color": "#b7a5ff",
        "type": "burst",
        "desc": "방향키 또는 화면 드래그로 캐릭터를 움직일 수 있습니다. 입자 꼬리 대신 실제 캐릭터 실루엣이 이전 위치에 남습니다.",
        "parts": [
            "이전 위치 실루엣",
            "가속선",
            "현재 몸체"
        ],
        "durationMs": 2500,
        "index": 23
    },
    {
        "id": "landing",
        "cat": "motion",
        "name": "착지 먼지",
        "sub": "발이 닿는 순간 옆으로 퍼짐",
        "tech": "발 접점 · 낮은 먼지",
        "color": "#d6bc9a",
        "type": "burst",
        "desc": "캐릭터가 내려와 바닥에 닿을 때만 먼지가 발생합니다. 바닥보다 높은 위치에서 폭발하는 표현을 피했습니다.",
        "parts": [
            "낙하 캐릭터",
            "발 접점 트리거",
            "양옆 확산"
        ],
        "durationMs": 2800,
        "index": 24
    },
    {
        "id": "sigil",
        "cat": "magic",
        "name": "마법진",
        "sub": "동심 문양과 서로 다른 회전",
        "tech": "벡터 문양 · 링",
        "color": "#cab1ff",
        "type": "continuous",
        "desc": "서로 다른 속도로 회전하는 원·다각형·작은 기호를 조합합니다. 문양 밀도와 회전 속도를 바꾸어 비교하세요.",
        "parts": [
            "동심 문양",
            "반대 방향 회전",
            "주변 기호"
        ],
        "durationMs": 5000,
        "index": 25
    },
    {
        "id": "portal",
        "cat": "magic",
        "name": "포털",
        "sub": "열린 경계와 안으로 흐르는 빛",
        "tech": "타원 경계 · 내부 흐름",
        "color": "#b696ff",
        "type": "continuous",
        "desc": "검은 내부와 밝은 경계를 구분합니다. 원형 오라와 달리 안쪽으로 이어지는 타원형 흐름이 공간의 입구를 만듭니다.",
        "parts": [
            "어두운 내부",
            "회전하는 경계",
            "내향 궤적"
        ],
        "durationMs": 5000,
        "index": 26
    },
    {
        "id": "teleport",
        "cat": "magic",
        "name": "순간이동",
        "sub": "출발과 도착이 이어지는 전이",
        "tech": "위치 분리 · 형성",
        "color": "#adbdff",
        "type": "burst",
        "desc": "한 위치의 캐릭터가 위로 분해되고 다른 위치에서 다시 형성됩니다. 두 지점 사이의 이동을 뚜렷하게 보여줍니다.",
        "parts": [
            "출발 소멸",
            "위치 전이",
            "도착 재구성"
        ],
        "durationMs": 3600,
        "index": 27
    },
    {
        "id": "vortex",
        "cat": "magic",
        "name": "소용돌이",
        "sub": "중심으로 휘감기는 회전장",
        "tech": "나선 리본 · 흡입",
        "color": "#85d6d6",
        "type": "continuous",
        "desc": "여러 가닥의 나선 띠가 중심으로 수렴합니다. 회전 방향과 속도를 바꾸어 흡입·순환의 인상을 비교하세요.",
        "parts": [
            "다중 나선",
            "중심 수렴",
            "회전 입자"
        ],
        "durationMs": 5000,
        "index": 28
    },
    {
        "id": "heal",
        "cat": "status",
        "name": "회복",
        "sub": "아래에서 몸으로 스며드는 빛",
        "tech": "상승 기호 · 흡수",
        "color": "#9ef1b8",
        "type": "continuous",
        "desc": "작은 십자 기호와 빛이 캐릭터 주위를 올라갑니다. 효과 중심에 실제 대상이 있어 크기와 위치를 비교하기 쉽습니다.",
        "parts": [
            "회복 기호",
            "부드러운 상승",
            "몸 주변 반응"
        ],
        "durationMs": 3500,
        "index": 29
    },
    {
        "id": "shield",
        "cat": "status",
        "name": "보호막 피격",
        "sub": "맞은 표면에서 퍼지는 파동",
        "tech": "표면 격자 · 피격 링",
        "color": "#96dfff",
        "type": "burst",
        "desc": "보호막을 클릭하면 가장 가까운 표면에서 파동이 퍼집니다. 구 전체가 같은 밝기로 번쩍이는 대신 맞은 방향을 보여줍니다.",
        "parts": [
            "외곽 경계",
            "표면 격자",
            "방향성 피격"
        ],
        "durationMs": 3000,
        "index": 30
    },
    {
        "id": "poison",
        "cat": "status",
        "name": "독구름",
        "sub": "낮게 머무르는 불안정한 안개",
        "tech": "저층 연무 · 기포",
        "color": "#b1d97a",
        "type": "continuous",
        "desc": "연기처럼 위로 치솟지 않고 지면 가까이 좌우로 머뭅니다. 작은 기포와 무거운 덩어리를 섞어 독성 영역을 표현합니다.",
        "parts": [
            "지면 체류",
            "느린 와류",
            "독성 기포"
        ],
        "durationMs": 5000,
        "index": 31
    },
    {
        "id": "aura",
        "cat": "status",
        "name": "강화 오라",
        "sub": "대상 주위에 유지되는 힘",
        "tech": "궤도 · 수직 광류",
        "color": "#efc77e",
        "type": "continuous",
        "desc": "캐릭터를 둘러싼 궤도와 수직 광류가 반복됩니다. 대상의 위치와 실루엣이 효과 안에서도 보이도록 여백을 둡니다.",
        "parts": [
            "대상 중심 궤도",
            "수직 광류",
            "지면 링"
        ],
        "durationMs": 5000,
        "index": 32
    },
    {
        "id": "rain",
        "cat": "nature",
        "name": "비",
        "sub": "빠른 낙하와 바닥의 착수",
        "tech": "방향성 선분 · 파문",
        "color": "#9fc6de",
        "type": "continuous",
        "desc": "길쭉한 빗줄기와 바닥의 작은 파문을 함께 그립니다. 바람을 바꾸면 빗줄기의 방향과 착수점이 함께 이동합니다.",
        "parts": [
            "기울어진 낙하",
            "속도 정렬",
            "바닥 착수"
        ],
        "durationMs": 5000,
        "index": 33
    },
    {
        "id": "snow",
        "cat": "nature",
        "name": "눈",
        "sub": "천천히 흔들리며 내려오는 조각",
        "tech": "육각 결정 · 횡방향 흔들림",
        "color": "#d7edff",
        "type": "continuous",
        "desc": "작은 점뿐 아니라 일부 큰 입자를 육각 결정으로 그립니다. 느린 낙하와 좌우 진동으로 비와 구분합니다.",
        "parts": [
            "느린 하강",
            "육각 결정",
            "미세 회전"
        ],
        "durationMs": 6000,
        "index": 34
    },
    {
        "id": "leaves",
        "cat": "nature",
        "name": "낙엽",
        "sub": "회전과 뒤집힘이 있는 낙하",
        "tech": "잎 모양 면 · 회전",
        "color": "#e7b270",
        "type": "continuous",
        "desc": "잎맥이 있는 면이 떨어지며 회전하고 폭이 좁아졌다 넓어집니다. 입자 방향과 실루엣의 변화가 핵심입니다.",
        "parts": [
            "잎 실루엣",
            "잎맥",
            "뒤집히는 낙하"
        ],
        "durationMs": 6000,
        "index": 35
    },
    {
        "id": "pollen",
        "cat": "nature",
        "name": "꽃가루·포자",
        "sub": "공중을 떠다니는 작은 생명",
        "tech": "부유 입자 · 미세 구조",
        "color": "#e4df99",
        "type": "continuous",
        "desc": "부유하는 포자에 작은 돌기와 중심을 넣습니다. 빠른 낙하 대신 천천히 순환하는 바람을 따라 움직입니다.",
        "parts": [
            "느린 부유",
            "미세 포자 구조",
            "깊이별 크기"
        ],
        "durationMs": 6000,
        "index": 36
    },
    {
        "id": "summon",
        "cat": "life",
        "name": "소환 형성",
        "sub": "조각이 모여 몸체를 만드는 과정",
        "tech": "조각 수렴 · 점진 형성",
        "color": "#a3efde",
        "type": "burst",
        "desc": "흩어진 조각이 캐릭터 실루엣으로 모이고 몸체가 점차 드러납니다. 완성되는 위치를 고정해 흐름이 읽히도록 했습니다.",
        "parts": [
            "실루엣 목표점",
            "조각 수렴",
            "완성 파동"
        ],
        "durationMs": 3800,
        "index": 37
    },
    {
        "id": "dissolve",
        "cat": "life",
        "name": "디졸브 소멸",
        "sub": "몸의 경계에서 깎여 사라짐",
        "tech": "절차적 침식 · 잔여 조각",
        "color": "#ffc893",
        "type": "burst",
        "desc": "캐릭터 표면을 작은 셀 단위로 지우고 경계의 조각만 날립니다. 캐릭터가 단순 투명해지는 것과 구분하세요.",
        "parts": [
            "표면 침식",
            "빛나는 경계",
            "이탈 조각"
        ],
        "durationMs": 3800,
        "index": 38
    },
    {
        "id": "absorb",
        "cat": "life",
        "name": "에너지 흡수",
        "sub": "개별 조각이 목표로 곡선 이동",
        "tech": "곡선 유도 · 도착 반응",
        "color": "#a1e9cd",
        "type": "burst",
        "desc": "바깥의 에너지 조각이 시간차를 두고 표적에 도착합니다. 각 조각의 곡선 경로와 도착 순간의 작은 반응을 보여줍니다.",
        "parts": [
            "개별 곡선 경로",
            "시간차 도착",
            "표적 펄스"
        ],
        "durationMs": 3500,
        "index": 39
    },
    {
        "id": "confetti",
        "cat": "life",
        "name": "보상 폭죽",
        "sub": "다채로운 조각이 터지는 축하",
        "tech": "색종이 면 · 탄도",
        "color": "#efbcff",
        "type": "burst",
        "desc": "색종이 조각이 부채꼴로 터진 뒤 회전하며 떨어집니다. 전투 파편보다 가볍고 오래 체공하는 움직임입니다.",
        "parts": [
            "다색 방출",
            "회전 색종이",
            "긴 체공"
        ],
        "durationMs": 4200,
        "index": 40
    },
    {
        "id": "combo_fireball",
        "name": "화염구",
        "sub": "차징 → 비행 → 충돌 → 연기",
        "color": "#ff9b60",
        "tech": "4단계 · 화염",
        "parts": [
            "차징",
            "비행·꼬리",
            "충돌·폭발",
            "연기·불씨"
        ],
        "desc": "발사점에서 모인 에너지가 화염구가 되어 표적으로 날아갑니다. 접촉 시점 이후에만 폭발과 잔여 연기가 나타납니다.",
        "cat": "combo",
        "type": "combo",
        "durationMs": 6000,
        "index": 41
    },
    {
        "id": "combo_thunder",
        "name": "번개 검격",
        "sub": "스윙 → 접촉 → 연쇄 방전",
        "color": "#b3b6ff",
        "tech": "4단계 · 번개",
        "parts": [
            "무기 스윙",
            "검격 면",
            "접점 스파크",
            "연쇄 번개"
        ],
        "desc": "무기를 휘두른 궤적과 검격을 먼저 보여준 뒤, 접촉점에서 방전이 다음 표적으로 이어집니다.",
        "cat": "combo",
        "type": "combo",
        "durationMs": 5600,
        "index": 42
    },
    {
        "id": "combo_ice",
        "name": "얼음 강타",
        "sub": "예고 → 강타 → 서리 → 결정",
        "color": "#9fdfff",
        "tech": "4단계 · 얼음",
        "parts": [
            "공격 위치 예고",
            "지면 강타",
            "서리 확산",
            "얼음 결정"
        ],
        "desc": "바닥의 예고 링이 닫힌 뒤 지면 타격이 발생합니다. 서리의 성장과 결정 파열이 뒤따릅니다.",
        "cat": "combo",
        "type": "combo",
        "durationMs": 6000,
        "index": 43
    },
    {
        "id": "combo_shield",
        "name": "보호막 방어",
        "sub": "형성 → 투사체 → 피격 → 파괴",
        "color": "#a2dcff",
        "tech": "4단계 · 방어",
        "parts": [
            "보호막 형성",
            "적 투사체",
            "표면 파동",
            "보호막 파괴"
        ],
        "desc": "작은 공격은 표면 반응으로 막고, 마지막 강한 공격은 보호막 파편을 만듭니다. 강도 변화에 따른 반응을 비교하세요.",
        "cat": "combo",
        "type": "combo",
        "durationMs": 6400,
        "index": 44
    },
    {
        "id": "combo_spore",
        "name": "블룸 포자 공격",
        "sub": "포자탄 → 분출 → 독성 영역",
        "color": "#c1dc86",
        "tech": "4단계 · 블룸",
        "parts": [
            "포자탄 비행",
            "접촉 분출",
            "독구름 유지",
            "잔여 포자"
        ],
        "desc": "큰 포자탄이 표적에 닿아 작은 포자를 분출합니다. 지면에 낮은 독구름이 남고 서서히 사라집니다.",
        "cat": "combo",
        "type": "combo",
        "durationMs": 6400,
        "index": 45
    },
    {
        "id": "combo_absorb",
        "name": "처치·흡수",
        "sub": "피격 → 침식 → 회수 → 강화",
        "color": "#a5e9d0",
        "tech": "4단계 · 성장",
        "parts": [
            "처치 피격",
            "표적 디졸브",
            "에너지 회수",
            "흡수 반응"
        ],
        "desc": "표적의 몸이 경계부터 소멸한 뒤, 흩어진 에너지가 플레이어로 돌아갑니다. 도착 시 플레이어 주변이 반응합니다.",
        "cat": "combo",
        "type": "combo",
        "durationMs": 6400,
        "index": 46
    }
]);
export const categories = freezeData([['numbers','수치 애니메이션'],['gauges','게이지·진행'],['interface','UI 상호작용'],['rewards','보상·성장'],['tactics','전술·상태'],['hit', '타격·근접'], ['burst', '폭발·파괴'], ['fire', '불·연기'], ['water', '물·얼음'], ['energy', '전기·에너지'], ['motion', '이동·궤적'], ['magic', '마법·공간'], ['status', '상태·방어'], ['nature', '환경·생명'], ['life', '생성·소멸']]);
const effectKeys = { "slash": ["swingStart", "swingSweep", "arc", "tail", "thickness", "amount", "color"], "thrust": ["spread", "color", "amount", "velocity", "wind", "drag", "gravity", "endSize"], "smash": ["color", "amount", "waveSpeed", "thickness"], "sparks": ["amount", "spread", "velocity", "wind", "drag", "gravity", "endSize", "color"], "explosion": ["fireOnly", "color", "amount", "spread", "velocity", "wind", "drag", "gravity", "endSize"], "debris": ["amount", "spread", "velocity", "wind", "drag", "gravity", "endSize", "rotation", "color"], "shockwave": ["amount", "waveSpeed", "thickness", "color"], "fissure": ["amount", "branches", "thickness", "color"], "flame": ["color", "wind", "velocity", "turbulence", "amount"], "flamethrower": ["amount", "velocity", "spread", "color"], "smoke": ["amount", "velocity", "turbulence", "wind", "color"], "embers": ["amount", "velocity", "turbulence", "wind", "color"], "splash": ["color", "amount", "spread", "velocity", "wind", "drag", "gravity", "endSize", "waveSpeed", "thickness"], "ripple": ["amount", "waveSpeed", "thickness", "color"], "frost": ["amount", "thickness", "color", "branches"], "ice": ["color", "amount", "spread", "velocity", "wind", "drag", "gravity", "endSize", "rotation"], "lightning": ["turbulence", "thickness", "color", "branches", "amount"], "chain": ["turbulence", "thickness", "color", "branches", "amount"], "laser": ["thickness", "color", "amount", "turbulence"], "charge": ["amount", "color"], "projectile": ["amount", "tail", "color", "spread", "velocity", "wind", "drag", "gravity", "endSize"], "weapon": ["swingStart", "swingSweep", "arc", "tail", "thickness", "color"], "dash": ["amount", "tail", "color"], "landing": ["amount", "color", "waveSpeed", "thickness"], "sigil": ["radius", "color", "rotation", "amount"], "portal": ["radius", "color", "rotation", "amount"], "teleport": ["amount", "color"], "vortex": ["radius", "amount", "rotation", "color"], "heal": ["color", "amount"], "shield": ["radius", "color", "thickness", "amount", "waveSpeed"], "poison": ["color", "amount", "velocity", "turbulence", "wind"], "aura": ["radius", "color", "amount", "rotation"], "rain": ["amount", "velocity", "wind", "turbulence", "color"], "snow": ["amount", "velocity", "turbulence", "wind", "rotation", "color"], "leaves": ["amount", "velocity", "turbulence", "wind", "rotation", "color"], "pollen": ["amount", "wind", "turbulence", "velocity", "color"], "summon": ["amount", "color"], "dissolve": ["color", "amount"], "absorb": ["amount", "tail", "color"], "confetti": ["color", "amount", "spread", "gravity", "drag", "velocity", "wind", "endSize", "rotation"] };
const keyPaths = { "size": "appearance.scale", "amount": "emission.density", "opacity": "appearance.opacity", "color": "appearance.color", "glow": "appearance.glow", "velocity": "motion.speedScale", "spread": "emission.spreadScale", "gravity": "motion.gravityScale", "drag": "motion.dragPerSec", "wind": "motion.windScale", "turbulence": "motion.turbulenceScale", "rotation": "motion.rotationScale", "tail": "trail.lengthScale", "branches": "branch.count", "thickness": "shape.thicknessScale", "radius": "shape.radiusScale", "waveSpeed": "wave.speedScale", "arc": "swing.arcScale", "endSize": "particle.endSizeRatio", "swingStart": "swing.startRad", "swingSweep": "swing.sweepRad", "fireOnly": "appearance.fireOnly", "duration": "lifetime.durationMs", "pathArc": "trajectory.arcHeight" };
const timelines = { "combo_fireball": { "tracks": [{ "key": "charge", "group": 0, "startMs": 0, "endMs": 1250, "kind": "effect", "at": "source", "effect": "charge", "sampleEndMs": 3050, "multiply": { "emission.density": 0.6 } }, { "key": "flight", "group": 1, "startMs": 1050, "endMs": 2550, "kind": "flight", "at": "position" }, { "key": "impact", "group": 2, "startMs": 2550, "endMs": 4300, "kind": "effect", "at": "target", "effect": "explosion", "config": { "appearance": { "fireOnly": true } } }, { "key": "smoke", "group": 3, "startMs": 3100, "endMs": 6000, "kind": "effect", "at": "target", "effect": "smoke", "offset": { "x": 0, "y": -24 }, "scale": 0.65, "fadeOutMs": 1200, "config": { "appearance": { "color": "#9aabb4" } }, "multiply": { "emission.density": 0.5 } }, { "key": "embers", "group": 3, "startMs": 3100, "endMs": 6000, "kind": "effect", "at": "target", "effect": "embers", "fadeOutMs": 1200, "multiply": { "emission.density": 0.5 } }], "markersMs": [2550] }, "combo_thunder": { "tracks": [{ "key": "weapon", "group": 0, "startMs": 0, "endMs": 1800, "kind": "effect", "at": "source", "effect": "weapon", "fit": 84, "sampleKeys": [[0, 0], [800, 370.24390243902445], [1800, 1170.2439024390246]], "config": { "swing": { "startRad": -1.15, "sweepRad": 2.05, "arcScale": 1 } } }, { "key": "slash", "group": 1, "startMs": 200, "endMs": 1800, "kind": "effect", "at": "source", "effect": "slash", "fit": 70, "sampleKeys": [[0, 92.56097560975611], [600, 370.24390243902445], [1600, 1170.2439024390246]], "config": { "swing": { "startRad": -1.15, "sweepRad": 2.05, "arcScale": 1 } }, "multiply": { "shape.thicknessScale": 0.6 } }, { "key": "impact", "group": 2, "startMs": 800, "endMs": 2200, "kind": "effect", "at": "target", "effect": "sparks", "multiply": { "emission.density": 0.55 }, "config": { "motion": { "speedScale": 0.6 } } }, { "key": "chain", "group": 3, "startMs": 1050, "endMs": 4100, "kind": "effect", "at": "position", "effect": "chain", "bindings": { "source": "target", "target": { "anchor": "target", "offset": { "x": -24, "y": -46 } } } }], "markersMs": [800, 1310, 1570] }, "combo_ice": { "tracks": [{ "key": "warning", "group": 0, "startMs": 0, "endMs": 1200, "kind": "telegraph", "at": "target" }, { "key": "impact", "group": 1, "startMs": 1150, "endMs": 2800, "kind": "effect", "at": "target", "effect": "smash" }, { "key": "frost", "group": 2, "startMs": 1350, "endMs": 4900, "kind": "effect", "at": "target", "effect": "frost" }, { "key": "ice", "group": 3, "startMs": 2250, "endMs": 5400, "kind": "effect", "at": "target", "effect": "ice" }], "markersMs": [1370, 2490] }, "combo_shield": { "tracks": [{ "key": "surface", "group": 0, "startMs": 0, "endMs": 4100, "kind": "effect", "at": "target", "effect": "shield", "constantMs": 2500, "fadeInMs": 700, "hideBody": true }, { "key": "flight0", "group": 1, "startMs": 1000, "endMs": 1600, "kind": "flight", "at": "position", "bindings": { "target": "shieldSurface" }, "config": { "appearance": { "color": "#ffc18a" }, "emission": { "density": 0.6 } }, "multiply": { "trail.lengthScale": 0.65 } }, { "key": "flight1", "group": 1, "startMs": 2250, "endMs": 2850, "kind": "flight", "at": "position", "bindings": { "target": "shieldSurface" }, "config": { "appearance": { "color": "#ffc18a" }, "emission": { "density": 0.6 } }, "multiply": { "trail.lengthScale": 0.65 } }, { "key": "flight2", "group": 1, "startMs": 3500, "endMs": 4100, "kind": "flight", "at": "position", "bindings": { "target": "shieldSurface" }, "config": { "appearance": { "color": "#ffc18a" }, "emission": { "density": 0.6 } }, "multiply": { "trail.lengthScale": 0.65 } }, { "key": "impact0", "group": 2, "startMs": 1600, "endMs": 2650, "kind": "effect", "at": "target", "effect": "shield", "hideBody": true, "impactOnly": true, "hitAngle": 3.141592653589793 }, { "key": "impact1", "group": 2, "startMs": 2850, "endMs": 3900, "kind": "effect", "at": "target", "effect": "shield", "hideBody": true, "impactOnly": true, "hitAngle": 3.141592653589793 }, { "key": "break", "group": 3, "startMs": 4100, "endMs": 6400, "kind": "shieldBreak", "at": "target" }], "markersMs": [1600, 2850, 4100] }, "combo_spore": { "tracks": [{ "key": "flight", "group": 0, "startMs": 0, "endMs": 1500, "kind": "sporeFlight", "at": "position", "config": {}, "multiply": { "trail.lengthScale": 0.4 } }, { "key": "impact", "group": 1, "startMs": 1500, "endMs": 3000, "kind": "effect", "at": "target", "effect": "sparks", "config": { "motion": { "speedScale": 0.45, "gravityScale": 0.15 } }, "multiply": { "emission.density": 0.8 } }, { "key": "poison", "group": 2, "startMs": 1700, "endMs": 6400, "kind": "effect", "at": "target", "effect": "poison", "offset": { "x": 0, "y": 32 }, "fadeInMs": 400, "fadeOutMs": 1500 }, { "key": "pollen", "group": 3, "startMs": 2100, "endMs": 6400, "kind": "effect", "at": "target", "effect": "pollen", "offset": { "x": 0, "y": 15 }, "scale": 0.53, "alpha": 0.55, "fadeOutMs": 1400, "sampleStartMs": 2100 }], "markersMs": [1500] }, "combo_absorb": { "tracks": [{ "key": "impact", "group": 0, "startMs": 0, "endMs": 800, "kind": "effect", "at": "target", "effect": "sparks", "multiply": { "emission.density": 0.4 }, "config": { "motion": { "speedScale": 0.5 } } }, { "key": "dissolve", "group": 1, "startMs": 400, "endMs": 3300, "kind": "effect", "at": "target", "effect": "dissolve" }, { "key": "absorb", "group": 2, "startMs": 2200, "endMs": 5600, "kind": "effect", "at": "position", "effect": "absorb", "bindings": { "source": "target", "target": "source" } }, { "key": "heal", "group": 3, "startMs": 3900, "endMs": 6400, "kind": "effect", "at": "source", "effect": "heal", "fadeInMs": 350, "fadeOutMs": 800, "multiply": { "emission.density": 0.65 } }], "markersMs": [60, 4100] } };
const byId = new Map(catalog.map(definition => [definition.id, definition]));
const sharedKeys = ['size', 'duration', 'opacity'];
const comboExtraKeys = {
    combo_fireball: ['amount', 'tail', 'pathArc'], combo_thunder: [],
    combo_ice: [], combo_shield: ['radius', 'amount', 'tail', 'pathArc'],
    combo_spore: ['amount', 'tail', 'pathArc'], combo_absorb: []
};
// Fields overridden by the authored algorithm are not configurable at the parent level.
for (const [id, keys] of Object.entries({ thrust: ['gravity'], explosion: ['gravity', 'spread'], projectile: ['gravity'] }))
    effectKeys[id] = effectKeys[id].filter(key => !keys.includes(key));
effectKeys.projectile.push('pathArc');
for (const definition of catalog) {
    if (definition.type === 'combo') {
        const keys = new Set(comboExtraKeys[definition.id]);
        for (const track of timelines[definition.id].tracks) {
            for (const key of effectKeys[track.effect] || []) {
                if (!keyPaths[key])
                    continue;
                if (getPath(track.config, keyPaths[key]) === undefined)
                    keys.add(key);
            }
        }
        effectKeys[definition.id] = [...keys];
    }
}
for (const e of FEEDBACK_DEFINITIONS) effectKeys[e.id]=e.keys;
for(const [key,spec] of Object.entries(FEEDBACK_SPECS))keyPaths[key]=spec[0];
const defaultsById = new Map();
for (const definition of catalog) {
    const defaults = { appearance: { color: definition.color } };
    if (!['debris', 'shockwave', 'smoke', 'splash', 'dash', 'landing', 'poison', 'rain', 'snow', 'leaves'].includes(definition.id))
        defaults.appearance.glow = true;
    for (const key of [...sharedKeys, ...effectKeys[definition.id]]) {
        const path = keyPaths[key];
        if (path && !['color', 'glow'].includes(key))
            mergeInto(defaults, patchAt(path, getPath(privateDefaults, path)));
    }
    defaults.lifetime.durationMs = definition.durationMs;
    if (definition.type === 'combo')
        defaults.timeline = cloneData(timelines[definition.id]);
    if(definition.family==='feedback'){
        if(!['damage_number','critical_number','healing_number','resource_number','combo_counter','radial_cooldown','xp_level','card_reveal','loot_transfer','level_up','rarity_beacon'].includes(definition.id))delete defaults.appearance.glow;
        if(definition.keys.some(k=>TEXT_KEYS.includes(k)))defaults.format=cloneData(FORMAT_DEFAULT);
        mergeInto(defaults,definition.patch);
        if(defaults.transition&&definition.id!=='card_reveal')defaults.transition.easing=['radial_cooldown','buff_stack','attack_warning'].includes(definition.id)?'linear':'outCubic';
    }
    defaultsById.set(definition.id, freezeData(defaults));
}
export function definitionFor(effectId) {
    const definition = byId.get(effectId);
    if (!definition)
        throw new RangeError(`알 수 없는 효과: ${effectId}`);
    return definition;
}
export function parametersFor(effectId) {
    const definition = definitionFor(effectId);
    const keys = [...new Set([...sharedKeys, ...effectKeys[effectId]])];
    return keys.filter(key => parameterSpecs[key]).map(key => {
        const [path, label, _, min, max, step, validMin, validMax, unit] = parameterSpecs[key];
        return { key, path, label, min, max: key === 'duration' ? Math.max(max, definition.durationMs * 2) : max,
            step, validMin, validMax, unit, defaultValue: getPath(defaultsById.get(effectId), path) };
    });
}
function assertShape(patch, schema, prefix = '') {
    if (!plain(patch))
        throw new TypeError(`${prefix || 'config'}: 일반 객체가 필요합니다.`);
    for (const key of Object.keys(patch)) {
        if (blockedKeys.has(key) || !Object.hasOwn(schema, key))
            throw new TypeError(`지원하지 않는 설정: ${prefix}${key}`);
        if (prefix === '' && key === 'timeline')
            continue;
        if (plain(schema[key]))
            assertShape(patch[key], schema[key], `${prefix}${key}.`);
    }
}
const allowedTrackKeys = new Set(['key', 'group', 'startMs', 'endMs', 'kind', 'at', 'effect', 'sampleEndMs', 'sampleStartMs', 'sampleKeys', 'constantMs', 'multiply', 'config', 'offset', 'scale', 'alpha', 'fadeInMs', 'fadeOutMs', 'fit', 'bindings', 'hideBody', 'impactOnly', 'hitAngle']);
const trackKinds = new Set(['effect', 'flight', 'sporeFlight', 'telegraph', 'shieldBreak']);
const anchors = new Set(['position', 'source', 'target', 'shieldSurface']);
function validateAnchor(value) {
    if (typeof value === 'string') {
        if (!anchors.has(value))
            throw new TypeError(`지원하지 않는 앵커: ${value}`);
    }
    else if (plain(value)) {
        if (!anchors.has(value.anchor))
            throw new TypeError('앵커 이름이 필요합니다.');
        if (value.offset)
            vector(value.offset);
        if (Object.keys(value).some(k => !['anchor', 'offset'].includes(k)))
            throw new TypeError('앵커 설정 키 오류');
    }
    else
        throw new TypeError('앵커 지정이 필요합니다.');
}
function validateTimeline(timeline) {
    if (!plain(timeline) || !Array.isArray(timeline.tracks) || timeline.tracks.length > 128)
        throw new TypeError('timeline.tracks는 최대 128개 트랙 배열이어야 합니다.');
    if (Object.keys(timeline).some(key => !['tracks', 'markersMs'].includes(key)))
        throw new TypeError('알 수 없는 timeline 설정');
    const identities = new Set();
    for (const track of timeline.tracks) {
        if (!plain(track) || typeof track.key !== 'string' || !track.key || identities.has(track.key))
            throw new TypeError('트랙 key는 중복 없는 문자열이어야 합니다.');
        identities.add(track.key);
        for (const key of Object.keys(track))
            if (!allowedTrackKeys.has(key))
                throw new TypeError(`지원하지 않는 트랙 설정: ${key}`);
        finite(track.startMs, 'track.startMs', 0);
        finite(track.endMs, 'track.endMs', track.startMs + Number.EPSILON);
        if (track.endMs <= track.startMs)
            throw new RangeError('트랙 종료는 시작보다 뒤여야 합니다.');
        if (!Number.isSafeInteger(track.group) || track.group < 0 || track.group > 3)
            throw new RangeError('트랙 group은 0..3 정수입니다.');
        if (!trackKinds.has(track.kind))
            throw new TypeError('알 수 없는 트랙 kind');
        validateAnchor(track.at);
        if (track.kind === 'effect' && (!byId.has(track.effect) || byId.get(track.effect).type === 'combo'))
            throw new TypeError('트랙은 기본 효과만 참조할 수 있습니다.');
        if (track.config) {
            assertShape(track.config, privateDefaults);
            validateParameterValues(withPatch(privateDefaults, track.config));
        }
        if (track.multiply)
            for (const [path, multiplier] of Object.entries(track.multiply)) {
                if (typeof getPath(privateDefaults, path) !== 'number')
                    throw new TypeError(`multiply 경로 오류: ${path}`);
                finite(multiplier, path, 0);
            }
        if (track.bindings) {
            if (Object.keys(track.bindings).some(key => !['source', 'target'].includes(key)))
                throw new TypeError('bindings는 source/target만 지원합니다.');
            for (const value of Object.values(track.bindings))
                validateAnchor(value);
        }
        for (const key of ['scale', 'alpha', 'fadeInMs', 'fadeOutMs', 'sampleEndMs', 'sampleStartMs', 'constantMs', 'fit'])
            if (track[key] !== undefined)
                finite(track[key], key, 0);
        if (track.fit === 0)
            throw new RangeError('fit은 0보다 커야 합니다.');
        if (track.offset)
            vector(track.offset);
        if (track.hitAngle !== undefined)
            finite(track.hitAngle, 'hitAngle');
        for (const key of ['hideBody', 'impactOnly'])
            if (track[key] !== undefined && typeof track[key] !== 'boolean')
                throw new TypeError(key + '는 boolean입니다.');
        if (track.sampleKeys) {
            if (!Array.isArray(track.sampleKeys) || track.sampleKeys.length < 2 || track.sampleKeys.length > 64)
                throw new TypeError('sampleKeys는 2..64 키프레임 배열입니다.');
            let prev = -1;
            for (const pair of track.sampleKeys) {
                if (!Array.isArray(pair) || pair.length !== 2)
                    throw new TypeError('키프레임은 [시각ms,샘플ms]입니다.');
                finite(pair[0], '키프레임 시각', 0);
                finite(pair[1], '샘플 시각', 0);
                if (pair[0] <= prev)
                    throw new RangeError('키프레임 시각은 증가해야 합니다.');
                prev = pair[0];
            }
        }
    }
    if (!Array.isArray(timeline.markersMs) || timeline.markersMs.length > 128)
        throw new TypeError('markersMs 배열이 필요합니다.');
    for (const time of timeline.markersMs)
        finite(time, 'markersMs', 0);
}
function validateParameterValues(config) {
    for (const spec of Object.values(parameterSpecs)) {
        const value = getPath(config, spec[0]);
        if (value !== undefined)
            finite(value, spec[0], spec[6], spec[7]);
    }
    if (config.appearance?.scale === 0)
        throw new RangeError('appearance.scale은 0보다 커야 합니다.');
    if (config.branch?.count !== undefined && !Number.isInteger(config.branch.count))
        throw new RangeError('branch.count는 정수입니다.');
    if (config.appearance?.color !== undefined && !/^#[0-9a-f]{6}$/i.test(config.appearance.color))
        throw new TypeError('색상은 #RRGGBB 형식입니다.');
    for (const key of ['glow', 'fireOnly'])
        if (config.appearance?.[key] !== undefined && typeof config.appearance[key] !== 'boolean')
            throw new TypeError(`appearance.${key}는 boolean입니다.`);
}
/** Common defaults → effect defaults → preset → instance override. Arrays replace in full. */
export function resolveConfig(effectId, ...overrides) {
    definitionFor(effectId);
    const schema = defaultsById.get(effectId), result = cloneData(schema);
    for (const patch of overrides) {
        if (patch == null)
            continue;
        assertShape(patch, schema);
        mergeInto(result, patch);
    }
    validateParameterValues(result);
    if(result.format)validateFormat(result.format);
    if(result.transition?.easing!==undefined&&!['linear','outCubic','inOutCubic'].includes(result.transition.easing))throw new TypeError('지원하지 않는 transition.easing');
    for(const path of ['gauge.segments','reward.count']){const n=getPath(result,path);if(n!==undefined&&!Number.isInteger(n))throw new RangeError(path+'는 정수입니다.');}
    if (result.timeline)
        validateTimeline(result.timeline);
    return freezeData(result);
}
export function timelineGroups(effectId, config) {
    const definition = definitionFor(effectId), tracks = config.timeline?.tracks || [];
    return definition.parts.map((name, group) => {
        const matches = tracks.filter(track => track.group === group);
        return { name, startMs: matches.length ? Math.min(...matches.map(t => t.startMs)) : 0, endMs: matches.length ? Math.max(...matches.map(t => t.endMs)) : 0 };
    });
}
const vertexShader = `attribute vec2 a_position;attribute vec4 a_color;attribute vec3 a_shape;uniform vec2 u_resolution;varying vec2 v_screen;varying vec4 v_color;varying vec3 v_shape;void main(){vec2 p=a_position/u_resolution*2.0-1.0;gl_Position=vec4(p.x,-p.y,0.,1.);v_screen=a_position;v_color=a_color;v_shape=a_shape;}`;
const fragmentShader = `precision mediump float;varying vec2 v_screen;uniform vec4 u_clip;varying vec4 v_color;varying vec3 v_shape;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}void main(){if(v_screen.x<u_clip.x||v_screen.y<u_clip.y||v_screen.x>u_clip.z||v_screen.y>u_clip.w)discard;float a=v_color.a;vec3 c=v_color.rgb;float k=v_shape.z;float r=length(v_shape.xy);if(k>.5&&k<1.5){a*=1.-smoothstep(.83,1.,r);}else if(k<2.5&&k>1.5){a*=exp(-r*r*4.5)*(1.-smoothstep(.7,1.,r));}else if(k>2.5){float n=noise(v_shape.xy*3.2+2.)*.6+noise(v_shape.xy*7.4)*.25+noise(v_shape.xy*15.)*.15;a*=(1.-smoothstep(.42+n*.3,.86+n*.15,r))*(.45+n*.55);c*=.72+n*.4;}if(a<.003)discard;gl_FragColor=vec4(c*a,a);}`;
/** Procedural geometry/material only; actual GPU resources and all GL calls belong to GameKit. */
export class EffectBatch {
    constructor(device, { initialVertices = 8192, maxVertices = 262144 } = {}) {
        if (!device || typeof device.createPipeline !== 'function' || typeof device.draw !== 'function')
            throw new TypeError('GameKit WebGLDevice 인스턴스를 전달해야 합니다.');
        if (!Number.isSafeInteger(initialVertices) || !Number.isSafeInteger(maxVertices) || initialVertices < 6 || maxVertices < initialVertices)
            throw new RangeError('버텍스 용량 설정 오류');
        this.device = device;
        this.maxVertices = maxVertices;
        this.data = new Float32Array(initialVertices * 9);
        this.n = 0;
        this.tx = 0;
        this.ty = 0;
        this.s = 1;this.sx=1;this.sy=1;
        this.ca = 1;
        this.sa = 0;
        this.alpha = 1;
        this.glow = true;
        this.calls = 0;
        this.vertices = 0;
        this.primitives = 0;
        this.activeViews = 0;
        this.disposed = false;
        this.project = null;
        this.projectOut = { x: 0, y: 0 };
        this.clip = [0, 0, 1, 1];
        this.resolution = [1, 1];
        this.uniforms = { u_resolution: this.resolution, u_clip: this.clip };
        this.pipeline = device.createPipeline({ vertex: vertexShader, fragment: fragmentShader, stride: 36,
            attributes: [{ name: 'a_position', size: 2, offset: 0 }, { name: 'a_color', size: 4, offset: 8 }, { name: 'a_shape', size: 3, offset: 24 }],
            uniforms: { u_resolution: '2f', u_clip: '4f' } });
        try {
            this.buffer = device.createVertexBuffer({ capacityBytes: this.data.byteLength });
        }
        catch (error) {
            device.deletePipeline(this.pipeline);
            throw error;
        }
        this.submission = { pipeline: this.pipeline, buffer: this.buffer, count: 0, uniforms: this.uniforms, blend: 'source-over', depth: false, stencil: false };
    }
    resetStats() { this.calls = 0; this.vertices = 0; this.primitives = 0; this.activeViews = 0; }
    begin({ width, height, clip, transform = {}, project = null } = {}) {
        if (this.disposed)
            throw new Error('이펙트 배치가 해제되었습니다.');
        finite(width, 'width', 1);
        finite(height, 'height', 1);
        if (project !== null && typeof project !== 'function')
            throw new TypeError('project는 (x,y,out) 함수입니다.');
        this.resolution[0] = width;
        this.resolution[1] = height;
        this.n = 0;
        this.rect = clip || { left: 0, top: 0, right: width, bottom: height, width, height };
        for (const [index, key] of ['left', 'top', 'right', 'bottom'].entries())
            this.clip[index] = finite(this.rect[key], `clip.${key}`);
        if (this.clip[2] <= this.clip[0] || this.clip[3] <= this.clip[1])
            throw new RangeError('clip 크기는 양수여야 합니다.');
        this.tx = finite(transform.x ?? 0, 'transform.x');
        this.ty = finite(transform.y ?? 0, 'transform.y');
        this.sx=1;this.sy=1;
        this.s = finite(transform.scale ?? 1, 'transform.scale', Number.MIN_VALUE);
        const angle = finite(transform.rotationRad ?? 0, 'transform.rotationRad');
        this.ca = Math.cos(angle);
        this.sa = Math.sin(angle);
        this.alpha = 1;
        this.glow = true;
        this.project = project;
        this.activeViews++;
    }
    end() {
        if (!this.n)
            return;
        this.device.uploadVertices(this.buffer, this.data.subarray(0, this.n));
        this.submission.count = this.n / 9;
        this.device.draw(this.submission);
        this.calls++;
        this.vertices += this.n / 9;
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.device.deleteVertexBuffer(this.buffer);
        this.device.deletePipeline(this.pipeline);
        this.n = 0;
        this.data = new Float32Array(0);
        this.project = null;
    }
    vertex(x, y, c, a, u = 0, v = 0, k = 0) { if (this.n + 9 > this.data.length) {
        if (this.n + 9 > this.maxVertices * 9)
            throw new RangeError('이펙트 버텍스 한도 초과');
        const bigger = new Float32Array(Math.min(this.maxVertices * 9, this.data.length * 2));
        bigger.set(this.data);
        this.data = bigger;
    } x*=this.sx;y*=this.sy; const d = this.data, n = this.n; d[n] = this.tx + (x * this.ca - y * this.sa) * this.s; d[n + 1] = this.ty + (x * this.sa + y * this.ca) * this.s; if (this.project) {
        this.project(d[n], d[n + 1], this.projectOut);
        d[n] = this.projectOut.x;
        d[n + 1] = this.projectOut.y;
    } d[n + 2] = c[0]; d[n + 3] = c[1]; d[n + 4] = c[2]; d[n + 5] = clamp(a * this.alpha); d[n + 6] = u; d[n + 7] = v; d[n + 8] = k; this.n += 9; }
    tri(ax, ay, bx, by, cx, cy, color, a = 1) { const c = rgb(color); this.vertex(ax, ay, c, a); this.vertex(bx, by, c, a); this.vertex(cx, cy, c, a); this.primitives++; }
    quad(x, y, rx, ry, color, a = 1, k = 0, angle = 0) {
        if (a <= .003 || rx < .01 || ry < .01)
            return;
        const c = rgb(color), ca = Math.cos(angle), sa = Math.sin(angle), ax = rx * ca, ay = rx * sa, bx = -ry * sa, by = ry * ca;
        const x0 = x - ax - bx, y0 = y - ay - by, x1 = x + ax - bx, y1 = y + ay - by, x2 = x + ax + bx, y2 = y + ay + by, x3 = x - ax + bx, y3 = y - ay + by;
        this.vertex(x0, y0, c, a, -1, -1, k);
        this.vertex(x1, y1, c, a, 1, -1, k);
        this.vertex(x2, y2, c, a, 1, 1, k);
        this.vertex(x0, y0, c, a, -1, -1, k);
        this.vertex(x2, y2, c, a, 1, 1, k);
        this.vertex(x3, y3, c, a, -1, 1, k);
        this.primitives++;
    }
    disc(x, y, r, color, a = 1, ry = r) { this.quad(x, y, r, ry, color, a, 1); }
    glowAt(x, y, r, color, a = .4, ry = r) { if (this.glow)
        this.quad(x, y, r, ry, color, a, 2); }
    puff(x, y, rx, ry, color, a = .5, rot = 0) { this.quad(x, y, rx, ry, color, a, 3, rot); }
    line(x1, y1, x2, y2, w, color, a = 1) { const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < .001 || w < .005)
        return; const nx = -dy / len * w * .5, ny = dx / len * w * .5; this.tri(x1 + nx, y1 + ny, x1 - nx, y1 - ny, x2 + nx, y2 + ny, color, a); this.tri(x1 - nx, y1 - ny, x2 - nx, y2 - ny, x2 + nx, y2 + ny, color, a); }
    beam(x1, y1, x2, y2, w, color, a = 1) { if (this.glow) {
        this.line(x1, y1, x2, y2, w * 6, color, a * .06);
        this.line(x1, y1, x2, y2, w * 3, color, a * .13);
    } this.line(x1, y1, x2, y2, w, color, a); this.line(x1, y1, x2, y2, w * .28, blend(color, '#ffffff', .8), a); }
    ring(x, y, r, w, color, a = 1, sy = 1, start = 0, end = TAU, n = 56) { if (r <= .01)
        return; const count = Math.max(3, Math.ceil(n * (end - start) / TAU)); for (let i = 0; i < count; i++) {
        let a1 = start + (end - start) * i / count, a2 = start + (end - start) * (i + 1) / count;
        this.line(x + Math.cos(a1) * r, y + Math.sin(a1) * r * sy, x + Math.cos(a2) * r, y + Math.sin(a2) * r * sy, w, color, a);
    } }
    poly(points, color, a = 1) { for (let i = 1; i < points.length - 1; i++)
        this.tri(...points[0], ...points[i], ...points[i + 1], color, a); }
    shard(x, y, r, angle, color, a = 1, stretch = 1) { const pts = []; for (let i = 0; i < 4; i++) {
        let v = angle + i * TAU / 4, s = i % 2 ? .5 : 1;
        pts.push([x + Math.cos(v) * r * s, y + Math.sin(v) * r * s * stretch]);
    } this.poly(pts, color, a); this.line(...pts[0], ...pts[1], .8, blend(color, '#ffffff', .5), a * .65); }
    rotate(angle, fn) { let ca = this.ca, sa = this.sa, c = Math.cos(angle), n = Math.sin(angle); this.ca = ca * c - sa * n; this.sa = sa * c + ca * n; try {
        fn();
    }
    finally {
        this.ca = ca;
        this.sa = sa;
    } }
    stretch(x,y,fn){finite(x,"stretch.x",Number.MIN_VALUE);finite(y,"stretch.y",Number.MIN_VALUE);const sx=this.sx,sy=this.sy;this.sx*=x;this.sy*=y;try{fn();}finally{this.sx=sx;this.sy=sy;}}
    scope(x, y, scale, fn) { x*=this.sx;y*=this.sy;let tx = this.tx, ty = this.ty, s = this.s; this.tx += (x * this.ca - y * this.sa) * s; this.ty += (x * this.sa + y * this.ca) * s; this.s *= scale; try {
        fn();
    }
    finally {
        this.tx = tx;
        this.ty = ty;
        this.s = s;
    } }
}
function createSampler(R) {
    const emptyCells = Object.freeze([]);
    let currentContext = null, currentParameters = null, bodyCells = emptyCells;
    const C = { white: '#f1fff5', mint: '#a5f1ce', orange: '#ffb875', blue: '#a7ddff', ground: '#405261' };
    function count(n, p) { return Math.max(0, Math.round(n * p.emission.density)); }
    function alpha(t, start, end) { return smooth((t - start) / .12) * (1 - smooth((t - end + .3) / .3)); }
    function point(x, y) { return { x, y }; }
    function ball(v, g, t, drag) {
        if (drag < .001)
            return v * t + .5 * g * t * t;
        const f = (1 - Math.exp(-drag * t)) / drag;
        return v * f + g / drag * (t - f);
    }
    function lifeSize(p, u) { return mix(1, p.particle.endSizeRatio, clamp(u)); }
    function particlePos(vx, vy, t, p) { return [ball(vx * p.motion.speedScale + p.motion.windScale * 20, 0, t, p.motion.dragPerSec), ball(vy * p.motion.speedScale, 100 * p.motion.gravityScale, t, p.motion.dragPerSec)]; }
    function spark(x, y, len, angle, color, a = 1, w = 1) { R.beam(x, y, x - Math.cos(angle) * len, y - Math.sin(angle) * len, w, color, a); }
    function star(x, y, r, color, a = 1) { R.line(x - r, y, x + r, y, 1.5, color, a); R.line(x, y - r, x, y + r, 1.5, color, a); R.glowAt(x, y, r * 3, color, a * .3); }
    function cross(x, y, r, color, a = 1) { R.quad(x, y, r, r * .28, color, a); R.quad(x, y, r * .28, r, color, a); }
    function character(x, y, scale = 1, color = '#b8c8d0', alpha = 1, pose = 0) { currentContext.subject?.draw?.(R, { x, y, scale, color, alpha, pose }); }
    function target(x, y, radius = 13, alpha = .6) { currentContext.preview?.target?.(R, { x, y, radius, alpha }); }
    function ground(y = 48) { currentContext.preview?.ground?.(R, { y }); }
    function radiate(t, p, seed, color, n = 30, speed = 100, origin = point(0, 0)) {
        if (t < 0 || t > 2.5)
            return;
        for (let i = 0; i < count(n, p); i++) {
            let ang = -Math.PI / 2 + (rand(i, seed) - .5) * TAU * p.emission.spreadScale, v = speed * (.35 + rand(i + 210, seed) * .85), age = t * (.8 + rand(i + 66, seed) * .35), q = particlePos(Math.cos(ang) * v, Math.sin(ang) * v, age, p), life = 1.3 + rand(i + 900, seed) * .85, fade = clamp(1 - age / life);
            let vx = Math.cos(ang) * v * p.motion.speedScale, vy = Math.sin(ang) * v * p.motion.speedScale + age * 100 * p.motion.gravityScale;
            const l = (4 + rand(i + 331, seed) * 10) * lifeSize(p, age / life);
            spark(origin.x + q[0], origin.y + q[1], l, Math.atan2(vy, vx), i % 3 ? color : blend(color, '#ffffff', .75), fade, (.7 + rand(i + 32, seed)) * lifeSize(p, age / life));
        }
    }
    function crescent(t, p, color, weapon = false) {
        let u = clamp(t / .66), lead = (p.swing.startRad ?? -2.7) + u * (p.swing.sweepRad ?? 4.6) * p.swing.arcScale, span = Math.min(1.95 * p.trail.lengthScale * clamp(1 - (t - .38) / .75), u * (p.swing.sweepRad ?? 4.6) * p.swing.arcScale + .02), r = 70;
        if (t > 1.4 || t < 0)
            return;
        const fade = clamp((1.25 - t) / .7), steps = 38;
        for (let i = 0; i < steps; i++) {
            let v = i / steps, a = lead - span + span * v, b = lead - span + span * (i + 1) / steps, w = (weapon ? 19 : 29) * Math.pow(Math.sin(v * Math.PI * .94), .8) * p.shape.thicknessScale, inner = Math.max(3, r - w);
            let p0 = [Math.cos(a) * r, Math.sin(a) * r * .62], p1 = [Math.cos(b) * r, Math.sin(b) * r * .62], p2 = [Math.cos(b) * inner, Math.sin(b) * inner * .62], p3 = [Math.cos(a) * inner, Math.sin(a) * inner * .62];
            R.poly([p0, p1, p2, p3], color, fade * (.06 + .6 * v));
            R.line(...p0, ...p1, 1.6, color, fade * (.2 + .8 * v));
        }
        if (R.glow)
            R.ring(0, 0, r + 4, 4, color, fade * .055, .62, lead - span, lead, 48);
        if (weapon) {
            let x = Math.cos(lead), y = Math.sin(lead) * .62;
            R.beam(x * 9, y * 9, x * 84, y * 84, 3, color, fade);
            R.line(-x * 7, -y * 7, x * 14, y * 14, 5, '#859398', fade);
            R.disc(0, 0, 4, '#e9e8de', fade);
        }
        else {
            for (let i = 0; i < count(9, p); i++) {
                let a = -2.7 + rand(i, 11) * 3.8, s = clamp(t - .15 - rand(i + 42, 17) * .15);
                spark(Math.cos(a) * (r + s * 26), Math.sin(a) * (r + s * 26) * .62, 6, a, color, fade * .6, .8);
            }
        }
    }
    function bolt(ax, ay, bx, by, t, p, seed, a = 1) {
        const n = 15, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, jitter = Math.floor(t * 13), pts = [];
        for (let i = 0; i <= n; i++) {
            let u = i / n, j = (rand(i + jitter * 37, seed) - .5) * 22 * p.motion.turbulenceScale * Math.sin(u * Math.PI);
            pts.push([mix(ax, bx, u) + nx * j, mix(ay, by, u) + ny * j]);
        }
        for (let i = 1; i < pts.length; i++)
            R.beam(...pts[i - 1], ...pts[i], 1.8 * p.shape.thicknessScale, p.appearance.color, a);
        for (let i = 0; i < Math.round(p.branch.count * p.emission.density); i++) {
            let j = 2 + Math.floor(rand(i + 89, seed) * (n - 4)), pt = pts[j], sign = i % 2 ? -1 : 1, ex = pt[0] + dx * .13 + nx * (16 + rand(i + 310, seed) * 22) * sign, ey = pt[1] + dy * .13 + ny * (16 + rand(i + 310, seed) * 22) * sign;
            R.beam(...pt, mix(pt[0], ex, .55) + nx * 6, mix(pt[1], ey, .55) + ny * 6, .7 * p.shape.thicknessScale, p.appearance.color, a * .65);
            R.line(mix(pt[0], ex, .55) + nx * 6, mix(pt[1], ey, .55) + ny * 6, ex, ey, .65 * p.shape.thicknessScale, p.appearance.color, a * .65);
        }
    }
    function crystal(x, y, r, rot, color, a = 1) {
        let pts = [[-r * .5, r * .55], [-r * .45, -r * .4], [0, -r], [r * .48, -r * .35], [r * .48, r * .55], [0, r * .8]].map(([a, b]) => [x + a * Math.cos(rot) - b * Math.sin(rot), y + a * Math.sin(rot) + b * Math.cos(rot)]);
        R.poly(pts, color, a * .8);
        R.poly([pts[0], pts[2], pts[5]], blend(color, '#ffffff', .6), a * .85);
        R.poly([pts[2], pts[3], pts[5]], blend(color, '#344968', .5), a * .9);
        for (let i = 0; i < pts.length; i++)
            R.line(...pts[i], ...pts[(i + 1) % pts.length], .6, blend(color, '#ffffff', .65), a * .7);
    }
    function cloud(t, p, seed, color, poison = false) {
        for (let i = 0; i < count(poison ? 13 : 17, p); i++) {
            let a = fract(t * (poison ? .2 : .21) * p.motion.speedScale + rand(i, seed)), x = poison ? (rand(i + 51, seed) - .5) * 155 + Math.sin(t * .6 + i) * 9 * p.motion.turbulenceScale : Math.sin(a * 5 + i) * 13 * p.motion.turbulenceScale + (rand(i + 60, seed) - .5) * 23;
            let y = poison ? 23 - Math.sin(a * Math.PI) * 23 : 48 - a * 124;
            let r = (poison ? 19 : 12) + a * (poison ? 16 : 29);
            x += p.motion.windScale * a * (poison ? 17 : 33);
            R.puff(x, y, r, r * (poison ? .6 : .86), blend(color, '#31404b', poison ? .35 : a * .35), Math.sin(a * Math.PI) * .47, t * .07 + i);
        }
    }
    function groundRing(t, p, color, y = 0, water = false) {
        if (t < 0)
            return;
        for (let i = 0; i < count(water ? 4 : 2, p); i++) {
            let a = t - i * (water ? .32 : .13), r = (water ? 15 : 18) + Math.max(0, a) * (water ? 33 : 65) * p.wave.speedScale;
            if (a >= 0 && a < 2.7) {
                let f = clamp(1 - a / (water ? 2.8 : 1.8));
                R.ring(0, y, r, (water ? 1 : 2.1) * p.shape.thicknessScale * f, color, f * .8, .34);
                R.ring(0, y + 2, r + 2, .6, color, f * .23, .34);
            }
        }
    }
    function pathPoint(u, source, target, arc = currentParameters.trajectory.arcHeight) {
        const path = currentContext.trail?.length > 1 ? currentContext.trail : currentContext.path;
        if (path?.length > 1) {
            const at = clamp(u) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(at)), t = at - i;
            return { x: mix(path[i].x, path[i + 1].x, t), y: mix(path[i].y, path[i + 1].y, t) };
        }
        return { x: mix(source.x, target.x, u), y: mix(source.y, target.y, u) - Math.sin(u * Math.PI) * arc };
    }
    function comet(u, p, s, tar, color) {
        if (u < 0 || u > 1)
            return;
        const head = pathPoint(u, s, tar);
        for (let i = 0; i < count(36, p); i++) {
            let v = i / count(36, p), u2 = Math.max(0, u - v * .31 * p.trail.lengthScale), q = pathPoint(u2, s, tar), r = (1 - v) * 5;
            R.glowAt(q.x, q.y, r * 4 + 1, color, (1 - v) * .14);
            R.disc(q.x, q.y, Math.max(.3, r), color, (1 - v) * .4);
        }
        R.glowAt(head.x, head.y, 21, color, .6);
        R.disc(head.x, head.y, 5, color);
        R.disc(head.x - 1, head.y - 1, 2.6, C.white);
    }
    function dissolveBody(t, p, seed, color) {
        let cut = clamp((t - .45) / 1.9);
        for (let i = 0; i < bodyCells.length; i++) {
            let [x, y] = bodyCells[i], n = clamp((y - currentContext.subject.bounds.minY) / (currentContext.subject.bounds.maxY - currentContext.subject.bounds.minY) * .7 + rand(i, seed) * .35), remain = n - cut;
            if (remain > 0) {
                R.quad(x, y, 1.8, 1.8, remain < .12 ? color : '#b9cbd2', clamp(remain * 12));
                if (remain < .12)
                    R.glowAt(x, y, 5, color, .4);
            }
            else {
                let age = -remain * 1.9;
                let dx = (rand(i + 481, seed) - .5) * 45 * age, dy = -age * (17 + rand(i + 622, seed) * 45);
                R.shard(x + dx, y + dy, 1.9 * (1 - clamp(age / 1.1)), i + age, color, clamp(1 - age / 1.1));
            }
        }
    }
    const EFFECT_DRAW = {
        slash(t, p, s) { crescent(t, p, p.appearance.color); },
        thrust(t, p, s) {
            const u = ease(t / .38), fade = clamp((1.04 - t) / .7), x = mix(-88, 64, u);
            if (t < 1.1) {
                R.poly([[x, 0], [x - 80, -13 * p.emission.spreadScale], [x - 65, 0], [x - 80, 13 * p.emission.spreadScale]], p.appearance.color, fade * .65);
                R.beam(x - 84, 0, x, 0, 2, p.appearance.color, fade);
                for (let i = 0; i < count(8, p); i++) {
                    let y = (rand(i, s.seed) - .5) * 50;
                    R.line(x - 70 - rand(i + 52, s.seed) * 45, y, x - 30, y, .7, p.appearance.color, fade * .55);
                }
            }
            radiate(t - .3, withPatch(p, { emission: { spreadScale: .35 }, motion: { gravityScale: .1 } }), s.seed, p.appearance.color, 15, 56, point(64, 0));
        },
        smash(t, p, s) {
            const u = clamp(t / .28);
            ground(0);
            if (t < .35)
                R.scope(0, -75 * (1 - u), 1, () => { R.quad(0, -17, 13, 17, '#b6c2c9', 1); R.quad(0, -20, 9, 7, p.appearance.color, .75); R.line(0, -50, 0, -25, 5, '#81969f', 1); });
            if (t > .22) {
                let a = t - .22, f = clamp(1 - a / 1.2);
                R.glowAt(0, 0, 68 * clamp(a * 9), p.appearance.color, f * .65, 27);
                groundRing(a, p, p.appearance.color);
                for (let i = 0; i < count(15, p); i++) {
                    let side = i % 2 ? 1 : -1, v = 27 + rand(i, s.seed) * 58, x = side * v * ease(a / 1.2), y = -Math.sin(clamp(a / 1.4) * Math.PI) * (8 + rand(i + 14, s.seed) * 15);
                    R.puff(x, y, 9 + a * 10, 5 + a * 5, '#b3a58f', f * .45, i);
                }
            }
        },
        sparks(t, p, s) { radiate(t, p, s.seed, p.appearance.color, 36, 113); R.glowAt(0, 0, 25, p.appearance.color, clamp(1 - t * 6) * .8); },
        explosion(t, p, s) {
            if (t < 0)
                return;
            let f = clamp(1 - t / (p.appearance.fireOnly ? 1.25 : 2.35));
            R.glowAt(0, 0, 95 * ease(t / .24), p.appearance.color, clamp(1 - t / 1.4) * .55);
            for (let i = 0; i < count(15, p); i++) {
                let a = rand(i, s.seed) * TAU, r = (16 + rand(i + 98, s.seed) * 27) * ease(t / .7), x = Math.cos(a) * r, y = Math.sin(a) * r * .75 - t * 9, sz = (9 + rand(i + 101, s.seed) * 20) * (.6 + ease(t / .35));
                let heat = clamp(1 - t / (.7 + rand(i + 312, s.seed) * .8)), col = blend('#3a4249', p.appearance.color, heat);
                R.puff(x, y, sz, sz * .86, col, f * .9, i);
                if (heat > .4)
                    R.disc(x, y, sz * .38, blend(p.appearance.color, '#ffeab6', .65), heat * .55);
            }
            if (t < .32) {
                R.disc(0, 0, 25 * ease(t / .045), blend(p.appearance.color, '#ffffff', .8), clamp(1 - t / .32));
                R.ring(0, 0, 75 * ease(t / .32), 2, p.appearance.color, clamp(1 - t / .32));
            }
            radiate(t, withPatch(p, { motion: { gravityScale: .4 }, emission: { spreadScale: 1 } }), s.seed + 17, p.appearance.color, 26, 110);
        },
        debris(t, p, s) {
            ground(0);
            for (let i = 0; i < count(22, p); i++) {
                let a = -Math.PI / 2 + (rand(i, s.seed) - .5) * 2.5 * p.emission.spreadScale, v = 45 + rand(i + 66, s.seed) * 100, q = particlePos(Math.cos(a) * v, Math.sin(a) * v, t, p), x = q[0], y = q[1], fade = clamp((2.95 - t) / .55);
                if (y > 0) {
                    const hit = Math.max(.15, -2 * Math.sin(a) * v * p.motion.speedScale / (100 * p.motion.gravityScale)), b = Math.max(0, t - hit);
                    y = -Math.abs(Math.sin(b * 7)) * 12 * Math.exp(-b * 2);
                    x *= .94;
                }
                R.disc(x, y + 4, 5, '#05080a', fade * .2, 1.5);
                let r = (3 + rand(i + 13, s.seed) * 7) * lifeSize(p, t / 3.1);
                R.shard(x, y - r, r, rand(i + 81, s.seed) * 6 + t * (rand(i + 39, s.seed) - .5) * 8 * p.motion.rotationScale, blend(p.appearance.color, '#4d4f50', rand(i + 46, s.seed) * .55), fade, 1.3);
            }
        },
        shockwave(t, p, s) {
            ground(0);
            groundRing(t, p, p.appearance.color);
            const r = 18 + t * 65 * p.wave.speedScale, f = clamp(1 - t / 1.9);
            for (let i = 0; i < count(32, p); i++) {
                let a = rand(i, s.seed) * TAU, x = Math.cos(a) * r, y = Math.sin(a) * r * .34;
                R.puff(x, y, 3 + t * 4, 2 + t * 2, p.appearance.color, f * .3, i);
            }
            R.disc(0, 0, 3, p.appearance.color, f * .8);
        },
        fissure(t, p, s) {
            ground(0);
            let f = clamp((3.35 - t) / .8);
            for (let b = 0; b < count(5 + p.branch.count, p); b++) {
                let a = TAU * b / count(5 + p.branch.count, p) + rand(b, s.seed) * .25, prev = [0, 0];
                for (let j = 1; j <= 7; j++) {
                    let r = j * 14, ang = a + (rand(b * 20 + j, s.seed) - .5) * .3, end = [Math.cos(ang) * r, Math.sin(ang) * r * .45], grow = clamp((t * .85 - j * .07) * 5);
                    if (grow > 0) {
                        let q = [mix(prev[0], end[0], grow), mix(prev[1], end[1], grow)];
                        R.line(...prev, ...q, 5 * p.shape.thicknessScale, '#020406', f);
                        R.beam(...prev, ...q, 1.1 * p.shape.thicknessScale, p.appearance.color, f * .8);
                        if (j === 3 || j === 5) {
                            let e = [q[0] + Math.cos(ang + .7) * 20, q[1] + Math.sin(ang + .7) * 12];
                            R.line(...q, ...e, 2.3, '#020406', f);
                            R.line(...q, ...e, .6, p.appearance.color, f * .8);
                        }
                    }
                    prev = end;
                }
            }
        },
        flame(t, p, s) {
            R.glowAt(0, 22, 69, p.appearance.color, .45, 45);
            for (let j = 0; j < 5; j++) {
                let baseX = (j - 2) * 8 + p.motion.windScale * 3, topY = -47 - (j === 2 ? 18 : 0) + Math.sin(t * 5 * p.motion.speedScale + j * 2) * 10 * p.motion.turbulenceScale, tipX = baseX + Math.sin(t * 4 + j) * 14 * p.motion.turbulenceScale + p.motion.windScale * 14, pts = [[baseX - 16, 40]];
                for (let i = 0; i <= 18; i++) {
                    let u = i / 18, x = mix(baseX - 16, tipX, u) + Math.sin(u * 8 + t * 5 + j) * 7 * Math.sin(u * Math.PI) * p.motion.turbulenceScale;
                    pts.push([x, mix(40, topY, u)]);
                }
                for (let i = 18; i >= 0; i--) {
                    let u = i / 18, x = mix(baseX + 16, tipX, u) + Math.sin(u * 8 + t * 5 + j + 1) * 5 * Math.sin(u * Math.PI) * p.motion.turbulenceScale;
                    pts.push([x, mix(40, topY, u)]);
                }
                R.poly(pts, j % 2 ? p.appearance.color : blend(p.appearance.color, '#ff4828', .45), .62);
            }
            R.puff(0, 25, 19, 30, blend(p.appearance.color, '#fff0a1', .7), .9);
            for (let i = 0; i < count(22, p); i++) {
                let a = fract(t * .4 * p.motion.speedScale + rand(i, s.seed)), x = (rand(i + 65, s.seed) - .5) * 42 + Math.sin(a * 9 + i) * 10 * p.motion.turbulenceScale + p.motion.windScale * a * 24, y = 38 - a * 137;
                R.disc(x, y, 1.3 * (1 - a), blend(p.appearance.color, '#fff0a1', .55), Math.sin(a * Math.PI));
            }
        },
        flamethrower(t, p, s) {
            let A = s.source, B = s.target, dx = B.x - A.x, dy = B.y - A.y, ang = Math.atan2(dy, dx), len = Math.hypot(dx, dy);
            for (let i = 0; i < count(65, p); i++) {
                let a = fract(t * .65 * p.motion.speedScale + rand(i, s.seed)), l = len * a, w = (rand(i + 223, s.seed) - .5) * 50 * a * p.emission.spreadScale, along = Math.cos(ang) * l - Math.sin(ang) * w, up = Math.sin(ang) * l + Math.cos(ang) * w, r = 4 + a * 16, col = blend(p.appearance.color, '#ffec98', clamp(1 - a * 1.4));
                R.puff(A.x + along, A.y + up, r, r * .83, col, Math.sin(a * Math.PI) * .55, i);
            }
            R.glowAt(A.x + dx * .45, A.y + dy * .45, len * .5, p.appearance.color, .15, len * .2);
            R.disc(A.x, A.y, 4, C.white, .8);
        },
        smoke(t, p, s) { cloud(t, p, s.seed, p.appearance.color); },
        embers(t, p, s) {
            for (let i = 0; i < count(44, p); i++) {
                let a = fract(t * (.12 + rand(i, s.seed) * .12) * p.motion.speedScale + rand(i + 44, s.seed)), x = (rand(i + 55, s.seed) - .5) * 125 + Math.sin(a * 9 + i) * 10 * p.motion.turbulenceScale + p.motion.windScale * a * 40, y = 70 - a * 153, r = .6 + rand(i + 33, s.seed) * 1.7, fade = Math.sin(a * Math.PI);
                R.glowAt(x, y, 6 * r, p.appearance.color, fade * .3);
                R.line(x, y, x - Math.cos(a * 8) * 2, y + 5, r, p.appearance.color, fade);
            }
        },
        splash(t, p, s) {
            ground(0);
            if (t < .6) {
                let u = clamp(t / .5), fade = 1 - u;
                for (let i = 0; i < 12; i++) {
                    let a = Math.PI + i * Math.PI / 11, b = Math.PI + (i + 1) * Math.PI / 11, r = 25 + u * 38;
                    R.poly([[Math.cos(a) * r, Math.sin(a) * r * .6], [Math.cos(b) * r, Math.sin(b) * r * .6], [Math.cos(b) * r * .7, Math.sin(b) * r * .25], [Math.cos(a) * r * .7, Math.sin(a) * r * .25]], p.appearance.color, fade * .25);
                }
            }
            for (let i = 0; i < count(32, p); i++) {
                let a = -Math.PI / 2 + (rand(i, s.seed) - .5) * 2.7 * p.emission.spreadScale, v = 45 + rand(i + 51, s.seed) * 87, q = particlePos(Math.cos(a) * v, Math.sin(a) * v, t, p), f = clamp((2.5 - t) / .5);
                if (q[1] < 0) {
                    let vy = Math.sin(a) * v * p.motion.speedScale + t * 100 * p.motion.gravityScale, ang = Math.atan2(vy, Math.cos(a) * v);
                    R.quad(q[0], q[1], (2 + rand(i + 200, s.seed) * 2) * lifeSize(p, t / 2.7), 1.2 * lifeSize(p, t / 2.7), p.appearance.color, f, 1, ang);
                    R.disc(q[0] - .8, q[1] - .8, .75, C.white, f * .8);
                }
                else if (t > .2) {
                    let b = clamp(q[1] / 45);
                    R.ring(q[0], 0, 2 + b * 10, .6, p.appearance.color, (1 - b) * f, .28);
                }
            }
            groundRing(t, withPatch(p, { emission: { density: .5 } }), p.appearance.color, 0, true);
        },
        ripple(t, p, s) {
            groundRing(t, p, p.appearance.color, 0, true);
            if (t < .55) {
                R.disc(0, -14 * Math.sin(t / .55 * Math.PI), 2.6, p.appearance.color, 1 - t / .55);
                R.glowAt(0, 0, 14, p.appearance.color, .15);
            }
        },
        frost(t, p, s) {
            let f = clamp((3.85 - t) / .8);
            for (let k = 0; k < count(6, p); k++) {
                let a = k * TAU / count(6, p), length = 68;
                for (let j = 0; j < 6; j++) {
                    let u = clamp(t * .65 - j * .12), r0 = j * length / 6, r1 = (j + u) * length / 6, x0 = Math.cos(a) * r0, y0 = Math.sin(a) * r0 * .55, x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1 * .55;
                    R.line(x0, y0, x1, y1, 1.7 * p.shape.thicknessScale, p.appearance.color, f);
                    if (j > 0 && j < Math.min(6, p.branch.count + 2)) {
                        for (let side of [-1, 1]) {
                            let len = (6 - j) * 4 * clamp((t * .7 - j * .13) * 3), ang = a + side * Math.PI / 3;
                            R.line(x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len * .55, p.shape.thicknessScale, p.appearance.color, f * .8);
                        }
                    }
                }
            }
            R.glowAt(0, 0, 75, p.appearance.color, .13 * f, 40);
        },
        ice(t, p, s) {
            if (t < .38) {
                for (let i = 0; i < 5; i++)
                    crystal((i - 2) * 13, 4, 25 + rand(i, s.seed) * 22, (i - 2) * .14, p.appearance.color, clamp(t * 10));
            }
            for (let i = 0; i < count(19, p); i++) {
                let a = t - .24;
                if (a < 0)
                    continue;
                let ang = -Math.PI / 2 + (rand(i, s.seed) - .5) * 2.8 * p.emission.spreadScale, v = 35 + rand(i + 35, s.seed) * 85, q = particlePos(Math.cos(ang) * v, Math.sin(ang) * v, a, p), f = clamp((2.5 - a) / .8);
                if (q[1] > 15)
                    q[1] = 15;
                crystal(q[0], q[1], (3 + rand(i + 81, s.seed) * 9) * lifeSize(p, a / 2.75), rand(i + 20, s.seed) * TAU + a * (i % 2 ? 2 : -2) * p.motion.rotationScale, p.appearance.color, f);
            }
            radiate(t - .2, withPatch(p, { motion: { gravityScale: .3 } }), s.seed + 10, p.appearance.color, 14, 66);
        },
        lightning(t, p, s) {
            let f = clamp((1.4 - t) / .55) * (Math.floor(t * 14) % 3 === 0 ? .55 : 1);
            if (t < 1.5) {
                bolt(s.source.x, s.source.y, s.target.x, s.target.y, t, p, s.seed, f);
                R.glowAt(s.target.x, s.target.y, 24, p.appearance.color, f * .55);
                star(s.target.x, s.target.y, 7, p.appearance.color, f);
            }
        },
        chain(t, p, s) {
            const pts = s.targets?.length ? [s.source, ...s.targets, s.target] : [s.source,
                point(mix(s.source.x, s.target.x, 75 / 176), mix(s.source.y, s.target.y, 75 / 176) - 32),
                point(mix(s.source.x, s.target.x, 119 / 176), mix(s.source.y, s.target.y, 119 / 176) + 22), s.target];
            for (let i = 1; i < pts.length; i++) {
                target(pts[i].x, pts[i].y, 10, .42);
                let a = t - (i - 1) * .26, f = alpha(a, 0, 1.45);
                if (a >= 0 && f > 0) {
                    bolt(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, a, withPatch(p, { branch: { count: Math.max(0, p.branch.count - 1) } }), s.seed + i * 91, f);
                    R.glowAt(pts[i].x, pts[i].y, 19, p.appearance.color, f * .6);
                }
            }
        },
        laser(t, p, s) {
            const f = .83 + Math.sin(t * 22) * .08, ax = s.source.x, ay = s.source.y, bx = s.target.x, by = s.target.y;
            R.beam(ax, ay, bx, by, 5 * p.shape.thicknessScale, p.appearance.color, f);
            R.glowAt(ax, ay, 18, p.appearance.color, .45);
            R.glowAt(bx, by, 27, p.appearance.color, .75);
            let ang = Math.atan2(by - ay, bx - ax);
            for (let i = 0; i < count(19, p); i++) {
                let a = fract(t * 1.4 + rand(i, s.seed)), v = 15 + rand(i + 33, s.seed) * 30, an = ang + (rand(i + 44, s.seed) - .5) * 3;
                let x = bx + Math.cos(an) * a * v, y = by + Math.sin(an) * a * v + Math.sin(a * 9 + i) * 3 * p.motion.turbulenceScale;
                spark(x, y, 5, an, p.appearance.color, 1 - a, .8);
            }
            for (let i = 0; i < 4; i++) {
                let a = fract(t * .8 + i / 4);
                R.disc(mix(ax, bx, a), mix(ay, by, a), 3 * p.shape.thicknessScale, C.white, .6);
            }
        },
        charge(t, p, s) {
            let u = clamp(t / 2.2), f = clamp((3.05 - t) / .35);
            for (let i = 0; i < count(35, p); i++) {
                let a = fract(t * .55 + rand(i, s.seed)), ang = rand(i + 12, s.seed) * TAU + a * 2.5, r = 92 * (1 - ease(a));
                let x = Math.cos(ang) * r, y = Math.sin(ang) * r * .7;
                R.disc(x, y, 1.2 + 2 * a, p.appearance.color, Math.sin(a * Math.PI) * f);
                spark(x, y, 7, ang - 1, p.appearance.color, (1 - a) * f * .5);
            }
            R.glowAt(0, 0, 26 + u * 35, p.appearance.color, .65 * f);
            R.disc(0, 0, 3 + u * 14, p.appearance.color, .5 * f);
            R.disc(-2, -2, 2 + u * 7, C.white, .8 * f);
            R.ring(0, 0, 28 + u * 4, 1, p.appearance.color, f * .7, 1, 0, TAU * u);
        },
        projectile(t, p, s) {
            if (s.trail?.length > 1) {
                comet(1, p, s.source, s.target, p.appearance.color);
                return;
            }
            let u = clamp((t - .12) / 1.9);
            if (t < 2.13)
                comet(u, p, s.source, s.target, p.appearance.color);
            if (t >= 2.02)
                radiate(t - 2.02, withPatch(p, { motion: { gravityScale: .1 } }), s.seed, p.appearance.color, 15, 45, s.target);
        },
        weapon(t, p, s) {
            if (s.weaponTrail?.length > 1) {
                const samples = s.weaponTrail, count = samples.length, used = Math.max(1, Math.ceil((count - 1) * Math.min(1, p.trail.lengthScale))), start = Math.max(1, count - used);
                for (let i = start; i < count; i++) {
                    const a = samples[i - 1], b = samples[i], fade = (i - start + 1) / used;
                    R.poly([[a.outer.x, a.outer.y], [b.outer.x, b.outer.y], [b.inner.x, b.inner.y], [a.inner.x, a.inner.y]], p.appearance.color, fade * .55);
                    R.line(a.outer.x, a.outer.y, b.outer.x, b.outer.y, 1.6 * p.shape.thicknessScale, p.appearance.color, fade);
                }
                return;
            }
            crescent(t, p, p.appearance.color, true);
        },
        dash(t, p, s) {
            let moving = s.interacted;
            let u = clamp(t / 1.1), x = moving ? s.actor.x : mix(-90, 80, ease(u)), y = moving ? s.actor.y : 32;
            const hist = moving ? s.history : null;
            for (let i = count(6, p); i > 0; i--) {
                let dx, dy;
                if (hist && hist.length) {
                    let q = hist[Math.max(0, hist.length - 1 - Math.round(i * 3 * p.trail.lengthScale))];
                    dx = q.x;
                    dy = q.y;
                }
                else {
                    dx = mix(-90, 80, ease(clamp(u - i * .065 * p.trail.lengthScale)));
                    dy = y;
                }
                character(dx, dy, .9, p.appearance.color, (1 - i / (count(6, p) + 1)) * .36, .7);
            }
            character(x, y, .9, '#edfff5', 1, moving ? Math.sin(t * 12) * .65 : .7);
            for (let i = 0; i < 6; i++) {
                let yy = y - 45 + rand(i, s.seed) * 40;
                R.line(x - 20 - i * 7 * p.trail.lengthScale, yy, x - 8, yy, .65, p.appearance.color, clamp(1 - t / 1.7) * .6);
            }
        },
        landing(t, p, s) {
            ground(0);
            let impact = .7, fall = clamp(t / impact), y = -100 * (1 - fall * fall);
            character(0, t < impact ? y : 0, 1, '#bdcdd3', 1, t > impact && t < 1 ? 1 : 0);
            if (t > impact) {
                let a = t - impact, fade = clamp(1 - a / 1.65);
                for (let i = 0; i < count(18, p); i++) {
                    let side = i % 2 ? -1 : 1, v = 25 + rand(i, s.seed) * 65, x = side * v * ease(a / 1.3), yy = -Math.sin(clamp(a / 1.1) * Math.PI) * (5 + rand(i + 30, s.seed) * 10);
                    R.puff(x, yy, 6 + a * 15, 3 + a * 8, p.appearance.color, fade * .35, i);
                }
                groundRing(a, withPatch(p, { emission: { density: .5 } }), p.appearance.color);
            }
        },
        sigil(t, p, s) {
            const r = 66 * p.shape.radiusScale;
            R.glowAt(0, 0, r * 1.25, p.appearance.color, .17, r * .66);
            for (let j = 0; j < 3; j++) {
                R.ring(0, 0, r - j * 12, .8, p.appearance.color, .55, .57);
                let N = j === 1 ? 3 : 6, pts = [];
                for (let k = 0; k < N; k++) {
                    let a = k * TAU / N + t * (j % 2 ? -.12 : .18) * p.motion.rotationScale;
                    pts.push([Math.cos(a) * (r - j * 12), Math.sin(a) * (r - j * 12) * .57]);
                }
                for (let k = 0; k < N; k++)
                    R.line(...pts[k], ...pts[(k + 1) % N], .9, p.appearance.color, .7);
            }
            for (let i = 0; i < count(16, p); i++) {
                let a = i * TAU / count(16, p) - t * .18 * p.motion.rotationScale, x = Math.cos(a) * (r + 10), y = Math.sin(a) * (r + 10) * .57;
                R.scope(x, y, 1, () => { R.line(-2, -3, 2, 3, .7, p.appearance.color, .8); R.line(2, -3, -2, 3, .7, p.appearance.color, .8); R.line(-3, 0, 3, 0, .7, p.appearance.color, .8); });
            }
            R.disc(0, 0, 3, p.appearance.color, .9);
        },
        portal(t, p, s) {
            let r = 60 * p.shape.radiusScale;
            R.disc(0, 0, r * .69, '#06070f', .97, r);
            R.glowAt(0, 0, r * 1.1, p.appearance.color, .2, r * 1.6);
            for (let j = 0; j < 5; j++) {
                let rr = r + j * .9;
                R.scope(0, 0, 1, () => {
                    for (let i = 0; i < 75; i++) {
                        let a = i * TAU / 75, b = (i + 1) * TAU / 75, noise = Math.sin(a * 7 + t * 2 * p.motion.rotationScale + j) * 2;
                        R.line(Math.cos(a) * (rr + noise) * .65, Math.sin(a) * (rr + noise), Math.cos(b) * (rr + noise) * .65, Math.sin(b) * (rr + noise), 1, p.appearance.color, .55);
                    }
                });
            }
            for (let i = 0; i < count(38, p); i++) {
                let u = fract(t * .2 + rand(i, s.seed)), a = rand(i + 20, s.seed) * TAU + t * .7 * p.motion.rotationScale, r2 = r * (1 - u);
                R.disc(Math.cos(a) * r2 * .65, Math.sin(a) * r2, 1.5, p.appearance.color, Math.sin(u * Math.PI) * .65);
            }
            for (let j = 0; j < 4; j++) {
                let a = fract(t * .35 + j / 4);
                R.ring(0, 0, Math.max(1, r * (1 - a)), .65, p.appearance.color, Math.sin(a * Math.PI) * .3, 1.5);
            }
        },
        teleport(t, p, s) {
            let a = s.source, b = s.target, phase = clamp((t - .4) / 1.2), arrive = smooth((t - 1.55) / .8), fade = clamp((3.5 - t) / .4);
            character(a.x, a.y + 25, .85, '#b6c5d0', 1 - phase);
            character(b.x, b.y + 25, .85, '#d5e7ef', arrive);
            for (let i = 0; i < count(36, p); i++) {
                let u = fract(rand(i, s.seed) + t * .65), left = t < 1.55, x = (left ? a.x : b.x) + (rand(i + 45, s.seed) - .5) * 31, y = (left ? a.y : b.y) + 25 - u * 81;
                R.line(x, y, x, y + 6, 1, p.appearance.color, Math.sin(u * Math.PI) * (left ? Math.sin(phase * Math.PI) : arrive * fade));
            }
            for (let q of [a, b])
                R.ring(q.x, q.y + 26, 23, 1, p.appearance.color, (q === a ? 1 - phase : arrive) * fade, .3);
            if (t > 1.15 && t < 1.7) {
                let u = (t - 1.15) / .55;
                R.beam(a.x, a.y - 13, b.x, b.y - 13, .7, p.appearance.color, Math.sin(u * Math.PI) * .5);
            }
        },
        vortex(t, p, s) {
            let radius = 78 * p.shape.radiusScale;
            for (let j = 0; j < count(5, p); j++) {
                for (let i = 0; i < 55; i++) {
                    let u = i / 55, v = (i + 1) / 55, a = j * TAU / count(5, p) + u * TAU * 1.9 + t * .85 * p.motion.rotationScale, b = j * TAU / count(5, p) + v * TAU * 1.9 + t * .85 * p.motion.rotationScale, r = radius * (1 - u), r2 = radius * (1 - v), w = 4 * (1 - u) + .4;
                    R.line(Math.cos(a) * r, Math.sin(a) * r * .55, Math.cos(b) * r2, Math.sin(b) * r2 * .55, w, p.appearance.color, .12 + .4 * u);
                }
            }
            R.glowAt(0, 0, 20, p.appearance.color, .5);
            R.disc(0, 0, 7, '#080d15', .9);
        },
        heal(t, p, s) {
            character(0, 42, 1, '#bcd3ca', .85);
            R.ring(0, 42, 32, 1, p.appearance.color, .45, .3);
            R.glowAt(0, 7, 54, p.appearance.color, .16);
            for (let i = 0; i < count(17, p); i++) {
                let a = fract(t * .3 + rand(i, s.seed)), ang = rand(i + 20, s.seed) * TAU, x = Math.cos(ang) * mix(35, 13, a), y = 43 - a * 93, f = Math.sin(a * Math.PI);
                cross(x, y, 2.2 + rand(i + 100, s.seed) * 2, p.appearance.color, f * .9);
                R.glowAt(x, y, 12, p.appearance.color, f * .15);
            }
        },
        shield(t, p, s) {
            if (!s.hideBody)
                character(0, 40, 1, '#bbcbd4', .75);
            let r = 49 * p.shape.radiusScale;
            if (!s.impactOnly) {
                R.disc(0, 7, r, p.appearance.color, .04);
                R.ring(0, 7, r, 1 * p.shape.thicknessScale, p.appearance.color, .55);
                for (let i = 1; i < 4; i++) {
                    let y = -r + i * r / 2, rr = Math.sqrt(Math.max(0, r * r - y * y));
                    R.ring(0, 7 + y, rr, .6, p.appearance.color, .15, .16);
                }
                for (let i = 0; i < 3; i++) {
                    let sx = .28 + i * .3;
                    for (let j = 0; j < 44; j++) {
                        let a = j * TAU / 44, b = (j + 1) * TAU / 44;
                        R.line(Math.cos(a) * r * sx, 7 + Math.sin(a) * r, Math.cos(b) * r * sx, 7 + Math.sin(b) * r, .6, p.appearance.color, .15);
                    }
                }
            }
            let ang = s.hitAngle ?? -.5, hx = Math.cos(ang) * r, hy = 7 + Math.sin(ang) * r, fade = clamp(1 - t / 1.7);
            R.glowAt(hx, hy, 30, p.appearance.color, fade * .8);
            for (let j = 0; j < count(3, p); j++) {
                let u = t * p.wave.speedScale - j * .12;
                if (u < 0)
                    continue;
                let span = clamp(u) * 1.9;
                R.ring(0, 7, r, 1.4 * p.shape.thicknessScale, p.appearance.color, clamp(1 - u / 1.15) * .8, 1, ang - span, ang + span, 75);
            }
            if (t < .4)
                star(hx, hy, 7, p.appearance.color, 1 - t / .4);
        },
        poison(t, p, s) {
            R.ring(0, 15, 74, .7, p.appearance.color, .2, .27);
            cloud(t, p, s.seed, p.appearance.color, true);
            for (let i = 0; i < count(13, p); i++) {
                let a = fract(t * .26 * p.motion.speedScale + rand(i, s.seed)), x = (rand(i + 70, s.seed) - .5) * 140 + p.motion.windScale * a * 17, y = 27 - a * 42 + Math.sin(a * 8 + i) * 5 * p.motion.turbulenceScale;
                R.ring(x, y, 2 + rand(i + 300, s.seed) * 3, .7, p.appearance.color, Math.sin(a * Math.PI) * .55);
            }
        },
        aura(t, p, s) {
            character(0, 40, 1, '#d3d0b9', .9);
            let r = 41 * p.shape.radiusScale;
            R.ring(0, 40, r, 1, p.appearance.color, .6, .3);
            for (let i = 0; i < count(12, p); i++) {
                let a = fract(t * .36 + rand(i, s.seed)), ang = i * TAU / count(12, p) + t * .25 * p.motion.rotationScale, x = Math.cos(ang) * r, y = 39 + Math.sin(ang) * r * .3 - a * 81;
                R.line(x, y, x, y + 12, 1, p.appearance.color, Math.sin(a * Math.PI) * .7);
            }
            for (let j = 0; j < 2; j++) {
                let y = 16 + Math.sin(t + j * Math.PI) * 18;
                R.ring(0, y, r, 1.2, p.appearance.color, .45, .3, t * .8 * p.motion.rotationScale + j * Math.PI, t * .8 * p.motion.rotationScale + j * Math.PI + Math.PI * 1.5);
            }
            R.glowAt(0, 0, 60, p.appearance.color, .12);
        },
        rain(t, p, s) {
            for (let i = 0; i < count(54, p); i++) {
                let age = fract(t * (.9 + rand(i, s.seed) * .35) * p.motion.speedScale + rand(i + 22, s.seed)), x = (rand(i + 55, s.seed) - .5) * 255 + p.motion.windScale * (age - .5) * 24, y = -88 + age * 154;
                let drift = p.motion.windScale * 3 + 2 + Math.sin(t * .8 + i * .1) * p.motion.turbulenceScale * .9;
                R.line(x - drift, y - 12, x, y, 1, p.appearance.color, .25 + rand(i + 7, s.seed) * .4);
                if (age > .9) {
                    let u = (age - .9) / .1;
                    R.ring(x, 66, 2 + u * 6, .6, p.appearance.color, (1 - u) * .45, .28);
                }
            }
        },
        snow(t, p, s) {
            for (let i = 0; i < count(32, p); i++) {
                let a = fract(t * (.065 + rand(i, s.seed) * .085) * p.motion.speedScale + rand(i + 53, s.seed)), x = (rand(i + 21, s.seed) - .5) * 240 + Math.sin(t * .7 + i) * 9 * p.motion.turbulenceScale + p.motion.windScale * a * 35, y = -86 + a * 163, r = 1 + rand(i + 91, s.seed) * 3, f = .4 + rand(i + 81, s.seed) * .6;
                if (r > 2.5) {
                    let ang = t * .2 * p.motion.rotationScale + i;
                    for (let j = 0; j < 3; j++) {
                        let an = ang + j * Math.PI / 3;
                        R.line(x - Math.cos(an) * r, y - Math.sin(an) * r, x + Math.cos(an) * r, y + Math.sin(an) * r, .7, p.appearance.color, f);
                    }
                }
                else
                    R.disc(x, y, r * .6, p.appearance.color, f);
            }
        },
        leaves(t, p, s) {
            for (let i = 0; i < count(17, p); i++) {
                let a = fract(t * .115 * p.motion.speedScale + rand(i, s.seed)), x = (rand(i + 22, s.seed) - .5) * 225 + Math.sin(t + i * 2) * 14 * p.motion.turbulenceScale + p.motion.windScale * a * 38, y = -87 + a * 164, rot = t * (.6 + rand(i + 1, s.seed)) * (i % 2 ? -1 : 1) * p.motion.rotationScale, r = 5 + rand(i + 72, s.seed) * 5, w = .25 + Math.abs(Math.cos(t + i)) * .75, col = blend(p.appearance.color, '#ae5e42', rand(i + 45, s.seed) * .65);
                const pts = [];
                for (let j = 0; j < 14; j++) {
                    let u = j * TAU / 14, px = Math.cos(u) * r, py = Math.sin(u) * r * .42 * w;
                    pts.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
                }
                R.poly(pts, col, .85);
                R.line(x - Math.cos(rot) * r, y - Math.sin(rot) * r, x + Math.cos(rot) * r, y + Math.sin(rot) * r, .7, blend(col, '#fff7c2', .4), .65);
            }
        },
        pollen(t, p, s) {
            for (let i = 0; i < count(29, p); i++) {
                let x = mod((rand(i, s.seed) - .5) * 230 + t * (p.motion.windScale * 8 + 3) + Math.sin(t * .4 + i) * 13 * p.motion.turbulenceScale + 125, 250) - 125, y = (rand(i + 25, s.seed) - .5) * 126 + Math.sin(t * .3 * p.motion.speedScale + i) * 12 * p.motion.turbulenceScale, r = 1.5 + rand(i + 98, s.seed) * 3.5, f = .35 + rand(i + 2, s.seed) * .6;
                R.glowAt(x, y, r * 3, p.appearance.color, f * .12);
                R.disc(x, y, r, p.appearance.color, f * .65);
                if (r > 3) {
                    for (let j = 0; j < 6; j++) {
                        let a = j * TAU / 6 + t * .2;
                        R.line(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8, x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2), .6, p.appearance.color, f);
                    }
                    R.disc(x - .6, y - .6, 1, C.white, .5);
                }
            }
        },
        summon(t, p, s) {
            let u = clamp((t - .2) / 2.1), fade = clamp((3.7 - t) / .5);
            for (let i = 0; i < (bodyCells.length ? count(48, p) : 0); i++) {
                let b = bodyCells[i % bodyCells.length], ang = rand(i, s.seed) * TAU, r = 65 + rand(i + 50, s.seed) * 38, startX = Math.cos(ang) * r, startY = Math.sin(ang) * r * .6, progress = smooth(clamp(u * 1.4 - rand(i + 24, s.seed) * .35)), x = mix(startX, b[0], progress), y = mix(startY, b[1] + 23, progress);
                R.shard(x, y, 2, ang * (1 - progress) + t, p.appearance.color, Math.sin(clamp(u) * Math.PI) * fade + .15 * fade);
                R.glowAt(x, y, 5, p.appearance.color, .1 * fade);
            }
            character(0, 23, 1, '#d9f1e8', smooth((u - .65) / .3) * fade);
            R.ring(0, 24, 34, 1, p.appearance.color, .55 * fade, .3);
            if (t > 2.1)
                R.ring(0, 0, 24 + (t - 2.1) * 46, 1, p.appearance.color, clamp(1 - (t - 2.1) / .7) * .7, .8);
        },
        dissolve(t, p, s) {
            R.scope(0, 40, 1, () => dissolveBody(t, p, s.seed, p.appearance.color));
            for (let i = 0; i < count(12, p); i++) {
                let a = t - .5 - rand(i, s.seed) * 1.3;
                if (a >= 0 && a < 1.2) {
                    let x = (rand(i + 88, s.seed) - .5) * 32 + (rand(i + 331, s.seed) - .5) * a * 35, y = 34 - rand(i + 77, s.seed) * 43 - a * 35;
                    R.disc(x, y, 1.2, p.appearance.color, (1 - a / 1.2) * .7);
                }
            }
        },
        absorb(t, p, s) {
            let b = s.target;
            character(b.x, b.y + 40, .9, '#bddbd1', .85);
            for (let i = 0; i < count(24, p); i++) {
                let u = clamp((t - rand(i + 8, s.seed) * .85) / 1.8), a = rand(i, s.seed) * TAU, x0 = s.source.x + Math.cos(a) * 26, y0 = s.source.y + Math.sin(a) * 37;
                let x = mix(x0, b.x, ease(u)), y = mix(y0, b.y, ease(u)) - Math.sin(u * Math.PI) * (15 + rand(i + 77, s.seed) * 44), f = u >= 1 ? 0 : 1;
                for (let j = 3; j >= 1; j--) {
                    let v = clamp(u - j * .03 * p.trail.lengthScale), xx = mix(x0, b.x, ease(v)), yy = mix(y0, b.y, ease(v)) - Math.sin(v * Math.PI) * (15 + rand(i + 77, s.seed) * 44);
                    R.disc(xx, yy, 1.6, p.appearance.color, f * .18);
                }
                R.shard(x, y, 2.5, a, p.appearance.color, f);
                R.glowAt(x, y, 8, p.appearance.color, f * .28);
                let arrival = clamp(1 - Math.abs(u - .985) * 35);
                R.glowAt(b.x, b.y, 28, p.appearance.color, arrival * .18);
            }
        },
        confetti(t, p, s) {
            const colors = [p.appearance.color, '#ffe393', '#bce4a0', '#96d8ec', '#f49d8f'];
            const pp = withPatch(p, { motion: { gravityScale: p.motion.gravityScale * .6, dragPerSec: p.motion.dragPerSec + .25 } });
            for (let i = 0; i < count(54, p); i++) {
                let ang = -Math.PI / 2 + (rand(i, s.seed) - .5) * 2.2 * p.emission.spreadScale, v = 50 + rand(i + 33, s.seed) * 112, q = particlePos(Math.cos(ang) * v, Math.sin(ang) * v, t, pp), r = (2 + rand(i + 70, s.seed) * 2) * lifeSize(p, t / 4.2), rot = rand(i + 5, s.seed) * TAU + t * (rand(i + 35, s.seed) - .5) * 9 * p.motion.rotationScale, f = clamp((4.1 - t) / .8);
                R.quad(q[0], q[1] + 32, r * (.2 + Math.abs(Math.cos(rot)) * .8), r * .55, colors[i % 5], f, 0, rot);
            }
            if (t < .4) {
                for (let i = 0; i < 8; i++) {
                    let a = i * TAU / 8;
                    star(Math.cos(a) * t * 115, 32 + Math.sin(a) * t * 90, 3, p.appearance.color, 1 - t / .4);
                }
            }
        }
    };
    function anchorPoint(binding, ctx, p, out) {
        const name = typeof binding === 'string' ? binding : binding.anchor;
        const base = name === 'position' ? ctx.position : name === 'shieldSurface' ? ctx.target : ctx[name];
        out.x = base.x;
        out.y = base.y;
        if (name === 'shieldSurface') {
            out.x -= 49 * p.shape.radiusScale;
            out.y += 7;
        }
        if (typeof binding === 'object' && binding.offset) {
            out.x += binding.offset.x;
            out.y += binding.offset.y;
        }
        return out;
    }
    function keyedSample(keys, elapsedMs) {
        if (elapsedMs <= keys[0][0])
            return keys[0][1];
        for (let i = 1; i < keys.length; i++)
            if (elapsedMs <= keys[i][0])
                return mix(keys[i - 1][1], keys[i][1], (elapsedMs - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
        return keys[keys.length - 1][1];
    }
    function sampleTrack(item, timeMs, parent) {
        const track = item.definition, p = item.parameters;
        if (!parent.layers[track.group] || timeMs < track.startMs || timeMs >= track.endMs)
            return;
        const ageMs = timeMs - track.startMs, span = track.endMs - track.startMs, u = ageMs / span;
        const ctx = item.context, source = ctx.source, targetPoint = ctx.target;
        Object.assign(ctx, parent);
        ctx.source = source;
        ctx.target = targetPoint;
        anchorPoint(track.bindings?.source || 'source', parent, p, source);
        anchorPoint(track.bindings?.target || 'target', parent, p, targetPoint);
        ctx.hideBody = track.hideBody ?? false;
        ctx.impactOnly = track.impactOnly ?? false;
        if (track.hitAngle !== undefined)
            ctx.hitAngle = track.hitAngle;
        anchorPoint(track.at, parent, p, item.position);
        item.position.x += track.offset?.x || 0;
        item.position.y += track.offset?.y || 0;
        let age = track.constantMs ?? (track.sampleKeys ? keyedSample(track.sampleKeys, ageMs) : track.sampleEndMs !== undefined ? u * track.sampleEndMs : ageMs + (track.sampleStartMs || 0));
        let opacity = track.alpha ?? 1;
        if (track.fadeInMs)
            opacity *= smooth(ageMs / track.fadeInMs);
        if (track.fadeOutMs)
            opacity *= clamp((span - ageMs) / track.fadeOutMs);
        let scale = track.scale ?? 1, rotation = 0;
        if (track.fit) {
            const dx = parent.target.x - parent.source.x, dy = parent.target.y - parent.source.y;
            scale *= Math.max(12, Math.hypot(dx, dy)) / track.fit;
            rotation = Math.atan2(dy, dx);
        }
        const oldAlpha = R.alpha;
        R.alpha *= opacity;
        try {
            R.scope(item.position.x, item.position.y, scale, () => R.rotate(rotation, () => {
                const oldContext = currentContext, oldParameters = currentParameters, oldCells = bodyCells;
                currentContext = ctx;
                currentParameters = p;
                bodyCells = ctx.subject?.cells || emptyCells;
                try {
                    if (track.kind === 'effect') {
                        const definition = definitionFor(track.effect);
                        age = age * definition.durationMs / p.lifetime.durationMs;
                        if (definition.type === 'continuous' || age < definition.durationMs)
                            EFFECT_DRAW[track.effect](age / 1000, p, ctx);
                    }
                    else if (track.kind === 'flight' || track.kind === 'sporeFlight') {
                        comet(u, p, ctx.source, ctx.target, p.appearance.color);
                        if (track.kind === 'sporeFlight') {
                            const q = pathPoint(u, ctx.source, ctx.target);
                            R.disc(q.x, q.y, 9, p.appearance.color, .75);
                            for (let i = 0; i < 8; i++) {
                                const angle = i * TAU / 8 + ageMs / 1000;
                                R.disc(q.x + Math.cos(angle) * 10, q.y + Math.sin(angle) * 10, 2.5, p.appearance.color, .7);
                            }
                        }
                    }
                    else if (track.kind === 'telegraph') {
                        R.ring(0, 0, 62 * (1 - u) + 16, 1, p.appearance.color, .65, .28);
                        R.disc(0, 0, 37, p.appearance.color, .04, 11);
                    }
                    else if (track.kind === 'shieldBreak') {
                        const t = ageMs / 1000, r = 49 * p.shape.radiusScale, fade = clamp(1 - t / 2.05);
                        R.glowAt(-r, 7, 30, p.appearance.color, clamp(1 - t / .3) * .8);
                        const amount = count(24, p);
                        for (let i = 0; i < amount; i++) {
                            const angle = i * TAU / amount, reach = r + t * (12 + rand(i, ctx.seed) * 22), x = Math.cos(angle) * reach, y = 7 + Math.sin(angle) * reach + t * t * 19, rot = angle + t * (rand(i + 70, ctx.seed) - .5) * 3;
                            R.shard(x, y, 3 + rand(i + 30, ctx.seed) * 5, rot, p.appearance.color, fade, 1.7);
                        }
                        if (t < .2)
                            R.ring(0, 7, r, 1.5, p.appearance.color, (1 - t / .2) * .6);
                    }
                }
                finally {
                    currentContext = oldContext;
                    currentParameters = oldParameters;
                    bodyCells = oldCells;
                }
            }));
        }
        finally {
            R.alpha = oldAlpha;
        }
    }
    function sample(effectId, timeMs, parameters, context) {
        const priorContext = currentContext, priorParameters = currentParameters, priorCells = bodyCells;
        currentContext = context;
        currentParameters = parameters;
        bodyCells = context.subject?.cells || emptyCells;
        try {
            if (context.effect.type === 'combo')
                for (const track of context.tracks)
                    sampleTrack(track, timeMs, context);
            else
                EFFECT_DRAW[effectId](timeMs / 1000, parameters, context);
        }
        finally {
            currentContext = priorContext;
            currentParameters = priorParameters;
            bodyCells = priorCells;
        }
    }
    return { sample };
}
const subjects = new WeakMap();
function normalizeSubject(subject) {
    if (subject == null)
        return null;
    if (!plain(subject))
        throw new TypeError('subject는 draw/cells를 가진 객체입니다.');
    if (subjects.has(subject))
        return subjects.get(subject);
    if (subject.draw !== undefined && typeof subject.draw !== 'function')
        throw new TypeError('subject.draw는 함수입니다.');
    const cells = subject.cells === undefined ? [] : cloneData(subject.cells);
    if (!Array.isArray(cells) || cells.length > 16384)
        throw new RangeError('subject.cells는 최대 16384개 좌표 배열입니다.');
    let minY = Infinity, maxY = -Infinity;
    for (const cell of cells) {
        if (!Array.isArray(cell) || cell.length !== 2)
            throw new TypeError('subject.cells의 항목은 [x,y]입니다.');
        finite(cell[0], 'cell.x');
        finite(cell[1], 'cell.y');
        minY = Math.min(minY, cell[1]);
        maxY = Math.max(maxY, cell[1]);
    }
    const bounds = subject.bounds ? { minY: finite(subject.bounds.minY, 'subject.bounds.minY'), maxY: finite(subject.bounds.maxY, 'subject.bounds.maxY') } : { minY: cells.length ? minY : 0, maxY: cells.length ? maxY : 1 };
    if (bounds.maxY <= bounds.minY)
        bounds.maxY = bounds.minY + 1;
    const result = Object.freeze({ draw: subject.draw, cells: freezeData(cells), bounds: Object.freeze(bounds) });
    subjects.set(subject, result);
    return result;
}
function points(values, name) {
    if (values == null)
        return [];
    if (!Array.isArray(values) || values.length > 512)
        throw new RangeError(`${name}은 최대 512개 좌표 배열입니다.`);
    return values.map(value => vector(value));
}
function normalizeInput(input = {}, previous = null) {
    const prior = previous || {};
    const position = vector(input.position ?? prior.position);
    const result = { data: input.data===undefined?(prior.data??normalizeFeedbackData()):normalizeFeedbackData(input.data,prior.data), position, source: vector(input.source ?? prior.source, position), target: vector(input.target ?? prior.target, position),
        hitAngle: finite(input.hitAngle ?? prior.hitAngle ?? -.55, 'hitAngle'), rotationRad: finite(input.rotationRad ?? prior.rotationRad ?? 0, 'rotationRad'),
        subject: input.subject === undefined ? (prior.subject ?? null) : normalizeSubject(input.subject),
        targets: input.targets === undefined ? (prior.targets || []) : points(input.targets, 'targets'),
        path: input.path === undefined ? (prior.path || []) : points(input.path, 'path'),
        trail: input.trail === undefined ? (prior.trail || []) : points(input.trail, 'trail'),
        weaponTrail: prior.weaponTrail || [], layers: prior.layers || [true, true, true, true],
        preview: input.preview === undefined ? (prior.preview ?? null) : input.preview };
    if (input.layers !== undefined) {
        if (!Array.isArray(input.layers) || input.layers.length !== 4 || input.layers.some(v => typeof v !== 'boolean'))
            throw new TypeError('layers는 4개의 boolean입니다.');
        result.layers = input.layers.slice();
    }
    if (input.weaponTrail !== undefined) {
        if (!Array.isArray(input.weaponTrail) || input.weaponTrail.length > 512)
            throw new TypeError('weaponTrail은 최대 512개 {inner,outer} 배열입니다.');
        result.weaponTrail = input.weaponTrail.map(item => ({ inner: vector(item.inner), outer: vector(item.outer) }));
    }
    if (result.path.length === 1)
        throw new TypeError('path는 0개 또는 2개 이상 좌표가 필요합니다.');
    if (result.preview !== null && !plain(result.preview))
        throw new TypeError('preview hook 객체가 필요합니다.');
    return result;
}
function compileTracks(config) {
    return (config.timeline?.tracks || []).map(track => {
        const base = withPatch(privateDefaults, config);
        delete base.timeline;
        base.lifetime.durationMs = track.effect ? definitionFor(track.effect).durationMs : 1000;
        let parameters = withPatch(base, track.config || {});
        for (const [path, factor] of Object.entries(track.multiply || {}))
            parameters = withPatch(parameters, patchAt(path, getPath(parameters, path) * factor));
        return { definition: track, parameters, context: { source: { x: 0, y: 0 }, target: { x: 0, y: 0 }, position: { x: 0, y: 0 } }, position: { x: 0, y: 0 } };
    });
}
function prepareRecord(record, config) {
    const previous=record.config;
    record.config = config;
    record.motionPose??={};
    if(record.definition.family==='feedback'&&config.transition){
        if(record.valueTransition){for(const k of ["durationMs","delayMs","easing"]){if(previous?.transition?.[k]!==config.transition[k])record.valueTransition[k]=config.transition[k]??"outCubic";}}
        else record.valueTransition=new NumberTransition({...record.input.data,...config.transition});
    }else record.valueTransition=null;
    record.parameters = withPatch(privateDefaults, config);
    delete record.parameters.timeline;
    record.tracks = compileTracks(config);
}
/**
 * Runtime default: game advances update(deltaMs), finite one-shots are removed automatically.
 * clock:'external': owner supplies seek(handle,ageMs), useful for editors/event journals; no auto-removal.
 * A runtime never starts RAF, never clears a framebuffer, and never disposes the caller's device.
 */
export class BloomEffects {
    constructor({ device, maxInstances = 2048, maxDensity = 64, maxBranches = 128, initialVertices = 8192, maxVertices = 262144 } = {}) {
        if (!Number.isSafeInteger(maxInstances) || maxInstances < 1)
            throw new RangeError('maxInstances는 양의 정수입니다.');
        finite(maxDensity, 'maxDensity', 1);
        if (!Number.isSafeInteger(maxBranches) || maxBranches < 1)
            throw new RangeError('maxBranches는 양의 정수입니다.');
        this.limits = Object.freeze({ maxInstances, maxDensity, maxBranches });
        this.geometry = new EffectBatch(device, { initialVertices, maxVertices });
        this.sampler = createSampler(this.geometry);
        this.records = new Map();
        this.nextId = 1;
        this.disposed = false;
        this.rendering = false;
        this.stats = { spawned: 0, stopped: 0, finished: 0, peak: 0 };
    }
    get size() { return this.records.size; }
    _ready() { if (this.disposed)
        throw new Error('이펙트 런타임이 해제되었습니다.'); }
    _record(handle) { this._ready(); const record = this.records.get(handle); if (!record)
        throw new Error('이 런타임의 활성 핸들이 아닙니다.'); return record; }
    _budget(config) {
        const check = (density, branches) => { if (density > this.limits.maxDensity)
            throw new RangeError(`emission.density가 명시적 실행 한도 ${this.limits.maxDensity}를 초과했습니다.`); if (branches > this.limits.maxBranches)
            throw new RangeError(`branch.count가 명시적 실행 한도 ${this.limits.maxBranches}를 초과했습니다.`); };
        check(config.emission?.density ?? 1, config.branch?.count ?? 0);
        for (const track of config.timeline?.tracks || [])
            check((track.config?.emission?.density ?? config.emission?.density ?? 1) * (track.multiply?.['emission.density'] ?? 1), (track.config?.branch?.count ?? config.branch?.count ?? 0) * (track.multiply?.['branch.count'] ?? 1));
    }
    spawn(effectId, options = {}) {
        this._ready();
        if (this.records.size >= this.limits.maxInstances)
            throw new RangeError('이펙트 인스턴스 한도 초과');
        const definition = definitionFor(effectId), config = resolveConfig(effectId, options.preset, options.config);
        this._budget(config);
        const input = normalizeInput(options);
        const clock = options.clock ?? 'runtime';
        if (!['runtime', 'external'].includes(clock))
            throw new TypeError('clock은 runtime 또는 external입니다.');
        const seed = options.seed ?? 2718;
        if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295)
            throw new RangeError('seed는 uint32입니다.');
        const loop = options.loop ?? definition.type === 'continuous';
        if (typeof loop !== 'boolean')
            throw new TypeError('loop는 boolean입니다.');
        const record = { definition, input, seed, loop, clock, ageMs: finite(options.ageMs ?? 0, 'ageMs', 0), status: 'playing', context: { source: { x: 0, y: 0 }, target: { x: 0, y: 0 }, position: { x: 0, y: 0 } }, localLists: { targets: [], path: [], trail: [], weaponTrail: [] } };
        prepareRecord(record, config);
        if(options.transition!=null){if(!record.valueTransition)throw new TypeError("수치 전환 없는 효과의 transition");record.valueTransition.reset(options.transition);}
        const id = this.nextId++;
        const handle = Object.freeze({ id, get state() { return record.status; }, get alive() { return record.status === 'playing'; } });
        record.handle = handle;
        this.records.set(handle, record);
        this.stats.spawned++;
        this.stats.peak = Math.max(this.stats.peak, this.size);
        return handle;
    }
    configure(handle, patch) {
        const record = this._record(handle), config = resolveConfig(record.definition.id, record.config, patch);
        this._budget(config);
        prepareRecord(record, config);
        return config;
    }
    /** Reconciliation replaces the prior payload; omitted fields go back to defaults, not stale values. */
    replace(handle, effectId, options = {}) {
        const record = this._record(handle), definition = definitionFor(effectId), config = resolveConfig(effectId, options.preset, options.config);
        this._budget(config);
        const input = normalizeInput(options), seed = options.seed ?? 2718;
        if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295)
            throw new RangeError('seed는 uint32입니다.');
        const loop = options.loop ?? definition.type === 'continuous';
        if (typeof loop !== 'boolean')
            throw new TypeError('loop는 boolean입니다.');
        record.definition = definition;
        record.input = input;
        record.valueTransition=null;
        record.seed = seed;
        record.loop = loop;
        prepareRecord(record, config);
        return handle;
    }
    setAnchors(handle, patch) { const record = this._record(handle); record.input = normalizeInput(patch, record.input); return handle; }
    /** Runtime event data is separate from style config. Does not reset age unless requested. */
    setData(handle, patch, {restart=false}={}) {
        const r=this._record(handle), data=normalizeFeedbackData(patch,r.input.data);
        r.input.data=data;
        if(restart)r.ageMs=0;
        if(r.valueTransition)r.valueTransition.reset({...data,startedAtMs:feedbackTime(r),...r.config.transition});
        return handle;
    }
    /** Retarget from the visible scalar, not the previous target. No simulation writes. */
    retarget(handle, value, options={}) {
        const r=this._record(handle);if(!r.valueTransition)throw new TypeError('이 효과에는 수치 전환이 없습니다.');
        normalizeFeedbackData({to:value},r.input.data);
        r.valueTransition.retarget(value,feedbackTime(r),options);
        r.input.data=normalizeFeedbackData({from:r.valueTransition.from,to:value},r.input.data);
        return handle;
    }
    values(handle) {return Object.freeze(feedbackValues(this._record(handle)));}
    setSeed(handle, seed) { if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295)
        throw new RangeError('seed는 uint32입니다.'); this._record(handle).seed = seed; }
    seek(handle, ageMs) { const record = this._record(handle); record.ageMs = finite(ageMs, 'ageMs', 0); return handle; }
    getConfig(handle) { return this._record(handle).config; }
    snapshot(handle) { const r = this._record(handle); return freezeData({ effect: r.definition.id, config: cloneData(r.config), data: cloneData(r.input.data), transition: r.valueTransition?.snapshot()??null, seed: r.seed, ageMs: r.ageMs, loop: r.loop, clock: r.clock, position: cloneData(r.input.position), source: cloneData(r.input.source), target: cloneData(r.input.target), hitAngle: r.input.hitAngle, rotationRad: r.input.rotationRad, layers: r.input.layers.slice() }); }
    stop(handle, reason = 'stopped') {
        this._ready();
        const record = this.records.get(handle);
        if (!record)
            return false;
        record.status = reason === 'finished' ? 'finished' : 'stopped';
        this.records.delete(handle);
        if (reason === 'finished')
            this.stats.finished++;
        else
            this.stats.stopped++;
        record.input = null;
        record.tracks = null;
        record.context = null;
        record.localLists = null;
        return true;
    }
    clear() { this._ready(); for (const handle of this.records.keys())
        this.stop(handle); }
    update(deltaMs) {
        this._ready();
        finite(deltaMs, 'deltaMs', 0);
        for (const [handle, record] of this.records) {
            if (record.clock === 'external')
                continue;
            record.ageMs += deltaMs;
            if (!record.loop && record.ageMs >= record.config.lifetime.durationMs)
                this.stop(handle, 'finished');
        }
    }
    _context(record) {
        const ctx = record.context, input = record.input, scale = record.config.appearance.scale, angle = record.input.rotationRad, ca = Math.cos(-angle), sa = Math.sin(-angle), origin = input.position;
        const local = (source, out) => { const x = (source.x - origin.x) / scale, y = (source.y - origin.y) / scale; out.x = x * ca - y * sa; out.y = x * sa + y * ca; return out; };
        local(input.source, ctx.source);
        local(input.target, ctx.target);
        ctx.position.x = ctx.position.y = 0;
        for (const key of ['targets', 'path', 'trail']) {
            const src = input[key], dst = record.localLists[key];
            while (dst.length < src.length)
                dst.push({ x: 0, y: 0 });
            dst.length = src.length;
            for (let i = 0; i < src.length; i++)
                local(src[i], dst[i]);
            ctx[key] = dst;
        }
        const weapon = record.localLists.weaponTrail;
        while (weapon.length < input.weaponTrail.length)
            weapon.push({ inner: { x: 0, y: 0 }, outer: { x: 0, y: 0 } });
        weapon.length = input.weaponTrail.length;
        for (let i = 0; i < weapon.length; i++) {
            local(input.weaponTrail[i].inner, weapon[i].inner);
            local(input.weaponTrail[i].outer, weapon[i].outer);
        }
        ctx.weaponTrail = weapon;
        ctx.subject = input.subject;
        ctx.preview = input.preview;
        ctx.seed = record.seed;
        ctx.hitAngle = input.hitAngle - angle;
        ctx.layers = input.layers;
        ctx.interacted = ctx.trail.length > 0;
        ctx.history = ctx.trail;
        ctx.actor = ctx.position;
        ctx.effect = record.definition;
        ctx.tracks = record.tracks;
        ctx.hideBody = false;
        ctx.impactOnly = false;
        return ctx;
    }
    /** Append to the current EffectBatch. Useful for callers composing ordered custom passes. */
    draw(handle) {
        const record = this._record(handle), duration = record.config.lifetime.durationMs;
        if (record.config.appearance.opacity === 0 || (!record.loop && record.ageMs >= duration))
            return false;
        let timeMs = record.ageMs;
        if (record.loop && record.definition.type !== 'continuous')
            timeMs = mod(timeMs, duration);
        // One explicit ms→authored-seconds conversion; sampler speed follows selected duration.
        const sampleMs = timeMs * record.definition.durationMs / duration;
        const R = this.geometry, ctx = this._context(record), savedAlpha = R.alpha, savedGlow = R.glow;
        R.alpha *= record.config.appearance.opacity;
        R.glow = record.config.appearance.glow ?? false;
        try {
            R.scope(record.input.position.x, record.input.position.y, record.config.appearance.scale, () => R.rotate(record.input.rotationRad, () => record.definition.family==='feedback' ? paintFeedback(R,record) : this.sampler.sample(record.definition.id, sampleMs, record.parameters, ctx)));
        }
        finally {
            R.alpha = savedAlpha;
            R.glow = savedGlow;
        }
        return true;
    }
    /** Submit VFX into the caller's already active GameKit frame. No framebuffer clear. */
    render({ width, height, clip, transform, project, handles, before, after } = {}) {
        this._ready();
        if (this.rendering)
            throw new Error('이펙트 render는 중첩할 수 없습니다.');
        this.rendering = true;
        try {
            this.geometry.begin({ width, height, clip, transform, project });
            before?.(this.geometry);
            for (const handle of handles ?? this.records.keys())
                this.draw(handle);
            after?.(this.geometry);
            this.geometry.end();
        }
        finally {
            this.rendering = false;
        }
    }
    dispose() { if (this.disposed)
        return; this.clear(); this.geometry.dispose(); this.disposed = true; }
}
/** Direct adapter for GameKit PresentationEventQueue. The journal owns dedup/rollback/expiry. */
export function createPresentationAdapter(effects, { resolvePayload = payload => payload } = {}) {
    if (!(effects instanceof BloomEffects) || typeof resolvePayload !== 'function')
        throw new TypeError('BloomEffects와 payload resolver가 필요합니다.');
    function payload(event) { const value = resolvePayload(event.payload, event); if (!plain(value) || typeof value.effect !== 'string')
        throw new TypeError('VFX payload.effect가 필요합니다.'); return value; }
    return {
        reversible: true,
        start(event) { const value = payload(event); return effects.spawn(value.effect, { ...value, clock: 'external', ageMs: 0 }); },
        update(handle, ageMs) { if (handle.alive)
            effects.seek(handle, ageMs); },
        stop(handle, reason) { if (handle?.alive)
            effects.stop(handle, reason === 'expired' ? 'finished' : reason); },
        reconcile(handle, event) { const value = payload(event); effects.replace(handle, value.effect, { ...value, clock: 'external' }); }
    };
}

/**
 * Bounded O(1) keyed label aggregation. The game supplies a stable key (entity/resource).
 * The channel only changes visual labels: dropped/merged labels NEVER change the wallet.
 * Call channel.update(deltaMs) once with effects.update(deltaMs). Journal handles event dedup.
 */
export class NumberLabelChannel {
    constructor(effects,{effect='resource_number',mergeGapMs=250,maxSpanMs=480,maxVisible=10,config={}}={}) {
        if(!(effects instanceof BloomEffects))throw new TypeError('BloomEffects가 필요합니다.');
        const definition=definitionFor(effect);
        if(!['resource_number','damage_number','healing_number'].includes(definition.id))throw new TypeError('합산 숫자 효과만 지원합니다.');
        finite(mergeGapMs,'mergeGapMs',0);finite(maxSpanMs,'maxSpanMs',0);
        if(!Number.isSafeInteger(maxVisible)||maxVisible<1||maxVisible>512)throw new RangeError('maxVisible은 1..512입니다.');
        this.disposed=false;this.effects=effects;this.effect=effect;this.mergeGapMs=mergeGapMs;this.maxSpanMs=maxSpanMs;this.maxVisible=maxVisible;
        this.config=resolveConfig(effect,config);this.timeMs=0;this.entries=new Map();this.stats={created:0,merged:0,evicted:0};
    }
    _ready(){if(this.disposed)throw new Error('수치 채널이 해제되었습니다.');}
    update(deltaMs){this._ready();finite(deltaMs,'deltaMs',0);this.timeMs+=deltaMs;for(const [key,r]of this.entries)if(!r.handle.alive)this.entries.delete(key);}
    emit({key,value,position,seed=2718}){this._ready();
        if(typeof key!=='string'||!key||key.length>256)throw new TypeError('합산 key가 필요합니다.');finite(value,'value');vector(position);
        const old=this.entries.get(key),now=this.timeMs;
        if(old?.handle.alive&&now-old.last<=this.mergeGapMs&&now-old.first<=this.maxSpanMs){
            const amount=old.amount+value;finite(amount,'합산 value');old.amount=amount;old.last=now;
            this.effects.setData(old.handle,{to:amount});this.effects.setAnchors(old.handle,{position});this.stats.merged++;return old.handle;
        }
        if(old?.handle.alive){this.effects.stop(old.handle);this.entries.delete(key);}
        while(this.entries.size>=this.maxVisible){const oldest=this.entries.keys().next().value;this.effects.stop(this.entries.get(oldest).handle);this.entries.delete(oldest);this.stats.evicted++;}
        const handle=this.effects.spawn(this.effect,{position,seed,config:this.config,data:{to:value}});
        this.entries.set(key,{handle,amount:value,first:now,last:now});this.stats.created++;return handle;
    }
    clear(){this._ready();for(const r of this.entries.values())if(r.handle.alive)this.effects.stop(r.handle);this.entries.clear();}
    dispose(){if(this.disposed)return;this.clear();this.disposed=true;}
}
