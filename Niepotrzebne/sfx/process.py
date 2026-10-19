import json, os, re, subprocess, sys, html, time, wave
import numpy as np
from fetch import get
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', '..', 'assets', 'audio')
os.makedirs(RAW, exist_ok=True)

def info(sid):
    cache = os.path.join(RAW, f'{sid}.json')
    if os.path.exists(cache): return json.load(open(cache))
    s = get(f'https://freesound.org/s/{sid}/').decode('utf8', 'replace')
    meta = lambda p: html.unescape((re.search(p, s) or [None, ''])[1])
    mp3 = meta(r'<meta property="og:audio" content="([^"]+)"')
    lic = 'CC0' if 'publicdomain/zero' in s else ('CC-BY' if 'licenses/by/' in s else ('CC-BY-NC' if 'licenses/by-nc' in s else 'other'))
    mp3 = (re.search(r'(https://cdn\.freesound\.org/previews/\S+?\.mp3)', mp3) or [None, mp3])[1]
    d = {'id': sid, 'title': meta(r'<meta property="og:title" content="([^"]+)"'), 'user': meta(r'freesound.org/people/([^/]+)/sounds'), 'license': lic, 'ogg': re.sub(r'-(lq|hq)\.mp3$', '-hq.ogg', mp3)}
    json.dump(d, open(cache, 'w'))
    time.sleep(2)
    return d

def raw(sid):
    d = info(sid)
    fn = os.path.join(RAW, f'{sid}.ogg')
    if not os.path.exists(fn):
        open(fn, 'wb').write(get(d['ogg']))
        time.sleep(2)
    return fn, d

def segments(fn, noise=-38, gap=0.06):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', fn, '-af', f'silencedetect=noise={noise}dB:d={gap}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', r).groups()[2]) + 60 * float(re.search(r'Duration: (\d+):(\d+)', r).groups()[1])
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    segs, t = [], 0.0
    if starts and starts[0] < 0.02 and ends: t = ends.pop(0); starts.pop(0)
    for s0 in starts:
        if s0 - t > 0.03: segs.append((t, s0))
        t = ends.pop(0) if ends else dur
    if dur - t > 0.03: segs.append((t, dur))
    return segs, dur

def level(fn, peak, loop, target=-15.0, cap=-1.0, win=0.05):
    with wave.open(fn) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    pk = 20 * np.log10(max(1e-9, np.abs(x).max()))
    if loop: return peak - pk
    n = max(1, int(sr * win))
    rms = np.sqrt(np.convolve(x * x, np.ones(n) / n, mode='valid').max())
    return min(target - 20 * np.log10(max(1e-9, rms)), cap - pk)

def render(fn, out, start=None, end=None, maxlen=None, gain_db=0, peak=-3.0, fade_out=0.03, rate=None, loop=None):
    if start is not None: start = max(0, start - 0.008)
    args = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error']
    if start is not None: args += ['-ss', f'{start:.3f}']
    if end is not None: args += ['-to', f'{end + 0.03:.3f}']
    args += ['-i', fn]
    length = None if end is None else (end + 0.03 - (start or 0))
    if maxlen: length = min(length or maxlen, maxlen)
    tmp = out + '.tmp.wav'
    af = ['highpass=f=40', 'aformat=channel_layouts=mono']
    if length: af.append(f'atrim=0:{length:.3f}')
    af.append('afade=t=in:d=0.004')
    if length: af.append(f'afade=t=out:st={max(0, length - fade_out):.3f}:d={fade_out}')
    subprocess.run(args + ['-af', ','.join(af), '-ar', '44100', tmp], check=True)
    g = level(tmp, peak, loop) + gain_db
    if loop:
        d = loop
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', tmp, '-filter_complex',
            f'[0]asplit[a][b];[a]atrim=0:{d},asetpts=PTS-STARTPTS[head];[b]atrim={d},asetpts=PTS-STARTPTS[body];[body][head]acrossfade=d={d}:c1=tri:c2=tri,volume={g}dB',
            '-ac', '1', '-b:a', '80k', out], check=True)
    else:
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', tmp, '-af', f'volume={g}dB', '-ac', '1', '-b:a', '96k', out], check=True)
    os.remove(tmp)

if __name__ == '__main__':
    plan = json.load(open(os.path.join(HERE, 'plan.json')))
    credits = {}
    for stem, p in plan.items():
        fn, d = raw(p['src'])
        if d['license'] != 'CC0': print('LICENSE', stem, d); continue
        credits[p['src']] = d
        out = os.path.join(OUT, stem + '.mp3')
        if 'seg' in p:
            segs, dur = segments(fn, p.get('noise', -38), p.get('gap', 0.06))
            if p['seg'] >= len(segs): print('NOSEG', stem, p['src'], len(segs)); continue
            a, b = segs[p['seg']]
            nxt = segs[p['seg'] + 1][0] - 0.01 if p['seg'] + 1 < len(segs) else dur
            b = min(nxt, b + p.get('tail', 0.15))
            render(fn, out, a, b, p.get('max'), p.get('gain', 0), p.get('peak', -3), p.get('fade', 0.03))
        else:
            render(fn, out, p.get('start'), p.get('end'), p.get('max'), p.get('gain', 0), p.get('peak', -3), p.get('fade', 0.03), loop=p.get('loop'))
        print('ok', stem, p['src'], d['title'][:40])
    json.dump(credits, open(os.path.join(HERE, 'credits.json'), 'w'), indent=1)
