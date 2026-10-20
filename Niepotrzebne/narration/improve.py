import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from finalize import transcribe, wer, render
VOICE = os.path.join(HERE, '..', '..', 'assets', 'voice')
lines = json.load(open(os.path.join(HERE, 'lines.json')))
takes = json.load(open(os.path.join(HERE, 'takes.json')))
rows = []
for l in lines:
    base, cur = l['file'][:-4], takes.get(l['file'], 0)
    h = [None, None]
    h[cur] = transcribe(os.path.join(HERE, 'out-lines', f'{base}_{cur}.wav'))
    w = [None, None]
    w[cur] = wer(l['text'], h[cur])
    if w[cur] > 0.05:
        o = 1 - cur
        h[o] = transcribe(os.path.join(HERE, 'out-lines', f'{base}_{o}.wav'))
        w[o] = wer(l['text'], h[o])
        if w[o] + 0.02 < w[cur]:
            render(os.path.join(HERE, 'out-lines', f'{base}_{o}.wav'), os.path.join(VOICE, l['file']))
            takes[l['file']] = cur = o
            json.dump(takes, open(os.path.join(HERE, 'takes.json'), 'w'))
        rows.append({'file': l['file'], 'text': l['text'], 'take': cur, 'heard': [x or '' for x in h], 'wer': [round(x, 2) if x is not None else None for x in w]})
    print(f"{min(x for x in w if x is not None):.2f} take{cur} {l['text'][:60]}", flush=True)
rows.sort(key=lambda r: -min(x for x in r['wer'] if x is not None))
html = open(os.path.join(HERE, 'check_template.html')).read().replace('__DATA__', json.dumps(rows, ensure_ascii=False))
open(os.path.join(HERE, 'check.html'), 'w').write(html)
print('done', len(rows), 'to review')
