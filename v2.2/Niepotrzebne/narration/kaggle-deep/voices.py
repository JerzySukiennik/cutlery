import subprocess, sys, time, json
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '-U', 'qwen-tts', 'soundfile'], check=True)
import torch, soundfile as sf
from qwen_tts import Qwen3TTSModel

TEXT = ("Ah, the fridge. Cold, quiet, and, as of this morning, home to one very determined little block of butter. "
        "Now, butter is not known for its climbing. But then, nobody told the butter that.")
VOICES = {
    'deep': 'Male, around 60, a deep, low-pitched bass-baritone voice with a warm, slightly husky texture, Received Pronunciation British English. A beloved storyteller narrating a cosy handmade video game: unhurried, gently amused, dry wit, a smile in the voice, small pauses before the punchline. Natural and human, with soft breaths.',
    'deeper': 'Male, around 65, a very deep, resonant low bass voice, rich and velvety, warm Received Pronunciation British English, like a fireside audiobook narrator: calm, unhurried, wry and gently amused, natural breathing, relaxed and human delivery.',
}
t0 = time.time()
dtype = torch.float32
model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=dtype, attn_implementation='sdpa')
print('loaded', round(time.time() - t0, 1), flush=True)
log = {}
for name, instruct in VOICES.items():
    for take in range(3):
        t = time.time()
        wavs, sr = model.generate_voice_design(text=TEXT, language='English', instruct=instruct)
        fn = f'/kaggle/working/{name}_{take}.wav'
        sf.write(fn, wavs[0], sr)
        log[f'{name}_{take}'] = {'sec': round(len(wavs[0]) / sr, 2), 'gen': round(time.time() - t, 1)}
        print(name, take, log[f'{name}_{take}'], flush=True)
json.dump({'voices': VOICES, 'text': TEXT, 'log': log}, open('/kaggle/working/voices.json', 'w'), indent=1)
print('done', round(time.time() - t0, 1))
