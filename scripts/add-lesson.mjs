/* 짬짬이 1분 수업 — data/lessons.json 에 차시 한 건을 더한다.
 *
 * 쓰는 법
 *   node add-lesson.mjs --lesson 13 --topic "고려의 건국" \
 *     --title "고려는 어떻게 세워졌을까요" --yt 8jVUv4Uerfk --sec 88 \
 *     --summary "신라 말의 혼란과 ..." --keywords "호족,왕건,개경"
 *
 * 출판사·과목·학년·학기는 config.json 의 defaults 를 따른다. 다르면 아래로 준다.
 *   --publisher --subject --grade --semester --unit --unit-title
 *   --file  (lessons.json 경로를 직접 지정. config 없이 쓸 때)
 *
 * 단원의 첫 차시를 넣을 때는 --unit-title 이 필요하다.
 * 이미 그 단원에 차시가 있으면 기존 제목을 따라간다 — 제목이 엇갈리면
 * 화면에 단원이 두 번 나오기 때문이다.
 *
 * 더한 뒤에는 사이트 폴더에서 검증 네 개를 반드시 돌린다.
 *   validate-data / gen-data / check-font-coverage / check-sources
 */

import fs from 'node:fs';
import { loadConfig, lessonsPath } from './config.mjs';

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const i = argv.indexOf('--' + name);
  if (i < 0 || i + 1 >= argv.length) return fallback;
  return argv[i + 1];
}

const explicitFile = arg('file');
const cfg = explicitFile ? loadConfig() : loadConfig({ need: ['siteDir'] });
const FILE = explicitFile || lessonsPath(cfg);

if (!fs.existsSync(FILE)) {
  console.error('✗ lessons.json 이 없습니다: ' + FILE);
  process.exit(1);
}

const d = cfg.defaults;
const publisher = arg('publisher', d.publisher);
const subject = arg('subject', d.subject);
const grade = Number(arg('grade', d.grade));
const semester = Number(arg('semester', d.semester));
const unit = Number(arg('unit', 1));
const unitTitleArg = arg('unit-title');

const lesson = Number(arg('lesson'));
const topic = arg('topic');
const lessonTitle = arg('title');
const youtubeId = arg('yt');
const seconds = Number(arg('sec'));
const summary = arg('summary');
const keywords = (arg('keywords', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const missing = [];
if (!lesson) missing.push('--lesson');
if (!topic) missing.push('--topic');
if (!lessonTitle) missing.push('--title');
if (!youtubeId) missing.push('--yt');
if (!seconds) missing.push('--sec');
if (!summary) missing.push('--summary');
if (!keywords.length) missing.push('--keywords');
if (missing.length) {
  console.error('✗ 빠진 값: ' + missing.join(' '));
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
  console.error(`✗ youtubeId '${youtubeId}' 가 유튜브 11자리 형식이 아닙니다.`);
  process.exit(1);
}

// 과목 약칭 — id 앞머리. 모르는 과목은 이름 앞 두 글자를 쓴다.
const ABBR = { 사회: 'sa', 과학: 'sc', 국어: 'ko', 수학: 'ma', 영어: 'en' };
const abbr = ABBR[subject] || subject.slice(0, 2);
const id = `${abbr}${grade}-${semester}-${unit}-${String(lesson).padStart(2, '0')}`;

const lessons = JSON.parse(fs.readFileSync(FILE, 'utf8'));

if (lessons.some((L) => L.id === id)) {
  console.error(`✗ 이미 있습니다: ${id}`);
  process.exit(1);
}
const dupYt = lessons.find((L) => L.youtubeId === youtubeId);
if (dupYt) {
  console.error(`✗ 같은 영상이 이미 ${dupYt.id} 에 등록돼 있습니다.`);
  process.exit(1);
}

const sameUnit = lessons.find(
  (L) =>
    L.publisher === publisher && L.subject === subject &&
    L.grade === grade && L.semester === semester && L.unit === unit
);
if (sameUnit && unitTitleArg && sameUnit.unitTitle !== unitTitleArg) {
  console.error(
    `✗ 같은 단원의 unitTitle 이 다릅니다.\n` +
      `    기존: ${sameUnit.unitTitle}\n` +
      `    지금: ${unitTitleArg}`
  );
  process.exit(1);
}
const unitTitle = unitTitleArg || (sameUnit && sameUnit.unitTitle);
if (!unitTitle) {
  console.error('✗ 이 단원의 첫 차시입니다. --unit-title 로 단원 제목을 주세요.');
  process.exit(1);
}

if (seconds < 20 || seconds > 200) {
  console.log(`⚠ 길이 ${seconds}초 — 1분 숏폼이라기엔 벗어납니다. 확인해 주세요.`);
}

lessons.push({
  id, publisher, subject, grade, semester, unit, unitTitle,
  lesson, lessonTitle, topic, youtubeId, seconds, summary, keywords,
});

lessons.sort(
  (a, b) =>
    a.publisher.localeCompare(b.publisher, 'ko') ||
    a.subject.localeCompare(b.subject, 'ko') ||
    a.grade - b.grade || a.semester - b.semester ||
    a.unit - b.unit || a.lesson - b.lesson
);

fs.writeFileSync(FILE, JSON.stringify(lessons, null, 2) + '\n', 'utf8');

console.log(`✅ 추가 ${id} · ${topic} (${seconds}초)`);
console.log(`   총 ${lessons.length}편 — ${FILE}`);
console.log('\n이제 사이트 폴더에서 검증을 돌리세요:');
console.log('   node scripts/validate-data.mjs');
console.log('   node scripts/gen-data.mjs');
console.log('   node scripts/check-font-coverage.mjs');
console.log('   node scripts/check-sources.mjs');
