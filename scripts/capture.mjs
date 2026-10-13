// Node 22.13+ local capture; the same collector powers the web API.
import { writeFile } from 'node:fs/promises';
import { collectRecording, diagnose, reportMarkdown } from '../lib/recorder.ts';
const [signature, output = 'recording.json'] = process.argv.slice(2);
if(!signature){console.error('Usage: node scripts/capture.mjs <signature> [output.json]');process.exit(1);}
const endpoint=process.env.RPC_FAST_URL || 'https://api.mainnet-beta.solana.com';
try {
  if(new URL(endpoint).protocol!=='https:')throw new Error('RPC endpoint must use HTTPS.');
  const r=await collectRecording(signature,endpoint,process.env.RPC_FAST_URL?'RPC Fast':'Solana public RPC');
  await writeFile(output,JSON.stringify(r,null,2),{flag:'wx'});
  const reportPath=output.endsWith('.json')?output.slice(0,-5)+'.md':output+'.md';
  await writeFile(reportPath,reportMarkdown(r),{flag:'wx'});
  console.log(`${diagnose(r).title}. Saved ${output} and ${reportPath}. Import the JSON in Flight Recorder.`);
  if(r.observations.every(o=>!o.ok))process.exitCode=2;
}catch(error){console.error(error instanceof Error?error.message:'Capture failed.');process.exitCode=1;}
