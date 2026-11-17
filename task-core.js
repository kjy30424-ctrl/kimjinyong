(function(root){
const dateKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const dueAt=t=>Date.parse(t.date+'T'+(t.time||'09:00')+':00+09:00');
const due=(t,now=Date.now())=>!t.done&&!t.deleted&&t.remind!==false&&dueAt(t)<=now&&!(t.snoozeUntil>now);
const signature=(t,now=new Date())=>[t.id,t.date,t.time||'09:00',dateKey(now),t.snoozeUntil||0].join('|');
const api={dateKey,dueAt,due,signature};if(typeof module!=='undefined')module.exports=api;else root.SeoulTasks=api;
})(typeof window==='undefined'?this:window);
