from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1000,"height":1400})
    pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto("file:///workspace/em-tintinalli/index.html?print=all"); pg.wait_for_timeout(1200)
    pg.emulate_media(media="print")
    pg.pdf(path="/workspace/em-tintinalli/full_toolkit.pdf", format="A4", print_background=True, margin={"top":"10mm","bottom":"12mm","left":"10mm","right":"10mm"},
           display_header_footer=True, header_template="<span></span>",
           footer_template='<div style="font-size:7px;width:100%;text-align:center;color:#444">EM Toolkit full printable edition (all 26 sections) – reference aid, every ⚠ VERIFY item pending owner review · page <span class="pageNumber"></span>/<span class="totalPages"></span></div>')
print("errors:",errs)
