/* 이 스킬이 쓰는 경로를 한곳에서 읽는다.
 *
 * 컴퓨터마다 경로가 다르므로 스킬 폴더의 config.json 에 적는다.
 * config.json 은 저장소에 올리지 않는다(.gitignore). config.sample.json 을 복사해 쓴다.
 *
 * 환경변수로도 덮어쓸 수 있다: JJAM1MIN_SITE_DIR · JJAM1MIN_WORK_DIR · JJAM1MIN_TEXTBOOK_DIR
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(SKILL_DIR, 'config.json');

const DEFAULTS = {
  publisher: '천재교과서',
  subject: '사회',
  grade: 5,
  semester: 2,
};

export function loadConfig({ need = [] } = {}) {
  let cfg = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      fail(`config.json 을 읽지 못했습니다: ${e.message}`);
    }
  }

  if (process.env.JJAM1MIN_SITE_DIR) cfg.siteDir = process.env.JJAM1MIN_SITE_DIR;
  if (process.env.JJAM1MIN_WORK_DIR) cfg.workDir = process.env.JJAM1MIN_WORK_DIR;
  if (process.env.JJAM1MIN_TEXTBOOK_DIR) cfg.textbookDir = process.env.JJAM1MIN_TEXTBOOK_DIR;

  cfg.defaults = { ...DEFAULTS, ...(cfg.defaults || {}) };

  for (const key of need) {
    if (!cfg[key]) {
      fail(
        `config.json 에 '${key}' 가 없습니다.\n` +
          `    ${CONFIG_PATH}\n` +
          `    config.sample.json 을 복사해 경로를 채워 주세요.`
      );
    }
    if (!fs.existsSync(cfg[key])) {
      fail(`'${key}' 경로가 없습니다: ${cfg[key]}`);
    }
  }

  return cfg;
}

export function lessonsPath(cfg) {
  return path.join(cfg.siteDir, 'data', 'lessons.json');
}

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}
