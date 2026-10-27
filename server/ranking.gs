/**
 * 라스트 네이버 - 전체 랭킹 서버 (구글 스프레드시트 + Apps Script)
 * 사용법은 채팅에서 알려준 순서를 따라 하세요. 이 파일 전체를 Apps Script 편집기에 붙여넣으면 됩니다.
 */
const SHEET_NAME = 'records';
const MAX_ROWS_RETURNED = 50;
const MIN_STAGE1_SEC = { easy: 50, normal: 60, hard: 70 };   // 게임의 스테이지 1 자물쇠 시간과 같아야 해요

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['등록시각', '이름', '난이도', '총시간(ms)', '사망', '스테이지1(ms)', '스테이지2(ms)', '스테이지3(ms)']);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cleanName_(s) {
  s = String(s || '').replace(/[\u0000-\u001f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 12);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const diff = String(d.diff);
    if (!MIN_STAGE1_SEC[diff]) return json_({ ok: false, error: 'diff' });
    const name = cleanName_(d.name);
    if (!name) return json_({ ok: false, error: 'name' });
    const t = Math.round(Number(d.timeMs)), deaths = Math.round(Number(d.deaths));
    const st = (d.stages || []).map(Number);
    if (!isFinite(t) || !isFinite(deaths) || st.length !== 3 || st.some(x => !isFinite(x))) return json_({ ok: false, error: 'format' });
    // 사람이 낼 수 없는 기록은 거절 (스테이지별 최소 시간 + 합계 일치)
    const min1 = MIN_STAGE1_SEC[diff] * 1000 * 0.97;
    if (st[0] < min1 || st[1] < 85000 || st[2] < 8000) return json_({ ok: false, error: 'too_fast' });
    if (Math.abs(st[0] + st[1] + st[2] - t) > 2000) return json_({ ok: false, error: 'sum' });
    if (deaths < 0 || deaths > 500 || t > 6 * 3600 * 1000) return json_({ ok: false, error: 'range' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sh = getSheet_();
      // 같은 사람이 같은 기록을 연달아 두 번 올리는 것 방지
      const last = sh.getLastRow();
      if (last > 1) {
        const prev = sh.getRange(Math.max(2, last - 4), 1, Math.min(5, last - 1), 5).getValues();
        if (prev.some(r => r[1] === name && r[2] === diff && Number(r[3]) === t && Number(r[4]) === deaths)) return json_({ ok: true, dup: true, rank: rankOf_(diff, t, deaths) });
      }
      sh.appendRow([new Date(), name, diff, t, deaths, st[0], st[1], st[2]]);
    } finally { lock.releaseLock(); }
    CacheService.getScriptCache().removeAll(['top_easy_time', 'top_easy_deaths', 'top_normal_time', 'top_normal_deaths', 'top_hard_time', 'top_hard_deaths']);
    return json_({ ok: true, rank: rankOf_(diff, t, deaths) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function readRows_(diff) {
  const sh = getSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 5).getValues()
    .filter(r => r[2] === diff)
    .map(r => ({ name: String(r[1]), diff: r[2], timeMs: Number(r[3]), deaths: Number(r[4]), at: new Date(r[0]).getTime() }));
}

function sorter_(sort) {
  return sort === 'deaths'
    ? (a, b) => a.deaths - b.deaths || a.timeMs - b.timeMs || a.at - b.at
    : (a, b) => a.timeMs - b.timeMs || a.deaths - b.deaths || a.at - b.at;
}

function rankOf_(diff, t, deaths) {
  const rows = readRows_(diff);
  return {
    time: rows.filter(r => r.timeMs < t || (r.timeMs === t && r.deaths < deaths)).length + 1,
    deaths: rows.filter(r => r.deaths < deaths || (r.deaths === deaths && r.timeMs < t)).length + 1,
    total: rows.length
  };
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    const diff = MIN_STAGE1_SEC[p.diff] ? p.diff : 'normal';
    const sort = p.sort === 'deaths' ? 'deaths' : 'time';
    const n = Math.min(MAX_ROWS_RETURNED, Math.max(1, parseInt(p.n || '20', 10)));
    const cache = CacheService.getScriptCache(), key = 'top_' + diff + '_' + sort;
    let rows;
    const hit = cache.get(key);
    if (hit) rows = JSON.parse(hit);
    else {
      rows = readRows_(diff).sort(sorter_(sort)).slice(0, MAX_ROWS_RETURNED);
      cache.put(key, JSON.stringify(rows), 30);
    }
    return json_({ ok: true, diff: diff, sort: sort, rows: rows.slice(0, n) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
