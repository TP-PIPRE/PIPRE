"""Read-only text/NUL audit of versioned and new files after an interrupted write."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.java', '.json', '.md', '.yaml', '.yml', '.sql', '.py', '.mjs', '.xml', '.css', '.html', '.properties', '.sh', '.cmd', '.txt'}

def git_files(*arguments):
    return subprocess.check_output(['git', 'ls-files', '-z', *arguments], cwd=ROOT).decode('utf-8').split('\0')

issues = []
checked = 0
for relative in sorted(set(git_files() + git_files('--others', '--exclude-standard'))):
    path = ROOT / relative
    if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
        continue
    checked += 1
    content = path.read_bytes()
    encoding = 'utf-16' if content.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig'
    try:
        decoded = content.decode(encoding)
        if '\0' in decoded:
            issues.append({'file': relative, 'error': 'NUL characters', 'count': decoded.count('\0')})
    except UnicodeDecodeError:
        issues.append({'file': relative, 'error': 'invalid text encoding'})
print(json.dumps({'checked': checked, 'issues': issues}, ensure_ascii=False, indent=2))
sys.exit(bool(issues))
