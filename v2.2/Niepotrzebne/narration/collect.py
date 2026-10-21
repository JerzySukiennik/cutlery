import hashlib, json, os, re, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
def js_strings(src):
    return [m.group(1).replace("\\'", "'") for m in re.finditer(r"'((?:[^'\\]|\\.)*)'", src)]
texts = []
data = subprocess.run(['node', '--input-type=module', '-e', f"import * as N from '{os.path.abspath(os.path.join(ROOT, 'src/narration.js'))}'; console.log(JSON.stringify(N))"], capture_output=True, text=True, check=True).stdout
def walk(v):
    if isinstance(v, str): texts.append(v)
    elif isinstance(v, list): [walk(x) for x in v]
    elif isinstance(v, dict): [walk(x) for x in v.values()]
walk(json.loads(data))
ui = open(os.path.join(ROOT, 'src/ui.js')).read()
texts += [m.group(1).replace("\\'", "'") for m in re.finditer(r"end: '((?:[^'\\]|\\.)*)'", ui)]
pat = [r"text: '((?:[^'\\]|\\.)*)'", r"holdHint: '((?:[^'\\]|\\.)*)'", r"\bhint: '((?:[^'\\]|\\.)*)'", r"\.hint\([^,]+, '[^']+', '((?:[^'\\]|\\.)*)'", r"\.hint\([^,]+, '[^']+', [^?]+\? '((?:[^'\\]|\\.)*)' : '((?:[^'\\]|\\.)*)'"]
for dirpath, _, files in os.walk(os.path.join(ROOT, 'src')):
    for fn in files:
        if not fn.endswith('.js') or fn in ('narration.js', 'props.js', 'textures.js', 'render.js', 'detail.js'): continue
        s = open(os.path.join(dirpath, fn)).read()
        for p in pat:
            for m in re.finditer(p, s):
                for g in m.groups():
                    if g: texts.append(g.replace("\\'", "'"))
out, seen = [], set()
for t in texts:
    t = t.split('|')[0].strip()
    if not t or t in seen or len(t) < 8: continue
    seen.add(t)
    out.append({'text': t, 'file': hashlib.sha1(t.encode()).hexdigest()[:12] + '.mp3'})
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lines.json'), 'w'), indent=1, ensure_ascii=False)
print(len(out), 'lines', sum(len(x['text']) for x in out), 'chars')
