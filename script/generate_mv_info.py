
import datetime
import json
import os
from pathlib import Path
from urllib import parse


def encodeurl(url=''):
    return parse.quote(url, safe='~@#$&()*!+=:;,.?/\'')

if __name__ == '__main__':

    mv_info = []
    md_lines = []
    
    p = Path('video/MV')
    for item in p.glob('*.m3u8'):
        mv_name = item.name.replace('.m3u8', '')
        filepath = item.as_posix()
        url = parse.urljoin('https://cdn.jsdelivr.net/gh/Nomeqc/static/', filepath)
        url = encodeurl(url)
        # 获得文件更新时间
        fp = os.popen(f'git log -1 --format="%ad" -- "{filepath}"')
        timestamp = datetime.datetime.strptime(fp.read().strip(), '%a %b %d %H:%M:%S %Y %z').timestamp()

        down_url = parse.urljoin('https://github.com/Nomeqc/static/blob/master/', filepath)
        down_url = encodeurl(down_url)
        md_lines.append(f'- {mv_name}    [播放](http://tools.201992.xyz/m3u8-play.html#{url})    [下载]({down_url})')
        mv_info.append({'name': mv_name, 'url': url, 'time': int(timestamp)})
        # print(url)
    md_lines.insert(0, f'# Fallrainy的MV(共 {len(mv_info)} 支)')

    Path.write_text(Path('video/MV.json'), json.dumps(mv_info, ensure_ascii=False, indent=4), encoding='utf-8')
    Path.write_text(Path('video/MV/README.md'), '\n'.join(md_lines), encoding='utf-8')
