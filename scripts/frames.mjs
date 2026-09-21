/* 숏폼 mp4 → 규격 확인 + 검수용 프레임 시트.
 *
 * 쓰는 법
 *   node frames.mjs <mp4경로> [출력.png] [프레임수]
 *
 * 뽑은 png 를 열어 교과서 본문과 눈으로 대조한다.
 * 이 단계는 자동화가 대신하지 못한다 — NotebookLM 은 내용을 바꾼다.
 *
 * ffmpeg 를 찾는 순서
 *   1. 환경변수 FFMPEG_PATH
 *   2. PATH 의 ffmpeg
 *   3. python 의 imageio-ffmpeg 가 들고 있는 것
 *   없으면: pip install imageio-ffmpeg  (또는 ffmpeg 를 PATH 에 두기)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function tryRun(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: 'ignore' });
    return true;
  } catch (e) {
    // ffmpeg 는 입력이 없으면 1로 끝나지만 실행 자체는 된 것이다
    return e && e.status !== undefined && e.code !== 'ENOENT';
  }
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (tryRun('ffmpeg', ['-version'])) return 'ffmpeg';

  for (const py of ['python', 'python3', 'py']) {
    try {
      const out = execFileSync(py, ['-c', 'import imageio_ffmpeg,sys;sys.stdout.write(imageio_ffmpeg.get_ffmpeg_exe())'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (out && fs.existsSync(out)) return out;
    } catch (e) { /* 다음 후보 */ }
  }
  return null;
}

const FFMPEG = findFfmpeg();
if (!FFMPEG) {
  console.error('✗ ffmpeg 를 찾지 못했습니다.');
  console.error('   pip install imageio-ffmpeg   또는 ffmpeg 를 PATH 에 두세요.');
  console.error('   경로를 직접 주려면 환경변수 FFMPEG_PATH 를 쓰세요.');
  process.exit(1);
}

const mp4 = process.argv[2];
if (!mp4 || !fs.existsSync(mp4)) {
  console.error('✗ mp4 경로를 주세요.  node frames.mjs <mp4> [출력.png] [프레임수]');
  process.exit(1);
}
const out = process.argv[3] || mp4.replace(/\.mp4$/i, '_시트.png');
const want = Number(process.argv[4] || 9);

function ff(args) {
  try {
    execFileSync(FFMPEG, args, { encoding: 'latin1', stdio: ['ignore', 'pipe', 'pipe'] });
    return '';
  } catch (e) {
    return String(e.stderr || '');
  }
}

// ── 규격 확인 ────────────────────────────────────────────────
const info = ff(['-i', mp4]);
const dur = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
const res = info.match(/, (\d{3,4})x(\d{3,4})/);
const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : null;

console.log('파일   ' + path.basename(mp4));
console.log('길이   ' + (seconds ? seconds.toFixed(1) + '초' : '?'));
console.log('해상도 ' + (res ? res[1] + 'x' + res[2] : '?'));

if (res && !(res[1] === '720' && res[2] === '1280')) console.log('⚠ 세로 720x1280 이 아닙니다');
if (seconds && (seconds < 50 || seconds > 100)) console.log('⚠ 길이가 50~100초를 벗어납니다');

// ── 프레임 뽑아 가로로 잇기 ──────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jjam1min-'));
const every = seconds ? Math.max(1, Math.floor(seconds / want)) : 8;

ff(['-y', '-i', mp4, '-vf', `fps=1/${every},scale=290:-1`, '-frames:v', String(want),
    path.join(tmp, 'f_%02d.png')]);

const shots = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
if (!shots.length) {
  console.error('✗ 프레임을 뽑지 못했습니다.');
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}

// tile 대신 hstack 을 쓴다 — tile 은 행이 모자라면 빈칸이 생긴다
const inputs = [];
for (const s of shots) inputs.push('-i', path.join(tmp, s));
ff([...inputs, '-y', '-filter_complex', `hstack=inputs=${shots.length}`, out]);

fs.rmSync(tmp, { recursive: true, force: true });

if (!fs.existsSync(out)) {
  console.error('✗ 시트를 만들지 못했습니다.');
  process.exit(1);
}
console.log(`\n✅ 프레임 ${shots.length}장 → ${out}`);
console.log('   열어서 교과서와 대조하세요.');
console.log('   볼 것: 용어가 바뀌지 않았나 · 없는 내용이 들어갔나 ·');
console.log('          지도와 유물 모양이 교과서와 맞나 · 화면 글자 맞춤법');
