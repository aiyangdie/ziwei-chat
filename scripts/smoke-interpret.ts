import { generateChart } from '../lib/ziwei/algorithm';

async function main() {
  const chart = generateChart({
    year: 1995,
    month: 6,
    day: 15,
    hour: 4,
    gender: 'male',
    name: '测试',
  });
  console.log('palaces', chart.palaces.length, chart.wuxingJuName);

  const res = await fetch('http://localhost:3000/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chart,
      messages: [{ role: 'user', content: '请用三句话概括我的命格特点。' }],
    }),
  });
  console.log('status', res.status, res.headers.get('content-type'));
  const text = await res.text();
  console.log(text.slice(0, 2000));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
