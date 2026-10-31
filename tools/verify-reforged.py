"""Run the review build's source, art, combat, input and language checks."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess, os, json, datetime, shutil
root=Path(__file__).resolve().parent.parent
node=os.environ.get('GAME_NODE') or shutil.which('node') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node')
env=dict(os.environ,NODE_PATH=os.environ.get('NODE_PATH',str(Path(node).resolve().parent.parent/'node_modules')))
tests=[('check-dynamic-render.cjs',[]),('check-dynamic-combat.cjs',[]),('build-weapon-images.cjs',['--audit']),('build-reforged-fighters.cjs',['--audit']),('check-reforged-art-runtime.cjs',[]),('check-reforged-combat.cjs',[]),('check-menu-flow.cjs',[]),('check-asset-retry.cjs',[]),('check-economy-runtime.cjs',[]),('check-languages.cjs',[]),('check-mobile.cjs',[]),('check-combat-fx.cjs',[]),('check-street-props.cjs',[]),('check-painted-animation.cjs',['--complete']),('check-battle-music.cjs',[])]
def run(test):
 file,args=test;p=subprocess.run([node,str(root/'tools'/file),*args],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 result=dict(test=file,args=args,exitCode=p.returncode,output=p.stdout)
 print(('PASS ' if p.returncode==0 else 'FAIL ')+file,flush=True)
 return result
with ThreadPoolExecutor(max_workers=3)as pool:results=list(pool.map(run,tests))
(root/'review/verification.json').write_text(json.dumps(dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),results=results),indent=2)+'\n')
raise SystemExit(any(x['exitCode'] for x in results))
