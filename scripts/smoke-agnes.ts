import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }

  const { agnesChat } = await import('../lib/agnes');
  const t = await agnesChat([{ role: 'user', content: '只回复一个字：好' }], { max_tokens: 32 });
  console.log('REPLY:', JSON.stringify(t));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
