'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
const templateButtons=[...document.querySelectorAll(".template")];
const frames=templateButtons.map(()=>new Image());let chosen=0,photo=null,zoom=1,dx=0,dy=0,drag=null,ready=false,uploadSequence=0;
const status=message=>$('status').textContent=message;
function constrain(){
 dx=Math.max(-canvas.width,Math.min(canvas.width,dx));
 dy=Math.max(-canvas.height,Math.min(canvas.height,dy));
}
function render(){ctx.clearRect(0,0,1024,1024);if(photo){constrain();const scale=Math.max(1024/photo.width,1024/photo.height)*zoom;ctx.fillStyle='#fff';ctx.fillRect(0,0,1024,1024);ctx.drawImage(photo,(1024-photo.width*scale)/2+dx,(1024-photo.height*scale)/2+dy,photo.width*scale,photo.height*scale);}if(frames[chosen].complete&&frames[chosen].naturalWidth)ctx.drawImage(frames[chosen],0,0,1024,1024);$('x').value=dx;$('y').value=dy;$('zoomValue').value=Math.round(zoom*100)+'%';$('empty').hidden=!!photo;$('save').disabled=!photo||!ready;}
function selectTemplate(index){if(!Number.isInteger(index)||index<0||index>=frames.length)throw Error('无效模板');chosen=index;loadFrame(index);document.querySelectorAll('.template').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));render();}
document.querySelectorAll('.template').forEach(b=>b.onclick=()=>selectTemplate(Number(b.dataset.template)));
function loadFrame(index){
 const im=frames[index];ready=im.complete&&im.naturalWidth>0;
 if(ready){status('');render();return;}
 status('正在加载模板…');render();
 im.onload=()=>{if(chosen===index){ready=true;status('');render();}};
 im.onerror=()=>{if(chosen===index){ready=false;status('模板加载失败，请重新选择模板重试。');render();}};
 im.src=templateButtons[index].querySelector('img').getAttribute('src');
}
loadFrame(0);
$('photo').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;const sequence=++uploadSequence;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){status('请选择 JPG、PNG 或 WebP 图片。');return;}if(file.size>20*1024*1024){status('图片超过 20 MB，请选择小一些的照片。');return;}status('正在读取照片…');const url=URL.createObjectURL(file);try{const im=new Image();im.src=url;await im.decode();if(sequence!==uploadSequence)return;if(!im.naturalWidth)throw Error();photo=im;zoom=1;dx=0;dy=0;$('zoom').value=1;$('filename').textContent=file.name;['zoom','x','y','reset'].forEach(id=>$(id).disabled=false);status('照片已就绪，拖动即可调整位置。');render();}catch{if(sequence===uploadSequence)status('无法读取这张图片，请换一张 JPG 或 PNG。');}finally{URL.revokeObjectURL(url);}};
$('zoom').oninput=e=>{zoom=Number(e.target.value);render();};$('x').oninput=e=>{dx=Number(e.target.value);render();};$('y').oninput=e=>{dy=Number(e.target.value);render();};$('reset').onclick=()=>{zoom=1;dx=dy=0;$('zoom').value=1;render();};
canvas.onpointerdown=e=>{if(!photo||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx,dy};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;const ratio=1024/canvas.getBoundingClientRect().width;dx=drag.dx+(e.clientX-drag.x)*ratio;dy=drag.dy+(e.clientY-drag.y)*ratio;render();};canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>drag=null;
$('save').onclick=()=>{if(!photo||!ready)return;canvas.toBlob(blob=>{if(!blob){status('保存失败，请重试。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${templateButtons[chosen].querySelector('span').textContent}-我的头像.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status('已生成头像。若未自动下载，请在浏览器中打开此页再保存。');},'image/png');};
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'select_avatar_template',description:'按索引切换头像模板，索引从0开始。',inputSchema:{type:'object',properties:{index:{type:'integer',minimum:0,maximum:frames.length-1}},required:['index'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({index})=>{selectTemplate(index);return {selectedTemplate:chosen};}})).catch(()=>{});}catch{}}
