import subprocess, sys, time, json
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '-U', 'qwen-tts', 'soundfile'], check=True)
import torch, soundfile as sf
from qwen_tts import Qwen3TTSModel

TEXT = ("Ah, the fridge. Cold, quiet, and, as of this morning, home to one very determined little block of butter. "
        "Now, butter is not known for its climbing. But then, nobody told the butter that.")
VOICES = {
    'storyteller': 'Male, around 60, warm and slightly husky baritone, Received Pronunciation British English. A beloved storyteller narrating a cosy handmade video game: unhurried, gently amused, dry wit, a smile in the voice, small pauses before the punchline.',
    'cheeky': 'Male, mid-30s, bright and clear London British English, playful and quick like a cheeky nature-show host, light teasing tone, crisp consonants, comic timing.',
    'grandad': 'Male, about 70, soft, deep and slightly gravelly voice with a gentle Northern English accent, slow and cosy like a grandfather telling a bedtime story by the fire, affectionate humour.',
    'aunt': 'Female, around 50, warm and rich mezzo voice, Received Pronunciation British English, wry and knowing like a favourite aunt reading aloud, theatrical but soft, good comic timing.',
    'butler': 'Male, about 55, refined and plummy upper-class British English, deadpan and dry, very precise diction, understated comedy, like a polite butler narrating with quiet amusement.',
    'scot': 'Male, around 45, warm Scottish accent, friendly and lilting, a cheerful storyteller with a relaxed pace and a twinkle in the voice.',
}
t0 = time.time()
dtype = torch.float32
model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=dtype, attn_implementation='sdpa')
print('loaded', round(time.time() - t0, 1), flush=True)
log = {}
for name, instruct in VOICES.items():
    for take in range(2):
        t = time.time()
        wavs, sr = model.generate_voice_design(text=TEXT, language='English', instruct=instruct)
        fn = f'/kaggle/working/{name}_{take}.wav'
        sf.write(fn, wavs[0], sr)
        log[f'{name}_{take}'] = {'sec': round(len(wavs[0]) / sr, 2), 'gen': round(time.time() - t, 1)}
        print(name, take, log[f'{name}_{take}'], flush=True)
json.dump({'voices': VOICES, 'text': TEXT, 'log': log}, open('/kaggle/working/voices.json', 'w'), indent=1)
print('done', round(time.time() - t0, 1))
