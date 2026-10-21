import base64, json, os, subprocess, sys, time, urllib.request, urllib.error
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = 'gemini-3.8-flash-tts'

def key():
    for line in open(os.path.expanduser('~/Downloads/Claude/Projects/Drops/.env')):
        if line.startswith('GEMINI_API_KEY='): return line.split('=', 1)[1].strip().strip('"\'')

def speak(text, voice, out, style):
    body = {'systemInstruction': {'parts': [{'text': style}]}, 'contents': [{'parts': [{'text': text}]}],
            'generationConfig': {'responseModalities': ['AUDIO'], 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}}}}
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': key()})
    for k in range(4):
        try:
            d = json.load(urllib.request.urlopen(req, timeout=180))
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]
            if e.code == 429 and k < 3: print('429, waiting', file=sys.stderr); time.sleep(40 * (k + 1)); continue
            raise SystemExit(f'HTTP {e.code}: {msg}')
    part = d['candidates'][0]['content']['parts'][0]['inlineData']
    pcm = out + '.pcm'
    open(pcm, 'wb').write(base64.b64decode(part['data']))
    rate = 24000
    if 'rate=' in part.get('mimeType', ''): rate = int(part['mimeType'].split('rate=')[1].split(';')[0])
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', pcm, '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '4', out], check=True)
    os.remove(pcm)
    return d.get('usageMetadata', {})

if __name__ == '__main__':
    spec = json.load(open(sys.argv[1]))
    for s in spec['items']:
        out = os.path.join(HERE, s['out'])
        if os.path.exists(out): continue
        u = speak(s['text'], s['voice'], out, spec['style'])
        print('ok', s['out'], u.get('totalTokenCount'))
        time.sleep(spec.get('gap', 8))
