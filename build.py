import os
ROOT=os.path.dirname(os.path.abspath(__file__))
import re,base64,io
from PIL import Image
src=open(ROOT+'/src/base.html',encoding='utf8').read()
def rep(a,b,c=1):
    global src
    assert src.count(a)==c,(src.count(a),a[:80]); src=src.replace(a,b)


import base64,io
from PIL import Image
def webp(p,w=None,q=82,flip=False):
    im=Image.open(p).convert('RGB')
    if w: im=im.resize((w,int(im.height*w/im.width)),Image.LANCZOS)
    o=io.BytesIO(); im.save(o,'WEBP',quality=q,method=6); return 'data:image/webp;base64,'+base64.b64encode(o.getvalue()).decode()
W=ROOT+'/src/assets/images/'
mp3f=base64.b64encode(open(ROOT+'/src/assets/sounds/lock_fail.mp3','rb').read()).decode()
mp3='data:audio/mpeg;base64,'+base64.b64encode(open(ROOT+'/src/assets/sounds/step.mp3','rb').read()).decode()
assets=f"""        // 스테이지 3 이미지: 장롱 문(가운데 이음새 기준 좌우로 갈라짐) / 장롱 틈 뒤 / 방 정면 / 문 있는 벽(오른쪽은 좌우 반전) / 죽을 때
        const ROOM3_DOOR_SRC = "{webp(W+'door.png',2048,82)}";
        const ROOM3_BACK_SRC = "{webp(W+'slit.png',2048,80)}";
        const ROOM3_FRONT_SRC = "{webp(W+'front.png',2048,80)}";
        const ROOM3_WALL_SRC = "{webp(W+'wall.png',2048,80)}";
        const JUMP3_SRC = "{webp(W+'killer.png',1600,82)}";
"""
i=src.rindex('    </script>\n</body>')
src=src[:i]+assets+src[i:]
# sound
rep('            door_rattle: "data:audio/mpeg;base64,', '            step: "'+mp3+'",\n            lock_fail: "data:audio/mpeg;base64,'+mp3f+'",\n            door_rattle: "data:audio/mpeg;base64,')
rep('door_rattle: 0.9, door_close: 0.9','door_rattle: 0.9, door_close: 0.9, step: 1.0, lock_fail: 1.0')

css=r"""/* ===== 스테이지 3: 열쇠 찾기 + 장롱 ===== */
        #view-hide, #view-out { background: #000; overflow: hidden; }
        #h-stage, #o-stage { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
            width: max(100vw, calc(100vh * 1024 / 434)); aspect-ratio: 1024 / 434; overflow: hidden; background: #000; }
        #h-stage { --g: calc(.012 + var(--open,0) * .165); }
        #h-stage.shake { animation: hShake .08s infinite alternate; }
        #h-stage.jolt { animation: hJolt .09s 1; }
        @keyframes hShake { from { transform: translate(-50%,-50%); } to { transform: translate(calc(-50% + .35%),-50%); } }
        @keyframes hJolt { 0% { transform: translate(-50%,-50%); } 50% { transform: translate(calc(-50% - .9%),-50%); } 100% { transform: translate(-50%,-50%); } }
        #h-back, .h-door { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        #h-back { filter: brightness(.38); }
        #h-dark { position: absolute; inset: 0; background: radial-gradient(ellipse 14% 62% at 50% 45%, rgba(3,2,2,.92), rgba(3,2,2,0) 100%); }
        #h-head { position: absolute; left: 50%; top: 20%; width: 21%; height: auto; pointer-events: none;
            --p: clamp(0, calc((var(--open,0) - .2) / .5), 1);
            transform: translateX(-50%) translateX(calc((1 - var(--p)) * 3.4%)); opacity: calc(var(--p) * 1.6); }
        #h-doorL { clip-path: inset(0 50% 0 0); transform: translateX(calc(var(--g) * -50%)); }
        #h-doorR { clip-path: inset(0 0 0 50%); transform: translateX(calc(var(--g) * 50%)); }
        #h-hand { position: absolute; left: calc(50% - var(--g) * 50% - 7%); top: 50%; width: 11.3%; height: auto; z-index: 3; pointer-events: none;
            opacity: clamp(0, calc((var(--open,0) - .3) * 5), 1); }
        #h-vig { position: absolute; inset: 0; z-index: 4; pointer-events: none; box-shadow: inset 0 0 18vh rgba(0,0,0,.8); }

        #o-pan { position: absolute; inset: 0; will-change: transform, filter; }
        #o-wall { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        #o-key { position: absolute; width: 3.2%; transform: translate(-50%,-50%); pointer-events: none; display: none;
            animation: keyGlint 2.4s ease-in-out infinite; }
        @keyframes keyGlint { 0%,100% { opacity: .55; filter: drop-shadow(0 0 3px rgba(255,215,120,.5)); } 50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(255,225,140,.95)); } }
        #o-lock { position: absolute; width: 11%; aspect-ratio: 1; transform: translate(-50%,-50%); pointer-events: none; border-radius: 50%; opacity: 0;
            background: radial-gradient(circle, rgba(255,220,130,.35), rgba(255,220,130,0) 68%); }
        #o-lock.ready { animation: lockGlow 1.8s ease-in-out infinite; }
        @keyframes lockGlow { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
        #o-vig { position: absolute; inset: 0; z-index: 6; pointer-events: none; --d: 0;
            background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0, calc(.3 + var(--d) * .6)) 100%); }
        #o-flick { position: absolute; inset: 0; z-index: 7; background: #000; opacity: 0; pointer-events: none; }
        #view-out:not(.active) ~ #o-vig, #view-out:not(.active) ~ #o-flick { display: none; }
        #s3-fade { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; z-index: 20; }

        #s3-compass { position: absolute; left: 50%; bottom: 3.5vh; transform: translateX(-50%); z-index: 30;
            display: flex; gap: 10px; align-items: center; color: rgba(255,255,255,0.6); font-size: 1rem; pointer-events: none; white-space: nowrap; }
        #s3-compass span { padding: 6px 12px; border: 1px solid #333; border-radius: 6px; background: rgba(0,0,0,0.5); }
        #s3-compass span.arrow { border: 0; background: none; padding: 0 4px; }
        #s3-compass span.on { color: #fff; border-color: #b8693a; background: rgba(90,58,34,0.7); }
        #s3-prompt { position: absolute; left: 50%; bottom: 12vh; transform: translateX(-50%); z-index: 30; text-align: center;
            pointer-events: none; text-shadow: 0 0 10px #000; min-width: 260px; }
        #s3-prompt .big { font-size: 2rem; font-weight: 700; color: #ffb36b; letter-spacing: .05em; }
        #s3-prompt .mid { font-size: 1.2rem; color: #ffe8a8; }
        #s3-prompt .hold { margin: 8px auto 0; width: 240px; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; }
        #s3-prompt .hold i { display: block; height: 100%; width: 0; background: #e7e2dc; }
        #s3-hud { position: absolute; top: 20px; left: 24px; z-index: 40; pointer-events: none; text-shadow: 0 0 10px #000; }
        #s3-keys small { font-size: .95rem; line-height: 1.3; color: #c9bfb4; vertical-align: middle; }
        #s3-keys span { font-size: 2rem; margin-right: 8px; opacity: .25; filter: grayscale(1); }
        #s3-keys span.got { opacity: 1; filter: none; }

        """
rep('        .hidden { display: none !important; }', css+'.hidden { display: none !important; }')

views="""<!-- ===== 스테이지 3: 열쇠 찾기 + 장롱 ===== -->
        <div id="view-hide" class="view-screen">
            <div id="h-stage">
                <img id="h-back" alt="">
                <div id="h-dark"></div>
                <img id="h-head" alt="">
                <img class="h-door" id="h-doorL" alt=""><img class="h-door" id="h-doorR" alt="">
                <img id="h-hand" alt="">
                <div id="h-vig"></div>
            </div>
        </div>
        <div id="view-out" class="view-screen">
            <div id="o-stage">
                <div id="o-pan"><img id="o-wall" alt="">
                    <div id="o-lock"></div>
                    <svg id="o-key" viewBox="0 0 64 64"><g fill="none" stroke="#f2d27a" stroke-width="5" stroke-linecap="round"><circle cx="20" cy="32" r="11"/><path d="M31 32h28M50 32v10M58 32v8"/></g></svg>
                </div>
            </div>
        </div>
        <div id="o-vig"></div><div id="o-flick"></div>
        <div id="s3-fade"></div>
        <div id="s3-prompt"></div>
        <div id="s3-compass"></div>
        <div id="s3-hud" class="hidden"><div id="s3-keys"></div></div>

        """
rep('<div id="s2-hud" class="hidden">', views+'<div id="s2-hud" class="hidden">')

box="""<div id="instruction-box-3" class="hidden bg-gray-900 border border-gray-700 p-6 rounded text-left max-w-xl mb-8">
            <h3 class="text-xl font-bold text-red-500 mb-4 border-b border-gray-700 pb-2">STAGE 3 - 생존 수칙</h3>
            <ul class="list-disc pl-5 space-y-3 text-gray-300">
                <li>방 곳곳(왼쪽·정면·오른쪽)에 <strong class="text-white">열쇠 5개</strong>가 떨어져 있어요(자리는 매번 달라져요). <strong class="text-white">← →</strong> 로 둘러보고 반짝이는 열쇠를 찾아 <strong class="text-white">ENTER</strong>로 주우세요. (줍는 데 1.5초, 도중에 돌아보면 취소돼요)</li>
                <li><strong class="text-yellow-400">5개 중 진짜 열쇠는 단 하나</strong>예요. 한 번에 하나만 들 수 있고, 맞는지는 <strong class="text-white">자물쇠를 끝까지 따봐야만</strong> 알 수 있어요. 정면 자물쇠 앞에서 <strong class="text-white">ENTER</strong>를 누르면 바로 자물쇠 따기가 시작돼요.</li>
                <li>움직이는 흰 원 위에 마우스를 올려두어 자물쇠를 풀어요. 100%가 됐을 때 <strong class="text-white">철컥 소리</strong>와 함께 열리면 진짜 열쇠, 열리지 않으면 가짜예요(그 열쇠는 사라져요). 술래 때문에 끊겨도 진행도는 유지돼요.</li>
                <li><strong class="text-blue-400">발소리가 들리면</strong> 술래가 오고 있는 거예요. <strong class="text-white">SPACE</strong>로 장롱 안에 숨으세요. <strong class="text-red-600 font-bold underline">술래가 도착할 때 밖에 있으면 죽습니다.</strong></li>
                <li>술래가 장롱 문을 열려고 하면 <strong class="text-white">ENTER를 연타</strong>해서 5초 동안 막아내세요. 술래가 물러나면 SPACE로 다시 나와 열쇠를 찾으세요.</li>
            </ul>
        </div>
"""
rep('        <button id="btn-start"', '        '+box+'\n        <button id="btn-start"')
rep('스테이지 2부터 시작</button>','스테이지 2부터 시작</button>\n        <button id="btn-stage3" class="btn-style mt-4" style="font-size:1rem;padding:10px 26px;opacity:0.85;">스테이지 3부터 시작</button>')

js=open(ROOT+'/src/stage3.js',encoding='utf8').read()
rep('    </script>\n\n    <!-- 이미지 에셋', js+'    </script>\n\n    <!-- 이미지 에셋')

# lock hand shake while picking in stage 3
rep("const picking = isGameRunning && !isPaused && currentView === 'lock' && isPicking;","const picking = (isGameRunning && !isPaused && currentView === 'lock' && isPicking) || (s3.running && !isPaused && s3.lockPicking);")
# stage 2: cancel finished turn animations; show stage 1 rules again after final clear is in stage3
rep("s2.turnTimer = setTimeout(() => { s2.turning = false; }, TURN_IN_MS);","s2.turnTimer = setTimeout(() => { s2.turning = false; if (roomPan.getAnimations) roomPan.getAnimations().forEach(an => an.cancel()); }, TURN_IN_MS);")
# integration
rep("if ((!isGameRunning && !s2.running) || isPaused) return;","if ((!isGameRunning && !s2.running && !s3.running) || isPaused) return;")
rep("function stage2HideViews() {\n", "function stage2HideViews() {\n            stage3Hide();\n")
rep("if (currentStage === 2) startStage2(); else startGame();","if (currentStage === 3) startStage3(); else if (currentStage === 2) startStage2(); else startGame();")
rep("            btnStage2.classList.add('hidden');\n            if (currentStage","            btnStage2.classList.add('hidden');\n            btnStage3.classList.add('hidden');\n            if (currentStage")
# stage 2 win -> stage 3
rep('uiSubtitle.textContent = "1분 30초를 버텼습니다.";\n            instructionBox.classList.add(\'hidden\');\n            instructionBox2.classList.add(\'hidden\');\n            currentStage = 1;                             // 스테이지 3은 아직 없음 → 처음부터\n            btnStart.textContent = "처음부터 다시";',
    'uiSubtitle.textContent = "1분 30초를 버텼습니다.";\n            instructionBox.classList.add(\'hidden\');\n            instructionBox2.classList.add(\'hidden\');\n            instructionBox3.classList.remove(\'hidden\');\n            currentStage = 3;\n            btnStart.textContent = "스테이지 3 시작";')

# ===== 결과 화면: 클리어 시간 / 사망 횟수 =====
panel = """<div id="run-result" style="display:none;margin:0 0 28px;padding:18px 28px;min-width:320px;max-width:92vw;background:rgba(10,10,10,.85);border:1px solid #3a3a3a;border-radius:6px;text-align:center;font-family:'Noto Sans KR',sans-serif;color:#ddd">
            <div style="font-size:.8rem;letter-spacing:.2em;color:#888">TOTAL TIME</div>
            <div id="rr-time" style="font-size:2.6rem;font-weight:700;color:#7CFC8A;text-shadow:0 0 14px rgba(0,255,0,.45);margin:2px 0 10px"></div>
            <div id="rr-diff" style="font-size:.85rem;color:#999;margin-bottom:4px"></div>
            <div id="rr-deaths" style="font-size:1.15rem;color:#ff6b6b;margin-bottom:12px"></div>
            <table id="rr-table" style="margin:0 auto;border-collapse:collapse;font-size:.92rem;color:#bbb"></table>
            <div id="rr-best" style="margin-top:12px;font-size:.85rem;color:#e6c35c"></div>
        </div>
        """
rep('<h2 id="ui-subtitle" class="text-2xl mb-8 text-gray-300">STAGE 1</h2>\n', '<h2 id="ui-subtitle" class="text-2xl mb-8 text-gray-300">STAGE 1</h2>\n        '+panel)

runjs = r"""
        // --- 기록: 플레이 시간(일시정지·메뉴·사망 화면 제외)과 사망 횟수 ---
        const runStat = { t: [0, 0, 0, 0], d: [0, 0, 0, 0], last: 0 };
        function runReset() { runStat.t = [0, 0, 0, 0]; runStat.d = [0, 0, 0, 0]; }
        function runStage() { return isGameRunning ? 1 : (s2.running ? 2 : (s3.running ? 3 : 0)); }
        function runDeath(st) { runStat.d[st] = (runStat.d[st] || 0) + 1; }
        setInterval(() => {
            const now = performance.now();
            const dt = Math.min(now - runStat.last, 250);
            runStat.last = now;
            const st = runStage();
            if (st && !isPaused) runStat.t[st] += dt;
        }, 100);
        function fmtTime(ms) {
            const sec = Math.floor(ms / 1000), m = Math.floor(sec / 60), r = sec % 60;
            return m > 0 ? `${m}분 ${String(r).padStart(2, '0')}초` : `${r}초`;
        }
        function runShowResult() {
            const total = runStat.t[1] + runStat.t[2] + runStat.t[3];
            const deaths = runStat.d[1] + runStat.d[2] + runStat.d[3];
            document.getElementById('rr-time').textContent = fmtTime(total);
            document.getElementById('rr-diff').textContent = '난이도: ' + DIFF_LABEL[diffKey];
            document.getElementById('rr-deaths').textContent = deaths === 0 ? '사망 0회 — 노데스 클리어!' : `사망 ${deaths}회`;
            const th = 'style="padding:3px 14px;color:#888;font-weight:400"', td = 'style="padding:3px 14px"';
            let rows = `<tr><th ${th}></th><th ${th}>시간</th><th ${th}>사망</th></tr>`;
            [1, 2, 3].forEach(i => { rows += `<tr><td ${td}>스테이지 ${i}</td><td ${td}>${fmtTime(runStat.t[i])}</td><td ${td}>${runStat.d[i]}회</td></tr>`; });
            document.getElementById('rr-table').innerHTML = rows;
            let best = '';
            try {
                const prev = parseInt(localStorage.getItem('ln_best_' + diffKey) || '0', 10);
                if (!prev || total < prev) { localStorage.setItem('ln_best_' + diffKey, String(Math.round(total))); best = prev ? '🏆 최고 기록 갱신!' : '🏆 첫 클리어 기록'; }
                else best = `최고 기록 ${fmtTime(prev)}`;
            } catch (e) { }
            document.getElementById('rr-best').textContent = best;
            document.getElementById('run-result').style.display = 'block';
        }
        function runHideResult() { document.getElementById('run-result').style.display = 'none'; }
"""
rep('    </script>\n\n    <!-- 이미지 에셋', runjs+'    </script>\n\n    <!-- 이미지 에셋')
rep("function startGame() {\n            clearInterval(gameLoopInterval);\n            currentStage = 1;", "function startGame() {\n            clearInterval(gameLoopInterval);\n            currentStage = 1;\n            runReset();")
rep("btnStage2.addEventListener('click', () => { currentStage = 2; startCurrentStage(); });","btnStage2.addEventListener('click', () => { currentStage = 2; runReset(); startCurrentStage(); });")
rep("btnStage3.addEventListener('click', () => { currentStage = 3; startCurrentStage(); });","btnStage3.addEventListener('click', () => { currentStage = 3; runReset(); startCurrentStage(); });")
rep("function startCurrentStage() {\n","function startCurrentStage() {\n            runHideResult();\n")
rep("if (!isGameRunning) return; // 중복 호출 방지\n            stopGame();","if (!isGameRunning) return; // 중복 호출 방지\n            runDeath(1);\n            stopGame();")
rep("function s2Die(reason, soundDelay = 0) {\n            if (!s2.running) return;\n","function s2Die(reason, soundDelay = 0) {\n            if (!s2.running) return;\n            runDeath(2);\n")
rep("function s3Die(reason) {\n            if (!s3.running) return;\n","function s3Die(reason) {\n            if (!s3.running) return;\n            runDeath(3);\n")
rep('uiSubtitle.textContent = "자물쇠가 열렸습니다. 집을 빠져나왔습니다.";','uiSubtitle.textContent = "자물쇠가 열렸습니다. 집을 빠져나왔습니다.";\n            runShowResult();')
rep("instructionBox.classList.remove('hidden');       // 처음부터 다시 할 때 스테이지 1 규칙을 보여줌", "instructionBox.classList.add('hidden');")


# ===== 난이도 선택 + 설정(볼륨/밝기) =====
rep("const REACTION_MS = 650;","let REACTION_MS = 650;")
rep("        let masterGain = null;","        let masterGain = null;\n        let userVol = 1;")
rep("masterGain.gain.value = MASTER_VOLUME;","masterGain.gain.value = MASTER_VOLUME * userVol;")
rep("            justify-content: center;\n            align-items: center;\n        }\n\n        #pause-overlay","            justify-content: safe center;\n            align-items: center;\n            overflow-y: auto;\n        }\n        @media (min-width: 1200px) { #settings { position: absolute; top: 16px; right: 16px; margin: 0 !important; } }\n\n        #pause-overlay")
settings = """<div id="settings" style="margin:0 0 22px;padding:14px 22px;background:rgba(20,20,24,.9);border:1px solid #3a3a3a;border-radius:6px;font-family:'Noto Sans KR',sans-serif;color:#ccc;font-size:.95rem;display:grid;grid-template-columns:auto 1fr;gap:10px 16px;align-items:center;max-width:92vw">
            <span>난이도</span>
            <span id="diff-btns" style="display:flex;gap:8px"></span>
            <span>볼륨</span>
            <span style="display:flex;gap:10px;align-items:center"><input id="set-vol" type="range" min="0" max="150" step="5" style="width:130px"><b id="set-vol-v" style="min-width:3.2em;text-align:right;color:#fff"></b></span>
            <span>밝기</span>
            <span style="display:flex;gap:10px;align-items:center"><input id="set-bri" type="range" min="0" max="100" step="5" style="width:130px"><b id="set-bri-v" style="min-width:3.2em;text-align:right;color:#fff"></b></span>
        </div>
        <div id="bright-ov" style="position:fixed;inset:0;pointer-events:none;z-index:99999;opacity:0"></div>
        """
rep('        <button id="btn-start"', '        '+settings+'<button id="btn-start"')
settingsjs = r"""
        // --- 난이도 / 볼륨 / 밝기 설정 ---
        const DIFF_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' };
        let diffKey = 'normal';
        const BASE_DIFF = {
            d1: JSON.parse(JSON.stringify(DIFFICULTY)), react: REACTION_MS,
            s2: JSON.parse(JSON.stringify(STAGE2)), s3: JSON.parse(JSON.stringify(STAGE3))
        };
        // 보통 = 기존 값. 쉬움/어려움은 아래 값으로 덮어씀
        const DIFF_PRESET = {
            easy: {
                m1: 0.7, a1: 0.75, react: 900,
                s2: { PRESS_PUSH: 0.05, RISE_START: 0.20, RISE_END: 0.30, GAP_MS: [3000, 4500] },
                s3: { PRESS_PUSH: 0.05, RISE_START: 0.20, RISE_MAX: 0.34, FOOTSTEP_MS: 6000, ARRIVAL_GAP_MS: [15000, 20000], FIRST_ARRIVAL_MS: 14000, LOCK_SECONDS: 8, FAKE_CHANCE: 0.4 }
            },
            normal: { m1: 1, a1: 1, react: null, s2: {}, s3: {} },
            hard: {
                m1: 1.3, a1: 1.25, react: 550,
                s2: { PRESS_PUSH: 0.036, RISE_START: 0.30, RISE_END: 0.42, START_OPEN: 0.25, GAP_MS: [1500, 2800] },
                s3: { PRESS_PUSH: 0.036, RISE_START: 0.27, RISE_MAX: 0.34, START_OPEN: 0.30, FOOTSTEP_MS: 3200, ARRIVAL_GAP_MS: [9000, 14000], FIRST_ARRIVAL_MS: 8000, LOCK_SECONDS: 16, FAKE_CHANCE: 0.2 }
            }
        };
        function applyDifficulty(key) {
            if (!DIFF_PRESET[key]) key = 'normal';
            diffKey = key;
            const pr = DIFF_PRESET[key];
            ['spawnChance'].forEach(k => { DIFFICULTY[k].start = BASE_DIFF.d1[k].start * pr.m1; DIFFICULTY[k].end = BASE_DIFF.d1[k].end * pr.m1; });
            ['approachSpeed'].forEach(k => { DIFFICULTY[k].start = BASE_DIFF.d1[k].start * pr.a1; DIFFICULTY[k].end = BASE_DIFF.d1[k].end * pr.a1; });
            REACTION_MS = pr.react || BASE_DIFF.react;
            const rs = document.getElementById('reaction-sec'); if (rs) rs.textContent = REACTION_MS / 1000;
            Object.keys(BASE_DIFF.s2).forEach(k => { STAGE2[k] = pr.s2[k] !== undefined ? pr.s2[k] : BASE_DIFF.s2[k]; });
            Object.keys(BASE_DIFF.s3).forEach(k => { STAGE3[k] = pr.s3[k] !== undefined ? pr.s3[k] : BASE_DIFF.s3[k]; });
            document.querySelectorAll('#diff-btns button').forEach(b => {
                const on = b.dataset.k === key;
                b.style.background = on ? '#700' : '#1a1a1a'; b.style.borderColor = on ? '#f33' : '#555'; b.style.color = on ? '#fff' : '#aaa';
            });
            try { localStorage.setItem('ln_diff', key); } catch (e) { }
        }
        const setVol = document.getElementById('set-vol'), setBri = document.getElementById('set-bri'), brightOv = document.getElementById('bright-ov');
        function applyVolume(v) {
            userVol = v / 100;
            if (masterGain) masterGain.gain.value = MASTER_VOLUME * userVol;
            document.getElementById('set-vol-v').textContent = v + '%';
            try { localStorage.setItem('ln_vol', String(v)); } catch (e) { }
        }
        function applyBrightness(v) {            // 50 = 원래 밝기. 낮추면 어두워지고, 올리면 어두운 부분이 들려 올라옴
            if (v < 50) { brightOv.style.mixBlendMode = 'normal'; brightOv.style.background = '#000'; brightOv.style.opacity = ((50 - v) / 50 * 0.6).toFixed(2); }
            else { const g = Math.round((v - 50) / 50 * 40); brightOv.style.mixBlendMode = 'lighten'; brightOv.style.background = `rgb(${g},${g},${g})`; brightOv.style.opacity = v > 50 ? '1' : '0'; }
            document.getElementById('set-bri-v').textContent = v + '%';
            try { localStorage.setItem('ln_bri', String(v)); } catch (e) { }
        }
        ['easy', 'normal', 'hard'].forEach(k => {
            const b = document.createElement('button');
            b.type = 'button'; b.dataset.k = k; b.textContent = DIFF_LABEL[k];
            b.style.cssText = 'padding:6px 18px;border:2px solid #555;border-radius:4px;cursor:pointer;font-size:.95rem';
            b.addEventListener('click', () => { applyDifficulty(k); b.blur(); });
            document.getElementById('diff-btns').appendChild(b);
        });
        setVol.addEventListener('input', () => applyVolume(+setVol.value));
        setBri.addEventListener('input', () => applyBrightness(+setBri.value));
        setVol.addEventListener('change', () => setVol.blur());
        setBri.addEventListener('change', () => setBri.blur());
        (function initSettings() {
            let d = 'normal', v = 100, br = 50;
            try { d = localStorage.getItem('ln_diff') || d; v = parseInt(localStorage.getItem('ln_vol') || v, 10); br = parseInt(localStorage.getItem('ln_bri') || br, 10); } catch (e) { }
            setVol.value = v; setBri.value = br;
            applyDifficulty(d); applyVolume(v); applyBrightness(br);
        })();
"""
rep('    </script>\n\n    <!-- 이미지 에셋', settingsjs+'    </script>\n\n    <!-- 이미지 에셋')
open(ROOT+'/LastNeighbor.html','w',encoding='utf8').write(src)
print(len(src))
