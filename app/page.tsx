'use client';
import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, FileJson, Fingerprint, FlaskConical, Layers3, Menu, Radio, Search, ShieldCheck, Terminal, Trash2, TriangleAlert, X } from 'lucide-react';
import { demoRecording, diagnose, reportMarkdown, validSignature, parseRecording, type Recording } from '@/lib/recorder';
type Section = 'overview' | 'logs' | 'accounts' | 'raw';
const n = (v: number | undefined | null) => v == null ? '—' : v.toLocaleString('en-US');
const short = (s: string) => s.length > 24 ? s.slice(0, 12) + '…' + s.slice(-8) : s;

export default function Home() {
  const [record, setRecord] = useState<Recording>(() => demoRecording('failed'));
  const [signature, setSignature] = useState('');
  const [section, setSection] = useState<Section>('overview');
  const [provider, setProvider] = useState('Checking provider…');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [help, setHelp] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [history, setHistory] = useState<Recording[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const verdict = diagnose(record);
  const tx = record.transaction;
  const logs = tx?.meta?.logMessages ?? [];
  const isDemo = record.source === 'demo';
  const confirmation = record.status?.confirmationStatus ?? 'Unavailable';
  useEffect(() => { fetch('/api/record').then(r => r.json() as Promise<{provider?: string}>).then(r => setProvider(r.provider ?? 'Provider unavailable')).catch(() => setProvider('Provider unavailable')); }, []);
  useEffect(() => { if(!help)return; const onKey = (e: KeyboardEvent) => {if(e.key==='Escape')setHelp(false);}; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); }, [help]);
  function selectDemo(kind: 'failed' | 'success' | 'unknown') { setRecord(demoRecording(kind)); setSection('overview'); setError(''); setNotice(''); setLogFilter(''); setSidebar(false); }
  async function loadMainnetExample() {
    try {
      const response = await fetch('/example-mainnet.json'); if(!response.ok)throw new Error('The captured example is unavailable.');
      const r=parseRecording(await response.text());setRecord(r);setSection('overview');setError('');setLogFilter('');setSidebar(false);
      setNotice('Historical mainnet capture from 11 Oct 2026. This is a saved, unsigned observation, not a fresh lookup.');
    }catch(err){setError(err instanceof Error?err.message:'Could not load the captured example.');}
  }
  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file)return;
    try {
      if(file.size > 2_000_000)throw new Error('Evidence files must be smaller than 2 MB.');
      const r=parseRecording(await file.text());setRecord(r);setSection('overview');setError('');setLogFilter('');setSidebar(false);
      setHistory(prev=>[r,...prev.filter(x=>x.signature!==r.signature)].slice(0,8));
      setNotice('Evidence imported locally. File contents have not been independently verified.');
    }catch(err){setError(err instanceof Error?err.message:'Could not import this file.');}
    e.target.value='';
  }
  async function investigate(e: React.FormEvent) {
    e.preventDefault(); if (lock.current) return; const value = signature.trim();
    if (!validSignature(value)) { setError('Enter a valid Solana transaction signature: a base58-encoded, 64-byte signature.'); input.current?.focus(); return; }
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/record', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signature: value }), signal: AbortSignal.timeout(20000) });
      const data = await response.json() as Recording & {error?: string}; if (!response.ok) throw new Error(data.error || 'Recording could not be completed.');
      if (data.schemaVersion !== 1 || !Array.isArray(data.observations)) throw new Error('The server returned an invalid recording.');
      setRecord(data); setSection('overview'); setLogFilter('');
      setHistory(prev => [data, ...prev.filter(r => r.signature !== data.signature)].slice(0, 8));
    } catch (err) { setError(err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'The request timed out. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function download(format: 'json' | 'md') {
    const blob = new Blob([format === 'json' ? JSON.stringify(record, null, 2) : reportMarkdown(record)], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `flight-recorder-${isDemo ? 'demo' : record.signature.slice(0, 10)}.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`${format === 'json' ? 'Evidence JSON' : 'Incident report'} exported${isDemo ? ' with a synthetic-demo label' : ''}.`);
  }
  return <div className="app-shell">
    <aside className={`sidebar ${sidebar ? 'is-open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); selectDemo('failed'); }} aria-label="Flight Recorder home"><span className="brand-mark"><Radio size={23}/></span><span>flight<span className="brand-light">recorder</span><small>SOLANA OBSERVABILITY</small></span></a>
      <div className="workspace"><span className="workspace-icon">S</span><div>Solo workspace<small>Infrastructure lab</small></div><span className="version">v0.1</span></div>
      <p className="nav-caption">WORKSPACE</p>
      <button className="nav-link active" onClick={() => { setHelp(false); setSidebar(false); input.current?.focus(); }}><Activity size={18}/> Transaction inspector <span className="nav-dot"/></button>
      <button className="nav-link" onClick={() => setHelp(true)}><Layers3 size={18}/> How it works <ArrowUpRight size={14}/></button>
      <button className="nav-link" onClick={() => importInput.current?.click()}><FileJson size={18}/> Import evidence <ArrowUpRight size={14}/></button>
      <input ref={importInput} type="file" accept=".json,application/json" hidden aria-label="Import evidence JSON" onChange={importFile}/>
      <div className="nav-divider"/><p className="nav-caption">EXAMPLE RECORDINGS <FlaskConical size={13}/></p>
      <button className={`example ${isDemo && verdict.kind === 'failed' ? 'selected' : ''}`} onClick={() => selectDemo('failed')}><span className="status-dot failed"/><span>Instruction error<small>Trace an execution failure</small></span><ChevronRight size={14}/></button>
      <button className={`example ${isDemo && verdict.kind === 'success' ? 'selected' : ''}`} onClick={() => selectDemo('success')}><span className="status-dot success"/><span>Successful execution<small>Inspect a confirmed result</small></span><ChevronRight size={14}/></button>
      <button className={`example ${isDemo && verdict.kind === 'unknown' ? 'selected' : ''}`} onClick={() => selectDemo('unknown')}><span className="status-dot unknown"/><span>Missing evidence<small>Know what you don’t know</small></span><ChevronRight size={14}/></button>
      <p className="demo-note">Examples use synthetic data.</p><div className="nav-divider"/>
      <button className="example" onClick={loadMainnetExample}><span className="status-dot failed"/><span>Real mainnet capture<small>Saved evidence · 11 Oct 2026</small></span><ArrowUpRight size={14}/></button><div className="nav-divider"/>
      <p className="nav-caption">THIS SESSION <span>{history.length.toString().padStart(2,'0')}</span></p>
      {history.length === 0 ? <p className="empty-history">Your live recordings will appear here. Kept in memory for this tab.</p> : <><div className="history-list">{history.map((r,i) => <button className="history-item" key={r.capturedAt+i} onClick={() => {setRecord(r);setSection('overview');setLogFilter('');setSidebar(false);}}><span className={`status-dot ${diagnose(r).kind}`}/><span>{short(r.signature)}</span></button>)}</div><button className="clear-history" onClick={() => {setHistory([]);setNotice('Session history cleared.');}}><Trash2 size={12}/> Clear history</button></>}
      <div className="sidebar-bottom"><div className="read-only"><ShieldCheck size={18}/><div>Read-only by design<small>No wallet. No signing. No funds.</small></div></div><span>Built for the evidence.</span><span className="bottom-cross">✳</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="Toggle navigation" onClick={() => setSidebar(!sidebar)}><Menu size={20}/></button><span>Workspace</span><ChevronRight size={13}/><strong>Transaction inspector</strong></div><div className="network-pill"><span className="status-dot success"/> Solana mainnet <span className="beta">BETA</span></div></header>
      <main>
        <div className="page-title"><div><div className="eyebrow">EVERY TRANSACTION LEAVES A TRACE</div><h1>Find the signal.<br className="mobile-break"/> Keep the evidence.</h1><p>From a transaction signature to a clear incident report.</p></div><div className="title-art" aria-hidden="true"><span/><span/><span/><Activity size={34}/></div></div>
        <section className="search-panel" aria-label="Record a transaction"><form onSubmit={investigate}><label htmlFor="signature">TRANSACTION SIGNATURE <span>READ-ONLY LOOKUP</span></label><div className="search-row"><Search size={20}/><input id="signature" ref={input} value={signature} onChange={e=>setSignature(e.target.value)} placeholder="Paste a Solana transaction signature…" autoComplete="off" spellCheck={false} aria-describedby="lookup-hint" disabled={busy}/><button type="submit" className="primary" disabled={busy}>{busy ? 'Recording…' : 'Inspect transaction'}{busy ? <span className="spinner"/> : <ArrowRight size={17}/>}</button></div><div id="lookup-hint" className="search-bottom"><span><span className="tiny-dot"/> {provider}</span><span>Two RPC reads · No wallet connection</span></div></form></section>
        {error && <div className="message error" role="alert"><TriangleAlert size={18}/>{error}</div>}
        {notice && <div className="message notice" role="status"><Check size={16}/>{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={15}/></button></div>}
        <div className={`context-bar ${isDemo ? 'demo' : 'live'}`}><span><FlaskConical size={16}/><strong>{record.imported ? 'Imported · unverified' : isDemo ? 'Demo recording' : 'Live RPC recording'}</strong><span className="context-description">{isDemo ? 'Synthetic evidence. Explore the workflow before your first lookup.' : `Captured ${new Date(record.capturedAt).toLocaleString()} · ${record.provider}`}</span></span>{isDemo && <button onClick={()=>input.current?.focus()}>Try your own <ArrowUpRight size={14}/></button>}</div>
        <section className="recording-panel" aria-label="Transaction evidence">
          <div className="recording-heading"><div><div className="section-eyebrow">RECORDING / {isDemo ? 'EXAMPLE' : 'MAINNET'}</div><div className="recording-id"><Fingerprint size={19}/><span title={record.signature}>{short(record.signature)}</span>{!isDemo && <a href={`https://explorer.solana.com/tx/${encodeURIComponent(record.signature)}`} target="_blank" rel="noreferrer" aria-label="Open transaction in Solana Explorer"><ArrowUpRight size={16}/></a>}</div></div><div className="export-actions"><button className="secondary compact" onClick={()=>download('json')}><FileJson size={15}/><span>JSON</span></button><button className="secondary" onClick={()=>download('md')}><ArrowDownToLine size={16}/> Export report</button></div></div>
          <div className="tabs" role="tablist" aria-label="Evidence views">{([['overview','Overview'],['logs','Program logs'],['accounts','Account changes'],['raw','Raw evidence']] as const).map(([key,title])=><button role="tab" aria-selected={section===key} aria-controls={`panel-${key}`} id={`tab-${key}`} key={key} className={section===key?'tab active':'tab'} onClick={()=>setSection(key)}>{title}{key==='logs' && <span>{logs.length}</span>}</button>)}</div>
          <div className="tab-content" role="tabpanel" id={`panel-${section}`} aria-labelledby={`tab-${section}`}>
            {section==='overview' && <>
              <div className={`verdict ${verdict.kind}`}><div className="verdict-icon">{verdict.kind==='failed'?<TriangleAlert size={22}/>:verdict.kind==='success'?<CheckCircle2 size={22}/>:<CircleHelp size={22}/>}</div><div><div className="verdict-title"><h2>{verdict.title}</h2><span className="evidence-tag">{verdict.kind==='unknown'?'UNCERTAINTY EXPLICIT':'RPC EVIDENCE'}</span></div><p>{verdict.detail}</p><code>{verdict.evidence}</code></div></div>
              <div className="metrics"><div><span>Confirmation</span><strong className="capitalize">{confirmation}</strong><small>Separate from execution result</small></div><div><span>Recorded slot</span><strong>{n(tx?.slot ?? record.status?.slot)}</strong><small>From the RPC response</small></div><div><span>Transaction fee</span><strong>{tx?.meta?.fee == null?'—':(tx.meta.fee/1e9).toFixed(9).replace(/\.?0+$/,'')} <em>SOL</em></strong><small>{tx?.meta?.fee == null?'Fee unavailable':`${n(tx.meta.fee)} lamports`}</small></div><div><span>Compute consumed</span><strong>{n(tx?.meta?.computeUnitsConsumed)} <em>CU</em></strong><small>Reported execution compute</small></div></div>
              <div className="evidence-grid"><div className="timeline"><div className="subheading"><h3>Evidence timeline</h3><span>OBSERVATION SNAPSHOT</span></div><div className="timeline-item"><span className="timeline-icon"><Search size={14}/></span><div><strong>Recording captured</strong><p>{isDemo?'Synthetic capture time': 'Server capture completed'} · {new Date(record.capturedAt).toISOString().slice(11,19)} UTC</p></div><span className="timeline-label">CAPTURE</span></div>{record.observations.map((o,i)=><div className="timeline-item" key={o.method+i}><span className={`timeline-icon ${o.ok?'':'bad'}`}>{o.ok?<Check size={14}/>:<X size={14}/>}</span><div><strong>{o.method}</strong><p>{o.ok?(o.method==='getTransaction'?(tx?'Transaction data returned':'No transaction returned'):(record.status?'Signature status returned':'No status returned')):o.error}</p></div><span className="timeline-duration">{o.durationMs} ms</span></div>)}<div className="timeline-item"><span className={`timeline-icon ${verdict.kind==='failed'?'bad':''}`}><ShieldCheck size={14}/></span><div><strong>{verdict.title}</strong><p>Derived only from the available response fields</p></div></div><p className="timeline-footnote"><Clock3 size={13}/> Durations are RPC round trips, not transaction landing times.</p></div><aside className="next-step"><div className="next-step-icon"><ArrowUpRight size={20}/></div><span className="section-eyebrow">NEXT BEST STEP</span><h3>Move from evidence <br/>to investigation.</h3><p>{verdict.next}</p><button onClick={()=>setSection(logs.length?'logs':'raw')}>{logs.length?'Inspect program logs':'Review raw evidence'}<ArrowRight size={16}/></button></aside></div>
            </>}
            {section==='logs' && <><div className="view-heading"><div><h3>Program execution logs</h3><p>Provider-returned messages in their original order.</p></div><div className="filter"><Search size={15}/><input aria-label="Filter program logs" value={logFilter} onChange={e=>setLogFilter(e.target.value)} placeholder="Filter logs…"/></div></div><div className="log-console">{logs.length===0?<div className="empty-state"><Terminal size={30}/><h3>No program logs available</h3><p>This recording does not include execution logs. That absence does not establish a failure.</p></div>:logs.filter(l=>l.toLowerCase().includes(logFilter.toLowerCase())).length===0?<p className="empty-filter">No log lines match “{logFilter}”.</p>:logs.map((line,i)=>line.toLowerCase().includes(logFilter.toLowerCase())&&<div className={`log-line ${/failed|error/i.test(line)?'log-error':/success/.test(line)?'log-success':''}`} key={i}><span>{String(i+1).padStart(2,'0')}</span><code>{line}</code></div>)}</div><p className="panel-note">Custom program error numbers are program-specific. This tool does not assign a meaning without a verified program definition.</p></>}
            {section==='accounts' && <><div className="view-heading"><div><h3>SOL balance changes</h3><p>Pre- and post-transaction balances. Includes fees and account funding; not a token transfer decoder.</p></div></div>{tx?.meta?.preBalances && tx?.meta?.postBalances?<div className="table-scroll"><table><thead><tr><th>Account</th><th>Before / SOL</th><th>After / SOL</th><th>Change / SOL</th></tr></thead><tbody>{tx.transaction.message.accountKeys.map((a,i)=>{const pre=tx.meta?.preBalances?.[i], post=tx.meta?.postBalances?.[i]; const delta=pre!=null&&post!=null?(post-pre)/1e9:null; return <tr key={i}><td><code title={typeof a==='string'?a:a.pubkey}>{short(typeof a==='string'?a:a.pubkey)}</code>{typeof a!=='string'&&a.signer&&<span className="account-tag">Signer</span>}</td><td>{pre==null?'—':(pre/1e9).toFixed(9)}</td><td>{post==null?'—':(post/1e9).toFixed(9)}</td><td className={delta!=null&&delta<0?'negative':delta!=null&&delta>0?'positive':''}>{delta==null?'—':`${delta>0?'+':''}${delta.toFixed(9)}`}</td></tr>})}</tbody></table></div>:<div className="empty-state"><Layers3 size={30}/><h3>No balance evidence available</h3><p>Inspect a transaction with available execution metadata to see SOL balance changes.</p></div>}<p className="panel-note">Values are displayed to 9 decimals. Very large lamport balances may exceed JavaScript’s safe integer precision.</p></>}
            {section==='raw' && <><div className="view-heading"><div><h3>Portable evidence bundle</h3><p>Response data, provenance, and RPC observations. No endpoint credentials.</p></div><button className="secondary compact" onClick={()=>download('json')}><ArrowDownToLine size={15}/> Download JSON</button></div><pre className="raw-json">{JSON.stringify(record,null,2)}</pre></>}
          </div>
        </section>
        <footer className="page-footer"><span><ShieldCheck size={14}/> Evidence, without assumptions.</span><button onClick={()=>setHelp(true)}>Methodology & limitations <ArrowUpRight size={13}/></button></footer>
      </main>
    </div>
    {help && <div className="modal-backdrop" onClick={()=>setHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" autoFocus aria-label="Close methodology" onClick={()=>setHelp(false)}><X size={20}/></button><span className="eyebrow">METHOD, NOT MAGIC</span><h2 id="help-title">An evidence recorder.<br/>A clearer starting point.</h2><p>Flight Recorder reads a transaction and its signature status from a Solana mainnet RPC provider, then packages the result into a portable incident report.</p><ol><li><strong>Capture.</strong> Two bounded, read-only requests: getTransaction at confirmed commitment and getSignatureStatuses with history search.</li><li><strong>Inspect.</strong> Review execution errors, confirmation state, logs, fees, compute, and SOL balance changes.</li><li><strong>Preserve.</strong> Download the JSON evidence and a Markdown incident report for your issue tracker.</li></ol><div className="limitations"><strong>What the evidence cannot tell you</strong><p>A null result does not prove a transaction was dropped, expired, or never sent. RPC round-trip durations are not landing latency. This MVP does not replay transactions or record the original submission lifecycle.</p></div><p className="help-small">Current provider: {provider}. RPC Fast support is prepared through a server-side RPC_FAST_URL setting; access must be obtained separately. Synthetic demos do not use RPC infrastructure. Imported evidence is read locally and is not independently verified. History stays in tab memory and disappears on reload. No wallet connection or signing.</p><button className="primary" onClick={()=>setHelp(false)}>Back to the inspector <ArrowRight size={16}/></button></section></div>}
  </div>;
}
