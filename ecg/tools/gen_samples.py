#!/usr/bin/env python3
"""Generate demo ECG samples for ECG Reader.

Synthetic records use a McSharry/ECGSYN-style sum-of-Gaussians beat model, but with
explicit per-beat timing so the ground-truth PR / QRS / QT and RR series are known.
Real excerpts come from the MIT-BIH Arrhythmia Database (PhysioNet, ODC-BY 1.0).

Outputs:
  samples.js                      embedded demo data (window.ECG_SAMPLES)
  samples/*.csv, *.json           same data as uploadable files (for testing the parsers)
  samples/mitdb100_10s.hea/.dat   WFDB format 212 excerpt
  samples/syn_nsr72.hea/.dat      WFDB format 16 copy of the NSR sample
  samples/strip_photo.jpg         test image for the experimental photo digitizer
"""
import json, os, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SD = os.path.join(ROOT, 'samples')
os.makedirs(SD, exist_ok=True)
FS = 500
DUR = 10.0
rng = np.random.default_rng(42)

def g(t, mu, sig, a):
    return a * np.exp(-0.5 * ((t - mu) / sig) ** 2)

# Lead morphologies: amplitudes (mV) for P, Q, R, S, T
LEADS = {
    'II': dict(P=0.15, Q=-0.10, R=1.30, S=-0.25, T=0.35),
    'V1': dict(P=0.07, Q=0.00, R=0.30, S=-1.00, T=0.10),
    'V5': dict(P=0.10, Q=-0.12, R=1.60, S=-0.30, T=0.40),
}

def beat(t, lead, pr=0.16, qrs=0.09, qt=0.40, has_p=True, pvc=False, sp=0.02):
    """t: time relative to QRS onset (s). Returns mV.
    Ground truth (by construction): P onset at -pr, QRS onset 0, QRS offset qrs, T end ~ qt
    (P onset = mu - 2.5 sigma; T end defined as tangent-method end = mu + 2 sigma)."""
    A = LEADS[lead]
    y = np.zeros_like(t)
    if has_p:
        y += g(t, -pr + 2.5 * sp, sp, A['P'])
    if pvc:
        # wide, bizarre, discordant T (no P)
        sq = qrs / 6.0
        sign = 1 if lead != 'V1' else -1
        y += g(t, qrs * 0.5, sq * 1.3, 1.6 * sign)
        y += g(t, qrs * 0.85, sq * 0.8, -0.35 * sign)
        st = 0.05
        y += g(t, qt - 2.0 * st, st, -0.45 * sign)
        return y
    s = qrs / 9.0                           # base sigma; QRS spans ~ 9 sigma
    y += g(t, 2.5 * s * 0.8, s * 0.8, A['Q'])
    y += g(t, 4.5 * s, s * (1.0 if qrs < 0.11 else 1.6), A['R'] * (1 if qrs < 0.11 else 0.8))
    y += g(t, qrs - 2.5 * s * 0.9, s * 0.9, A['S'])
    st = 0.045                              # T end (tangent method) = mu + 2 sigma
    y += g(t, qt - 2.0 * st, st, A['T'] if qrs < 0.11 else (-A['T'] if lead == 'V1' else A['T'] * 0.8))
    return y

def synth(onsets, params, af=False, noise=True):
    t = np.arange(int(DUR * FS)) / FS
    out = {}
    for lead in LEADS:
        y = np.zeros_like(t)
        for on, p in zip(onsets, params):
            m = (t > on - 0.5) & (t < on + 0.8)
            y[m] += beat(t[m] - on, lead, **p)
        if af:  # fibrillatory waves 4-8 Hz, varying
            for f in rng.uniform(4.5, 7.5, 6):
                y += 0.025 * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (1 + 0.5 * np.sin(2 * np.pi * 0.3 * t))
        if noise:
            y += 0.15 * np.sin(2 * np.pi * 0.22 * t + 1) + 0.07 * np.sin(2 * np.pi * 0.07 * t)   # baseline wander
            y += 0.04 * np.sin(2 * np.pi * 60 * t)                                                 # PH 60 Hz mains
            y += rng.normal(0, 0.012, t.size)                                                      # EMG/white
        out[lead] = np.round(y * 1000).astype(int)   # µV
    return out

def qt_for(rr, qtc=0.41):
    return qtc * np.sqrt(rr)

def regular(hr, pr=0.16, qrs=0.09, qtc=0.41, hrv=0.02, start=0.3, sp=0.02):
    rr0 = 60.0 / hr
    on, prm = [], []
    tt = start
    k = 0
    while tt < DUR - 0.2:
        rr = rr0 * (1 + hrv * np.sin(2 * np.pi * k / 4.5))
        on.append(tt); prm.append(dict(pr=pr, qrs=qrs, qt=qt_for(rr0, qtc), sp=sp))
        tt += rr; k += 1
    return on, prm

samples = []
def add(id_, name, onsets, prm, truth, af=False):
    leads = synth(onsets, prm, af=af)
    samples.append(dict(id=id_, name=name, group='Synthetic', fs=FS, units='uV',
                        leads={k: v.tolist() for k, v in leads.items()}, truth=truth,
                        source='Synthetic (Gaussian-kernel ECGSYN-style model, tools/gen_samples.py). Includes baseline wander, 60 Hz mains and white noise.'))

o, p = regular(72); add('syn_nsr72', 'Synthetic – Normal sinus 72', o, p,
    dict(rhythm='sinus', hr=72, pr=160, qrs=90, qtc=410, flags=[]))
o, p = regular(45, qtc=0.40); add('syn_brady45', 'Synthetic – Sinus brady 45', o, p,
    dict(rhythm='sinus_brady', hr=45, pr=160, qrs=90, qtc=400, flags=[]))
o, p = regular(120, pr=0.14, qrs=0.08, qtc=0.42); add('syn_tachy120', 'Synthetic – Sinus tachy 120', o, p,
    dict(rhythm='sinus_tachy', hr=120, pr=140, qrs=80, qtc=420, flags=[]))
# AF-like: irregularly irregular RR, no P, f-waves
rrs = np.clip(rng.gamma(9, 0.7 / 9, 40), 0.42, 1.25)
o, tt = [], 0.25
for rr in rrs:
    if tt > DUR - 0.2: break
    o.append(tt); tt += rr
p = [dict(pr=0.16, qrs=0.09, qt=0.36, has_p=False) for _ in o]
mean_rr = np.mean(np.diff(o))
add('syn_af', 'Synthetic – AF-like irregular', o, p,
    dict(rhythm='af', hr=round(60 / mean_rr), qrs=90, flags=['irregular']), af=True)
# PVCs: sinus 75 with every 4th beat a PVC (coupling 0.6 RR, full compensatory pause)
rr0 = 0.8; o, p, tt, k = [], [], 0.3, 0
while tt < DUR - 0.2:
    if k % 4 == 3:
        o.append(tt - 0.4 * rr0 - 0.02); p.append(dict(qrs=0.15, qt=0.42, has_p=False, pvc=True))
    else:
        o.append(tt); p.append(dict(pr=0.16, qrs=0.09, qt=qt_for(rr0)))
    tt += rr0; k += 1
add('syn_pvc', 'Synthetic – Sinus 75 with PVCs (q4)', o, p,
    dict(rhythm='sinus', hr=75, pr=160, qrs=90, flags=['pvc'], n_pvc=sum(1 for x in p if x.get('pvc'))))
o, p = regular(70, pr=0.28); add('syn_avb1', 'Synthetic – 1st-degree AV block (PR 280)', o, p,
    dict(rhythm='sinus', hr=70, pr=280, qrs=90, qtc=410, flags=['avb1']))
o, p = regular(75, qrs=0.15, qtc=0.44); add('syn_wideqrs', 'Synthetic – Wide QRS 150 ms', o, p,
    dict(rhythm='sinus', hr=75, pr=160, qrs=150, qtc=440, flags=['wide_qrs']))
o, p = regular(65, qtc=0.52); add('syn_longqt', 'Synthetic – Long QTc ~520', o, p,
    dict(rhythm='sinus', hr=65, pr=160, qrs=90, qtc=520, flags=['long_qtc']))
# sinus pause: 70 bpm with a 2.8 s gap
o, p = regular(70, hrv=0.0); o = np.array(o)
o[4:] += 2.8 - 60 / 70; keep = o < DUR - 0.2
o = o[keep].tolist(); p = p[:len(o)]
add('syn_pause', 'Synthetic – Sinus 70 with 2.8 s pause', o, p,
    dict(rhythm='sinus', hr=70, pr=160, qrs=90, qtc=410, flags=['pause']))
o, p = regular(78, pr=0.10, sp=0.016); add('syn_shortpr', 'Synthetic – Short PR (100 ms)', o, p,
    dict(rhythm='sinus', hr=78, pr=100, qrs=90, qtc=410, flags=['short_pr']))

# ---------- real excerpts (MIT-BIH Arrhythmia DB, ODC-BY 1.0) ----------
MITDB_ATTR = ('MIT-BIH Arrhythmia Database (Moody GB, Mark RG. IEEE Eng Med Biol 2001;20(3):45-50), '
              'via PhysioNet (Goldberger AL et al., Circulation 2000;101(23):e215-e220). '
              'Licensed under the Open Data Commons Attribution License v1.0. 10-s excerpt, unmodified samples.')
try:
    import wfdb
    for rec, t0, name, truth in [
        ('100', 0, 'PhysioNet MIT-BIH 100 (0–10 s)', dict(rhythm='sinus', hr=None, flags=[], note='Reference: sinus rhythm, one APC (A) at ~5.6 s')),
        ('208', 20, 'PhysioNet MIT-BIH 208 (20–30 s)', dict(rhythm='sinus', hr=None, flags=['pvc'], note='Reference: sinus with PVCs (V) and fusion (F) beats')),
    ]:
        a, b = int(t0 * 360), int((t0 + 10) * 360)
        r = wfdb.rdrecord(rec, pn_dir='mitdb', sampfrom=a, sampto=b, physical=False)
        ann = wfdb.rdann(rec, 'atr', pn_dir='mitdb', sampfrom=a, sampto=b)
        beats = [(int(s - a), sym) for s, sym in zip(ann.sample, ann.symbol) if sym in 'NLRAaJSVFejE/fQ']
        rr = np.diff([s for s, _ in beats]) / 360
        truth['hr'] = round(60 / np.median(rr))
        truth['ref_beats'] = beats
        leads = {}
        for i, nm in enumerate(r.sig_name):
            leads[nm] = np.round((r.d_signal[:, i] - r.baseline[i]) / r.adc_gain[i] * 1000).astype(int).tolist()
        samples.append(dict(id='mitdb' + rec, name=name, group='PhysioNet (real)', fs=360, units='uV', leads=leads,
                            truth=truth, source=MITDB_ATTR, license='ODC-BY-1.0',
                            url='https://physionet.org/content/mitdb/1.0.0/'))
        if rec == '100':  # also write a format-212 WFDB excerpt for upload testing
            wfdb.wrsamp('mitdb100_10s', fs=360, units=['mV', 'mV'], sig_name=r.sig_name, d_signal=r.d_signal,
                        fmt=['212', '212'], adc_gain=r.adc_gain, baseline=r.baseline, write_dir=SD,
                        comments=['Excerpt of MIT-BIH Arrhythmia DB record 100, 0-10 s. ODC-BY 1.0. https://physionet.org/content/mitdb/1.0.0/'])
except Exception as e:
    print('WARNING: could not fetch PhysioNet data:', e)

# ---------- write outputs ----------
with open(os.path.join(ROOT, 'samples.js'), 'w') as f:
    f.write('/* Demo ECG data for ECG Reader. Synthetic records: generated by tools/gen_samples.py.\n'
            '   PhysioNet excerpts: ' + MITDB_ATTR + ' */\n')
    f.write('window.ECG_SAMPLES = ' + json.dumps(samples, separators=(',', ':')) + ';\n')

nsr = samples[0]
names = list(nsr['leads'])
with open(os.path.join(SD, 'syn_nsr72_with_time.csv'), 'w') as f:
    f.write('time_s,' + ','.join(names) + '\n')
    for i in range(len(nsr['leads']['II'])):
        f.write('%.4f,' % (i / FS) + ','.join('%.3f' % (nsr['leads'][n][i] / 1000) for n in names) + '\n')
with open(os.path.join(SD, 'syn_avb1_lead2_uV.txt'), 'w') as f:
    f.write('\n'.join(str(v) for v in samples[5]['leads']['II']))
with open(os.path.join(SD, 'syn_af.json'), 'w') as f:
    s = samples[3]
    json.dump(dict(fs=s['fs'], units='uV', leads=s['leads'], note=s['source']), f)
try:
    import wfdb
    d = np.array([nsr['leads'][n] for n in names]).T.astype(int)
    wfdb.wrsamp('syn_nsr72', fs=FS, units=['mV'] * 3, sig_name=names, d_signal=d, fmt=['16'] * 3,
                adc_gain=[1000.0] * 3, baseline=[0] * 3, write_dir=SD)
except Exception as e:
    print('WARNING wfdb write', e)

# ---------- photo test image for the experimental digitizer ----------
try:
    from PIL import Image, ImageDraw, ImageFilter
    px_mm = 8
    W, H = int(250 * px_mm) // 2, 40 * px_mm      # 5 s strip, 40 mm tall
    im = Image.new('RGB', (W + 40, H + 40), (252, 246, 244))
    d = ImageDraw.Draw(im)
    for mm in range(0, 126):
        x = 20 + mm * px_mm
        d.line([(x, 20), (x, 20 + H)], fill=(240, 170, 170) if mm % 5 == 0 else (248, 214, 214), width=2 if mm % 5 == 0 else 1)
    for mm in range(0, 41):
        y = 20 + mm * px_mm
        d.line([(20, y), (20 + W, y)], fill=(240, 170, 170) if mm % 5 == 0 else (248, 214, 214), width=2 if mm % 5 == 0 else 1)
    s = samples[0]; sig = np.array(s['leads']['II'][:5 * FS]) / 1000.0
    # print-like: remove wander as an ECG machine would
    from scipy.signal import butter, filtfilt
    b, a = butter(2, [0.5 / 250, 40 / 250], 'band'); sig = filtfilt(b, a, sig)
    pts = [(20 + (i / FS) * 25 * px_mm, 20 + H * 0.6 - v * 10 * px_mm) for i, v in enumerate(sig)]
    d.line(pts, fill=(25, 25, 35), width=3)
    im = im.rotate(0.6, resample=Image.BICUBIC, fillcolor=(252, 246, 244)).filter(ImageFilter.GaussianBlur(0.8))
    im.save(os.path.join(SD, 'strip_photo.jpg'), quality=80)
    json.dump(dict(px_per_mm=px_mm, origin=[20, 20], note='5 s of syn_nsr72 lead II at 25 mm/s, 10 mm/mV, rotated 0.6 deg'),
              open(os.path.join(SD, 'strip_photo.meta.json'), 'w'))
except Exception as e:
    print('WARNING image', e)
print('samples:', [s['id'] for s in samples])
