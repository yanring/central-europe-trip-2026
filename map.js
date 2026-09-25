"use strict";
const CITY_GUIDES={
  "布达佩斯":{label:"河岸、温泉与街区",intro:"先在多瑙河两岸选想看的风景，再决定要不要加温泉或咖啡。经典地标与安静街区都列出来，取舍由你们定。",hotels:["parisi","tribe"],cover:"bp-palace"},
  "维也纳":{label:"花园、市场与庭院",intro:"以花园、城市散步、小店和好饭为主。艺术馆只保留一个低优先级备选，不需要为了完整打卡去看展。",hotels:["hyatt"],cover:"vi-gardens"},
  "湖区":{label:"湖岸、小镇与山景",intro:"先挑更喜欢哪片湖、愿不愿意爬坡，再安排接驳。这里的点分布很散，地图上的近远比一天塞几个地方更重要。",hotels:["jeffs"],cover:"lk-gosau"},
  "布拉格":{label:"小巷、公园与城市视野",intro:"城堡区小巷、河边地标、生活街区和葡萄园都可以选。先比较你们想要的体验，不必照着某条固定路线走。",hotels:["lindner"],cover:"pr-grebovka"}
};
let cityMap=null;
let cityPlaceMarkers=new Map();
let cityHotelMarkers=new Map();
let highlightedPlaceId=null;
const cityHotelSelection={};
function cityHotels(){return CITY_GUIDES[filter.city].hotels.map(id=>D.hotels.find(h=>h.id===id)).filter(Boolean);}
function activeCityHotel(){const hotels=cityHotels();return hotels.find(h=>h.id===cityHotelSelection[filter.city])||hotels[0];}
function hasCoordinates(p){return Number.isFinite(p?.coordinates?.lat)&&Number.isFinite(p?.coordinates?.lng);}
function removeCityMap(){
  if(cityMap)cityMap.remove();
  cityMap=null;cityPlaceMarkers.clear();cityHotelMarkers.clear();highlightedPlaceId=null;
}
function mapPanel(){
  const hotels=cityHotels(),active=activeCityHotel();
  return `<aside class="map-panel" id="map-panel"><div class="map-panel-head"><div><div class="eyebrow">SEE WHERE THINGS ARE</div><h2>${esc(filter.city)} · 地点地图</h2></div><button class="small" data-action="map-fit">看全区域</button></div><p class="map-help">鼠标移到卡片上高亮位置；点地图上的编号查看对应地点。手机上点卡片的“地图定位”。</p><div class="hotel-selector"><span>已订住宿</span>${hotels.map(h=>`<button data-action="map-hotel" data-hotel="${h.id}" aria-pressed="${h.id===active.id}" class="hotel-pick ${h.id===active.id?"active":""}"><b>H</b><span>${esc(h.name)}<small>${esc(h.nights)}</small></span></button>`).join("")}</div><div id="city-map" aria-label="${esc(filter.city)}景点与酒店地图"><p class="map-loading">正在打开地图……</p></div><p id="map-network-note" class="map-network-note" hidden>底图暂时加载不完整。地点标记仍可查看，也可用卡片上的地图链接。</p><div class="map-legend"><span><i class="legend-place"></i>候选地点</span><span><i class="legend-saved"></i>已收藏</span><span><i class="legend-hotel"></i>酒店</span></div><div id="map-place-info" class="map-place-info" aria-live="polite"><strong>先看看位置，再选喜欢的</strong><p>酒店用 H 标出；收藏不会自动生成路线，也不代表已经预订。</p></div><p class="map-footnote">街区、湖岸和公园的标记是代表位置，不是唯一入口。地图距离感用于筛选，实际交通留到选好后再排。</p></aside>`;
}
function setupCityMap(){
  const target=document.getElementById("city-map");
  if(!target)return;
  if(!window.L){target.innerHTML='<p class="map-loading">地图暂时不可用；地点卡片与外部地图链接仍可使用。</p>';return;}
  target.innerHTML="";
  cityMap=L.map(target,{scrollWheelZoom:false,zoomControl:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).on('tileerror',()=>{const note=document.getElementById('map-network-note');if(note)note.hidden=false;}).addTo(cityMap);
  L.control.scale({imperial:false}).addTo(cityMap);
  refreshMapMarkers();
  fitCityMap();
}
function refreshMapMarkers(){
  if(!cityMap)return;
  for(const marker of [...cityPlaceMarkers.values(),...cityHotelMarkers.values()])marker.remove();
  cityPlaceMarkers.clear();cityHotelMarkers.clear();
  const places=filterPlaces(),active=activeCityHotel();
  places.forEach((p,i)=>{
    if(!hasCoordinates(p))return;
    const saved=state.favorites.includes(p.id);
    const marker=L.marker([p.coordinates.lat,p.coordinates.lng],{title:p.name,icon:L.divIcon({className:'place-map-icon',html:`<span class="map-pin ${saved?'saved':''}" aria-hidden="true">${i+1}</span>`,iconSize:[32,38],iconAnchor:[16,36]}),zIndexOffset:0});
    marker.bindTooltip(esc(p.name),{direction:'top',offset:[0,-31]});
    marker.on('mouseover',()=>highlightMapPlace(p.id,false));
    marker.on('click',()=>{highlightMapPlace(p.id,false);document.getElementById('place-'+p.id)?.scrollIntoView({behavior:'smooth',block:'center'});});
    marker.addTo(cityMap);
    marker.getElement()?.setAttribute('aria-label',`${i+1}. ${p.name}${saved?'，已收藏':''}`);
    cityPlaceMarkers.set(p.id,marker);
  });
  for(const h of cityHotels()){
    if(!hasCoordinates(h))continue;
    const marker=L.marker([h.coordinates.lat,h.coordinates.lng],{title:h.name,icon:L.divIcon({className:'hotel-map-icon',html:`<span class="hotel-map-pin ${h.id===active.id?'active':''}" aria-hidden="true">H</span>`,iconSize:[38,38],iconAnchor:[19,19]}),zIndexOffset:600}).bindTooltip(`${esc(h.name)} · ${esc(h.nights)}`,{direction:'top',offset:[0,-18]});
    marker.on('click',()=>selectMapHotel(h.id));marker.addTo(cityMap);
    marker.getElement()?.setAttribute('aria-label',`酒店：${h.name}，${h.nights}`);
    cityHotelMarkers.set(h.id,marker);
  }
  if(highlightedPlaceId&&cityPlaceMarkers.has(highlightedPlaceId))highlightMapPlace(highlightedPlaceId,false);
  else{highlightedPlaceId=null;const info=document.getElementById('map-place-info');if(info)info.innerHTML='<strong>先看看位置，再选喜欢的</strong><p>酒店用 H 标出；收藏不会自动生成路线，也不代表已经预订。</p>';}
}
function fitCityMap(){
  if(!cityMap)return;
  const points=[...cityPlaceMarkers.values()].map(m=>m.getLatLng()),hotel=activeCityHotel();
  if(hasCoordinates(hotel))points.push([hotel.coordinates.lat,hotel.coordinates.lng]);
  if(points.length)cityMap.fitBounds(L.latLngBounds(points),{padding:[40,40],maxZoom:14});
  else cityMap.setView([48.2,16.3],6);
}
function highlightMapPlace(id,pan){
  if(currentView!=="explore")return;
  const p=allPlaces().find(p=>p.id===id);
  if(!p)return;
  if(highlightedPlaceId!==id){
    document.getElementById('place-'+highlightedPlaceId)?.classList.remove('map-highlight');
    const old=cityPlaceMarkers.get(highlightedPlaceId);old?.getElement()?.classList.remove('map-highlight');old?.setZIndexOffset(0);old?.closeTooltip();
  }
  highlightedPlaceId=id;
  document.getElementById('place-'+id)?.classList.add('map-highlight');
  const marker=cityPlaceMarkers.get(id),hotel=activeCityHotel();
  if(marker){marker.getElement()?.classList.add('map-highlight');marker.setZIndexOffset(1000);marker.openTooltip();if(pan)cityMap.panInside(marker.getLatLng(),{padding:[45,45],animate:false});}
  let distance='';
  if(cityMap&&hasCoordinates(p)&&hasCoordinates(hotel)){
    const km=cityMap.distance([p.coordinates.lat,p.coordinates.lng],[hotel.coordinates.lat,hotel.coordinates.lng])/1000;
    distance=`<p class="hotel-distance">距 ${esc(hotel.name)} <b>直线约 ${km<1?Math.round(km*1000)+' m':km.toFixed(1)+' km'}</b><small>不是步行或驾车里程；隔河、山路会绕行。</small></p>`;
  }
  const info=document.getElementById('map-place-info');
  if(info)info.innerHTML=`<div class="eyebrow">${esc(p.kind)} · ${esc(p.booking?.status||'预约信息待确认')}</div><strong>${esc(p.name)}</strong><p>${esc(p.intro||p.why)}</p>${p.coordinateNote?`<p class="map-point-note">${esc(p.coordinateNote)}</p>`:""}${distance}<button class="small map-return" data-action="jump" data-target="place-${esc(p.id)}">回到这个地点 ↓</button>${!marker?'<p>此地点坐标尚未确认，未在地图上猜测位置。</p>':''}`;
}
function selectMapHotel(id){
  if(!cityHotels().some(h=>h.id===id))return;
  cityHotelSelection[filter.city]=id;
  document.querySelectorAll('.hotel-pick').forEach(b=>{b.classList.toggle('active',b.dataset.hotel===id);b.setAttribute('aria-pressed',String(b.dataset.hotel===id));});
  refreshMapMarkers();fitCityMap();cityHotelMarkers.get(id)?.openTooltip();
}
function refreshExploreResults(){
  const results=document.getElementById('explore-results');
  if(results)results.innerHTML=resultHTML();
  document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===filter.category);b.setAttribute('aria-pressed',String(b.dataset.category===filter.category));});
  refreshMapMarkers();
}
document.addEventListener('pointerover',e=>{
  if(e.pointerType==='touch')return;
  const card=e.target.closest('.explore-results .place-card');
  if(card&&!card.contains(e.relatedTarget))highlightMapPlace(card.dataset.placeId,true);
});
document.addEventListener('focusin',e=>{const card=e.target.closest('.explore-results .place-card');if(card)highlightMapPlace(card.dataset.placeId,true);});
