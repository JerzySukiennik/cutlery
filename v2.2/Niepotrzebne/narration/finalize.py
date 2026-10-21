import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(ROOT, 'assets', 'voice')
RAW = os.environ.get('RAW') or os.path.join(HERE, 'out-lines')
MODEL = os.path.expanduser('~/Library/Application Support/PushToType/Models/ggml-base.en.bin')
TMP = os.path.join(HERE, '_w.wav')
sys.path.insert(0, HERE)
from lower import lower

def words(s): return re.sub(r"[^a-z0-9' ]+", ' ', s.lower().replace('-', ' ')).split()
def wer(ref, hyp):
    r, h = words(ref), words(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))

def transcribe(fn):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', fn, '-ar', '16000', '-ac', '1', TMP], check=True)
    r = subprocess.run(['nice', '-n', '10', 'whisper-cli', '-m', MODEL, '-f', TMP, '-nt', '-np', '-t', '4'], capture_output=True, text=True)
    return ' '.join(r.stdout.split())

def render(src, dst):
    af = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,afade=t=in:d=0.02,areverse,afade=t=in:d=0.005,loudnorm=I=-16:TP=-1.5'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-af', af, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', dst], check=True)

if __name__ == '__main__':
    st, formant = float(sys.argv[1]), float(sys.argv[2])
    os.makedirs(OUT, exist_ok=True)
    lines = json.load(open(os.path.join(HERE, 'lines.json')))
    mapping, report, bad = {}, [], []
    for l in lines:
        base = l['file'].replace('.mp3', '')
        takes = [os.path.join(RAW, f'{base}_{t}.wav') for t in (0, 1)]
        takes = [t for t in takes if os.path.exists(t)]
        if not takes: bad.append(l['text']); continue
        scored = sorted(((wer(l['text'], transcribe(t)), i, t) for i, t in enumerate(takes)))
        w, _, best = scored[0]
        report.append({'file': l['file'], 'wer': round(w, 3), 'take': os.path.basename(best)})
        if w > 0.2: bad.append(l['text'])
        src = best
        if st:
            src = os.path.join(HERE, '_low.wav')
            lower(best, src, st, formant)
        af = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,afade=t=in:d=0.02,areverse,afade=t=in:d=0.005,loudnorm=I=-16:TP=-1.5'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-af', af, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', os.path.join(OUT, l['file'])], check=True)
        mapping[l['text']] = l['file']
        print(f"{w:.2f} {l['file']} {l['text'][:60]}", flush=True)
    json.dump(mapping, open(os.path.join(OUT, 'lines.json'), 'w'), indent=0, ensure_ascii=False)
    json.dump({'report': report, 'bad': bad}, open(os.path.join(HERE, 'report.json'), 'w'), indent=1, ensure_ascii=False)
    print(len(mapping), 'lines,', len(bad), 'flagged')
