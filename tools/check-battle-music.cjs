const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../game');
const audio = [], events = {};
class FakeAudio {
  constructor(src) { this.src=src; this.paused=true; this.currentTime=0;this.dataset={};audio.push(this); }
  play() { this.paused=false; return Promise.resolve(); }
  pause() { this.paused=true; }
}
const sandbox = { Audio:FakeAudio, Map, document:{hidden:false,body:{appendChild(){}},addEventListener(k,fn){events[k]=fn;}},Snd:{on:true,musicOn:true} };
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'js/battle-music.js'),'utf8'),sandbox);
const {music,tracks}=vm.runInContext('({music:BattleMusic,tracks:BATTLE_TRACKS})',sandbox);
const metadata=[];
for(const t of tracks){
  const file=path.join(root,'assets/audio',t.file);assert.ok(fs.statSync(file).size>100000);
  const probe=JSON.parse(execFileSync('/opt/homebrew/bin/ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',file],{encoding:'utf8'}));
  assert.ok(Number(probe.format.duration)>60);assert.equal(probe.streams[0].codec_name,'mp3');
  // Decode the complete file; a valid header alone does not prove a complete download.
  execFileSync('/opt/homebrew/bin/ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe'});
  metadata.push({title:t.title,file:t.file,duration:Number(probe.format.duration),...probe.streams[0]});
}
for(let arena=0;arena<15;arena++){
  music.syncMatch({arena,round:1,paused:false});assert.equal(music.track,music.arenaTracks[arena]);assert.equal(music.current.loop,true);
}
music.syncMatch({arena:0,round:3,paused:false});assert.equal(music.track,4);
music.syncMatch({arena:1,round:3,paused:false});assert.equal(music.track,5);
music.syncMatch({arena:0,round:1,paused:false},true);assert.equal(music.track,4);
const current=music.current;current.currentTime=12;
music.syncMatch({arena:0,round:1,paused:true},true);assert.equal(current.paused,true);
music.syncMatch({arena:0,round:1,paused:false},true);assert.equal(current.paused,false);assert.equal(current.currentTime,12);
sandbox.Snd.musicOn=false;music.apply();assert.equal(current.paused,true);
sandbox.Snd.musicOn=true;music.apply();assert.equal(current.paused,false);
sandbox.Snd.on=false;music.apply();assert.equal(current.paused,true);
sandbox.Snd.on=true;music.apply();assert.equal(current.paused,false);
sandbox.document.hidden=true;events.visibilitychange();assert.equal(current.paused,true);
sandbox.document.hidden=false;events.visibilitychange();assert.equal(current.paused,false);
music.stop();assert.equal(current.paused,true);assert.equal(current.currentTime,0);assert.equal(music.track,-1);
assert.equal(audio.filter(a=>!a.paused).length,0);
const report={filesDecoded:6,arenaMappingsChecked:15,decidingRounds:true,bossFight:true,pauseResume:true,mute:true,backgroundTab:true,stopResets:true,tracks:metadata};
fs.writeFileSync(path.join(root,'assets/audio/verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
