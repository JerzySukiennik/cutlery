import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ref_wav, ref_text, only = sys.argv[1], sys.argv[2], (sys.argv[3].split(',') if len(sys.argv) > 3 else None)
lines = json.load(open(os.path.join(HERE, 'lines.json')))
if only: lines = [l for l in lines if l['file'] in only]
data = {'ref': base64.b64encode(open(ref_wav, 'rb').read()).decode(), 'ref_text': ref_text, 'lines': lines}
code = '''import subprocess, sys, time, json, base64, io
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '-U', 'qwen-tts', 'soundfile'], check=True)
import torch, soundfile as sf
from qwen_tts import Qwen3TTSModel
D = json.loads(%r)
ref, sr0 = sf.read(io.BytesIO(base64.b64decode(D['ref'])))
t0 = time.time()
model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cuda:0', dtype=torch.float32, attn_implementation='sdpa')
prompt = model.create_voice_clone_prompt(ref_audio=(ref, sr0), ref_text=D['ref_text'])
print('ready', round(time.time() - t0, 1), flush=True)
log = {}
for i, l in enumerate(D['lines']):
    for take in range(2):
        t = time.time()
        wavs, sr = model.generate_voice_clone(text=l['text'], language='English', voice_clone_prompt=prompt)
        fn = l['file'].replace('.mp3', '') + f'_{take}.wav'
        sf.write('/kaggle/working/' + fn, wavs[0], sr)
        log[fn] = round(len(wavs[0]) / sr, 2)
    print(i, l['file'], log[fn], round(time.time() - t, 1), flush=True)
json.dump(log, open('/kaggle/working/log.json', 'w'))
print('done', round(time.time() - t0, 1))
''' % json.dumps(data)
open(os.path.join(HERE, 'kaggle-lines', 'lines.py'), 'w').write(code)
json.dump({'id': 'jerzysukiennik/cutlery-narrator-lines', 'title': 'cutlery narrator lines', 'code_file': 'lines.py', 'language': 'python', 'kernel_type': 'script', 'is_private': 'true', 'enable_gpu': 'true', 'enable_internet': 'true', 'machine_shape': 'NvidiaTeslaT4', 'dataset_sources': [], 'competition_sources': [], 'kernel_sources': [], 'model_sources': []}, open(os.path.join(HERE, 'kaggle-lines', 'kernel-metadata.json'), 'w'), indent=1)
print(len(lines), 'lines,', os.path.getsize(os.path.join(HERE, 'kaggle-lines', 'lines.py')) // 1024, 'KB')
