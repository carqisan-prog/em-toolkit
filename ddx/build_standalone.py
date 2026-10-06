#!/usr/bin/env python3
"""Inline css/ and js/ into a single offline file: ddx-standalone.html"""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root/'index.html').read_text(encoding='utf-8')
css = (root/'css/app.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/app.css">', '<style>\n'+css+'\n</style>')
def js(m):
    src = (root/m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return '<script>\n/* '+m.group(1)+' */\n'+src+'\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', js, html)
assert 'src="js/' not in html and 'href="css/' not in html
(root/'ddx-standalone.html').write_text(html, encoding='utf-8')
print('wrote ddx-standalone.html', len(html)//1024, 'KB')
