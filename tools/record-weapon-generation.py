from pathlib import Path
import json,argparse,shutil,hashlib,datetime
p=argparse.ArgumentParser();p.add_argument('--id',required=True);p.add_argument('--source',required=True);p.add_argument('--prompt-file');a=p.parse_args()
r=Path(__file__).resolve().parent.parent
entries=json.loads((r/'art-direction/weapon-illustrations.json').read_text())['entries'];entry=next(e for e in entries if e['id']==a.id)
src=Path(a.source);assert src.is_file()and src.suffix=='.png'
dst=r/'game/assets/weapons/illustrated/sources'/f'{a.id}.png';shutil.copy2(src,dst)
receipt={**entry,'prompt':Path(a.prompt_file).read_text()if a.prompt_file else entry['prompt'],'generator':'built-in image_gen','source':src.name,'destination':str(dst.relative_to(r)),'sourceSha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewed':False}
(r/'game/assets/weapons/illustrated/receipts'/f'{a.id}.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(a.id+' saved')
