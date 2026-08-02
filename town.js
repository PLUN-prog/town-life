/* 小镇生活 · 共享脚本：侧边栏高亮 / 日期徽章 / 轻提示 / 小星星 / 小镇设置（主题·昵称头像·提醒引擎） */
(function(){
  var ls={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
  var page=document.body.getAttribute('data-page');
  document.querySelectorAll('.side a').forEach(function(a){
    if(a.getAttribute('data-page')===page){ a.classList.add('on'); }
  });
  var b=document.querySelector('.date-badge');
  if(b && b.textContent.trim()===''){
    var d=new Date(),W=['日','一','二','三','四','五','六'];
    b.textContent='🗓 '+d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日 · 星期'+W[d.getDay()];
  }
  window.townToast=function(msg){
    var t=document.querySelector('.toast');
    if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show');
    clearTimeout(t._h);
    t._h=setTimeout(function(){ t.classList.remove('show'); },2200);
  };
  window.twinkle=function(){
    var marks=['✦','★','·','❀','✧'];
    for(var i=0;i<14;i++){
      (function(){
        var s=document.createElement('span');
        s.className='twinkle'; s.textContent=marks[i%marks.length];
        s.style.left=(Math.random()*96)+'vw';
        s.style.color=['#4E9E7E','#7FC9AA','#F0A868','#C97B63'][i%4];
        s.style.fontSize=(10+Math.random()*9)+'px';
        s.style.animationDuration=(2.4+Math.random()*2.2)+'s';
        document.body.appendChild(s);
        setTimeout(function(){ s.remove(); },5200);
      })();
    }
  };

  /* ============ 小镇设置：主题 / 昵称头像 ============ */
  var cfg=ls.get('settings-v1-config')||{};
  cfg.nick=cfg.nick||'零'; cfg.avatar=cfg.avatar||'🐰'; cfg.theme=cfg.theme||'spring';
  window.townUser=function(){ return cfg; };
  /* 背景像素画风：春日 / 秋日 / 冬日 */
  document.body.classList.add('theme-'+cfg.theme);
  /* 侧边栏底部用户卡 */
  var u=document.querySelector('.side-user');
  if(u){
    var ico=u.querySelector('.uico'),nm=u.querySelector('.unm');
    if(ico)ico.textContent=cfg.avatar;
    if(nm)nm.textContent=cfg.nick;
  }
  /* 页面内 [data-nick] 占位符 */
  document.querySelectorAll('[data-nick]').forEach(function(el){ el.textContent=cfg.nick; });

  /* ============ 提醒引擎（页面打开时生效，需浏览器通知权限） ============ */
  var notify=ls.get('settings-v1-notify')||{};
  function nf(name,def){ var o=notify[name]; return (o&&typeof o==='object')?o:def; }
  var water=nf('water',{on:false,from:'09:00',to:'21:00',interval:60});
  var course=nf('course',{on:false,lead:10});
  var todo=nf('todo',{on:false,time:'20:00'});
  var study=nf('study',{on:false,time:'19:30'});
  function todayStr(){var x=new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}
  function pad(n){return String(n).padStart(2,'0');}
  function toMin(t){var p=String(t||'').split(':');return (+p[0]||0)*60+(+p[1]||0);}
  function fire(title,body){
    try{ if('Notification'in window&&Notification.permission==='granted'){ new Notification(title,{body:body}); } }catch(e){}
    if(window.townToast) townToast(title+' '+body);
  }
  var sent=ls.get('settings-v1-notified')||{date:''};
  if(sent.date!==todayStr()){ sent={date:todayStr(),water:-1,courses:{},todo:false,study:false}; ls.set('settings-v1-notified',sent); }
  function check(){
    if(sent.date!==todayStr()){ sent={date:todayStr(),water:-1,courses:{},todo:false,study:false}; ls.set('settings-v1-notified',sent); }
    var d=new Date(),now=d.getHours()*60+d.getMinutes();
    /* 💧 喝水：时段内按间隔提醒 */
    if(water.on){
      var from=toMin(water.from),to=toMin(water.to),iv=Math.max(15,+water.interval||60);
      if(now>=from&&now<=to){
        var slot=Math.floor((now-from)/iv);
        if(sent.water!==slot){ sent.water=slot; ls.set('settings-v1-notified',sent); fire('💧 喝水时间到','喝一杯水，也让眼睛歇一歇'); }
      }
    }
    /* 📚 课程：今日课程开始前 lead 分钟提醒 */
    if(course.on){
      try{
        var C=ls.get('home-v1-courses')||{},a=C[todayStr()]||[];
        a.forEach(function(c){
          if(c.done||!c.time)return;
          var key=c.time+'-'+c.name,left=toMin(c.time)-now;
          if(left>=0&&left<=course.lead&&!sent.courses[key]){
            sent.courses[key]=1; ls.set('settings-v1-notified',sent);
            fire('📚 快上课啦','还有 '+left+' 分钟：'+c.time+' '+c.name);
          }
        });
      }catch(e){}
    }
    /* 📝 待办：到点提醒未完成事项 */
    if(todo.on&&!sent.todo&&now>=toMin(todo.time)){
      sent.todo=true; ls.set('settings-v1-notified',sent);
      var T=ls.get('home-v1-todos')||{},tl=(T[todayStr()]||[]).filter(function(x){return !x.done;});
      fire('📝 待办检查','今天还有 '+(tl.length||'0')+' 件小事没做完'+(tl.length?'：「'+tl[0].t+'」等':'')); 
    }
    /* 📖 学习：到点提醒专注 */
    if(study.on&&!sent.study&&now>=toMin(study.time)){
      sent.study=true; ls.set('settings-v1-notified',sent);
      fire('📖 学习时间','该专注一会儿啦，今天也积累一点点');
    }
  }
  check();
  setInterval(check,20000);

  /* ============ 每日自动刷新：次日 0 点重置当日数据 ============ */
  (function(){
    var last=new Date().toDateString();
    setInterval(function(){
      if(new Date().toDateString()!==last) location.reload();
    },30000);
  })();

  /* ============ 空状态：像素插画 + 引导按钮 ============ */
  var ARTS={
    book:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="2" width="14" height="11" fill="#6FBE9E"/><rect x="1" y="2" width="14" height="2" fill="#4E9E7E"/><rect x="4" y="5" width="8" height="1" fill="#E4F4EE"/><rect x="4" y="7" width="8" height="1" fill="#E4F4EE"/><rect x="4" y="9" width="5" height="1" fill="#E4F4EE"/><rect x="6" y="1" width="4" height="2" fill="#F0A868"/></svg>',
    cal:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="2" width="14" height="13" fill="#FFFDF8"/><rect x="1" y="2" width="14" height="3" fill="#C97B63"/><rect x="1" y="2" width="14" height="1" fill="#A85F4B"/><rect x="3" y="1" width="1" height="2" fill="#5C5C63"/><rect x="12" y="1" width="1" height="2" fill="#5C5C63"/><rect x="3" y="7" width="2" height="2" fill="#F0A868"/><rect x="7" y="7" width="2" height="2" fill="#6FBE9E"/><rect x="11" y="7" width="2" height="2" fill="#8FB9D8"/><rect x="3" y="11" width="2" height="2" fill="#C9A8D8"/><rect x="7" y="11" width="2" height="2" fill="#E8C96A"/></svg>',
    star:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="1" width="2" height="2" fill="#F6C453"/><rect x="5" y="3" width="6" height="2" fill="#F6C453"/><rect x="3" y="5" width="10" height="2" fill="#F0A868"/><rect x="5" y="7" width="6" height="2" fill="#F0A868"/><rect x="7" y="9" width="2" height="5" fill="#C97B63"/><rect x="3" y="12" width="10" height="2" fill="#C97B63"/></svg>',
    money:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="4" width="12" height="9" fill="#E8C96A"/><rect x="2" y="4" width="12" height="2" fill="#C99B3F"/><rect x="7" y="6" width="2" height="2" fill="#C99B3F"/><rect x="7" y="9" width="2" height="2" fill="#C99B3F"/><rect x="3" y="2" width="10" height="3" fill="#F0A868"/><rect x="5" y="1" width="6" height="2" fill="#C97B63"/></svg>',
    note:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="1" width="12" height="14" fill="#FFFDF8"/><rect x="2" y="1" width="3" height="14" fill="#F0A868"/><rect x="6" y="4" width="6" height="1" fill="#D6D6DE"/><rect x="6" y="7" width="6" height="1" fill="#D6D6DE"/><rect x="6" y="10" width="4" height="1" fill="#D6D6DE"/></svg>',
    moon:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="2" width="8" height="2" fill="#8FB9D8"/><rect x="1" y="4" width="10" height="2" fill="#8FB9D8"/><rect x="2" y="6" width="12" height="4" fill="#8FB9D8"/><rect x="1" y="10" width="10" height="2" fill="#8FB9D8"/><rect x="3" y="12" width="8" height="2" fill="#8FB9D8"/><rect x="6" y="6" width="2" height="2" fill="#F6C453"/><rect x="10" y="8" width="1" height="1" fill="#F6C453"/></svg>',
    ear:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="3" width="3" height="9" fill="#6FBE9E"/><rect x="12" y="3" width="3" height="9" fill="#6FBE9E"/><rect x="3" y="2" width="10" height="3" fill="#4E9E7E"/><rect x="3" y="11" width="10" height="3" fill="#4E9E7E"/><rect x="6" y="5" width="4" height="6" fill="#E4F4EE"/><rect x="7" y="6" width="2" height="4" fill="#F0A868"/></svg>',
    flower:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="1" width="2" height="3" fill="#F0A868"/><rect x="5" y="2" width="2" height="2" fill="#F0A868"/><rect x="9" y="2" width="2" height="2" fill="#F0A868"/><rect x="6" y="4" width="4" height="3" fill="#F6C453"/><rect x="7" y="7" width="2" height="6" fill="#6FBE9E"/><rect x="4" y="9" width="2" height="2" fill="#4E9E7E"/><rect x="10" y="9" width="2" height="2" fill="#4E9E7E"/></svg>',
    cup:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="3" width="10" height="10" fill="#8FB9D8"/><rect x="2" y="3" width="10" height="2" fill="#5E8FAE"/><rect x="12" y="4" width="2" height="5" fill="#8FB9D8"/><rect x="14" y="5" width="1" height="3" fill="#5E8FAE"/><rect x="4" y="6" width="2" height="2" fill="#E8F2F8"/><rect x="7" y="6" width="2" height="2" fill="#E8F2F8"/></svg>',
    trophy:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="2" width="10" height="7" fill="#F0A868"/><rect x="3" y="2" width="10" height="2" fill="#E08A4A"/><rect x="1" y="1" width="2" height="3" fill="#E8C96A"/><rect x="13" y="1" width="2" height="3" fill="#E8C96A"/><rect x="6" y="9" width="4" height="3" fill="#F0A868"/><rect x="5" y="12" width="6" height="2" fill="#C97B63"/></svg>',
    list:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="2" width="3" height="2" fill="#6FBE9E"/><rect x="5" y="2" width="10" height="2" fill="#D6D6DE"/><rect x="1" y="7" width="3" height="2" fill="#6FBE9E"/><rect x="5" y="7" width="10" height="2" fill="#D6D6DE"/><rect x="1" y="12" width="3" height="2" fill="#6FBE9E"/><rect x="5" y="12" width="7" height="2" fill="#D6D6DE"/></svg>',
    dumbbell:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="6" width="2" height="4" fill="#5C5C63"/><rect x="3" y="5" width="2" height="6" fill="#94949D"/><rect x="5" y="4" width="6" height="8" fill="#5C5C63"/><rect x="11" y="5" width="2" height="6" fill="#94949D"/><rect x="13" y="6" width="2" height="4" fill="#5C5C63"/></svg>'
  };
  window.townEmptyHTML=function(o){
    var art=ARTS[o.art]||ARTS.star;
    var spark=o.spark||'';
    return '<div class="empty-state'+(o.mini?' mini':'')+'">'+
      '<div class="es-art">'+art+(spark?'<span class="spark">'+spark+'</span>':'')+'</div>'+
      '<div class="es-title">'+o.title+'</div>'+
      (o.desc?'<div class="es-desc">'+o.desc+'</div>':'')+
      (o.btn?'<div class="es-btn"><button class="btn primary es-go">'+o.btn+'</button></div>':'')+
      '</div>';
  };
  window.townEmpty=function(el,o){
    el.innerHTML=townEmptyHTML(o);
    var b=el.querySelector('.es-go');
    if(b&&o.onBtn) b.onclick=o.onBtn;
    return el;
  };

  /* ============ 图表工具（canvas 折线/柱状/饼图） ============ */
  var CP=['#6FBE9E','#F0A868','#C97B63','#8FB9D8','#C9A8D8','#E8C96A','#7FC9AA','#E19A84'];
  function fit(canvas,w,h){
    var dpr=window.devicePixelRatio||1;
    canvas.width=w*dpr;canvas.height=h*dpr;
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    var ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return ctx;
  }
  function fmt(v){return v>=10000?(v/10000).toFixed(1)+'w':v>=1000?(v/1000).toFixed(1)+'k':String(v);}
  window.townChart={
    /* data:[{label,value}] */
    line:function(canvas,data,o){
      o=o||{};
      var w=o.w||(canvas.clientWidth||300),h=o.h||120;
      var ctx=fit(canvas,w,h);
      var pad={l:o.axis?34:8,r:8,t:10,b:o.labels?20:8};
      var max=Math.max.apply(null,data.map(function(d){return d.value;}).concat([1]));
      max=max*1.15;
      var iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;
      function X(i){return pad.l+iw*(data.length===1?0.5:i/(data.length-1));}
      function Y(v){return pad.t+ih*(1-v/max);}
      /* 网格 */
      ctx.strokeStyle='#EFEDE3';ctx.lineWidth=1;
      for(var g=0;g<=3;g++){var gy=pad.t+ih*g/3;ctx.beginPath();ctx.moveTo(pad.l,gy);ctx.lineTo(w-pad.r,gy);ctx.stroke();}
      /* 面积 */
      var grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);
      grad.addColorStop(0,'rgba(111,190,158,.30)');grad.addColorStop(1,'rgba(111,190,158,0)');
      ctx.beginPath();
      data.forEach(function(d,i){i?ctx.lineTo(X(i),Y(d.value)):ctx.moveTo(X(0),Y(d.value));});
      ctx.lineTo(X(data.length-1),h-pad.b);ctx.lineTo(X(0),h-pad.b);ctx.closePath();
      ctx.fillStyle=grad;ctx.fill();
      /* 折线 */
      ctx.beginPath();ctx.strokeStyle='#4E9E7E';ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';
      data.forEach(function(d,i){i?ctx.lineTo(X(i),Y(d.value)):ctx.moveTo(X(0),Y(d.value));});
      ctx.stroke();
      /* 点 + 值 */
      ctx.fillStyle='#4E9E7E';
      data.forEach(function(d,i){
        var x=X(i),y=Y(d.value);
        ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();
        ctx.fillStyle='#fff';ctx.strokeStyle='#4E9E7E';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(x,y,2.2,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#4E9E7E';
        ctx.font='bold 9px sans-serif';ctx.textAlign='center';
        ctx.fillText(fmt(d.value),x,y-8);
      });
      /* 底部标签 */
      if(o.labels){
        ctx.fillStyle='#94949D';ctx.font='9px sans-serif';
        data.forEach(function(d,i){
          var t=String(d.label);if(t.length>3)t=t.slice(0,3);
          ctx.fillText(t,X(i),h-3);
        });
      }
    },
    bar:function(canvas,data,o){
      o=o||{};
      var w=o.w||(canvas.clientWidth||300),h=o.h||110;
      var ctx=fit(canvas,w,h);
      var pad={l:4,r:4,t:14,b:o.labels?18:6};
      var max=Math.max.apply(null,data.map(function(d){return d.value;}).concat([1]));
      var iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;
      var bw=Math.min(30,iw/data.length*0.55);
      data.forEach(function(d,i){
        var x=pad.l+iw*(i+0.5)/data.length;
        var bh=Math.max(2,ih*d.value/max);
        var y=pad.t+ih-bh;
        var c=d.color||CP[i%CP.length];
        ctx.fillStyle=c;
        ctx.fillRect(x-bw/2,y,bw,bh);
        ctx.fillStyle='rgba(0,0,0,.06)';
        ctx.fillRect(x-bw/2,y+bh-2,bw,2);
        ctx.fillStyle=c;ctx.font='bold 9px sans-serif';ctx.textAlign='center';
        ctx.fillText(fmt(d.value),x,y-5);
        if(o.labels){
          ctx.fillStyle='#94949D';ctx.font='9px sans-serif';
          var t=String(d.label);if(t.length>3)t=t.slice(0,3);
          ctx.fillText(t,x,h-4);
        }
      });
    },
    /* data:[{label,value}] → 环形饼图 */
    pie:function(canvas,data,o){
      o=o||{};
      var w=o.w||(canvas.clientWidth||200),h=o.h||120;
      var ctx=fit(canvas,w,h);
      var total=data.reduce(function(s,d){return s+d.value;},0);
      var cx=w/2,cy=h/2,R=Math.min(w,h)/2-(o.labels?16:6);
      var r=R*0.62;
      if(!total){ctx.fillStyle='#D6D6DE';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('暂无数据',cx,cy+4);return;}
      var a=-Math.PI/2;
      data.forEach(function(d,i){
        var ang=total?d.value/total*Math.PI*2:0;
        var c=d.color||CP[i%CP.length];
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a,a+ang);ctx.closePath();
        ctx.fillStyle=c;ctx.fill();
        ctx.strokeStyle='#FFFDF8';ctx.lineWidth=2;ctx.stroke();
        a+=ang;
      });
      ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fillStyle='#FFFDF8';ctx.fill();
      ctx.fillStyle='#3A3A3F';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
      ctx.fillText(fmt(total),cx,cy-1);
      ctx.fillStyle='#94949D';ctx.font='8px sans-serif';
      ctx.fillText(o.centerLabel||'合计',cx,cy+10);
    }
  };

  window.townExport={
    download:function(name,content,mime,noBom){
      var blob=new Blob([noBom?content:'\uFEFF'+content],{type:(mime||'text/plain')+';charset=utf-8'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
      document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);
    },
    stamp:function(){var d=new Date();return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');},
    esc:function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');},
    /* tables:[{t, h:[..], rows:[[..]]}] */
    xls:function(name,tables,title,sub){
      var d=new Date(),html='<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><title>'+title+'</title></head><body>';
      html+='<h2>'+title+'</h2><p>导出时间：'+d.toLocaleString()+(sub?'　'+sub:'')+'</p>';
      tables.forEach(function(tb){
        if(!tb.rows||!tb.rows.length){html+='<h4>'+tb.t+'（0 条）</h4>';return;}
        html+='<h4>'+tb.t+'（'+tb.rows.length+' 条）</h4><table border="1" cellspacing="0" cellpadding="4">';
        html+='<tr>'+tb.h.map(function(x){return '<th bgcolor="#E4F4EE">'+x+'</th>';}).join('')+'</tr>';
        tb.rows.forEach(function(r){html+='<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';});
        html+='</table><br>';
      });
      html+='<p>—— 小镇生活 · slow & gentle ——</p></body></html>';
      this.download(name,html,'application/vnd.ms-excel');
    },
    txt:function(name,lines){
      this.download(name,lines.join('\r\n'),'text/plain');
    }
  };

  /* ============ PWA：注册 Service Worker（需 HTTPS 部署后生效） ============ */
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }
})();
