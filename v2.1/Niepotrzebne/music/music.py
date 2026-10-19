import json, os, re, subprocess, sys, urllib.parse, urllib.request
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', '..', 'assets', 'music')
UA = {'User-Agent': 'CutleryMusic/1.0 (gzowotesla@gmail.com)'}
KEVIN = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/'
SCH = 'Robert Schumann - scenes from childhood, op. 15 - '
TRACKS = {
    'gymnopedie1': {'commons': 'Erik Satie - gymnopedies - la 1 ere. lent et douloureux.ogg', 'title': 'Gymnopédie No. 1', 'by': 'Erik Satie, played by Robin Alciatore'},
    'foreign_lands': {'commons': SCH + 'i. of foreign lands and peoples.ogg', 'title': 'Of Foreign Lands and Peoples (Kinderszenen I)', 'by': 'Robert Schumann'},
    'pleading_child': {'commons': SCH + 'iv. pleading child.ogg', 'title': 'Pleading Child (Kinderszenen IV)', 'by': 'Robert Schumann'},
    'curious_story': {'commons': SCH + 'ii. a curious story.ogg', 'title': 'A Curious Story (Kinderszenen II)', 'by': 'Robert Schumann'},
    'fireside': {'commons': SCH + 'viii. at the fireside.ogg', 'title': 'At the Fireside (Kinderszenen VIII)', 'by': 'Robert Schumann'},
    'traumerei': {'commons': SCH + 'vii. dreaming.ogg', 'title': 'Träumerei (Kinderszenen VII)', 'by': 'Robert Schumann'},
    'child_asleep': {'commons': SCH + 'xii. child falling asleep.ogg', 'title': 'Child Falling Asleep (Kinderszenen XII)', 'by': 'Robert Schumann'},
    'poet_speaks': {'commons': SCH + 'xiii. the poet speaks.ogg', 'title': 'The Poet Speaks (Kinderszenen XIII)', 'by': 'Robert Schumann'},
    'cattails': {'kevin': 'Cattails.mp3', 'title': 'Cattails'},
    'somewhere_sunny': {'kevin': 'Somewhere Sunny (ver 2).mp3', 'title': 'Somewhere Sunny (ver 2)'},
    'clear_air': {'kevin': 'Clear Air.mp3', 'title': 'Clear Air'},
    'morning': {'kevin': 'Morning.mp3', 'title': 'Morning'},
    'almost_bliss': {'kevin': 'Almost Bliss.mp3', 'title': 'Almost Bliss'},
}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def commons_info(name):
    q = urllib.parse.urlencode({'action': 'query', 'titles': 'File:' + name, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'format': 'json'})
    pg = next(iter(json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']['pages'].values()))
    ii = pg['imageinfo'][0]
    em = ii['extmetadata']
    clean = lambda k: re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', em.get(k, {}).get('value', ''))).strip()
    return {'url': ii['url'], 'page': ii['descriptionurl'], 'license': clean('LicenseShortName'), 'artist': clean('Artist')}

def fetch(key, t):
    meta = dict(t)
    if 'commons' in t:
        meta.update(commons_info(t['commons']))
        assert meta['license'] in ('Public domain', 'CC0'), (key, meta['license'])
    else:
        meta.update({'url': KEVIN + urllib.parse.quote(t['kevin']), 'page': 'https://incompetech.com', 'license': 'CC BY 4.0', 'by': 'Kevin MacLeod (incompetech.com)'})
    meta['url'] = meta['url'].split('?')[0]
    ext = os.path.splitext(urllib.parse.urlparse(meta['url']).path)[1]
    fn = os.path.join(RAW, key + ext)
    if not os.path.exists(fn):
        subprocess.run(['curl', '-sfL', '--retry', '4', '--max-time', '600', '-A', UA['User-Agent'], '-o', fn + '.part', meta['url']], check=True)
        os.rename(fn + '.part', fn)
    return fn, meta

PROFILE = {'maj': np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]), 'min': np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])}
def key_of(fn):
    sr = 11025
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', fn, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout, dtype=np.int16).astype(np.float32)
    n = 8192
    chroma = np.zeros(12)
    f = np.fft.rfftfreq(n, 1 / sr)
    ok = (f > 60) & (f < 2000)
    pc = (np.round(12 * np.log2(f[ok] / 261.63)) % 12).astype(int)
    for i in range(0, len(x) - n, n):
        s = np.abs(np.fft.rfft(x[i:i + n] * np.hanning(n)))[ok]
        np.add.at(chroma, pc, s)
    best = max(((np.corrcoef(np.roll(PROFILE[m], r), chroma)[0, 1], r, m) for r in range(12) for m in PROFILE))
    return 60 + best[1], best[2]

def render(fn, out):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', fn, '-af', 'loudnorm=I=-20:TP=-1.5:LRA=14:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    ln = f"loudnorm=I=-20:TP=-1.5:LRA=14:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    af = f"silenceremove=start_periods=1:start_threshold=-60dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,{ln},afade=t=in:d=0.05,aresample=44100"
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', fn, '-af', af, '-ac', '2', '-c:a', 'libmp3lame', '-q:a', '6', out], check=True)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    credits = json.load(open(os.path.join(HERE, 'credits.json'))) if os.path.exists(os.path.join(HERE, 'credits.json')) else {}
    for key, t in TRACKS.items():
        if only and key not in only: continue
        fn, meta = fetch(key, t)
        out = os.path.join(OUT, key + '.mp3')
        render(fn, out)
        root, mode = key_of(out)
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout)
        meta.update({'key': root, 'mode': mode, 'dur': round(dur, 1), 'kb': os.path.getsize(out) // 1024})
        credits[key] = meta
        print(f"{key:16} {meta['license']:13} {root} {mode} {dur:6.1f}s {meta['kb']:5}KB  {meta.get('artist', meta.get('by', ''))[:50]}")
    json.dump(credits, open(os.path.join(HERE, 'credits.json'), 'w'), indent=1, ensure_ascii=False)
