
"use strict";
const D = JSON.parse(document.getElementById("guide-data").textContent);
const SEED = JSON.parse(document.getElementById("guide-state").textContent);
const STORE = "slow-central-europe-v1-" + (SEED.revision || "original");
const dates = new Set(D.days.map(x=>x.date));
const knownPlaces = new Set(D.places.map(x=>x.id));
const allowedViews = ["overview","days","explore","logistics","prepare","mine","sources"];
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clean = (s,n=6000) => typeof s==="string" ? s.slice(0,n) : "";
function normalize(raw) {
  const x=raw && typeof raw==="object" ? raw : {};
  const n={routes:{},dayNotes:{},dayTitles:{},dayWakes:{},edits:{},placeNotes:{},favorites:[],checks:{},customPlaces:[],globalNote:clean(x.globalNote,30000),savedAt:clean(x.savedAt,100),view:allowedViews.includes(x.view)?x.view:"overview",day:dates.has(x.day)?x.day:D.days[0].date};
  for (const day of D.days) {
    const rid=x.routes?.[day.date];
    if(day.routes.some(r=>r.id===rid)) n.routes[day.date]=rid;
    if(typeof x.dayNotes?.[day.date]==="string") n.dayNotes[day.date]=clean(x.dayNotes[day.date],20000);
    if(typeof x.dayTitles?.[day.date]==="string") n.dayTitles[day.date]=clean(x.dayTitles[day.date],150);
    if(typeof x.dayWakes?.[day.date]==="string") n.dayWakes[day.date]=clean(x.dayWakes[day.date],60);
    for (const r of day.routes) {
      const steps=x.edits?.[day.date]?.[r.id];
      if(Array.isArray(steps)) {
        n.edits[day.date] ||= {};
        n.edits[day.date][r.id]=steps.slice(0,35).filter(v=>v&&typeof v==="object").map(v=>({time:clean(v.time,60),title:clean(v.title,250),body:clean(v.body,5000),fixed:false,refs:[]}));
      }
    }
  }
  if(Array.isArray(x.customPlaces)) n.customPlaces=x.customPlaces.slice(0,100).filter(p=>p&&typeof p.id==="string"&&/^custom-[a-z0-9-]+$/.test(p.id)).map(p=>({
    id:p.id,city:["布达佩斯","维也纳","湖区","布拉格"].includes(p.city)?p.city:"布拉格",name:clean(p.name,160)||"新备选",
    kind:["街区","吃喝","风景","室内","放空"].includes(p.kind)?p.kind:"放空",weather:p.weather==="雨天可用"?"雨天可用":"晴阴",
    time:clean(p.time,100)||"自己决定",budget:"个人新增，尚未核验",why:clean(p.why,7000),do:"详见你的备注。",
    access:"在地图中确认实际位置与交通。",hours:"尚未核验",caution:"个人新增内容，不属于已研究或已预订信息。",refs:[],map:clean(p.map,250)||clean(p.name,160),effort:"自选",custom:true}));
  const allIds=new Set([...knownPlaces,...n.customPlaces.map(p=>p.id)]);
  if(Array.isArray(x.favorites)) n.favorites=[...new Set(x.favorites.filter(id=>allIds.has(id)))];
  for(const id of allIds) if(typeof x.placeNotes?.[id]==="string") n.placeNotes[id]=clean(x.placeNotes[id],10000);
  for(const item of D.checklist) n.checks[item.id]=!!x.checks?.[item.id];
  return n;
}
let state=normalize(SEED.state);
let storageOkay=true;
try { const stored=localStorage.getItem(STORE); if(stored) state=normalize(JSON.parse(stored)); } catch(e) { storageOkay=false; }
let currentView=state.view;
let currentDay=state.day;
let filter={query:"",city:"布达佩斯",kind:"全部类型",weather:"全部天气",favorites:false,category:"游玩"};
let editorContext=null;
let toastTimer=null;
const app=document.getElementById("app");
const modal=document.getElementById("editor");
const allPlaces=()=>[...D.places,...state.customPlaces];
const dateShort=s=>`${Number(s.slice(5,7))}/${Number(s.slice(8,10))}`;
const dayTitle=d=>state.dayTitles[d.date]||d.title;
const dayWake=d=>state.dayWakes[d.date]||d.wake;
const getDay=()=>D.days.find(d=>d.date===currentDay)||D.days[0];
function getRoute(d) {
  const base=d.routes.find(r=>r.id===state.routes[d.date])||d.routes[0];
  return {...base,steps:state.edits[d.date]?.[base.id] || base.steps};
}
function toast(t) {
  const el=document.getElementById("toast"); el.textContent=t; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),3800);
}
function save() {
  state.savedAt=new Date().toISOString(); state.view=currentView; state.day=currentDay;
  try {localStorage.setItem(STORE,JSON.stringify(state));storageOkay=true;} catch(e){storageOkay=false;}
  updateStatus();
}
function updateStatus() {
  const el=document.getElementById("save-status");
  el.classList.toggle("failed",!storageOkay);
  el.textContent=storageOkay?(state.savedAt?"已保存在此浏览器":"本地版 · 仅此设备"):"请导出备份";
  document.getElementById("storage-warning").classList.toggle("visible",!storageOkay);
}
function sourceLinks(ids=[]) {
  return `<div class="refs">${[...new Set(ids)].map(id=>{
    const s=D.sources[id]; if(!s)return "";
    return s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.kind+" · "+s.note)}">${esc(s.label)} ↗</a>` : `<span>${esc(s.label)}</span>`;
  }).join("")}</div>`;
}
function mapURL(query) {return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(query);}
function directionsURL(origin,destination) {return "https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(origin)+"&destination="+encodeURIComponent(destination)+"&travelmode=transit";}
function mapLink(q,label="地图 ↗"){return `<a class="link-button" href="${esc(mapURL(q))}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;}
function footer(){return `<footer class="app-footer"><span>研究快照 ${D.meta.updated} · 所有游玩与接驳时刻均为建议，票面时间单独标记。</span><span>本地保存，不是云同步 · <a href="#sources" data-action="view" data-view="sources">查看来源</a></span></footer>`;}
function setView(v,scroll=true){
  if(!allowedViews.includes(v))v="overview";
  currentView=v; save(); render();
  if(scroll)window.scrollTo({top:0,behavior:"instant"});
}
function openDay(id){if(dates.has(id))currentDay=id;setView("days");}
function heading(k,title,sub,action=""){return `<div class="page-head"><div><div class="eyebrow">${esc(k)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${action?`<div class="head-actions">${action}</div>`:""}</div>`;}
function render(){
  removeCityMap();
  app.classList.toggle("explorer-content",currentView==="explore");
  document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===currentView));
  const renders={overview:renderHome,days:renderDay,explore:renderExplore,logistics:renderLogistics,prepare:renderPrepare,mine:renderMine,sources:renderSources};
  app.innerHTML=renders[currentView]()+footer();
  updateStatus();
  if(currentView==="explore")setupCityMap();
  if(currentView==="days") {
    const active=document.querySelector(".date-tab.active");
    if(active)active.scrollIntoView({block:"nearest",inline:"center",behavior:"instant"});
  }
}
function renderHome(){
  return `<section class="selection-hero"><div class="eyebrow">CENTRAL EUROPE · YOUR SHORTLIST</div><h1>先挑喜欢的地方，<br>再把它们串成旅程。</h1><p>不急着填满每一天。先看看四个地方有什么好玩的、需要接受什么取舍，收藏你们真正想去的。</p><div class="selection-steps"><span><b>01</b> 看实景与亮点</span><span><b>02</b> 对照地图和酒店</span><span><b>03</b> 收藏，再安排交通</span></div></section><section class="city-door-grid">${Object.entries(CITY_GUIDES).map(([city,c])=>{const p=D.places.find(p=>p.id===c.cover),count=D.places.filter(p=>p.city===city).length;return `<button class="city-door" data-action="city" data-city="${city}">${p?.photo?.url?`<img src="${esc(p.photo.url)}" alt="${esc(p.photo.caption)}" loading="lazy" referrerpolicy="no-referrer">`:""}<span class="city-door-copy"><small>${esc(c.label)}</small><strong>${city}</strong><span>${count} 个游玩、吃喝与休息候选</span><b>打开地点与地图 ↗</b></span></button>`}).join("")}</section><div class="selection-note"><strong>你们先做选择，我们再排路线。</strong><p>公共花园、小镇、街区、湖景与当地体验优先；艺术馆只是少量可跳过的备选。已订酒店与交通继续保留在侧栏，原有日程仅作参考。</p><button data-action="view" data-view="mine">看已经收藏的 ${state.favorites.length} 个地点 →</button></div>`;
}
function timeValue(s){const m=/(\d{1,2}):(\d{2})/.exec(s);return m?Number(m[1])*60+Number(m[2]):1500;}
function timelineHTML(events){
  return `<div class="timeline">${events.map(e=>`<div class="timeline-event ${e.fixed?"fixed":""}"><div class="event-time">${esc(e.time)}${e.fixed?'<br><span class="chip fixed" style="font-size:9px;padding:2px 5px;margin-top:5px">票面时间</span>':""}</div><div><h4>${esc(e.title)}</h4><p>${esc(e.body)}</p>${sourceLinks(e.refs)}</div></div>`).join("")}</div>`;
}
function placePhoto(p, variant="card") {
  const photo=p?.photo;
  if(!photo?.url) return `<div class="photo-unavailable"><span>实景照片待补</span>${p?`<a class="link-button" href="${esc(p.photoPage||mapURL(p.map))}" target="_blank" rel="noopener noreferrer">查看该地点实景 ↗</a>`:""}</div>`;
  return `<figure class="place-photo photo-${variant}"><div class="photo-frame"><img src="${esc(photo.url)}" alt="${esc(photo.caption||p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><div class="photo-fallback">图片暂时无法加载，请打开图片来源看实景。</div></div><figcaption><span>${esc(photo.caption||p.name)}</span><a href="${esc(photo.page)}" target="_blank" rel="noopener noreferrer">${esc(photo.credit||"图片来源")} ↗</a></figcaption></figure>`;
}
function renderDay(){
  const d=getDay(),r=getRoute(d),hotel=D.hotels.find(h=>h.id===d.hotel);
  const events=[...d.common,...r.steps].sort((a,b)=>timeValue(a.time)-timeValue(b.time));
  const edited=!!state.edits[d.date]?.[r.id];
  return `<div class="date-strip" aria-label="选择日期">${D.days.map(x=>`<button class="date-tab ${x.date===d.date?"active":""}" data-action="day" data-day="${x.date}" aria-pressed="${x.date===d.date}"><b>${dateShort(x.date)}</b><small>${esc(x.weekday)} · ${esc(x.city.split(" → ")[0])}</small></button>`).join("")}</div>
  <div class="day-title"><div><div class="eyebrow">DAY ${D.days.indexOf(d)+1} / ${dateShort(d.date)} ${d.weekday} · ${esc(d.city)}</div><h1 style="margin-top:8px">${esc(dayTitle(d))}</h1></div><div class="actions"><button class="small" data-action="edit-day">编辑当天</button><button class="small ghost" data-action="print">打印</button></div></div>
  <p class="day-intro">${esc(d.intro)}</p>
  <div class="chips"><span class="chip">起床 ${esc(dayWake(d))}</span><span class="chip">${esc(d.pace)}</span><span class="chip outline">活动时间为建议，不是预约</span>${edited?'<span class="chip warm">此玩法已修改</span>':""}</div>
  <div class="anchor-box"><h3>先守住这些时间与条件</h3><div class="chips">${d.anchors.map(t=>`<span class="chip">${esc(t)}</span>`).join("")}</div></div>
  <div class="day-layout"><section><div class="section-head"><h2>今天怎么过</h2><span class="tiny muted">选一个，不是全都做</span></div><div class="route-choices">${d.routes.map(x=>`<button class="route-choice ${x.id===r.id?"active":""}" data-action="route" data-route="${x.id}" aria-pressed="${x.id===r.id}"><span class="radio"></span><span><b>${esc(x.title)}</b><small>${esc(x.fit)}</small></span></button>`).join("")}</div><p class="route-reason">${esc(r.why)}</p>${timelineHTML(events)}<div class="section"><div class="section-head"><h2>这条路线上可以选择</h2><span class="tiny muted">详细营业与交通在卡片里</span></div><div class="stack">${r.spots.map(id=>allPlaces().find(p=>p.id===id)).filter(Boolean).map(p=>placeCard(p,true)).join("")||'<p class="muted">今天不安排新景点。</p>'}</div></div></section>
  <aside class="day-aside">${hotel?`<div class="card aside-card"><div class="eyebrow">TONIGHT</div><h3 style="margin-top:9px">${esc(hotel.name)}</h3><p>${esc(hotel.nights)}</p><p><strong>入住</strong> ${esc(hotel.checkin)}<br><strong>退房</strong> ${esc(hotel.checkout)}</p><p class="address">${esc(hotel.address)}</p>${mapLink(hotel.address,"酒店定位 ↗")}<p class="tiny muted" style="margin-top:12px">${esc(hotel.note)}</p></div>`:""}
  <div class="card aside-card"><h3>今天吃什么</h3><p>${esc(d.food)}</p></div>
  <div class="card aside-card"><h3>别踩这些坑</h3>${d.watch.map(w=>`<div class="warning">${esc(w)}</div>`).join("")}</div>
  <div class="card aside-card note-card"><label class="label" for="day-note">今天的共同决定 / 预约记录</label><textarea id="day-note" class="note-field" data-note-day="${d.date}" placeholder="例如：18:00 餐厅已经确认。下雨就取消湖边，改咖啡馆。">${esc(state.dayNotes[d.date]||"")}</textarea><p class="tiny muted" style="margin-top:9px">输入即保存到此浏览器。换设备请导出。</p></div></aside></div>
  <div class="section actions"><button data-action="day" data-day="${D.days[Math.max(0,D.days.indexOf(d)-1)].date}" ${D.days.indexOf(d)===0?"disabled":""}>← 前一天</button><button data-action="day" data-day="${D.days[Math.min(D.days.length-1,D.days.indexOf(d)+1)].date}" ${D.days.indexOf(d)===D.days.length-1?"disabled":""}>后一天 →</button></div>`;
}
function placeCard(p,compact=false,mapIndex=null){
  const fav=state.favorites.includes(p.id);
  const hotelForCity=D.hotels.find(h=>h.city===p.city&&h.id!=="tribe");
  return `<article class="place-card visual-place" id="place-${esc(p.id)}" data-place-id="${esc(p.id)}" tabindex="0">${mapIndex?`<span class="place-map-number">${String(mapIndex).padStart(2,"0")}</span>`:""}${!p.custom?placePhoto(p):""}<div class="place-content"><div class="place-top"><div><div class="eyebrow">${esc(p.city)} / ${esc(p.kind)}</div><h3>${esc(p.name)}</h3></div><button class="fav ${fav?"active":""}" data-action="favorite" data-place="${esc(p.id)}" aria-label="${fav?"取消收藏":"收藏"} ${esc(p.name)}" aria-pressed="${fav}">${fav?"★":"☆"}</button></div><div class="chips"><span class="chip">${esc(p.weather)}</span><span class="chip outline">停留 ${esc(p.time)}</span>${p.custom?'<span class="chip warm">个人新增 · 未核验</span>':""}</div>
  ${p.booking?`<div class="booking-info"><span class="booking-status">${esc(p.booking.status)}</span><p>${esc(p.booking.detail)}</p>${p.booking.url?`<a href="${esc(p.booking.url)}" target="_blank" rel="noopener noreferrer">预约 / 官方说明 ↗</a>`:""}</div>`:""}${p.intro?`<p class="place-intro">${esc(p.intro)}</p>`:""}${p.appearance?`<p class="place-appearance">${esc(p.appearance)}</p>`:""}${p.highlights?.length?`<div class="place-highlights">${p.highlights.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`:""}
  <div class="place-experience"><div><span>去了做什么</span><p>${esc(p.do)}</p></div><div><span>为什么推荐给你们</span><p>${esc(p.why)}</p></div>${p.bestTime?`<div class="best-time"><span>建议什么时候去</span><p>${esc(p.bestTime)}</p></div>`:""}${p.tradeoff?`<div class="place-tradeoff"><span>不足 / 可能不喜欢</span><p>${esc(p.tradeoff)}</p></div>`:""}</div>
  ${p.coordinateNote?`<p class="coordinate-note">地图标记：${esc(p.coordinateNote)}</p>`:""}<details><summary>营业、预算与我的备注</summary><dl><dt>原交通参考（选好后再规划）</dt><dd>${esc(p.access)}</dd><dt>营业 / 季节限制</dt><dd>${esc(p.hours)}</dd><dt>预算</dt><dd>${esc(p.budget)}。标为预算的数字不是实时菜单价。</dd><dt>提醒</dt><dd>${esc(p.caution)}</dd></dl>${sourceLinks(p.refs)}<div class="form-field" style="margin-top:16px"><label class="label" for="note-${esc(p.id)}">我的备注</label><textarea class="place-note" id="note-${esc(p.id)}" data-note-place="${esc(p.id)}" placeholder="要吃什么、想坐哪里、已订时间……">${esc(state.placeNotes[p.id]||"")}</textarea></div>${p.custom?`<button class="small danger" data-action="delete-place" data-place="${esc(p.id)}">删除这个个人备选</button>`:""}</details><div class="actions">${currentView==="explore"?`<button class="small map-locate" data-action="show-place-map" data-place="${esc(p.id)}">地图定位 ↗</button>`:""}${mapLink(p.map,"外部地图 / 实景 ↗")}${(p.relatedMaps||[]).map(m=>mapLink(m.query,m.label+" ↗")).join("")}${hotelForCity&&currentView!=="explore"?`<a class="link-button" href="${esc(directionsURL(hotelForCity.address,p.map))}" target="_blank" rel="noopener noreferrer">从住宿地规划交通 ↗</a>`:""}</div></div></article>`;
}
function filterPlaces(){
  const q=filter.query.trim().toLowerCase();
  return allPlaces().filter(p=>p.city===filter.city&&(filter.category==="全部"||(filter.category==="游玩"?!(p.kind==="吃喝"||p.id==="bp-rest"):(p.kind==="吃喝"||p.id==="bp-rest")))&&(filter.kind==="全部类型"||p.kind===filter.kind)&&(filter.weather==="全部天气"||p.weather===filter.weather)&&(!filter.favorites||state.favorites.includes(p.id))&&(!q||[p.name,p.city,p.intro,p.appearance,...(p.highlights||[]),p.bestTime,p.tradeoff,p.why,p.do,p.access,p.hours,p.caution,p.kind].join(" ").toLowerCase().includes(q)));
}
function resultHTML(){
  const items=filterPlaces();
  return `<div class="result-count"><span role="status">${items.length} 个选择 · 先看实景与体验，再决定要不要去</span><button class="small ${filter.favorites?"primary":""}" data-action="filter-favorites">${filter.favorites?"★ 只看收藏":"☆ 只看收藏"}</button></div><div class="place-grid">${items.length?items.map((p,i)=>placeCard(p,false,i+1)).join(""):'<div class="empty">没有匹配结果。换一个城市、天气或关键词试试。</div>'}</div>`;
}
function renderExplore(){
  const options=(values,selected)=>values.map(x=>`<option ${x===selected?"selected":""}>${esc(x)}</option>`).join("");
  const city=CITY_GUIDES[filter.city];
  return `<div class="city-tabs" aria-label="选择目的地">${Object.keys(CITY_GUIDES).map(name=>`<button data-action="city" data-city="${name}" aria-pressed="${filter.city===name}" class="${filter.city===name?"active":""}">${name}<small>${D.places.filter(p=>p.city===name).length} 个候选</small></button>`).join("")}</div><div class="city-heading"><div><div class="eyebrow">${esc(city.label)}</div><h1>${esc(filter.city)}，有哪些值得去？</h1><p>${esc(city.intro)}</p></div><button class="small" data-action="add-place">＋ 新增备选</button></div><div class="category-tabs" aria-label="候选类型">${[["游玩","风景与游玩"],["吃喝","吃喝与休息"],["全部","全部候选"]].map(([id,label])=>`<button data-action="category" data-category="${id}" aria-pressed="${filter.category===id}" class="${filter.category===id?"active":""}">${label}</button>`).join("")}</div><div class="explore-layout"><section class="explore-list"><div class="filterbar city-filter"><label class="search-filter">搜地点或体验<input id="search-places" data-filter="query" value="${esc(filter.query)}" placeholder="例如：湖景、市集、咖啡"></label><label>天气<select data-filter="weather">${options(["全部天气","晴阴","雨天可用","晴天限定"],filter.weather)}</select></label></div><div id="explore-results" class="explore-results">${resultHTML()}</div></section>${mapPanel()}</div>`;
}
function renderLogistics(){
  return heading("THE FIXED PART","先保住交通，再自由安排","以下票面与酒店规则来自你的最新版文本。站台、登机口、临时变更以运营通知为准。",'<button class="small" data-action="print">打印当前页</button>')+
  `<div class="callout cool"><h3>两个名字不能弄错</h3><p>9/27 上车站是 <strong>Budapest-Kelenföld</strong>，不是 Keleti。布拉格酒店是 <strong>Lindner Hotel Prague Castle</strong>，不再是 Comfort Hotel Prague City East。</p></div>
  <section class="section"><div class="section-head"><h2>5 家酒店 / 9 晚</h2><span class="tiny muted">提前到店 ≠ 已获提前入住</span></div><div class="stack">${D.hotels.map(h=>`<article class="card hotel-row"><div><div class="eyebrow">${esc(h.city)} / ${esc(h.nights)}</div><h3 style="margin-top:8px">${esc(h.name)}</h3><p class="address">${esc(h.address)}</p><div class="hotel-times"><div><small>标准入住</small>${esc(h.checkin)}</div><div><small>标准退房</small>${esc(h.checkout)}</div></div><div class="actions">${mapLink(h.address,"地图定位 ↗")}${h.phone?`<a class="link-button" href="tel:${esc(h.phone.replace(/\s/g,""))}">致电酒店</a>`:""}${h.email?`<a class="link-button" href="mailto:${esc(h.email)}">发邮件</a>`:""}</div></div><div><h4>本次实际衔接</h4><p style="font-size:13px">${esc(h.actual)}</p><p class="note">${esc(h.note)}</p>${sourceLinks(h.refs)}</div></article>`).join("")}</div></section>
  <section class="section"><div class="section-head"><h2>已订长途交通</h2></div><div class="stack">${D.trips.map(t=>`<article class="card trip-card"><div class="trip-head"><div><div class="eyebrow">${esc(t.date)} · ${esc(t.mode)} · ${esc(t.name)}</div><h3>${esc(t.route)}</h3><div class="tiny muted">${esc(t.duration)}</div></div><div class="trip-clock">${esc(t.time)}</div></div><div class="trip-legs">${t.legs.map(l=>`<div>${esc(l)}</div>`).join("")}</div><p class="seat">${esc(t.seats)}</p><div class="grid2"><div><h4>出发前</h4><p>${esc(t.before)}</p></div><div><h4>抵达后</h4><p>${esc(t.after)}</p></div></div>${sourceLinks(t.refs)}</article>`).join("")}</div></section>
  <section class="section callout"><h3>接驳还没有自动变成预订</h3><p>建议的接站时间、打车到店窗口和机场提前量，都不是已确认车辆班次。请在准备清单里落实司机与酒店回复。公交票与季节运营信息在“准备与实用”里。</p><div class="actions" style="margin-top:12px"><button data-action="view" data-view="prepare">查看待办与实用信息 →</button></div></section>`;
}
function checkHTML(){
  const groups=[...new Set(D.checklist.map(x=>x.group))];
  return groups.map(g=>`<div class="check-group"><h3>${esc(g)}</h3><div class="card">${D.checklist.filter(x=>x.group===g).map(x=>`<div class="check-row ${state.checks[x.id]?"done":""}"><input type="checkbox" id="check-${x.id}" data-check="${x.id}" ${state.checks[x.id]?"checked":""}><div><label for="check-${x.id}">${esc(x.title)}</label><p>${esc(x.detail)}</p>${sourceLinks(x.refs)}</div></div>`).join("")}</div></div>`).join("");
}
function renderPrepare(){
  const done=D.checklist.filter(x=>state.checks[x.id]).length;
  return heading("BEFORE YOU GO","准备与实用","先落实几件真正影响体验的事。餐馆、车辆和额外活动目前都未由本攻略代订。")+
  `<div class="card compact" style="margin-bottom:24px"><div class="section-head" style="margin:0"><strong>准备进度</strong><span class="tiny muted" id="check-count">${done} / ${D.checklist.length} 项</span></div><div class="progress-bar"><span id="check-progress" style="width:${done/D.checklist.length*100}%"></span></div></div>
  <div class="section-links" style="margin-bottom:25px"><button data-action="jump" data-target="prep-checks">预约与准备清单</button><button data-action="jump" data-target="practical-info">交通 / 预算 / 雨天 / 英文模板</button></div><section id="prep-checks">${checkHTML()}</section>
  <section id="practical-info" class="section"><div class="section-head"><h2>实用手册</h2><span class="tiny muted">按需展开</span></div><div class="stack">${D.practical.map((p,i)=>`<details class="card accordion" ${i===0?"open":""}><summary>${esc(p.title)}</summary><div class="accordion-body">${p.items.map(t=>`<p>${esc(t)}</p>`).join("")}${sourceLinks(p.refs)}</div></details>`).join("")}</div></section>`;
}
function renderMine(){
  const notedDays=D.days.filter(d=>state.dayNotes[d.date]||state.edits[d.date]||state.dayTitles[d.date]||state.routes[d.date]);
  return heading("YOUR EDITION","我的调整与备份","所有修改只存在当前浏览器。换设备、清缓存或分享给同行人前，请先导出。")+
  `<div class="grid2"><div class="card"><h2>保存与分享</h2><p class="muted" style="font-size:13px">“可分享网页”包含攻略、已选路线、收藏和笔记，对方打开后可继续编辑。“备份 JSON”便于导入此版本或后续交给 ChatGPT 继续修改。</p><div class="actions"><button class="primary" data-action="export-html">导出可分享网页</button><button data-action="export-json">备份 JSON</button><button data-action="import">导入备份</button></div><p class="tiny muted" style="margin-top:15px">网页公开可访问，个人修改仍只存此浏览器，不会自动同步到同行人的设备。实景图片、地图和来源链接需要联网。</p></div>
  <div class="card"><h2>共同约定</h2><textarea id="global-note" data-global-note placeholder="例如：饭店不用每顿预订。下雨不爬山。每天下午至少坐下来休息一次。">${esc(state.globalNote)}</textarea><p class="tiny muted" style="margin-top:9px">不用按“保存”，输入即存。导出给同行人后各自的修改不会自动合并。</p></div></div>
  <section class="section"><div class="section-head"><h2>已经选好的玩法与笔记</h2><button class="small" data-action="view" data-view="days">去改行程</button></div><div class="card">${D.days.map(d=>{const r=getRoute(d);return `<div class="mine-day"><h4>${dateShort(d.date)} ${esc(d.city)} · ${esc(r.title)} ${state.edits[d.date]?.[r.id]?'<span class="chip warm">已改时刻</span>':""}</h4>${state.dayNotes[d.date]?`<p>${esc(state.dayNotes[d.date])}</p>`:'<p class="tiny muted">还没有当天备注。</p>'}<button class="small ghost" data-action="day" data-day="${d.date}">打开这一天 →</button></div>`;}).join("")}</div></section>
  <section class="section"><div class="section-head"><h2>收藏的地点 <span class="muted">${state.favorites.length}</span></h2><button class="small" data-action="add-place">＋ 新增备选</button></div><div class="place-grid">${allPlaces().filter(p=>state.favorites.includes(p.id)).map(p=>placeCard(p)).join("")||'<div class="empty">还没有收藏。在备选卡片点 ☆，这里就会出现。</div>'}</div></section>
  <section class="section"><div class="callout cool"><h3>继续 refine 的方式</h3><p>把导出的 HTML 或 JSON 发回对话，并说明想改的日期、喜欢/不喜欢的地方、已收到的预约回复。下一版就能保留你们的决定，而不是从头重排。</p></div></section>
  <section class="section"><button class="small danger" data-action="reset">重置此浏览器的所有修改</button></section>`;
}
function renderSources(){
  return heading("RESEARCH NOTES","来源、边界与核验记录",`研究快照：${D.meta.updated}。共 ${Object.keys(D.sources).length} 条来源/依据，优先使用运营方、商家、场馆与旅游局。`) +
  `<div class="grid3"><div class="card compact"><h3>用户确认</h3><p class="tiny muted">住宿与长途车票来自你这次最新文字，不声称已重新读取所有订单。</p></div><div class="card compact"><h3>公开信息已查</h3><p class="tiny muted">营业日、季节安排、当前发布票价等。已查不等于保证当天不变。</p></div><div class="card compact"><h3>规划估算</h3><p class="tiny muted">起床、短途接驳、餐饮预算与游玩时长。没有把这些包装为实时班次或报价。</p></div></div>
  <div class="section callout"><h3>这次研究中主动排除的坑</h3><p>Gosausee 左岸落石封闭；542 下载页给到冬季表；Steegwirt 周一周二不营业；Moserwirt 周三休息；Anzengruber 对你们的维也纳停留时间不合适；Koppenbrüller 洞穴在你们抵达湖区前已结束季节；Jiřák 不能下午才到还假定摊位齐全。</p>${sourceLinks(["gosau","bus542","steegwirt","moser","anzengruber","dachstein","jirakrules"])}</div>
  <div class="section card">${Object.entries(D.sources).map(([id,s])=>`<div class="source-row"><span class="chip outline">${esc(s.kind)}</span><div>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`:`<strong>${esc(s.label)}</strong>`}</div>${s.note?`<p>${esc(s.note)}</p>`:""}</div>`).join("")}</div>`;
}
function openEditor(mode){
  if(modal.open)modal.close();
  if(mode==="day"){
    const d=getDay(),r=getRoute(d);editorContext={mode,date:d.date,route:r.id};
    const text=r.steps.map(e=>`${e.time} | ${e.title} | ${e.body}`).join("\n");
    modal.innerHTML=`<form id="edit-form"><div class="dialog-body"><div class="dialog-head"><div><div class="eyebrow">${dateShort(d.date)} · ${esc(r.title)}</div><h2>编辑这一天</h2></div><button type="button" class="small ghost" data-action="close-dialog" aria-label="关闭">×</button></div><p class="tiny muted">只修改选中玩法的自由活动。票面车次、酒店规则与固定交通不会跟着改变。</p><div class="grid2"><div class="form-field"><label class="label" for="edit-title">当天标题</label><input id="edit-title" maxlength="150" value="${esc(dayTitle(d))}"></div><div class="form-field"><label class="label" for="edit-wake">起床建议</label><input id="edit-wake" maxlength="60" value="${esc(dayWake(d))}"></div></div><div class="form-field"><label class="label" for="edit-steps">自由活动：每行「时间 | 标题 | 说明」</label><textarea id="edit-steps" class="edit-timeline" spellcheck="false">${esc(text)}</textarea><p class="tiny muted" style="margin-top:7px">时间用 10:30 或 10:30–12:00；删除整行可取消活动。编辑后的时刻将标为你们的个人安排，不是新预订。</p></div><div class="form-field"><label class="label" for="edit-note">当天笔记 / 已确认预约</label><textarea id="edit-note">${esc(state.dayNotes[d.date]||"")}</textarea></div></div><div class="dialog-foot"><button type="button" class="ghost" data-action="restore-route">恢复此玩法原始安排</button><button type="button" data-action="close-dialog">取消</button><button type="submit" class="primary">保存修改</button></div></form>`;
  }else{
    editorContext={mode:"place"};
    modal.innerHTML=`<form id="edit-form"><div class="dialog-body"><div class="dialog-head"><h2>新增自己的备选</h2><button type="button" class="small ghost" data-action="close-dialog" aria-label="关闭">×</button></div><p class="tiny muted">你们自己发现的地方会标为“个人新增 · 未核验”，与研究条目分开。</p><div class="form-field"><label class="label" for="new-name">名称</label><input id="new-name" maxlength="160" required placeholder="餐厅、街区或想做的事"></div><div class="grid2"><div class="form-field"><label class="label" for="new-city">城市</label><select id="new-city">${["布达佩斯","维也纳","湖区","布拉格"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="form-field"><label class="label" for="new-kind">类型</label><select id="new-kind">${["街区","吃喝","风景","室内","放空"].map(x=>`<option>${x}</option>`).join("")}</select></div></div><div class="form-field"><label class="label" for="new-map">地图搜索名称 / 地址</label><input id="new-map" maxlength="250" placeholder="尽量使用当地名称与城市"></div><div class="form-field"><label class="label" for="new-detail">为什么想去 / 营业与预约备注</label><textarea id="new-detail" placeholder="同事推荐、想吃什么、哪天合适……"></textarea></div><div class="form-field"><label class="label" for="new-weather">天气</label><select id="new-weather"><option>晴阴</option><option>雨天可用</option></select></div></div><div class="dialog-foot"><button type="button" data-action="close-dialog">取消</button><button type="submit" class="primary">加入备选并收藏</button></div></form>`;
  }
  modal.showModal();
}
function submitEditor(e){
  e.preventDefault(); if(!editorContext)return;
  if(editorContext.mode==="day"){
    const {date,route}=editorContext;
    const raw=document.getElementById("edit-steps").value;
    const lines=raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(lines.length>35){toast("每种玩法最多 35 行。");return;}
    const steps=[];
    for(const l of lines){
      const parts=l.split("|").map(s=>s.trim());
      if(parts.length<2||!parts[0]||!parts[1]){toast("每行至少写：时间 | 标题");return;}
      steps.push({time:clean(parts[0],60),title:clean(parts[1],250),body:clean(parts.slice(2).join(" | "),5000),fixed:false,refs:[]});
    }
    state.edits[date]||={};state.edits[date][route]=steps;
    state.dayNotes[date]=clean(document.getElementById("edit-note").value,20000);
    state.dayTitles[date]=clean(document.getElementById("edit-title").value,150);
    state.dayWakes[date]=clean(document.getElementById("edit-wake").value,60);
    save();modal.close();render();toast("已保存。固定车票与酒店信息没有改动。");
  }else{
    const name=clean(document.getElementById("new-name").value.trim(),160);
    if(!name){toast("先填一个名称。");return;}
    const id="custom-"+Date.now().toString(36);
    state.customPlaces.push({id,name,city:document.getElementById("new-city").value,kind:document.getElementById("new-kind").value,weather:document.getElementById("new-weather").value,map:clean(document.getElementById("new-map").value,250)||name,why:clean(document.getElementById("new-detail").value,7000)});
    state.favorites.push(id);state=normalize(state);save();modal.close();render();toast("已加入个人备选并收藏。");
  }
}
function download(name,text,type){
  const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
}
function safeJSON(o){return JSON.stringify(o).replace(/</g,"\\u003c");}
function exportJSON(){save();download("slow-europe-backup-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify({schema:"slow-europe-v1",exportedAt:new Date().toISOString(),data:D,state},null,2),"application/json;charset=utf-8");toast("备份已生成，包含攻略资料与个人修改。");}
function exportHTML(){
  save();
  const clone=document.documentElement.cloneNode(true);
  clone.querySelector("#guide-state").textContent=safeJSON({revision:"export-"+Date.now(),state});
  clone.querySelector("#app").innerHTML="";
  clone.querySelector("#editor").innerHTML="";clone.querySelector("#editor").removeAttribute("open");
  clone.querySelector("#toast").textContent="";clone.querySelector("#toast").classList.remove("show");
  download("slow-europe-personal.html","<!DOCTYPE html>\n"+clone.outerHTML,"text/html;charset=utf-8");
  toast("可分享网页已生成。对方可继续修改，但不会自动同步。");
}
async function importFile(file){
  if(!file)return;if(file.size>5000000){toast("文件过大，请导入本攻略导出的 JSON。");return;}
  try{
    const payload=JSON.parse(await file.text());
    if(payload.schema!=="slow-europe-v1"||!payload.state||typeof payload.state!=="object")throw Error("schema");
    if(!confirm("导入将替换此浏览器的收藏、路线和笔记。已导出当前版本备份了吗？"))return;
    state=normalize(payload.state);currentDay=state.day;currentView="mine";save();render();toast("已导入个人修改；固定研究资料仍使用此网页版本。");
  }catch(e){toast("无法导入：请选择本攻略导出的有效 JSON 备份。");}
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const action=b.dataset.action;
  if(action==="city"){filter.city=b.dataset.city;filter.query="";filter.kind="全部类型";filter.weather="全部天气";setView("explore");}
  else if(action==="category"){filter.category=b.dataset.category;refreshExploreResults();fitCityMap();}
  else if(action==="map-fit")fitCityMap();
  else if(action==="map-hotel")selectMapHotel(b.dataset.hotel);
  else if(action==="show-place-map"){highlightMapPlace(b.dataset.place,true);document.getElementById("map-panel")?.scrollIntoView({behavior:"smooth",block:"start"});}
  else if(action==="view"){e.preventDefault();setView(b.dataset.view);}
  else if(action==="day"){e.preventDefault();openDay(b.dataset.day);}
  else if(action==="route"){const d=getDay();if(d.routes.some(r=>r.id===b.dataset.route)){state.routes[d.date]=b.dataset.route;save();render();}}
  else if(action==="favorite"){
    const id=b.dataset.place;
    state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
    save();
    document.querySelectorAll(`[data-action="favorite"][data-place="${id}"]`).forEach(btn=>{
      const active=state.favorites.includes(id);btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",String(active));btn.textContent=active?"★":"☆";
      const p=allPlaces().find(x=>x.id===id);btn.setAttribute("aria-label",(active?"取消收藏 ":"收藏 ")+(p?.name||""));
    });
    if(currentView==="mine"){render();}else if(currentView==="explore"){if(filter.favorites)refreshExploreResults();else refreshMapMarkers();}
  }
  else if(action==="filter-favorites"){filter.favorites=!filter.favorites;refreshExploreResults();}
  else if(action==="edit-day")openEditor("day");
  else if(action==="add-place")openEditor("place");
  else if(action==="close-dialog")modal.close();
  else if(action==="restore-route"){
    const {date,route}=editorContext||{};if(!date)return;
    if(confirm("恢复此玩法原始时间表？当天笔记会保留。")){if(state.edits[date])delete state.edits[date][route];save();modal.close();render();toast("已恢复这一玩法的原始时间表。");}
  }
  else if(action==="delete-place"){if(confirm("删除这个个人新增备选？")){state.customPlaces=state.customPlaces.filter(p=>p.id!==b.dataset.place);state.favorites=state.favorites.filter(x=>x!==b.dataset.place);delete state.placeNotes[b.dataset.place];save();render();}}
  else if(action==="lake-swap"){state.routes["2026-09-30"]="c";state.routes["2026-10-01"]="d";save();render();toast("已把湖景玩法移到 10/1。餐厅与车辆预约需要另行调整。");}
  else if(action==="export-json")exportJSON();
  else if(action==="export-html")exportHTML();
  else if(action==="import")document.getElementById("import-file").click();
  else if(action==="print")window.print();
  else if(action==="jump")document.getElementById(b.dataset.target)?.scrollIntoView({behavior:"smooth",block:"start"});
  else if(action==="reset"){
    if(confirm("这会清除本浏览器的个人修改、收藏与笔记。建议先导出备份。确认重置？")){state=normalize({});currentView="overview";currentDay=D.days[0].date;save();render();toast("已恢复原始攻略。");}
  }
});
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.matches("[data-note-day]")){state.dayNotes[el.dataset.noteDay]=clean(el.value,20000);save();}
  if(el.matches("[data-note-place]")){state.placeNotes[el.dataset.notePlace]=clean(el.value,10000);save();}
  if(el.matches("[data-global-note]")){state.globalNote=clean(el.value,30000);save();}
  if(el.matches('[data-filter="query"]')){filter.query=el.value;refreshExploreResults();}
});
document.addEventListener("change",e=>{
  const el=e.target;
  if(el.matches("select[data-filter]")){filter[el.dataset.filter]=el.value;refreshExploreResults();}
  if(el.matches("[data-check]")){
    state.checks[el.dataset.check]=el.checked;save();el.closest(".check-row").classList.toggle("done",el.checked);
    const n=D.checklist.filter(i=>state.checks[i.id]).length;
    document.getElementById("check-count").textContent=`${n} / ${D.checklist.length} 项`;
    document.getElementById("check-progress").style.width=(n/D.checklist.length*100)+"%";
  }
  if(el.id==="import-file"){importFile(el.files[0]);el.value="";}
});
document.addEventListener("error",e=>{if(e.target instanceof HTMLImageElement){e.target.hidden=true;e.target.closest(".photo-frame")?.classList.add("image-failed");}},true);
modal.addEventListener("submit",submitEditor);
modal.addEventListener("click",e=>{if(e.target===modal)modal.close();});
render();
