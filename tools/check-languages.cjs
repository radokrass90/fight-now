const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../game');
function language(search,saved){
 const memory={fightnow_language:saved?JSON.stringify(saved):null};let destination;
 const sb={URLSearchParams,URL,location:{search,href:'https://example.com/game/'+search,replace(url){destination=url;}},localStorage:{getItem:k=>memory[k],setItem:(k,v)=>memory[k]=v}};
 vm.createContext(sb);
 for(const f of ['i18n','language','data','arenas'])vm.runInContext(fs.readFileSync(root+'/js/'+f+'.js','utf8'),sb);
 return {sb,memory,get destination(){return destination;},read:code=>vm.runInContext(code,sb)};
}
for(const lang of ['de','en']){
 const test=language('?lang='+lang);
 assert.equal(test.read('I18N.language'),lang);
 const values=test.read('CHARS.flatMap(c=>[c.bio,c.sp1.name,c.sp1.desc,c.sp2.name,c.sp2.desc,c.sup.name,c.finName,...Object.values(c.moves).map(m=>m.name)]).concat(Object.values(STYLE_NAMES),ARENAS.map(a=>a.city))');
 assert.equal(test.read('CHARS.length'),15);assert(values.every(v=>typeof v==='string'&&v.length>0&&!/[А-Яа-я]/.test(v)));
 assert.equal(test.read('localize("Choose your fighter")'),lang==='de'?'Wähle deinen Kämpfer':'Choose your fighter');
}
assert.equal(language('', 'en').read('I18N.language'),'en');assert.equal(language('?lang=bg').read('I18N.language'),'de');
const selection=language('?mobile=1&v=lang-1');selection.read('I18N.choose("en")');
assert.equal(JSON.parse(selection.memory.fightnow_language),'en');assert(selection.destination.includes('mobile=1'));assert(selection.destination.includes('lang=en'));
const catalog=language('?lang=de').read('I18N_DE');
for(const file of fs.readdirSync(root+'/js').filter(f=>f.endsWith('.js'))){
 const source=fs.readFileSync(root+'/js/'+file,'utf8');if(!source.includes('import * as THREE'))new vm.Script(source,{filename:file});
 for(const m of source.matchAll(/localize\(("(?:\\.|[^"\\])*")\)/g))assert(Object.hasOwn(catalog,JSON.parse(m[1])),'Missing German: '+m[1]);
}
for(const file of ['index.html','animation-gallery.html']){
 const html=fs.readFileSync(root+'/'+file,'utf8').replace(/<!--[^]*?-->|\/\*[^]*?\*\//g,'');assert(!/[А-Яа-я]/.test(html),file+' still contains Bulgarian');
 for(const m of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g))assert(Object.hasOwn(catalog,m[1]),'Missing DOM translation: '+m[1]);
}
for(const file of ['shop-ui','mobile-ui'])for(const m of fs.readFileSync(root+'/js/'+file+'.js','utf8').matchAll(/localize\(((?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*'))\)/g))assert(Object.hasOwn(catalog,vm.runInNewContext(m[1])),'Missing German shop text: '+m[1]);
console.log('PASS: DE/EN menus, 15 biographies and move sets, arena cities, complete translation keys, saved choice, URL preservation and no Bulgarian interface text.');
