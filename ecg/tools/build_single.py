#!/usr/bin/env python3
"""Inline samples.js, ecg.js and app.js into one self-contained HTML file: ecg-reader-standalone.html"""
import os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(R, 'index.html'), encoding='utf-8').read()
for name in ['samples.js', 'ecg.js', 'app.js']:
    js = open(os.path.join(R, name), encoding='utf-8').read().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', f'<script>/* {name} */\n{js}\n</script>')
assert '<script src=' not in html
open(os.path.join(R, 'ecg-reader-standalone.html'), 'w', encoding='utf-8').write(html)
print('wrote ecg-reader-standalone.html', len(html) // 1024, 'KB')
