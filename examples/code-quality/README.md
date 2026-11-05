# BLOOM 코드 포맷팅·정적 검사 템플릿

규칙 원본: [DEV-028~031](../../rules/development.md#code-formatting). 이 폴더는 각 게임 저장소에 **복사해서 적용할 예제**다. 이 레퍼런스 저장소 자체의 포맷 검사 설정은 아니다.

## 적용

1. `.prettierrc.json`, `.prettierignore`, `eslint.config.mjs`를 게임 저장소 루트에 복사한다. `.vscode/`, `.github/workflows/`, `tools/`도 동일한 상대 경로로 복사한다.
2. `package.json`이 없다면 `npm init -y`로 만든다. `npm install --save-dev prettier eslint @eslint/js globals eslint-plugin-html`을 실행하고 `package-lock.json`을 함께 커밋한다.
3. `npm exec -- prettier --check .`, `npm exec -- eslint .`로 전체 검사할 수 있지만, PR CI는 변경 파일만 검사한다.
4. 폴더/파일 제외 경로는 예시다. 각 게임의 자동 생성 코드·외부 벤더 코드·셰이더 경로에 맞춰 두 ignore 설정을 수정한다.
5. HTML의 `<script>`, `<script type="module">`, 비-JavaScript 셰이더 script를 실제 게임 샘플에서 검사한다. 인라인 JS가 ESLint와 저장 시 fix 모두 적용되는지 별도 확인한다.

## 정책

- Prettier: printWidth=100, spaces=4, semi=true, singleQuote=true, trailingComma=all, bracketSpacing=true, arrowParens=always, endOfLine=lf.
- HTML의 인라인 JS와 CSS는 Prettier 적용 대상이며, HTML 내부의 일반 JS도 ESLint 검사한다.
- GLSL·WGSL·minified·자동 생성 소스는 제외하고, HTML/JS 내 셰이더는 가능한 좁은 구문에 `prettier-ignore`를 적용한다.
- ESLint recommended의 error와 Prettier 불일치는 CI 실패, warning은 보고만 한다. CI는 포맷이나 코드를 자동 수정하지 않는다.
- 기존 레거시는 수정한 **파일 전체**부터 점진 적용한다. 일괄 포맷은 별도 작업이다.
- ESLint/Prettier는 devDependencies로 고정하고 게임의 HTML 원본 배포에는 빌드 단계를 추가하지 않는다.

## CI 검증 사례

- 수정한 JS의 미정의 식별자와 형식 위반 → 실패
- 수정한 HTML 내 JS의 미정의 식별자 → 실패
- 수정하지 않은 레거시 파일 → 검사 대상 제외
- GLSL/자동 생성물 → 제외
- warning만 있는 파일 → 통과
- 설정/의존성 업그레이드 → 전역 영향이 있으므로 별도 전체 검사 시행

**주의:** 템플릿은 각 소비 게임의 엔트리·Node 도구·HTML 구조와 의존성 버전에 맞춰 실행 검증한 뒤 적용한다. CI의 `BASE_SHA`는 GitHub Actions PR 이벤트에서 전달된다.
