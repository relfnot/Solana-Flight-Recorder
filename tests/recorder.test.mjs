import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validSignature, diagnose, demoRecording, collectRecording, reportMarkdown, parseRecording } from '../lib/recorder.ts';
const signature = '4ReKprwf3WdLHRrzp4ctPWNBsQDPL3VZz3zMmoZfcGJMJCHh5Vq937mPdyxhCbw54wNnA6hZ7KfNpQdpt13yY7A9';
const fixture = demoRecording('success');
fixture.transaction.transaction.signatures = [signature];
test('signature validation checks both alphabet and decoded byte length', () => {
  assert.equal(validSignature(signature), true);
  for (const bad of ['', '0'.repeat(88), 'a'.repeat(64), 'z'.repeat(88), 'demo', '<script>']) assert.equal(validSignature(bad), false, bad);
});
test('execution error stays failed even when finalized', () => { const r=demoRecording('failed'); assert.equal(r.status.confirmationStatus,'finalized'); assert.equal(diagnose(r).kind,'failed'); });
test('null evidence never implies dropped or expired', () => {const v=diagnose(demoRecording('unknown')); assert.equal(v.kind,'unknown'); assert.match(v.detail,/not proof/);});
test('missing meta and missing status never imply successful execution', () => {const r=structuredClone(fixture);r.transaction.meta=null;r.status=null;assert.equal(diagnose(r).kind,'unknown');});
test('status can establish outcome when transaction history is unavailable', () => {const r=structuredClone(fixture);r.transaction=null;assert.equal(diagnose(r).kind,'success');r.status.err={InstructionError:[1,'InvalidArgument']};assert.equal(diagnose(r).kind,'failed');});
test('collector uses only two read-only RPC methods and no endpoint in report', async () => {
  const calls=[];
  const mock=async (url, init)=>{const p=JSON.parse(init.body); calls.push(p);return Response.json({result:p.method==='getTransaction'?fixture.transaction:{value:[fixture.status]}});};
  const r=await collectRecording(signature,'https://example.invalid/?api-key=SECRET','RPC Fast',mock);
  assert.deepEqual(calls.map(c=>c.method),['getTransaction','getSignatureStatuses']);
  assert.equal(calls[0].params[1].maxSupportedTransactionVersion,1);
  assert.equal(calls[0].params[1].commitment,'confirmed');
  assert.equal(calls[1].params[1].searchTransactionHistory,true);
  assert.equal(diagnose(r).kind,'success');assert.equal(JSON.stringify(r).includes('SECRET'),false);
});
test('429 and network exceptions become unavailable evidence, not missing transactions',async()=>{
  for(const mock of [async()=>new Response('',{status:429}),async()=>{throw new Error('https://secret.invalid/KEY');}]){
    const r=await collectRecording(signature,'https://example.invalid','Test',mock);assert.equal(diagnose(r).title,'Evidence incomplete');assert.equal(r.observations.every(o=>!o.ok),true);assert.equal(JSON.stringify(r).includes('KEY'),false);
  }
});
test('partial provider failure preserves valid successful evidence',async()=>{
  const r=await collectRecording(signature,'https://example.invalid','Test',async(url,init)=>JSON.parse(init.body).method==='getTransaction'?new Response('',{status:503}):Response.json({result:{value:[fixture.status]}}));
  assert.equal(diagnose(r).kind,'success');assert.equal(r.transaction,null);assert.equal(r.observations.some(o=>!o.ok),true);
});
test('malformed RPC payload becomes incomplete evidence',async()=>{
  for(const result of [{},{unexpected:42}]){
    const r=await collectRecording(signature,'https://example.invalid','Test',async()=>Response.json({result}));assert.equal(diagnose(r).kind,'unknown');assert.equal(diagnose(r).title,'Evidence incomplete');
  }
});
test('demo exports cannot be mistaken for real mainnet evidence',()=>{const md=reportMarkdown(demoRecording('failed'));assert.match(md,/SYNTHETIC DEMO/);assert.match(md,/not transaction landing latency/);assert.match(md,/6001/);});
test('invalid signatures never issue a request',async()=>{let called=false;await assert.rejects(collectRecording('bad','https://example.invalid','Test',async()=>{called=true;}));assert.equal(called,false);});
test('imports preserve data but explicitly mark it as unverified',()=>{const r=parseRecording(JSON.stringify(demoRecording('failed')));assert.equal(r.imported,true);assert.match(reportMarkdown(r),/not independently verified/);});
test('imports reject malformed metadata, mismatched signature and oversized payloads',()=>{
  const r=structuredClone(fixture);r.source='live';r.signature=signature;r.transaction.transaction.signatures=[];
  assert.throws(()=>parseRecording(JSON.stringify(r)),/does not match/);
  r.transaction.meta.logMessages={unexpected:'object'};assert.throws(()=>parseRecording(JSON.stringify(r)),/not a supported/);
  assert.throws(()=>parseRecording('x'.repeat(2000001)),/smaller than/);
});
test('malformed nested transaction and status are unavailable, never trusted',async()=>{
  const r=await collectRecording(signature,'https://example.invalid','Test',async(u,init)=>Response.json({result:JSON.parse(init.body).method==='getTransaction'?{slot:1,blockTime:null,meta:{err:null},transaction:{}}:{value:[{err:null}]}}));
  assert.equal(diagnose(r).kind,'unknown');assert.equal(r.observations.every(o=>!o.ok),true);
});
