#!/usr/bin/env python3
"""규칙 Markdown → 위키 HTML 변환기.

원본은 Markdown이고 HTML은 생성물이다. 생성된 HTML은 직접 고치지 않는다.

사용법:
    python3 tools/build-rules.py            # PAGES 중 존재하는 원본을 모두 변환
    python3 tools/build-rules.py --check    # 변환 결과가 커밋된 HTML과 같은지만 확인 (쓰지 않음)

Markdown 표기 규약 (이 4개만 특별 처리, 나머지는 일반 Markdown):
    ## 제목 {#anchor}                      절 앵커. h2는 "N.", h3는 "N.M." 번호가 자동으로 붙는다.
    - [DEV-001][P0] 문장                   규칙 줄. 끝에 (needs-criteria) 표시 가능. 우선순위 없으면 [-].
    > [!NOTE] **제목**  / [!IMPORTANT] / [!TIP]   공지 / 핵심 규칙 카드 / 일반 규칙 카드
    ```flow                                A → B → C 흐름 띠
    **나쁜 예** 또는 **좋은 예** 문단 + 바로 다음 코드 블록 → 빨강/초록 예시 카드

검사(하나라도 실패하면 종료 코드 1, 생성물을 쓰지 않음):
    규칙 ID 중복, 앵커 id 중복, 문서 내 #링크 대상 존재, 문서 간 .md#링크 대상 존재,
    진입 문서(AGENTS.md)와 상세 문서의 같은 ID 규칙 줄 문장 일치
"""
from __future__ import annotations

import html
import os
import re
import sys
from pathlib import Path

try:
    import markdown
    from markdown.extensions.toc import slugify_unicode
except ImportError:  # pragma: no cover
    sys.stderr.write("python-markdown이 필요합니다: pip install -r tools/requirements.txt\n")
    sys.exit(2)

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "wiki-template.html"
REPO_BLOB = "https://github.com/byh-playground/bloom-reference/blob/main/"

# (원본 Markdown, 생성 HTML) — 원본이 없는 항목은 건너뛴다.
PAGES = [
    ("AGENTS.md", "rules/index.html"),
    ("rules/ai-development.md", "rules/ai-development.html"),
    ("rules/development.md", "rules/development.html"),
    ("rules/project-management.md", "rules/project-management.html"),
]

RULE_LINE_RE = re.compile(r"^- \[([A-Z]{2,3}-\d{3})\]\[(P\d|-)\] (.+)$", re.M)
ALERT_KIND = {"NOTE": "notice", "IMPORTANT": "rule core", "TIP": "rule"}


class BuildError(Exception):
    pass


# ---------------------------------------------------------------- 전처리 (Markdown 문자열 단계)

def preprocess(md_text: str) -> str:
    """```flow 블록을 raw HTML 흐름 띠로 바꾼다."""

    def flow(m: re.Match) -> str:
        line = m.group(1).strip()
        parts = re.split(r"\s(→|≠|=)\s", line)
        out = []
        for p in parts:
            if p in ("→", "≠", "="):
                out.append(f"<b>{p}</b>")
            else:
                out.append(f"<span>{html.escape(p)}</span>")
        return '\n<div class="flow">' + "".join(out) + "</div>\n"

    return re.sub(r"```flow\n(.*?)\n```", flow, md_text, flags=re.S)


# ---------------------------------------------------------------- 후처리 (HTML 문자열 단계)

def wrap_tables(body: str) -> str:
    return body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")


def convert_alerts(body: str) -> str:
    pat = re.compile(r"<blockquote>\s*<p>\[!(NOTE|IMPORTANT|TIP)\]\s*(?:<strong>(.*?)</strong>)?\s*(.*?)</p>(.*?)</blockquote>", re.S)

    def repl(m: re.Match) -> str:
        kind, title, first, rest = m.group(1), m.group(2), m.group(3), m.group(4)
        cls = ALERT_KIND[kind]
        inner = (first or "").strip()
        rest = rest.strip()
        if rest:
            inner = (inner + "\n" + rest) if inner else rest
        if cls == "notice":
            head = f"<strong>{title}</strong><br>" if title else ""
            return f'<div class="notice">{head}{inner}</div>'
        head = f'<div class="rule-title">{title}</div>' if title else ""
        return f'<div class="{cls}">{head}{inner}</div>'

    return pat.sub(repl, body)


def convert_examples(body: str) -> str:
    pat = re.compile(r"<p><strong>(나쁜 예|좋은 예)([^<]*)</strong></p>\s*(<pre>.*?</pre>)", re.S)

    def repl(m: re.Match) -> str:
        kind = "bad" if m.group(1) == "나쁜 예" else "good"
        title = m.group(1) + m.group(2)
        return f'<div class="example {kind}"><div class="example-title">{title}</div>{m.group(3)}</div>'

    return pat.sub(repl, body)


def convert_meta_lines(body: str) -> str:
    return re.sub(r"<p>(빈도: [^<]*?나중 수정비용: [^<]*?)</p>", r'<p class="meta-line">\1</p>', body)


def convert_rule_lines(body: str, page_rules: dict[str, str]) -> str:
    # 느슨한 목록(<li><p>…</p></li>)으로 렌더된 경우도 같은 규칙 줄로 취급한다.
    pat = re.compile(r"<li>\s*(?:<p>)?\[([A-Z]{2,3}-\d{3})\]\[(P\d|-)\] (.*?)(?:</p>)?\s*</li>", re.S)

    def repl(m: re.Match) -> str:
        rid, pri, text = m.group(1), m.group(2), m.group(3).strip()
        plain = re.sub(r"<[^>]+>", "", text).strip()
        if rid in page_rules:
            raise BuildError(f"규칙 ID 중복: {rid}")
        page_rules[rid] = plain
        needs = ""
        if "(needs-criteria)" in text:
            text = text.replace("(needs-criteria)", "").rstrip()
            needs = '<span class="needs-criteria">판별 기준 필요</span>'
        pri_html = f'<span class="rule-priority">{pri}</span>' if pri != "-" else ""
        return (f'<li class="rule-line" id="{rid}" data-priority="{pri}">'
                f'<span class="rule-id">{rid}</span>{pri_html}{text}{needs}</li>')

    return pat.sub(repl, body)


def sectionize(body: str) -> tuple[str, list[tuple[int, str, str]]]:
    """h2마다 <section>으로 감싸고 h2/h3에 번호를 붙인다. 목차용 (level, id, text) 목록을 돌려준다."""
    head_re = re.compile(r'<h([234])(?: id="([^"]*)")?>(.*?)</h\1>', re.S)
    out: list[str] = []
    toc: list[tuple[int, str, str]] = []
    pos = 0
    n2 = n3 = 0
    open_section = False
    for m in head_re.finditer(body):
        out.append(body[pos:m.start()])
        pos = m.end()
        level, hid, text = int(m.group(1)), m.group(2) or "", m.group(3)
        plain = re.sub(r"<[^>]+>", "", text).strip()
        if level == 2:
            n2 += 1
            n3 = 0
            if open_section:
                out.append("</section>\n")
            sec_id = hid or f"section-{n2}"
            out.append(f'<section class="section" id="{sec_id}" data-search>\n')
            out.append(f'<h2><span class="anchor-no">{n2}.</span>{text}</h2>')
            toc.append((2, sec_id, f"{n2}. {plain}"))
            open_section = True
        elif level == 3:
            n3 += 1
            hid = hid or f"section-{n2}-{n3}"
            out.append(f'<h3 id="{hid}"><span class="anchor-no">{n2}.{n3}.</span>{text}</h3>')
            toc.append((3, hid, f"{n2}.{n3} {plain}"))
        else:
            attr = f' id="{hid}"' if hid else ""
            out.append(f"<h4{attr}>{text}</h4>")
    out.append(body[pos:])
    if open_section:
        out.append("</section>\n")
    return "".join(out), toc


def collect_ids(body: str) -> list[str]:
    return re.findall(r'\sid="([^"]+)"', body)


def rewrite_links(body: str, out_dir: Path, page_map: dict[str, str]) -> tuple[str, list[tuple[str, str]]]:
    """href가 알려진 .md 원본을 가리키면 생성 HTML 경로로 바꾼다. 문서 간 링크 (대상 md, 앵커) 목록도 돌려준다."""
    cross: list[tuple[str, str]] = []

    def repl(m: re.Match) -> str:
        href = m.group(1)
        target, _, frag = href.partition("#")
        if not target.endswith(".md"):
            return m.group(0)
        # 현재 원본 위치 기준 상대 경로 → 레포 기준 경로
        rel = os.path.normpath(os.path.join(rewrite_links.src_dir, target)).replace(os.sep, "/")
        if rel not in page_map:
            return m.group(0)
        cross.append((rel, frag))
        new = os.path.relpath(ROOT / page_map[rel], out_dir).replace(os.sep, "/")
        return f'href="{new}' + (f"#{frag}" if frag else "") + '"'

    return re.sub(r'href="([^"]+)"', repl, body), cross


rewrite_links.src_dir = "."  # type: ignore[attr-defined]


# ---------------------------------------------------------------- 페이지 빌드

def build_page(src: str, out: str, page_map: dict[str, str]) -> dict:
    md_text = (ROOT / src).read_text(encoding="utf-8")
    md = markdown.Markdown(
        extensions=["meta", "tables", "fenced_code", "attr_list", "toc", "md_in_html"],
        extension_configs={"toc": {"slugify": slugify_unicode, "toc_depth": "2-3"}},
    )
    body = md.convert(preprocess(md_text))
    meta = {k: " ".join(v) for k, v in md.Meta.items()}

    page_rules: dict[str, str] = {}
    body = convert_rule_lines(body, page_rules)
    body = convert_alerts(body)
    body = convert_examples(body)
    body = convert_meta_lines(body)
    body = wrap_tables(body)
    body, toc = sectionize(body)

    out_dir = (ROOT / out).parent
    rewrite_links.src_dir = str(Path(src).parent)  # type: ignore[attr-defined]
    body, cross = rewrite_links(body, out_dir, page_map)

    ids = collect_ids(body)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        raise BuildError(f"{src}: 앵커 id 중복 {dup}")
    local_links = re.findall(r'href="#([^"]+)"', body)
    missing = sorted({l for l in local_links if l not in ids})
    if missing:
        raise BuildError(f"{src}: 문서 내 링크 대상 없음 {missing}")

    return {
        "src": src, "out": out, "meta": meta, "body": body, "toc": toc,
        "ids": set(ids), "rules": page_rules, "cross": cross,
        "title": meta.get("title", Path(src).stem),
    }


def render(page: dict, pages: list[dict], template: str) -> str:
    meta = page["meta"]
    out_dir = (ROOT / page["out"]).parent
    nav = []
    for p in pages:
        href = os.path.relpath(ROOT / p["out"], out_dir).replace(os.sep, "/")
        cur = ' class="current"' if p is page else ""
        nav.append(f'      <li><a{cur} href="{href}">{html.escape(p["title"])}</a></li>')
    toc = []
    for level, hid, text in page["toc"]:
        cls = ' class="sub"' if level == 3 else ""
        toc.append(f'      <li{cls}><a href="#{hid}">{html.escape(text)}</a></li>')
    badges = []
    for b in [x.strip() for x in meta.get("badges", "").split(",") if x.strip()]:
        core = b.endswith("*")
        badges.append(f'<span class="badge{" core" if core else ""}">{html.escape(b.rstrip("*"))}</span>')
    body = page["body"]  # <pre> 안 공백이 바뀌므로 줄 들여쓰기를 추가하지 않는다
    return (template
            .replace("{{SOURCE}}", page["src"])
            .replace("{{SOURCE_URL}}", REPO_BLOB + page["src"])
            .replace("{{TITLE}}", html.escape(page["title"]))
            .replace("{{BRAND_SMALL}}", html.escape(meta.get("brand_small", "")))
            .replace("{{SEARCH_PLACEHOLDER}}", html.escape(meta.get("search_placeholder", "검색")))
            .replace("{{KICKER}}", html.escape(meta.get("kicker", "")))
            .replace("{{SUBTITLE}}", html.escape(meta.get("subtitle", "")))
            .replace("{{BADGES}}", "".join(badges))
            .replace("{{FOOTER}}", html.escape(meta.get("footer", "BLOOM Reference")))
            .replace("{{PAGES}}", "\n".join(nav))
            .replace("{{TOC}}", "\n".join(toc))
            .replace("{{BODY}}", body))


def cross_checks(pages: list[dict]) -> None:
    by_src = {p["src"]: p for p in pages}
    seen: dict[str, str] = {}
    for p in pages:
        if p["src"] == "AGENTS.md":
            continue
        for rid in p["rules"]:
            if rid in seen:
                raise BuildError(f"규칙 ID 중복: {rid} ({seen[rid]}, {p['src']})")
            seen[rid] = p["src"]
    entry = by_src.get("AGENTS.md")
    if entry:
        detail = {rid: (p["src"], text) for p in pages if p is not entry for rid, text in p["rules"].items()}
        for rid, text in entry["rules"].items():
            if rid in detail and detail[rid][1] != text:
                raise BuildError(f"규칙 줄 불일치 {rid}: AGENTS.md와 {detail[rid][0]}의 문장이 다름")
    for p in pages:
        for target, frag in p["cross"]:
            if frag and target in by_src and frag not in by_src[target]["ids"]:
                raise BuildError(f"{p['src']}: {target}#{frag} 앵커 없음")


def main(argv: list[str]) -> int:
    check_only = "--check" in argv
    template = TEMPLATE.read_text(encoding="utf-8")
    page_map = {src: out for src, out in PAGES if (ROOT / src).exists()}
    if not page_map:
        print("변환할 원본이 없습니다.")
        return 0
    try:
        pages = [build_page(src, out, page_map) for src, out in page_map.items()]
        cross_checks(pages)
        results = [(p, render(p, pages, template)) for p in pages]
    except BuildError as e:
        print(f"실패: {e}", file=sys.stderr)
        return 1
    changed = 0
    for p, html_text in results:
        dest = ROOT / p["out"]
        old = dest.read_text(encoding="utf-8") if dest.exists() else None
        if old == html_text:
            print(f"동일  {p['out']}")
            continue
        changed += 1
        if check_only:
            print(f"차이  {p['out']}")
        else:
            dest.write_text(html_text, encoding="utf-8")
            print(f"생성  {p['out']}  ({len(p['rules'])} 규칙 줄, {len(p['toc'])} 절)")
    if check_only and changed:
        print(f"생성물이 원본과 다릅니다({changed}개). python3 tools/build-rules.py 를 실행해 갱신하세요.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
