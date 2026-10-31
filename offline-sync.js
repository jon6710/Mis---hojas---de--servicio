(()=>{
'use strict';
const DB_NAME='mhs_offline_v44';
const DB_VERSION=2;
const Q='queue', B='blobs', S='state';
let dbp;
const listeners=new Set();
let syncing=false;
function openDB(){
  if(dbp)return dbp;
  dbp=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,DB_VERSION);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(Q)){
        const s=db.createObjectStore(Q,{keyPath:'id'});
        s.createIndex('status','status',{unique:false});
        s.createIndex('updatedAt','updatedAt',{unique:false});
      }
      if(!db.objectStoreNames.contains(B))db.createObjectStore(B,{keyPath:'id'});
      if(!db.objectStoreNames.contains(S))db.createObjectStore(S,{keyPath:'id'});
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  return dbp;
}
function tx(store,mode='readonly'){return openDB().then(db=>db.transaction(store,mode).objectStore(store));}
function req(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});}
async function putQueue(item){const s=await tx(Q,'readwrite');await req(s.put(item));notify();}
async function enqueue(kind,payload,{dedupeKey='',blobId=''}={}){
  const now=new Date().toISOString();
  if(dedupeKey){
    const all=await listQueue();
    const old=all.find(x=>x.dedupeKey===dedupeKey&&x.status==='pending');
    if(old){old.payload=payload;old.updatedAt=now;old.blobId=blobId||old.blobId;await putQueue(old);return old.id;}
  }
  const id='q_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  await putQueue({id,kind,payload,dedupeKey,blobId,status:'pending',createdAt:now,updatedAt:now,tries:0,lastError:''});
  return id;
}
async function listQueue(){const s=await tx(Q);return (await req(s.getAll()))||[];}
async function pendingCount(){return (await listQueue()).filter(x=>x.status==='pending').length;}
async function storeBlob(blob,meta={}){
  const id='blob_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const s=await tx(B,'readwrite');
  await req(s.put({id,blob,meta,createdAt:new Date().toISOString()}));
  return id;
}
async function getBlob(id){if(!id)return null;const s=await tx(B);return req(s.get(id));}

async function saveState(value){const s=await tx(S,'readwrite');await req(s.put({id:'main',value,updatedAt:new Date().toISOString()}));}
async function loadState(){const s=await tx(S);const rec=await req(s.get('main'));return rec?.value||null;}

async function deleteBlob(id){if(!id)return;const s=await tx(B,'readwrite');return req(s.delete(id));}
async function setStatus(id,status,lastError=''){const s=await tx(Q,'readwrite');const item=await req(s.get(id));if(!item)return;item.status=status;item.lastError=lastError;item.updatedAt=new Date().toISOString();if(status==='pending')item.tries=(item.tries||0)+1;await req(s.put(item));}
async function deleteQueue(id){const s=await tx(Q,'readwrite');await req(s.delete(id));notify();}
function endpoint(){return (window.MHS_SYNC_ENDPOINT||'').trim();}
async function syncNow(){
  if(syncing||!navigator.onLine)return {synced:0,pending:await pendingCount(),reason:!navigator.onLine?'offline':'busy'};
  const ep=endpoint();
  if(!ep){notify();return {synced:0,pending:await pendingCount(),reason:'no-endpoint'};}
  syncing=true;notify();let synced=0;
  try{
    const items=(await listQueue()).filter(x=>x.status==='pending').sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    for(const item of items){
      try{
        const fd=new FormData();fd.append('kind',item.kind);fd.append('payload',JSON.stringify(item.payload||{}));fd.append('queueId',item.id);
        if(item.blobId){const rec=await getBlob(item.blobId);if(rec?.blob)fd.append('file',rec.blob,rec.meta?.name||'archivo');}
        const resp=await fetch(ep,{method:'POST',body:fd,headers:{'X-MHS-Offline-Queue':'1'}});
        if(!resp.ok)throw new Error('HTTP '+resp.status);
        await deleteQueue(item.id);if(item.blobId)await deleteBlob(item.blobId);synced++;
      }catch(e){await setStatus(item.id,'pending',String(e?.message||e));break;}
    }
  }finally{syncing=false;notify();}
  return {synced,pending:await pendingCount(),reason:'done'};
}
async function getStatus(){return {online:navigator.onLine,pending:await pendingCount(),syncing,configured:!!endpoint()};}
function onStatus(fn){listeners.add(fn);getStatus().then(fn);return()=>listeners.delete(fn);}
async function notify(){const st=await getStatus();listeners.forEach(fn=>{try{fn(st)}catch{}});}
window.addEventListener('online',()=>{notify();syncNow();});
window.addEventListener('offline',notify);
setInterval(()=>{if(navigator.onLine)syncNow();},45000);
openDB().then(notify).catch(()=>{});
window.MHSOffline={enqueue,storeBlob,getBlob,saveState,loadState,listQueue,pendingCount,syncNow,getStatus,onStatus,endpoint};
})();
