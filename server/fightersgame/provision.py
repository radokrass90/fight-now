"""Run on prod only. Secrets remain in a root-only server .env file."""
from pathlib import Path
import subprocess,secrets,json,os
root=Path('/opt/fightersgame');root.mkdir(exist_ok=True)
def sql(q,db='postgres'):
 return subprocess.check_output(['docker','exec','-i','-u','postgres','supabase-db','psql','-v','ON_ERROR_STOP=1','-d',db,'-At'],input=q.encode()).decode().strip()
env=root/'.env'
exists=sql("SELECT 1 FROM pg_roles WHERE rolname='fightersgame_api'")=='1'
if not env.exists():
 if exists:raise SystemExit('Existing role without local credentials; refusing to rotate it.')
 secret=secrets.token_urlsafe(48)
 sql("CREATE ROLE fightersgame_api LOGIN PASSWORD '"+secret+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 10;")
 fd=os.open(str(env),os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w')as f:f.write('DATABASE_URL=postgresql://fightersgame_api:'+secret+'@supabase-db:5432/fightersgame\nALLOWED_ORIGINS=https://radokrass90.github.io,https://fightersgame.159.195.207.175.sslip.io\n')
if sql("SELECT 1 FROM pg_database WHERE datname='fightersgame'")!='1':sql('CREATE DATABASE fightersgame OWNER postgres;')
sql('REVOKE ALL ON DATABASE fightersgame FROM PUBLIC; GRANT CONNECT ON DATABASE fightersgame TO fightersgame_api;')
sql((root/'api/schema.sql').read_text(),'fightersgame')
catalog=json.loads((root/'game/assets/weapons/catalog.json').read_text())
for w in catalog['weapons']:
 data=json.dumps(w,ensure_ascii=False).replace("'","''")
 sql("INSERT INTO weapons(id,price,data)VALUES('"+w['id']+"',"+str(w['price'])+",'"+data+"'::jsonb)ON CONFLICT(id)DO UPDATE SET price=excluded.price,data=excluded.data;",'fightersgame')
print(json.dumps({'database':'fightersgame','weapons':len(catalog['weapons']),'credentials':'server-only','existingSupabaseDatabasesUntouched':True}))
