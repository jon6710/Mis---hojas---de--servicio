/* MHS v37 · Nuevo formulario de AUTOCLAVE */
(()=>{
  const _editSheet=editSheet;
  const _collect=collect;
  const _finalizeSheet=finalizeSheet;
  const _pdfAutoclave=pdfAutoclave;
  const _prepareAutoclavePdfPhotos=prepareAutoclavePdfPhotos;

  function esNum(v){
    if(v===null||v===undefined||String(v).trim()==='')return NaN;
    return Number(String(v).replace(',','.'));
  }
  function fmt2(v){return Number.isFinite(v)?v.toFixed(2).replace('.',','):'—'}
  function autoSelect(id,label,options,value,extra=''){
    return `<div class="field"><label>${label}</label><select id="${id}" ${extra}>${options.map(o=>`<option value="${esc(o)}" ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  }
  function attachmentCard(key,title,hint,photosOnly=false){
    return `<div class="auto-upload-card"><div class="auto-upload-title"><b>${title}</b><small>${hint}</small></div>${attachmentSection(key,title,photosOnly)}</div>`;
  }
  function autoGeneral(c,d){
    return `<section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">1</span> DATOS GENERALES</span><span class="state ok">Datos del cliente</span></div><div class="accBody"><div class="formgrid auto-general-grid">
      ${field('cname','Cliente *',c.name||'')}
      ${field('contact','Contacto',c.contact||'')}
      ${field('clientRef','Referencia cliente',d.clientRef||'')}
      ${field('address','Dirección',c.address||'')}
      ${field('phone','Teléfono',c.phone||'')}
      ${field('email','Correo electrónico',c.email||'','email')}
      ${texta('generalObs','Observaciones generales',d.generalObs||d.observations||'')}
      <div class="full auto-client-actions"><button type="button" class="secondary" onclick="pickClient()">🔍 BUSCAR CLIENTE GUARDADO</button><button type="button" onclick="newClientModal()">＋ NUEVO CLIENTE</button></div>
    </div></div></section>`;
  }
  function autoForm37(d){
    const declared=d.declaredM3||'';
    const checked=d.checkedM3||'';
    const method=d.checkMethod||'Medición propia + albarán';
    const result=d.checkResult||'Diferencia aceptada';
    const bill=(d.billM3!==undefined&&d.billM3!=='')?d.billM3:checked;
    return `
      <section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">2</span> ALBARÁN DEL CLIENTE</span><span class="state">Documento</span></div><div class="accBody"><div class="formgrid">
        ${field('clientDeliveryNo','N.º de albarán *',d.clientDeliveryNo||'')}
        ${field('clientDeliveryDate','Fecha albarán',d.clientDeliveryDate||'','date')}
        <div class="full">${attachmentCard('clientDeliveryAttachments','Adjuntar albarán del cliente','Foto o PDF del documento recibido')}</div>
      </div></div></section>

      <section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">3</span> MEDICIÓN PROPIA</span><span class="state">Opcional</span></div><div class="accBody">
        <div class="notice auto-info">Adjunta aquí el PDF con nuestra medición y cálculos de m³. Es opcional si se acepta directamente el albarán del cliente.</div>
        ${attachmentCard('ownMeasurementAttachments','Adjuntar medición propia (PDF)','Medición y cálculo realizado por nosotros')}
      </div></section>

      <section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">4</span> CONTROL DE VOLUMEN</span><span class="state" id="autoVolumeState">Pendiente</span></div><div class="accBody"><div class="formgrid auto-volume-grid">
        ${field('declaredM3','m³ declarados por el cliente *',declared,'number','min="0" step="0.01" inputmode="decimal" oninput="updateAutoclaveCalc()"')}
        ${field('checkedM3','m³ comprobados *',checked,'number','min="0" step="0.01" inputmode="decimal" oninput="updateAutoclaveCalc()"')}
        ${autoSelect('checkMethod','Forma de comprobación *',['Medición propia + albarán','Medición propia','Albarán del cliente','Otro'],method,'onchange="updateAutoclaveCalc()"')}
        <div class="notice">Volumen declarado según albarán o comunicación inicial.</div>
        <div class="notice">Volumen real medido o verificado.</div>
      </div></div></section>

      <section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">5</span> RESULTADO DE LA COMPROBACIÓN</span><span class="state" id="autoResultState">Calculando</span></div><div class="accBody"><div class="auto-result-grid">
        <div class="auto-kpi warn"><span>Diferencia en m³</span><strong id="diffM3">—</strong></div>
        <div class="auto-kpi ok"><span>Diferencia en %</span><strong id="diffPct">—</strong></div>
        ${autoSelect('checkResult','Resultado de comprobación *',['Diferencia aceptada','Revisar con cliente','Pendiente de comprobación','Ajuste comercial'],result,'onchange="updateAutoclaveCalc()"')}
        <div class="auto-result-msg" id="autoResultMsg">Introduce ambos volúmenes para calcular la diferencia.</div>
      </div></div></section>

      <section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">6</span> m³ A FACTURAR</span><span class="state">Facturación</span></div><div class="accBody"><div class="formgrid">
        ${field('billM3','m³ a facturar *',bill,'number','min="0" step="0.01" inputmode="decimal"')}
        <div class="notice">Por defecto se toma el volumen comprobado. Puedes modificarlo si existe un acuerdo comercial.</div>
        ${texta('differenceNotes','Observaciones sobre la diferencia',d.differenceNotes||'')}
      </div></div></section>

      <section class="accordion auto-section auto-open"><div class="accHead"><span><span class="auto-step">7</span> FOTOS ADICIONALES (OPCIONAL)</span><span class="state">Evidencias</span></div><div class="accBody">
        ${attachmentCard('photoAttachments','Añadir fotos','Carga, detalle de la madera, salida de autoclave, etc.',true)}
      </div></section>`;
  }

  editSheet=function(id){
    if(id)current=DB.get('sheets').find(x=>x.id===id);
    if(!current)return home();
    if(current.type!=='autoclave')return _editSheet(id);
    current.data=current.data||{};current.products=current.products||[];current.attachments=current.attachments||[];
    const c=current.client||{},d=current.data||{};
    app.innerHTML=`<div class="toolbar"><button class="secondary" onclick="saveSheet(true);showView('sheets')">← VOLVER</button><span class="spacer"></span>${current.number?'<button class="secondary" onclick="duplicateSheet()">DUPLICAR</button>':''}<button onclick="saveSheet()">GUARDAR</button><button class="secondary" onclick="printSheet()">GENERAR PDF</button><button onclick="finalizeSheet()">FINALIZAR HOJA</button></div>
    <div class="sheet auto-sheet"><div class="auto-title"><div><span class="auto-ico">🪵</span><div><h1>Hoja de servicio – Autoclave</h1><small>${current.number?`N.º ${esc(current.number)}`:'Nueva hoja'}</small></div></div><div class="auto-date">${field('date','Fecha *',current.date,'date')}</div></div>
    <div class="sheetmeta auto-meta">${field('num','N.º de hoja *',current.number)}${field('start','Hora inicio',current.start,'time')}${field('end','Hora fin',current.end,'time')}<div class="field"><label>Estado</label><div class="status">${current.status}</div></div></div>
    ${autoGeneral(c,d)}${autoForm37(d)}</div>`;
    openBlock=null;setTimeout(()=>{bindAutoSave();updateAutoclaveCalc(true)},0);
  };

  collect=function(){
    _collect();
    if(!current||current.type!=='autoclave')return;
    const d=current.data=current.data||{};
    current.client={...(current.client||{}),name:val('cname'),contact:val('contact'),address:val('address'),phone:val('phone'),email:val('email')};
    ['clientRef','generalObs','clientDeliveryNo','clientDeliveryDate','declaredM3','checkedM3','checkMethod','checkResult','billM3','differenceNotes'].forEach(k=>{if(document.getElementById(k))d[k]=val(k)});
    d.observations=d.generalObs||'';
    const a=esNum(d.declaredM3),b=esNum(d.checkedM3);
    d.differenceM3=(Number.isFinite(a)&&Number.isFinite(b))?(b-a):'';
    d.differencePct=(Number.isFinite(a)&&a!==0&&Number.isFinite(b))?((b-a)/a*100):'';
  };

  window.updateAutoclaveCalc=function(initial=false){
    if(!current||current.type!=='autoclave')return;
    const a=esNum(document.getElementById('declaredM3')?.value);
    const b=esNum(document.getElementById('checkedM3')?.value);
    const diff=(Number.isFinite(a)&&Number.isFinite(b))?b-a:NaN;
    const pct=(Number.isFinite(diff)&&a!==0)?diff/a*100:NaN;
    const dm=document.getElementById('diffM3'),dp=document.getElementById('diffPct'),msg=document.getElementById('autoResultMsg'),st=document.getElementById('autoResultState'),vs=document.getElementById('autoVolumeState');
    if(dm)dm.textContent=Number.isFinite(diff)?`${diff>=0?'+ ':''}${fmt2(diff)} m³`:'—';
    if(dp)dp.textContent=Number.isFinite(pct)?`${pct>=0?'+ ':''}${fmt2(pct)} %`:'—';
    if(vs){vs.textContent=Number.isFinite(diff)?'Comprobado':'Pendiente';vs.classList.toggle('ok',Number.isFinite(diff));}
    if(st){st.textContent=Number.isFinite(pct)?'Calculado':'Pendiente';st.classList.toggle('ok',Number.isFinite(pct));}
    if(msg){
      const within=Number.isFinite(pct)&&Math.abs(pct)<=2;
      msg.className='auto-result-msg '+(within?'accepted':'review');
      msg.textContent=!Number.isFinite(pct)?'Introduce ambos volúmenes para calcular la diferencia.':within?'✓ La diferencia está dentro del margen orientativo del 2 %.':'⚠ La diferencia supera el 2 %. Revisa el resultado antes de finalizar.';
    }
    const bill=document.getElementById('billM3');
    if(bill&&Number.isFinite(b)&&(!bill.value||initial))bill.value=String(b).replace('.',',');
  };

  finalizeSheet=function(){
    if(!current||current.type!=='autoclave')return _finalizeSheet();
    collect();const d=current.data||{},c=current.client||{},miss=[];
    if(!current.number)miss.push('N.º de hoja');
    if(!current.date)miss.push('Fecha');
    if(!c.name)miss.push('Cliente');
    if(!d.clientDeliveryNo)miss.push('N.º de albarán del cliente');
    const a=esNum(d.declaredM3),b=esNum(d.checkedM3),bill=esNum(d.billM3);
    if(!Number.isFinite(a)||a<0)miss.push('m³ declarados por el cliente');
    if(!Number.isFinite(b)||b<0)miss.push('m³ comprobados');
    if(!d.checkMethod)miss.push('Forma de comprobación');
    if(!d.checkResult)miss.push('Resultado de comprobación');
    if(!Number.isFinite(bill)||bill<0)miss.push('m³ a facturar');
    if(miss.length){alert(`Faltan ${miss.length} campos/requisitos:\n• `+miss.join('\n• '));return;}
    const pct=Number.isFinite(a)&&a!==0?Math.abs((b-a)/a*100):0;
    if(pct>2&&d.checkResult==='Diferencia aceptada'&&!confirm(`La diferencia es del ${fmt2(pct)} %, superior al 2 %. ¿Confirmas que quieres finalizarla como “Diferencia aceptada”?`))return;
    if(confirm('¿Quieres finalizar esta hoja de autoclave? La hoja seguirá pudiendo editarse posteriormente.')){current.status='FINALIZADA';saveSheet(true);editSheet();setTimeout(()=>alert('Hoja de autoclave finalizada correctamente.'),50);}
  };

  prepareAutoclavePdfPhotos=async function(s){
    if(s.type!=='autoclave')return _prepareAutoclavePdfPhotos(s);
    for(const key of ['clientDeliveryAttachments','ownMeasurementAttachments','photoAttachments']){
      for(const x of (s.data?.[key]||[])){
        x.pdfData='';
        if(x.id&&String(x.type||'').startsWith('image')){try{const f=await getFile(x.id);if(f)x.pdfData=await fileToDataURL(f)}catch(e){x.pdfData='';}}
      }
    }
  };

  pdfAutoclave=function(s){
    const d=s.data||{},a=esNum(d.declaredM3),b=esNum(d.checkedM3),diff=Number.isFinite(a)&&Number.isFinite(b)?b-a:NaN,pct=Number.isFinite(diff)&&a!==0?diff/a*100:NaN;
    const files=(arr,title)=>{arr=arr||[];return arr.length?`<div class="box attach"><h2>${title}</h2>${arr.map(x=>x.pdfData?`<div style="margin:2mm 0;text-align:center;break-inside:avoid"><img src="${x.pdfData}" style="max-width:70%;max-height:52mm;object-fit:contain"></div>`:`<div>${pdfText(x.name,'Archivo adjunto')}</div>`).join('')}</div>`:''};
    return `${pdfHeader(s,'HOJA DE SERVICIO - AUTOCLAVE')}${pdfClient(s)}
    <div class="box"><h2>Albarán del cliente</h2><b>N.º:</b> ${pdfText(d.clientDeliveryNo)} &nbsp; <b>Fecha:</b> ${pdfDate(d.clientDeliveryDate)}</div>
    <div class="box"><h2>Control de volumen</h2><table class="small"><tr><th>Declarado cliente</th><th>Comprobado</th><th>Diferencia</th><th>Diferencia %</th><th>Forma de comprobación</th></tr><tr><td>${Number.isFinite(a)?fmt2(a)+' m³':'—'}</td><td>${Number.isFinite(b)?fmt2(b)+' m³':'—'}</td><td>${Number.isFinite(diff)?fmt2(diff)+' m³':'—'}</td><td>${Number.isFinite(pct)?fmt2(pct)+' %':'—'}</td><td>${pdfText(d.checkMethod)}</td></tr></table></div>
    <div class="grid2"><div><div class="box"><h2>Resultado</h2><b>${pdfText(d.checkResult)}</b><br><br><b>m³ a facturar:</b> ${pdfText(d.billM3)} m³</div><div class="box cut"><h2>Observaciones sobre la diferencia</h2>${pdfText(d.differenceNotes)}</div></div><div><div class="box cut"><h2>Observaciones generales</h2>${pdfText(d.generalObs||d.observations)}</div>${pdfDirector()}</div></div>
    ${files(d.clientDeliveryAttachments,'Albarán del cliente adjunto')}${files(d.ownMeasurementAttachments,'Medición propia adjunta')}${files(d.photoAttachments,'Fotos adicionales')}`;
  };
})();
