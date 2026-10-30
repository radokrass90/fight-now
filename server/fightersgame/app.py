"""Private Supabase PostgreSQL database; public scoped game API. No DB keys in clients."""
import os,json,secrets,hashlib,hmac,re,time,threading,uuid
from pathlib import Path
from contextlib import asynccontextmanager
from collections import defaultdict,deque
from fastapi import FastAPI,HTTPException,Request,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field,ConfigDict
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
CATALOG=json.loads(Path(os.environ.get('CATALOG_FILE','/app/game/assets/weapons/catalog.json')).read_text())
WEAPONS={w['id']:w for w in CATALOG['weapons']}
FIGHTERS={'murat','yasmin','dragan','kevin','leyla','tomasz','hakan','nadine','emre','boris','jasmin','adem','marco','fatima','danny'}
pool=ConnectionPool(os.environ['DATABASE_URL'],min_size=1,max_size=5,open=False,kwargs={'row_factory':dict_row,'options':'-c statement_timeout=5000'})
@asynccontextmanager
async def lifespan(app):
 pool.open();pool.wait(timeout=15)
 yield
 pool.close()
app=FastAPI(lifespan=lifespan,docs_url=None,redoc_url=None,openapi_url=None)
app.add_middleware(CORSMiddleware,allow_origins=os.environ.get('ALLOWED_ORIGINS','https://radokrass90.github.io,https://fightersgame.159.195.207.175.sslip.io').split(','),allow_methods=['GET','POST'],allow_headers=['Authorization','Content-Type'])
@app.middleware('http')
async def headers(req,call_next):
 if int(req.headers.get('content-length','0')or 0)>16384:return __import__('fastapi').responses.JSONResponse({'detail':'request_too_large'},status_code=413)
 response=await call_next(req);response.headers['X-Content-Type-Options']='nosniff';response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
 if req.url.path.startswith('/api/'):response.headers['Cache-Control']='no-store'
 return response
limits=defaultdict(deque);limit_lock=threading.Lock()
def rate(key,count,seconds):
 with limit_lock:
  now=time.monotonic();q=limits[key]
  while q and q[0]<now-seconds:q.popleft()
  if len(q)>=count:raise HTTPException(429,'slow_down')
  q.append(now)
  if len(limits)>20000:
   for k in list(limits):
    if not limits[k]or limits[k][-1]<now-3600:del limits[k]
def ip(req):return req.headers.get('x-forwarded-for',req.client.host).split(',')[-1].strip()
def error(code,status=400):raise HTTPException(status,code)
def fighter(value):
 if value not in FIGHTERS:error('unknown_fighter')
 return value
def digest(token):return hashlib.sha256(token.encode()).hexdigest()
def password_hash(password,salt=None):
 salt=salt or secrets.token_hex(16)
 return salt+':'+hashlib.scrypt(password.encode(),salt=bytes.fromhex(salt),n=16384,r=8,p=1).hex()
def auth(req:Request):
 header=req.headers.get('authorization','')
 if not header.startswith('Bearer ')or len(header)>100:error('sign_in_required',401)
 with pool.connection()as db:
  row=db.execute('SELECT player_id FROM sessions WHERE token_hash=%s AND expires_at>now()',(digest(header[7:]),)).fetchone()
 if not row:error('session_expired',401)
 rate(('api',str(row['player_id'])),360,60)
 return row['player_id']
def session(db,pid):
 token=secrets.token_urlsafe(32);db.execute('INSERT INTO sessions(token_hash,player_id)VALUES(%s,%s)',(digest(token),pid));return token
def lock_player(db,pid):return db.execute('SELECT id,username,coins,revision FROM players WHERE id=%s FOR UPDATE',(pid,)).fetchone()
def profile(db,pid):
 p=db.execute('SELECT id,username,coins,revision FROM players WHERE id=%s',(pid,)).fetchone()
 owned=[r['weapon_id']for r in db.execute('SELECT weapon_id FROM inventory WHERE player_id=%s ORDER BY weapon_id',(pid,))]
 loadouts={r['fighter']:r['weapon_id']for r in db.execute('SELECT fighter,weapon_id FROM loadouts WHERE player_id=%s',(pid,))}
 upgrades={}
 for r in db.execute('SELECT fighter,kind,level FROM upgrades WHERE player_id=%s',(pid,)):upgrades.setdefault(r['fighter'],{})[r['kind']]=r['level']
 stats=db.execute("SELECT count(*)FILTER(WHERE won)wins,count(*)FILTER(WHERE NOT won)losses FROM matches WHERE player_id=%s AND state='finished'",(pid,)).fetchone()
 return dict(id=str(p['id']),username=p['username'],coins=p['coins'],revision=p['revision'],owned=owned,loadouts=loadouts,upgrades=upgrades,stats=stats)
def change_coins(db,pid,amount,reason,match_id=None):
 row=db.execute('UPDATE players SET coins=coins+%s,revision=revision+1 WHERE id=%s AND coins+%s>=0 RETURNING coins',(amount,pid,amount)).fetchone()
 if not row:error('not_enough_coins',409)
 db.execute('INSERT INTO ledger(player_id,delta,balance,reason,match_id)VALUES(%s,%s,%s,%s,%s)',(pid,amount,row['coins'],reason,match_id))
class Body(BaseModel):model_config=ConfigDict(extra='forbid')
class Credentials(Body):
 username:str=Field(min_length=3,max_length=20,pattern=r'^[a-zA-Z0-9_]+$')
 password:str=Field(min_length=8,max_length=128)
class WeaponBuy(Body):weaponId:str=Field(max_length=40)
class Equip(Body):
 fighter:str=Field(max_length=20)
 weaponId:str|None=Field(default=None,max_length=40)
class Upgrade(Body):
 fighter:str=Field(max_length=20)
 kind:str=Field(max_length=20)
class Start(Body):
 fighter:str=Field(max_length=20)
 opponent:str=Field(max_length=20)
 mode:str=Field(pattern='^(arcade|versus)$')
 difficulty:str=Field(pattern='^(easy|normal|hard)$')
class Finish(Body):
 matchId:uuid.UUID
 won:bool
 flawless:bool=False
 finisher:bool=False
@app.get('/api/v1/health')
def health():
 with pool.connection()as db:db.execute('SELECT 1')
 return {'ok':True,'database':'fightersgame','weaponCount':len(WEAPONS)}
@app.get('/api/v1/catalog')
def catalog():return CATALOG
@app.post('/api/v1/guest')
def guest(req:Request):
 rate(('guest',ip(req)),60,3600)
 with pool.connection()as db:
  pid=db.execute('INSERT INTO players DEFAULT VALUES RETURNING id').fetchone()['id'];token=session(db,pid)
  db.execute("INSERT INTO ledger(player_id,delta,balance,reason)VALUES(%s,250,250,'welcome')",(pid,))
  return dict(token=token,profile=profile(db,pid))
@app.get('/api/v1/profile')
def get_profile(pid=Depends(auth)):
 with pool.connection()as db:return profile(db,pid)
@app.post('/api/v1/register')
def register(body:Credentials,pid=Depends(auth)):
 hashed=password_hash(body.password)
 with pool.connection()as db:
  p=lock_player(db,pid)
  if p['username']:error('already_registered',409)
  if db.execute('SELECT 1 FROM players WHERE username=%s',(body.username.lower(),)).fetchone():error('username_taken',409)
  try:db.execute('UPDATE players SET username=%s,password_hash=%s,revision=revision+1 WHERE id=%s',(body.username.lower(),hashed,pid))
  except __import__('psycopg').errors.UniqueViolation:error('username_taken',409)
  return profile(db,pid)
@app.post('/api/v1/login')
def login(body:Credentials,req:Request):
 rate(('login',ip(req)),15,600)
 with pool.connection()as db:
  p=db.execute('SELECT id,password_hash FROM players WHERE username=%s',(body.username.lower(),)).fetchone()
  stored=p['password_hash']if p else password_hash('invalid-password')
  if not p or not hmac.compare_digest(password_hash(body.password,stored.split(':')[0]),stored):error('invalid_credentials',401)
  token=session(db,p['id']);return dict(token=token,profile=profile(db,p['id']))
@app.post('/api/v1/logout')
def logout(req:Request,pid=Depends(auth)):
 with pool.connection()as db:db.execute('DELETE FROM sessions WHERE player_id=%s AND token_hash=%s',(pid,digest(req.headers['authorization'][7:])))
 return {'ok':True}
@app.post('/api/v1/buy')
def buy(body:WeaponBuy,pid=Depends(auth)):
 w=WEAPONS.get(body.weaponId)
 if not w:error('unknown_weapon')
 with pool.connection()as db:
  lock_player(db,pid)
  if not db.execute('SELECT 1 FROM inventory WHERE player_id=%s AND weapon_id=%s',(pid,w['id'])).fetchone():
   change_coins(db,pid,-w['price'],'weapon:'+w['id']);db.execute('INSERT INTO inventory(player_id,weapon_id)VALUES(%s,%s)',(pid,w['id']))
  return profile(db,pid)
@app.post('/api/v1/equip')
def equip(body:Equip,pid=Depends(auth)):
 fighter(body.fighter)
 with pool.connection()as db:
  lock_player(db,pid)
  if body.weaponId and not db.execute('SELECT 1 FROM inventory WHERE player_id=%s AND weapon_id=%s',(pid,body.weaponId)).fetchone():error('weapon_not_owned',403)
  db.execute('INSERT INTO loadouts(player_id,fighter,weapon_id)VALUES(%s,%s,%s)ON CONFLICT(player_id,fighter)DO UPDATE SET weapon_id=excluded.weapon_id',(pid,body.fighter,body.weaponId))
  db.execute('UPDATE players SET revision=revision+1 WHERE id=%s',(pid,))
  return profile(db,pid)
@app.post('/api/v1/upgrade')
def upgrade(body:Upgrade,pid=Depends(auth)):
 fighter(body.fighter)
 if body.kind not in {'power','guard','focus'}:error('unknown_upgrade')
 with pool.connection()as db:
  lock_player(db,pid);r=db.execute('SELECT level FROM upgrades WHERE player_id=%s AND fighter=%s AND kind=%s',(pid,body.fighter,body.kind)).fetchone();level=r['level']if r else 0
  if level>=5:error('max_level',409)
  change_coins(db,pid,-100*(level+1),'upgrade:'+body.fighter+':'+body.kind)
  db.execute('INSERT INTO upgrades(player_id,fighter,kind,level)VALUES(%s,%s,%s,%s)ON CONFLICT(player_id,fighter,kind)DO UPDATE SET level=excluded.level',(pid,body.fighter,body.kind,level+1))
  return profile(db,pid)
@app.post('/api/v1/matches/start')
def start(body:Start,pid=Depends(auth)):
 fighter(body.fighter);fighter(body.opponent);rate(('start',str(pid)),120,3600)
 with pool.connection()as db:
  lock_player(db,pid);p=profile(db,pid);snapshot=dict(weaponId=p['loadouts'].get(body.fighter),upgrades=p['upgrades'].get(body.fighter,{}))
  db.execute("UPDATE matches SET state='abandoned' WHERE player_id=%s AND state='open'",(pid,))
  r=db.execute('INSERT INTO matches(player_id,fighter,opponent,mode,difficulty,loadout)VALUES(%s,%s,%s,%s,%s,%s)RETURNING id',(pid,body.fighter,body.opponent,body.mode,body.difficulty,Jsonb(snapshot))).fetchone()
  return dict(matchId=str(r['id']),loadout=snapshot,profile=p)
@app.post('/api/v1/matches/finish')
def finish(body:Finish,pid=Depends(auth)):
 with pool.connection()as db:
  lock_player(db,pid);m=db.execute('SELECT *,extract(epoch FROM now()-started_at)elapsed FROM matches WHERE id=%s AND player_id=%s FOR UPDATE',(body.matchId,pid)).fetchone()
  if not m:error('match_not_found',404)
  if m['state']=='finished':return dict(reward=m['reward'],profile=profile(db,pid),alreadyClaimed=True)
  if m['state']!='open':error('match_unavailable',409)
  if m['elapsed']<8:error('match_too_short',409)
  if m['elapsed']>86400:error('match_expired',409)
  earned=db.execute("SELECT coalesce(sum(reward),0)total FROM matches WHERE player_id=%s AND state='finished' AND finished_at>now()-interval '1 hour'",(pid,)).fetchone()['total']
  reward=({'easy':130,'normal':160,'hard':210}[m['difficulty']]+(20 if body.flawless else 0)+(15 if body.finisher else 0))if body.won else 45
  reward=max(0,min(reward,5000-int(earned)))
  db.execute("UPDATE matches SET state='finished',won=%s,reward=%s,finished_at=now()WHERE id=%s",(body.won,reward,m['id']))
  change_coins(db,pid,reward,'match_win'if body.won else 'match_loss',m['id'])
  return dict(reward=reward,profile=profile(db,pid),alreadyClaimed=False)
if Path('/app/game').exists():app.mount('/',StaticFiles(directory='/app/game',html=True),name='game')
