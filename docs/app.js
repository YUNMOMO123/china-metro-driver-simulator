const LINES = [
  {city:'上海',name:'1 号线',color:'#e65a62',km:36.9,stations:'莘庄 外环路 莲花路 锦江乐园 上海南站 漕宝路 上海体育馆 徐家汇 衡山路 常熟路 陕西南路 黄陂南路 人民广场 新闸路 汉中路 上海火车站 中山北路 延长路 上海马戏城 汶水路 彭浦新村 共康路 通河新村 呼兰路 共富新村 宝安公路 友谊西路 富锦路'.split(' ')},
  {city:'北京',name:'2 号线 · 外环',color:'#327a9c',km:23.1,stations:'西直门 车公庄 阜成门 复兴门 长椿街 宣武门 和平门 前门 崇文门 北京站 建国门 朝阳门 东四十条 东直门 雍和宫 安定门 鼓楼大街 积水潭 西直门'.split(' ')},
  {city:'广州',name:'1 号线',color:'#e4bd4b',km:18.5,stations:'西塱 坑口 花地湾 芳村 黄沙 长寿路 陈家祠 西门口 公园前 农讲所 烈士陵园 东山口 杨箕 体育西路 体育中心 广州东站'.split(' ')},
  {city:'深圳',name:'1 号线',color:'#59b9a6',km:40.92,stations:'罗湖 国贸 老街 大剧院 科学馆 华强路 岗厦 会展中心 购物公园 香蜜湖 车公庙 竹子林 侨城东 华侨城 世界之窗 白石洲 高新园 深大 桃园 大新 鲤鱼门 前海湾 新安 宝安中心 宝体 坪洲 西乡 固戍 后瑞 机场东'.split(' ')},
  {city:'成都',name:'1 号线 · 科学城方向',color:'#528be0',km:37.5,stations:'韦家碾 升仙湖 火车北站 人民北路 文殊院 骡马市 天府广场 锦江宾馆 华西坝 省体育馆 倪家桥 桐梓林 火车南站 高新 金融城 孵化园 锦城广场 世纪城 天府三街 天府五街 华府大道 四河 华阳 海昌路 广福 红石公园 麓湖 武汉路 天府公园 西博城 广州路 兴隆湖 科学城'.split(' ')}
];

const $ = id => document.getElementById(id);
const dom = Object.fromEntries(['lineCards','lineTitle','direction','viewStation','distance','approachName','trainMarker','approachFill','speed','speedRing','speedLimit','notch','notchText','doorText','score','stopsDone','totalStops','elapsed','progressBar','routeCaption','stationList','eventArea','statusText','statusDot','cabView','doorBtn','startBtn','clock','helpBtn','helpDialog','closeHelp','helpOkay'].map(id=>[id,$(id)]));
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const formatTime=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}`;
let route, stops, game, lastFrame=0;

function buildStops(line){
  const n=line.stations.length-1;
  const weights=Array.from({length:n},(_,i)=>1+0.26*Math.sin(i*2.4+line.km)+0.13*Math.cos(i*1.1));
  const total=weights.reduce((a,b)=>a+b,0);
  let at=0;
  return [0,...weights.map(w=>(at+=line.km*1000*w/total))];
}
function chooseLine(index){
  route=LINES[index];stops=buildStops(route);
  game={running:false,finished:false,time:0,pos:0,speed:0,notch:0,doors:true,dwell:6,neededDwell:6,next:1,score:1000,event:null,eventUntil:0,eventCountdown:72+Math.random()*48,overspeedClock:0,logs:[],misses:0};
  document.documentElement.style.setProperty('--accent',route.color);
  dom.lineTitle.textContent=`${route.city}地铁 ${route.name}`;
  dom.direction.textContent=`${route.stations[0]} → ${route.stations.at(-1)} · ${route.stations.length} 站 · 约 ${route.km} km`;
  dom.routeCaption.textContent=`${route.stations[0]} → ${route.stations.at(-1)}`;
  dom.totalStops.textContent=route.stations.length-1;
  dom.notch.value=0;
  renderLineCards(index);renderStations();renderEvent();render();
}
function renderLineCards(selected){
  dom.lineCards.innerHTML=LINES.map((line,i)=>`<button type="button" class="line-card ${i===selected?'active':''}" data-index="${i}" style="--route-color:${line.color}" aria-pressed="${i===selected}"><span class="city">${line.city} METRO</span><strong>${line.name}</strong><span class="endpoints">${line.stations[0]} → ${line.stations.at(-1)}</span><span class="number">0${i+1}</span></button>`).join('');
  dom.lineCards.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>chooseLine(Number(button.dataset.index))));
}
function renderStations(){
  const focus=game.doors?Math.max(0,game.next-1):game.next;
  const start=clamp(focus-2,0,Math.max(0,route.stations.length-7));
  dom.stationList.innerHTML=route.stations.slice(start,start+7).map((name,j)=>{
    const i=start+j,klass=i<game.next-1?'done':i===focus?'current':'';
    return `<div class="station-row ${klass}"><span class="station-node"></span><span>${name}</span><small>${String(i+1).padStart(2,'0')}</small></div>`;
  }).join('');
}
function effectiveLimit(){
  let limit=80;
  if(game.event && game.time<game.eventUntil && ['track','signal'].includes(game.event.type))limit=game.event.type==='track'?35:25;
  if(game.next<stops.length && stops[game.next]-game.pos<380)limit=Math.min(limit,45);
  return limit;
}
function setNotch(value){
  if(!game)return;
  game.notch=clamp(Number(value),-4,4);
  dom.notch.value=game.notch;
  render();
}
function toggleDoor(){
  if(game.finished)return;
  if(game.doors){
    if(game.dwell<game.neededDwell){note(`请继续停站 ${Math.ceil(game.neededDwell-game.dwell)} 秒`);return;}
    game.doors=false;game.dwell=0;game.neededDwell=6;note('车门关闭，确认发车信号');
  }else{
    if(game.speed>1.5){note('列车尚未停稳，无法开门');return;}
    if(game.next>=stops.length){note('当前没有待停靠站');return;}
    const error=Math.abs(stops[game.next]-game.pos);
    if(error>35){note(`尚未进入 ${route.stations[game.next]} 站台停车范围`);return;}
    game.doors=true;game.notch=0;dom.notch.value=0;game.dwell=0;
    const gained=Math.max(20,120-Math.round(error*2));game.score+=gained;
    note(`${route.stations[game.next]} 停靠完成 · 停车误差 ${Math.round(error)} m · +${gained} 分`);
    game.next++;
    if(game.next>=stops.length){game.finished=true;game.running=false;note(`全程完成！最终得分 ${game.score}`);}
    renderStations();
  }
  render();
}
function note(message){game.logs.unshift(message);game.logs=game.logs.slice(0,3);renderEvent();}
function triggerEvent(){
  const kinds=['track','signal','crowd','traction'];
  const type=kinds[Math.floor(Math.random()*kinds.length)];
  const data={
    track:{title:'临时限速',body:'前方区间进行轨道检查，限速 35 km/h，持续约 35 秒。'},
    signal:{title:'信号机降级',body:'行车调度要求谨慎运行，限速 25 km/h，持续约 28 秒。'},
    crowd:{title:'站台客流增加',body:'下一站乘降时间延长 6 秒，请确保车门停开足时。'},
    traction:{title:'牵引系统提示',body:'牵引输出暂时受限至 P2，持续约 35 秒。'}
  }[type];
  game.event={type,...data,ack:false};
  game.eventUntil=game.time+(type==='signal'?28:35);
  game.eventCountdown=85+Math.random()*55;
  if(type==='crowd')game.neededDwell=12;
  note(`调度提示：${data.title}`);
}
function renderEvent(){
  if(!game)return;
  if(game.event){
    const e=game.event,remaining=Math.max(0,Math.ceil(game.eventUntil-game.time));
    dom.eventArea.innerHTML=`<div class="event-card"><span class="event-type">⚠ RANDOM EVENT / ${remaining}s</span><strong>${e.title}</strong><p>${e.body}</p>${e.ack?'<span class="event-clear">已确认 · 按调度要求运行</span>':'<button id="ackEvent" type="button">收到调度指令</button>'}</div>`;
    dom.eventArea.querySelector('#ackEvent')?.addEventListener('click',()=>{e.ack=true;renderEvent();});
  }else if(game.finished){dom.eventArea.innerHTML=`<div class="dispatch-idle"><span class="signal-icon">★</span><strong>任务完成</strong><p>全程得分 ${game.score}。选择另一座城市继续驾驶。</p></div>`;}
  else if(game.logs.length){dom.eventArea.innerHTML=`<div class="event-clear">◉ 线路状态正常</div><p class="log-line">${game.logs[0]}</p>`;}
  else dom.eventArea.innerHTML='<div class="dispatch-idle"><span class="signal-icon">◉</span><strong>线路状态正常</strong><p>注意前方信号与限速。随机事件会在行车途中出现。</p></div>';
}
function tick(dt){
  if(!game.running||game.finished)return;
  const sim=clamp(dt,0,.06)*4;
  game.time+=sim;
  const limit=effectiveLimit();
  let acc=0;
  if(game.notch>0 && !game.doors){
    const power=game.event?.type==='traction'&&game.time<game.eventUntil?Math.min(game.notch,2):game.notch;
    acc=power*.29;
  }else if(game.notch<0)acc=game.notch*.38;
  const resistance=game.speed>0?.025:0;
  game.speed=clamp(game.speed+(acc-resistance)*sim*3.6,0,90);
  if(game.doors && game.speed>0){game.speed=0;game.notch=0;dom.notch.value=0;game.score=Math.max(0,game.score-20);note('车门开启，牵引联锁已切断 · -20 分');}
  game.pos+=game.speed/3.6*sim;
  if(game.doors)game.dwell+=sim;
  if(game.speed>limit+2){game.overspeedClock+=sim;if(game.overspeedClock>2){game.score=Math.max(0,game.score-5);game.overspeedClock=0;}}else game.overspeedClock=0;
  if(game.next<stops.length && game.pos>stops[game.next]+50){
    note(`${route.stations[game.next]} 过站 · -150 分`);game.score=Math.max(0,game.score-150);game.next++;game.misses++;renderStations();
    if(game.next>=stops.length){game.finished=true;game.running=false;note(`终点过站，任务结束 · ${game.score} 分`);}
  }
  if(game.event && game.time>=game.eventUntil){game.event=null;renderEvent();}
  if(!game.event && game.speed>8){game.eventCountdown-=sim;if(game.eventCountdown<=0 && game.next<stops.length-1)triggerEvent();}
  render();
}
function render(){
  if(!game)return;
  const target=clamp(game.next,1,stops.length-1),left=Math.max(0,stops[target]-game.pos),leg=stops[target]-stops[target-1];
  const fraction=clamp(1-left/leg,0,1),routeFraction=clamp(game.pos/stops.at(-1),0,1);
  dom.speed.textContent=Math.round(game.speed);
  dom.speedRing.style.background=`conic-gradient(from 220deg, ${game.speed>effectiveLimit()+2?'#ffb157':route.color} 0deg ${Math.max(1,game.speed/90*280)}deg, #364e59 ${Math.max(1,game.speed/90*280)}deg 280deg, transparent 280deg)`;
  dom.speedLimit.textContent=effectiveLimit();
  dom.distance.innerHTML=`${Math.ceil(left).toLocaleString('zh-CN')} <small>m</small>`;
  dom.approachName.textContent=route.stations[target];dom.viewStation.textContent=route.stations[target];
  dom.trainMarker.style.left=`${fraction*100}%`;dom.approachFill.style.width=`${fraction*100}%`;
  dom.notchText.textContent=game.notch===0?'N · 惰行':game.notch>0?`P${game.notch} · 牵引`:game.notch===-4?'EB · 紧急制动':`B${Math.abs(game.notch)} · 制动`;
  dom.doorText.textContent=game.doors?'已开启':'已关闭';dom.score.textContent=game.score;
  dom.stopsDone.textContent=game.next-1;dom.elapsed.textContent=formatTime(game.time);
  dom.progressBar.style.width=`${routeFraction*100}%`;
  dom.cabView.classList.toggle('moving',game.speed>3);
  dom.statusText.textContent=game.finished?'任务完成':!game.running?'等待发车':game.doors?'车门开启':game.speed>0?'运行中':'待命';
  dom.statusDot.style.background=game.finished?'#f2c96f':game.doors?'#edb760':'#4dd79b';
  dom.doorBtn.textContent=game.doors?'关闭车门':'开启车门';
  dom.startBtn.innerHTML=game.finished?'完成':game.running?'暂停模拟 <span>Ⅱ</span>':game.time>0?'继续驾驶 <span>→</span>':'开始驾驶 <span>→</span>';
  dom.startBtn.disabled=game.finished;
  const seconds=7*3600+30*60+Math.floor(game.time);
  dom.clock.textContent=`${String(Math.floor(seconds/3600)%24).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
dom.notch.addEventListener('input',e=>setNotch(e.target.value));
dom.doorBtn.addEventListener('click',toggleDoor);
dom.startBtn.addEventListener('click',()=>{if(game.finished)return;game.running=!game.running;render();});
document.addEventListener('keydown',e=>{
  if(dom.helpDialog.open || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  if(e.key==='ArrowUp'){e.preventDefault();setNotch(game.notch+1);}
  if(e.key==='ArrowDown'){e.preventDefault();setNotch(game.notch-1);}
  if(e.code==='Space'){e.preventDefault();setNotch(-4);}
});
dom.helpBtn.addEventListener('click',()=>dom.helpDialog.showModal());
dom.closeHelp.addEventListener('click',()=>dom.helpDialog.close());
dom.helpOkay.addEventListener('click',()=>dom.helpDialog.close());
function frame(now){if(lastFrame)tick((now-lastFrame)/1000);lastFrame=now;requestAnimationFrame(frame);}
chooseLine(0);requestAnimationFrame(frame);

