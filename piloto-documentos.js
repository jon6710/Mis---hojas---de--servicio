// Panel exclusivo de comparación de plantillas; NO modifica la impresión dinámica v51.
(function(){
  'use strict';
  const btn=document.getElementById('btnDocsPilot');
  if(!btn)return;
  const docs=[
    ['Autoclave · Hoja de servicio','AUTOCLAVE_HOJA_SERVICIO_APROBADA.pdf','Aprobada'],
    ['Autoclave · Albarán','AUTOCLAVE_ALBARAN_APROBADO.pdf','Aprobado'],
    ['Autoclave · Factura','AUTOCLAVE_FACTURA_REFERENCIA.pdf','Referencia aprobada'],
    ['Mobiliario · Hoja de servicio','MOBILIARIO_HOJA_SERVICIO_PENDIENTE_AJUSTE.pdf','Pendiente de ajustar a AUTOCLAVE / INSITU GEL'],
    ['Mobiliario · Albarán','MOBILIARIO_ALBARAN_REFERENCIA.pdf','Referencia pendiente de prueba real'],
    ['Mobiliario · Factura','MOBILIARIO_FACTURA_REFERENCIA.pdf','Referencia pendiente de prueba real']
  ];
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.side-link').forEach(e=>e.classList.remove('active'));
    btn.classList.add('active');
    const root=document.getElementById('app');
    root.innerHTML='<section class="hero"><div><span class="eyebrow">PILOTO v53 · COMPARACIÓN</span><h1>Plantillas de referencia A4</h1><p>Estas son las visuales aprobadas, aún NO conectadas a la impresión real de la aplicación. Para detectar fallos: abre un servicio, rellena datos e imprime con el sistema actual; compara con estas referencias.</p></div></section>'+docs.map(([n,f,status])=>'<section class="panel" style="padding:16px;margin:14px 0"><h3>'+n+'</h3><p>'+status+'</p><p><a class="btn blue" href="plantillas-aprobadas/'+f+'" target="_blank" rel="noopener">Abrir PDF de referencia</a></p></section>').join('')+'<section class="panel" style="padding:16px"><strong>Comprobaciones:</strong> clientes, productos, fotos, firma, sello, impresión A4, albarán sin precios, facturas con IVA, datos de mobiliario. <strong>La impresión dinámica definitiva sigue pendiente de integración.</strong></section>';
  });
})();
