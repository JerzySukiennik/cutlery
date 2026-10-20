import sys, parselmouth
from parselmouth.praat import call
def lower(src, dst, st, formant=1.0):
    s = parselmouth.Sound(src)
    f0 = call(s.to_pitch(), 'Get quantile', 0, 0, 0.5, 'Hertz')
    new = f0 * 2 ** (-st / 12)
    out = call(s, 'Change gender', 60, 400, formant, new, 1.0, 1.0)
    out.save(dst, 'WAV')
    return f0, new
if __name__ == '__main__':
    src = sys.argv[1]
    for name, st, fr in [('down2', 2, 1.0), ('down3', 3.5, 0.96), ('down5', 5, 0.93)]:
        f0, new = lower(src, f'samples/lo_{name}.wav', st, fr)
        print(name, round(f0), '->', round(new), 'Hz')
