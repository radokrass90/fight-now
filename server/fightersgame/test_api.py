"""Integration tests use only freshly created QA players; never touch existing profiles."""
import json,urllib.request,urllib.error,subprocess,uuid,hashlib,concurrent.futures
BASE='http://127.0.0.1:7120/api/v1';checks=[]
def call(path,data=None,token=None,expected=200):
 h={'Content-Type':'application/json'}
 if token:h['Authorization']='Bearer '+token
 req=urllib.request.Request(BASE+path,headers=h,data=None if data is None else json.dumps(data).encode())
 try:
  with urllib.request.urlopen(req,timeout=15)as r:status=r.status;body=json.load(r)
 except urllib.error.HTTPError as e:status=e.code;body=json.load(e)
 assert status==expected,(path,status,body,expected)
 return body
def sql(q):return subprocess.check_output(['docker','exec','-i','-u','postgres','supabase-db','psql','-v','ON_ERROR_STOP=1','-d','fightersgame','-At'],input=q.encode()).decode().strip()
def ok(label):checks.append(label);print('PASS '+label,flush=True)
assert call('/health')['database']=='fightersgame';weapons=call('/catalog')['weapons'];assert len(weapons)==100 and len({w['id']for w in weapons})==100
ok('fightersgame database and 100 unique catalog entries')
a=call('/guest',{});b=call('/guest',{});token=a['token'];pid=a['profile']['id'];assert pid!=b['profile']['id'] and a['profile']['coins']==250
call('/profile',expected=401);call('/buy',{'weaponId':weapons[0]['id'],'price':-9000},token,422)
p=call('/buy',{'weaponId':weapons[0]['id']},token);assert p['coins']==130
assert call('/buy',{'weaponId':weapons[0]['id']},token)['coins']==130
call('/equip',{'fighter':'murat','weaponId':weapons[0]['id']},b['token'],403)
p=call('/upgrade',{'fighter':'murat','kind':'power'},token);assert p['coins']==30 and p['upgrades']['murat']['power']==1
call('/upgrade',{'fighter':'murat','kind':'power'},token,409);assert call('/profile',token=token)['coins']==30
ok('server prices, insufficient funds, owned-item idempotency and player isolation')
sql("UPDATE players SET coins=100000 WHERE id='"+pid+"';INSERT INTO ledger(player_id,delta,balance,reason)VALUES('"+pid+"',99970,100000,'qa_fixture');")
second=weapons[1]
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:rows=list(pool.map(lambda _:call('/buy',{'weaponId':second['id']},token),range(8)))
assert call('/profile',token=token)['coins']==100000-second['price']
ok('concurrent double purchase charges exactly once')
for w in weapons:
 call('/buy',{'weaponId':w['id']},token)
 p=call('/equip',{'fighter':'murat','weaponId':w['id']},token);assert p['loadouts']['murat']==w['id']
p=call('/profile',token=token);assert len(p['owned'])==100 and p['coins']==100000-sum(w['price']for w in weapons[1:])
for kind in ['power','guard','focus']:
 level=p['upgrades'].get('murat',{}).get(kind,0)
 for _ in range(level,5):p=call('/upgrade',{'fighter':'murat','kind':kind},token)
 call('/upgrade',{'fighter':'murat','kind':kind},token,409)
assert all(p['upgrades']['murat'][k]==5 for k in ['power','guard','focus'])
ok('all 100 weapons buy/equip and all 15 character-upgrade levels')
name='qa_'+uuid.uuid4().hex[:12];password=uuid.uuid4().hex
call('/register',{'username':name,'password':password},token);call('/login',{'username':name,'password':'incorrect-password'},expected=401)
login=call('/login',{'username':name,'password':password});assert login['profile']['id']==pid and len(login['profile']['owned'])==100
call('/logout',{},login['token']);call('/profile',token=login['token'],expected=401)
ok('password save, second-device login, persistent inventory and session revocation')
start={'fighter':'murat','opponent':'boris','mode':'versus','difficulty':'hard'}
call('/matches/start',{**start,'mode':'training'},token,422)
m=call('/matches/start',start,token);mid=m['matchId'];claim={'matchId':mid,'won':True,'flawless':True,'finisher':True}
call('/matches/finish',claim,b['token'],404);call('/matches/finish',claim,token,409)
sql("UPDATE matches SET started_at=now()-interval '30 seconds' WHERE id='"+mid+"';")
coins=call('/profile',token=token)['coins'];r=call('/matches/finish',claim,token);assert r['reward']==245 and r['profile']['coins']==coins+245
again=call('/matches/finish',claim,token);assert again['alreadyClaimed'] and again['profile']['coins']==coins+245
old=call('/matches/start',start,token)['matchId'];call('/matches/start',start,token);call('/matches/finish',{'matchId':old,'won':True},token,409)
ok('earned match coins, match ownership, timing gate and exactly-once reward')
assert sql("SELECT count(*) FROM sessions WHERE token_hash='"+hashlib.sha256(token.encode()).hexdigest()+"'")=='1'
assert sql("SELECT has_table_privilege('fightersgame_api','ledger','UPDATE')")=='f'
assert sql("SELECT has_database_privilege('anon','fightersgame','CONNECT')")=='f'
ok('hashed session tokens and private database privileges')
print(json.dumps({'checks':checks,'database':'fightersgame','catalog':100,'qaPlayer':pid}))
