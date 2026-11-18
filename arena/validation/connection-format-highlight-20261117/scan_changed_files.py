"""Check proposed files without printing credentials or copying private state."""
import argparse
import json
import re
import subprocess
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--private-root',type=Path)
parser.add_argument('--base',help='Include committed changes since this revision.')
args=parser.parse_args()
root=Path.cwd()
paths=subprocess.check_output(['git','ls-files','--modified','--others','--exclude-standard','-z']).decode().split('\0')
if args.base:
    paths += subprocess.check_output(['git','diff','--name-only','-z',args.base]).decode().split('\0')
paths=sorted(set(p for p in paths if p and (root/p).is_file()))
known=set()

def sensitive(value,key=''):
    if isinstance(value,dict):
        for k,v in value.items():sensitive(v,k)
    elif isinstance(value,list):
        for v in value:sensitive(v,key)
    elif isinstance(value,str):
        if re.search('key|secret|password',key,re.I) and len(value)>=12:known.add(value)
        if value.lstrip().startswith(('{','[')):
            try:sensitive(json.loads(value))
            except ValueError:pass

if args.private_root:
    env=args.private_root/'.env'
    if env.is_file():
        for line in env.read_text().splitlines():
            match=re.match(r'\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)',line)
            if match and re.search('key|secret|password',match[1],re.I):
                value=match[2].strip().strip('"\'')
                if len(value)>=12:known.add(value)
    private=args.private_root/'arena/.data/public-access'
    config=private/'config.json'
    if config.is_file():sensitive(json.loads(config.read_text()))
    access=private/'ACCESS.txt'
    if access.is_file():
        for line in access.read_text().splitlines():
            if re.search('password|密码',line,re.I):
                match=re.search(r'[:：=]\s*(\S{12,})\s*$',line)
                if match:known.add(match[1])
    key=private/'records/_identity/api/connection-encryption.key'
    if key.is_file():known.add(key.read_text().strip())

patterns=[re.compile(p) for p in [
    r'\bAIza[A-Za-z0-9_-]{25,}',r'\bAQ\.[A-Za-z0-9_-]{25,}',
    r'\bnvapi-[A-Za-z0-9_-]{20,}',r'\bgsk_[A-Za-z0-9_-]{20,}',
    r'\bhf_[A-Za-z0-9_-]{20,}',r'\bsk-or-v1-[A-Za-z0-9_-]{25,}',
    r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
]]
blocked=[]
for name in paths:
    p=Path(name)
    if '/.data/' in name or p.name.startswith('.env') or p.suffix in {'.sqlite3','.db','.key','.pem'} or p.name=='ACCESS.txt':
        blocked.append({'file':name,'issue':'private-runtime-path'});continue
    try:body=p.read_text()
    except (UnicodeError,OSError):continue
    if any(secret in body for secret in known):blocked.append({'file':name,'issue':'known-private-value'})
    if any(pattern.search(body) for pattern in patterns):blocked.append({'file':name,'issue':'credential-pattern'})
report={'files_checked':len(paths),'known_private_values_checked':len(known),'findings':blocked,
        'private_state_included':any('/.data/' in p or Path(p).suffix in {'.sqlite3','.db','.key','.pem'} for p in paths),
        'credential_values_printed_or_saved':False}
out=Path('arena/validation/connection-format-highlight-20261117/secret-scan.json')
out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
raise SystemExit(bool(blocked))
