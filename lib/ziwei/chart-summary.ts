import type { ZiweiChart, Palace } from './types';
import { STEMS, BRANCHES } from './constants';

function formatStars(palace: Palace): string {
  if (!palace.stars?.length) return '（空宫）';
  return palace.stars
    .map((s) => {
      const bits = [s.name];
      if (s.brightness) bits.push(s.brightness);
      if (s.siHua) bits.push(`化${s.siHua}`);
      return bits.join('');
    })
    .join('、');
}

/** Compact chart text for LLM system prompt (keep token usage reasonable). */
export function summarizeChartForAI(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const gender = b.gender === 'male' ? '男' : '女';
  const lines: string[] = [];

  lines.push(`【命主】${b.name || '未命名'} · ${gender}`);
  lines.push(
    `【公历】${b.year}-${b.month}-${b.day} 时辰索引${b.hour}` +
      (b.city ? ` · 出生地 ${b.province || ''}${b.city}` : ''),
  );

  const L = chart.lunarInfo;
  if (L) {
    const gan = STEMS[L.yearStem] ?? '';
    const zhi = BRANCHES[L.yearBranch] ?? '';
    const leap = L.isLeapMonth ? '闰' : '';
    lines.push(
      `【农历】${gan}${zhi}年 ${leap}${Math.abs(L.lunarMonth)}月${L.lunarDay}日` +
        (L.fourPillars ? ` · 四柱 ${L.fourPillars.join(' ')}` : ''),
    );
  }

  lines.push(
    `【局数】${chart.wuxingJuName} · 命主星 ${chart.mingZhu || '-'} · 身主星 ${chart.shenZhu || '-'} · ${chart.yinYangGender || ''}`,
  );
  lines.push(`【当前】虚岁约 ${chart.currentAge} · 大限索引 ${chart.currentDaXianIndex}`);

  lines.push('【十二宫】');
  for (const p of chart.palaces) {
    const tags: string[] = [];
    if (p.isMingGong) tags.push('命');
    if (p.isShenGong) tags.push('身');
    if (p.isCurrentDaXian) tags.push('限');
    const tag = tags.length ? `[${tags.join('')}]` : '';
    lines.push(`- ${p.name}${tag}: ${formatStars(p)}`);
  }

  if (chart.daXians?.length) {
    const cur = chart.daXians[chart.currentDaXianIndex];
    if (cur) {
      lines.push(
        `【当前大限】${cur.startAge}-${cur.endAge}岁 · ${cur.palaceName}` +
          (cur.stemName ? ` · 干${cur.stemName}` : ''),
      );
    }
  }

  return lines.join('\n');
}

export const ZIWEI_SYSTEM_PROMPT = `你是一位精通倪海夏《天纪》体系紫微斗数的命理顾问。
规则：
1. 必须以用户提供的「命盘摘要」为依据解读，不要编造不存在的星曜或宫位。
2. 用语清晰、温和、可操作；避免恐吓式断语。
3. 可引用常见格局与四化逻辑（禄权科忌），但说明这是传统命理参考，非科学预测。
4. 若信息不足（缺出生地/时辰等），先说明局限再给倾向性建议。
5. 用中文回答，结构分点，篇幅适中。`;
