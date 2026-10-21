import sys
from process import raw, segments
for sid in [int(x) for x in sys.argv[1:]]:
    try:
        fn, d = raw(sid)
        segs, dur = segments(fn)
        print(f"{sid:>7} {d['license']:6} {dur:5.2f}s {len(segs):2} segs {[(round(a,2), round(b-a,2)) for a,b in segs[:8]]}  {d['title'][:45]}")
    except Exception as e:
        print(sid, 'ERR', e)
