
        // ==============================================================
        // STAGE 3 : 열쇠 찾기 - 방에서 열쇠 3개를 모으고, 발소리가 들리면 장롱에 숨어 문을 열려는 술래를 막아라
        // ==============================================================
        const STAGE3 = {
            KEY_COUNT: 5,               // 방에 흩어진 열쇠 수 (진짜는 1개)
            LOCK_SECONDS: 12,           // 자물쇠를 풀려면 흰 원 위에 마우스를 올려둬야 하는 총 시간(초). 술래 때문에 끊겨도 진행도는 유지돼요
            PICK_MS: 1500,              // 열쇠 하나를 줍는 데 걸리는 시간
            FIRST_ARRIVAL_MS: 11000,    // 시작 후 술래가 처음 장롱에 도착하기까지
            ARRIVAL_GAP_MS: [12000, 17000], // 술래가 떠난 뒤 다시 도착하기까지(범위)
            FOOTSTEP_MS: 4500,          // 도착 전 발소리가 들리기 시작하는 시간 (길수록 쉬움)
            STEP_GAP_MS: [950, 520],    // 발소리 간격: 처음 → 도착 직전 (짧아짐)
            HOLD_MS: 5000,              // 술래가 장롱 문을 열려고 하는 시간 (이 시간을 ENTER 연타로 버팀)
            START_OPEN: 0.12,           // 문이 처음 열려 있는 정도
            RISE_START: 0.26,           // 연타 안 할 때 문이 열리는 속도 (초당)
            RISE_PER_REPEL: 0.03,       // 술래를 물리칠 때마다 빨라지는 양
            RISE_MAX: 0.42,
            PRESS_PUSH: 0.035,          // ENTER 한 번에 닫히는 양
            LEAVE_MS: 400,
            FAKE_CHANCE: 0.3,           // 발소리가 다가오다가 장롱 앞까지 오지 않고 멀어지는 '헛걸음' 확률
            RECEDE_MS: 2600,            // 헛걸음일 때 발소리가 멀어지는 시간
            BURST_RANGE: [0.3, 1.8],    // 술래가 문을 당기는 세기의 변동 범위 (세게 당기다 잠깐 쉬다를 반복)
            FLICKER_MS: [4500, 11000]   // 밖에서 방 불빛이 깜빡이는 간격(범위)
        };
        const LOOKS = ['L', 'F', 'R'];                         // 왼쪽 / 정면 / 오른쪽
        const LOOK_NAME = { L: '왼쪽', F: '정면', R: '오른쪽' };
        // 열쇠가 놓인 위치 (화면 가로/세로 %) - 각 방향에 하나씩
        // 열쇠가 놓일 수 있는 자리 (각 방향에 1개씩, 자리는 매번 랜덤). 3개 중 1개만 진짜 열쇠!
        const KEY_POOL = {      // 가로 20~80% 안쪽만 사용 (16:9 화면에서는 양옆이 잘려 보임)
            L: [[67, 90], [24, 91], [78, 91], [20, 90]],
            F: [[70, 91], [25, 90], [80, 91], [20, 91]],
            R: [[31, 91], [74, 90], [20, 91], [80, 90]]
        };
        const LOCK_SPOT = [36.3, 53];              // 정면 벽의 자물쇠 위치

        const viewHide = document.getElementById('view-hide');
        const viewOut = document.getElementById('view-out');
        const hStage = document.getElementById('h-stage');
        const oPan = document.getElementById('o-pan');
        const oWall = document.getElementById('o-wall');
        const oKey = document.getElementById('o-key');
        const oLock = document.getElementById('o-lock');
        const oVig = document.getElementById('o-vig');
        const oFlick = document.getElementById('o-flick');
        const s3Prompt = document.getElementById('s3-prompt');
        const s3Compass = document.getElementById('s3-compass');
        const s3Hud = document.getElementById('s3-hud');
        const s3Keys = document.getElementById('s3-keys');
        const s3Fade = document.getElementById('s3-fade');
        const instructionBox3 = document.getElementById('instruction-box-3');
        const btnStage3 = document.getElementById('btn-stage3');

        const s3 = {
            running: false, hidden: false, look: 'F', turning: false, view: 'room', lockP: 0, lockPicking: false, clickMs: 0, nextClickMs: 400, retarget: 0, toast: null,
            phase: 'away', phaseT: 0, phaseLen: 0, side: 'L', stepT: 0,
            open: 0, holdT: 0, rattleT: 0, closeFrom: 0, repels: 0, fake: false, prevFake: false, burstT: 0, burstF: 1, flickT: 6000, dark: 0,
            keys: [], held: null, pick: null, keyEls: [], last: null, rafId: 0, turnTimer: 0
        };

        btnStage3.addEventListener('click', () => { currentStage = 3; startCurrentStage(); });

        function stage3Hide() {
            s3.running = false;
            cancelAnimationFrame(s3.rafId);
            clearTimeout(s3.turnTimer);
            if (oPan.getAnimations) oPan.getAnimations().forEach(an => an.cancel());
            viewHide.classList.remove('active');
            viewOut.classList.remove('active');
            s3Hud.classList.add('hidden');
            s3Fade.style.opacity = 0;
            s3Prompt.innerHTML = '';
            s3Compass.innerHTML = '';
            s3.lockPicking = false;
            viewLock.classList.remove('active');
        }

        function startStage3() {
            clearInterval(gameLoopInterval);
            isGameRunning = false;
            isPaused = false;
            resumeAudioContext();
            playSound('ui_click');

            uiOverlay.classList.add('hidden');
            pauseOverlay.classList.add('hidden');
            uiTitle.className = TITLE_CLASS_DEFAULT;
            uiTitle.style.textShadow = '';
            instructionBox2.classList.add('hidden');
            instructionBox3.classList.add('hidden');
            btnStage3.classList.add('hidden');

            viewLock.classList.remove('active');
            viewHallway.classList.remove('active');
            stopPicking();
            resetEnemy();
            updateHoverSide();

            stage2HideViews();     // 스테이지 2 / 3 화면 정리
            document.getElementById('h-back').src = ROOM3_BACK_SRC;
            document.querySelectorAll('.h-door').forEach(el => { el.src = ROOM3_DOOR_SRC; });
            document.getElementById('h-head').src = ROOM_HEAD_SRC;
            document.getElementById('h-hand').src = ROOM_HAND_SRC;
            oWall.dataset.k = '';
            new Image().src = JUMP3_SRC;                    // 점프스케어 이미지를 미리 불러둠 (죽을 때 깜빡임 방지)

            Object.assign(s3, {
                hidden: false, look: 'F', turning: false, view: 'room', lockP: 0, lockPicking: false, clickMs: 0, nextClickMs: 400, retarget: 0, toast: null,
                phase: 'away', phaseT: 0, phaseLen: STAGE3.FIRST_ARRIVAL_MS, side: 'L', stepT: 0,
                open: 0, holdT: 0, rattleT: 0, repels: 0, fake: false, prevFake: false, burstT: 0, burstF: 1, flickT: 6000, dark: 0,
                held: null, pick: null, last: null
            });
            // 열쇠 자리 랜덤 + 진짜 열쇠 하나 랜덤
            // 방(왼쪽/정면/오른쪽)마다 열쇠 1개는 무조건, 나머지는 남은 자리 중 랜덤
            const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
            const chosen = [], rest = [];
            LOOKS.forEach(k => {
                const sp = shuffle(KEY_POOL[k].map(p => ({ view: k, x: p[0], y: p[1] })));
                chosen.push(sp.shift()); rest.push(...sp);
            });
            chosen.push(...shuffle(rest).slice(0, Math.max(0, STAGE3.KEY_COUNT - chosen.length)));
            s3.keys = chosen.map((sp, i) => Object.assign(sp, { id: i, real: false, taken: false }));
            s3.keys[Math.floor(Math.random() * s3.keys.length)].real = true;
            s3.keyEls.forEach(el => el.remove());
            s3.keyEls = s3.keys.map(() => { const el = oKey.cloneNode(true); el.removeAttribute('id'); oKey.parentNode.appendChild(el); return el; });

            progressBar.style.width = '0%'; progressText.textContent = '0%';
            viewIndicator.textContent = "[← →] 둘러보기 / [클릭] 열쇠 줍기 / [ENTER] 자물쇠 / [SPACE] 장롱";
            s3Hud.classList.remove('hidden');
            s3Render();
            s3.running = true;
            s3.rafId = requestAnimationFrame(s3Frame);
            audioReady.then(() => { if (s3.running) startLoops(); });
        }

        function s3KeysLeft() { return s3.keys.filter(k => !k.taken).length + (s3.held ? 1 : 0); }
        function s3KeyHere() {                 // 마우스 커서가 올라가 있는 열쇠 (없으면 null)
            if (mouseX === null || mouseY === null || s3.hidden || s3.view !== 'room' || s3.turning) return null;
            let best = null, bd = 1e9;
            s3.keys.forEach((k, i) => {
                if (k.taken || k.view !== s3.look) return;
                const r = s3.keyEls[i].getBoundingClientRect();
                if (!r.width) return;
                const d = Math.hypot(mouseX - (r.left + r.width / 2), mouseY - (r.top + r.height / 2));
                if (d <= Math.max(r.width, r.height) * 0.9 + 14 && d < bd) { bd = d; best = k; }
            });
            return best;
        }
        function s3LockFail() {
            playSound('lock_fail', { gain: 1 });
            s3.held = null; s3.lockP = 0; s3.view = 'room'; s3.look = 'F'; s3.lockOver = false;
            progressBar.style.width = '0%'; progressText.textContent = '0%';
            lockInteractive.classList.remove('picking');
        }

        function key0() { return s3.look; }

        function s3Render() {
            const inLock = !s3.hidden && s3.view === 'lock';
            viewHide.classList.toggle('active', s3.hidden);
            viewOut.classList.toggle('active', !s3.hidden && !inLock);
            viewLock.classList.toggle('active', inLock);
            s3.lockPicking = inLock && s3.lockOver;
            const keysDone = !!s3.held;
            oLock.style.display = key0() === 'F' ? 'block' : 'none';
            oLock.style.left = LOCK_SPOT[0] + '%'; oLock.style.top = LOCK_SPOT[1] + '%';
            oLock.classList.toggle('ready', keysDone);

            // 밖: 바라보는 쪽 벽 (오른쪽은 문 벽 사진을 좌우 반전)
            const key = s3.look;
            if (oWall.dataset.k !== key) {
                oWall.src = key === 'F' ? ROOM3_FRONT_SRC : ROOM3_WALL_SRC;
                oWall.style.transform = key === 'R' ? 'scaleX(-1)' : 'none';
                oWall.dataset.k = key;
            }
            // 열쇠 표시
            const hk = (s3.hidden || inLock) ? null : s3KeyHere();
            s3.hoverKey = hk;
            s3.keys.forEach((k, i) => {
                const el = s3.keyEls[i];
                el.style.display = (!k.taken && k.view === key) ? 'block' : 'none';
                el.style.left = k.x + '%'; el.style.top = k.y + '%';
                el.classList.toggle('hot', k === hk);
            });

            oVig.style.setProperty('--d', s3.dark.toFixed(3));

            // 장롱 안: 술래가 문을 여는 정도
            const o = (s3.phase === 'attack' || s3.phase === 'leave') ? s3.open : 0;
            hStage.style.setProperty('--open', o.toFixed(3));
            hStage.classList.toggle('shake', s3.phase === 'attack' && o < 1);

            // 하단 안내
            s3Compass.style.bottom = '';
            if (s3.hidden) {
                s3Compass.innerHTML = (s3.phase === 'attack' || s3.phase === 'leave') ? ''
                    : '<span class="on">장롱 안</span><span style="border:0;background:none">SPACE: 밖으로 나가기</span>';
            } else if (inLock) {
                s3Compass.style.bottom = '1.2vh';
                s3Compass.innerHTML = '<span style="border:0;background:none">흰 원 위에 마우스를 올려두세요 / ← → : 돌아서기 / SPACE: 숨기</span>';
            } else {
                s3Compass.innerHTML = `<span class="arrow">←</span>${LOOKS.map(k => `<span class="${k === s3.look ? 'on' : ''}">${LOOK_NAME[k]}</span>`).join('')}<span class="arrow">→</span><span style="border:0;background:none">클릭: 줍기 / SPACE: 숨기</span>`;
            }

            // 중앙 문구: 연타 안내 / 줍는 진행도
            let html = '';
            if (s3.hidden && s3.phase === 'attack') {
                html = `<div class="big">ENTER 연타!</div><div class="hold"><i style="width:${Math.min(100, s3.holdT / STAGE3.HOLD_MS * 100).toFixed(1)}%"></i></div>`;
            } else if (!s3.hidden && s3.toast) {
                html = `<div class="mid">${s3.toast.text}</div>`;
            } else if (!s3.hidden && !inLock && !s3.pick && !s3.held && s3.hoverKey) {
                html = `<div class="mid">클릭: 열쇠 줍기</div>`;
            } else if (!s3.hidden && !inLock && s3.look === 'F' && !s3.pick && s3.held) {
                html = `<div class="mid">ENTER: 자물쇠 따기</div>`;
            } else if (!s3.hidden && s3.pick) {
                html = `<div class="mid">열쇠를 줍는 중...</div><div class="hold"><i style="width:${Math.min(100, s3.pick.t / STAGE3.PICK_MS * 100).toFixed(1)}%"></i></div>`;
            }
            if (s3Prompt.dataset.h !== html) { s3Prompt.innerHTML = html; s3Prompt.dataset.h = html; }

            s3Keys.innerHTML = `<span class="${s3.held ? 'got' : ''}">🗝</span><small>${s3.held ? '열쇠를 들고 있어요' : '열쇠 없음'}<br>남은 열쇠 ${s3KeysLeft()}개</small>`;
        }

        function s3LockTick(dt) {
            const ticks = dt / TICK_MS;                       // 스테이지 1과 같은 이동 속도를 유지
            s3.retarget += ticks;
            if (s3.retarget > LOCK_RETARGET_TICKS) { s3.retarget = 0; pickLockTarget(); }
            const f = 1 - Math.pow(1 - LOCK_FOLLOW, ticks);
            lockX += (targetLockX - lockX) * f;
            lockY += (targetLockY - lockY) * f;
            lockInteractive.style.left = `${lockX}px`;
            lockInteractive.style.top = `${lockY}px`;
            let over = false;
            if (mouseX !== null) {
                const r = lockInteractive.getBoundingClientRect();
                over = Math.hypot(mouseX - (r.left + r.width / 2), mouseY - (r.top + r.height / 2)) <= lockRadius;
            }
            s3.lockOver = over;
            lockInteractive.classList.toggle('picking', over);
            if (over) {
                s3.clickMs += dt;
                if (s3.clickMs >= s3.nextClickMs) {
                    s3.clickMs -= s3.nextClickMs;
                    s3.nextClickMs = lerp(PICK_CLICK_INTERVAL.slow, PICK_CLICK_INTERVAL.fast, s3.lockP / 100) * (0.88 + Math.random() * 0.24);
                    playSound('click' + (1 + Math.floor(Math.random() * 3)), { gain: 0.75 + Math.random() * 0.25, rate: 0.96 + Math.random() * 0.08 });
                    s3.nudge = 1;                                 // 딸깍 소리에 맞춰 손이 움찔
                }
                s3.lockP = Math.min(100, s3.lockP + dt / (STAGE3.LOCK_SECONDS * 10));
            }
            progressBar.style.width = `${s3.lockP}%`;
            progressText.textContent = `${Math.floor(s3.lockP)}%`;
            if (s3.lockP >= 100) {
                if (s3.held && s3.held.real) { s3Win(); return true; }
                s3LockFail(); s3Render(); return true;
            }
            return false;
        }

        // 발소리가 날 때마다 화면이 살짝 흔들리고 어두워짐 (장롱 안에서도 느껴짐)
        function s3StepFx() {
            const el = s3.hidden ? hStage : oPan;
            if (el.animate && !s3.turning) el.animate(
                s3.hidden ? [{ filter: 'brightness(1)' }, { filter: 'brightness(.5)' }, { filter: 'brightness(1)' }]
                          : [{ filter: 'brightness(1)' }, { filter: 'brightness(.7)' }, { filter: 'brightness(1)' }],
                { duration: 220 });
        }

        function s3NextPhase(phase, len) { s3.phase = phase; s3.phaseT = 0; s3.phaseLen = len; }

        function s3Frame(ts) {
            if (!s3.running) return;
            s3.rafId = requestAnimationFrame(s3Frame);
            if (s3.last === null) s3.last = ts;
            const dt = Math.min(ts - s3.last, 100);
            s3.last = ts;
            if (isPaused) return;
            s3.phaseT += dt;

            s3.dark = 0;
            if (s3.phase === 'away') {
                const remain = s3.phaseLen - s3.phaseT;
                // 발소리: 도착이 가까울수록 크고 빠르게, 소리 방향은 옆에서 가운데(장롱)로 이동
                if (remain <= STAGE3.FOOTSTEP_MS) {
                    const prog = 1 - Math.max(0, remain) / STAGE3.FOOTSTEP_MS;
                    s3.dark = prog;
                    s3.stepT -= dt;
                    if (s3.stepT <= 0) {
                        const gap = STAGE3.STEP_GAP_MS[0] + (STAGE3.STEP_GAP_MS[1] - STAGE3.STEP_GAP_MS[0]) * prog;
                        s3.stepT = gap;
                        playSound('step', {
                            pan: (s3.side === 'L' ? -1 : 1) * 0.85 * (1 - prog),
                            gain: (0.2 + 0.8 * prog) * (s3.hidden ? 0.4 : 1),
                            rate: 0.92 + Math.random() * 0.16
                        });
                        s3StepFx();
                    }
                }
                if (s3.phaseT >= s3.phaseLen && s3.fake) {   // 헛걸음: 코앞까지 왔다가 멀어짐
                    s3.fake = false; s3.prevFake = true; s3.stepT = 0;
                    s3NextPhase('recede', STAGE3.RECEDE_MS);
                } else if (s3.phaseT >= s3.phaseLen) {
                    s3.prevFake = false;
                    if (!s3.hidden) { s3Die('술래가 당신을 발견했습니다. 발소리를 듣고 숨었어야 했습니다...'); return; }
                    s3.pick = null;
                    s3NextPhase('attack', 0);
                    s3.open = STAGE3.START_OPEN; s3.holdT = 0; s3.rattleT = 0; s3.burstT = 0;
                    playSound('door_rattle', { pan: 0 });
                }
            } else if (s3.phase === 'recede') {
                const prog = Math.min(1, s3.phaseT / s3.phaseLen);
                s3.dark = 1 - prog;
                s3.stepT -= dt;
                if (s3.stepT <= 0) {
                    s3.stepT = 700 + prog * 500;
                    playSound('step', { pan: (s3.side === 'L' ? -1 : 1) * 0.85 * prog, gain: (1 - prog) * 0.9 * (s3.hidden ? 0.4 : 1), rate: 0.92 + Math.random() * 0.16 });
                    s3StepFx();
                }
                if (s3.phaseT >= s3.phaseLen) s3NextPhase('away', randBetween(STAGE3.ARRIVAL_GAP_MS) * 0.8);
            } else if (s3.phase === 'attack') {
                s3.burstT -= dt;
                if (s3.burstT <= 0) {
                    s3.burstT = 500 + Math.random() * 700;
                    s3.burstF = STAGE3.BURST_RANGE[0] + Math.random() * (STAGE3.BURST_RANGE[1] - STAGE3.BURST_RANGE[0]);
                }
                const rise = Math.min(STAGE3.RISE_MAX, STAGE3.RISE_START + STAGE3.RISE_PER_REPEL * s3.repels) * s3.burstF;
                s3.open += rise * dt / 1000;
                s3.holdT += dt;
                s3.rattleT += dt;
                if (s3.rattleT >= 1500) { s3.rattleT = 0; playSound('door_rattle', { pan: 0, gain: 0.7 }); }
                if (s3.open >= 1) { s3.open = 1; s3Render(); s3Die('장롱 문이 활짝 열렸습니다. 술래가 당신을 끌어냈습니다...'); return; }
                if (s3.holdT >= STAGE3.HOLD_MS) {
                    s3.repels++;
                    playSound('door_close', { pan: 0 });
                    s3.closeFrom = s3.open;
                    s3NextPhase('leave', STAGE3.LEAVE_MS);
                }
            } else if (s3.phase === 'leave') {
                s3.open = Math.max(0, s3.closeFrom * (1 - s3.phaseT / STAGE3.LEAVE_MS));
                if (s3.phaseT >= STAGE3.LEAVE_MS) {
                    s3.open = 0;
                    s3.side = Math.random() < 0.5 ? 'L' : 'R';
                    s3.stepT = 0;
                    s3.fake = !s3.prevFake && Math.random() < STAGE3.FAKE_CHANCE;
                    s3NextPhase('away', randBetween(STAGE3.ARRIVAL_GAP_MS));
                }
            }

            // 방 불빛 깜빡임 (밖에서만)
            s3.flickT -= dt;
            if (s3.flickT <= 0) {
                s3.flickT = randBetween(STAGE3.FLICKER_MS);
                if (!s3.hidden && s3.view === 'room' && oFlick.animate) oFlick.animate([{ opacity: 0 }, { opacity: .75 }, { opacity: .1 }, { opacity: .85 }, { opacity: 0 }], { duration: 300 });
            }

            if (s3.toast) { s3.toast.t -= dt; if (s3.toast.t <= 0) s3.toast = null; }

            // 자물쇠 풀기 (정면, 열쇠 3개 필요)
            s3.lockOver = false;
            if (!s3.hidden && s3.view === 'lock') {
                if (s3LockTick(dt)) return;
            }

            // 열쇠 줍기 진행
            if (s3.pick) {
                if (s3.hidden || s3.look !== s3.pick.view || s3.turning || s3KeyHere() !== s3.pick.key) {
                    s3.pick = null;
                } else {
                    s3.pick.t += dt;
                    if (s3.pick.t >= STAGE3.PICK_MS) {
                        const k = s3.pick.key;
                        k.taken = true; s3.held = k; s3.pick = null;
                        playSound('click2', { gain: 1 });
                    }
                }
            }
            s3Render();
        }

        // --- 입력 ---
        function s3Toggle() {
            if (s3.turning) return;
            if (s3.phase === 'attack' || s3.phase === 'leave') return;   // 술래가 문을 잡고 있는 동안은 나갈 수 없음
            s3.pick = null;
            s3.view = 'room';
            lockInteractive.classList.remove('picking');
            s3Fade.style.transition = 'opacity .12s';
            s3Fade.style.opacity = 1;
            s3.turning = true;
            s3.turnTimer = setTimeout(() => {
                s3.hidden = !s3.hidden;
                s3.look = 'F';
                s3Render();
                playSound(s3.hidden ? 'turn' : 'click1', { gain: 0.6 });
                s3Fade.style.transition = 'opacity .3s';
                s3Fade.style.opacity = 0;
                s3.turnTimer = setTimeout(() => { s3.turning = false; }, 150);
            }, 130);
        }

        function s3Look(step) {
            if (s3.hidden || s3.turning) return;
            if (s3.view === 'lock') { s3.view = 'room'; s3.look = 'F'; lockInteractive.classList.remove('picking'); s3Render(); return; }
            const idx = LOOKS.indexOf(s3.look) + step;
            if (idx < 0 || idx >= LOOKS.length) return;
            const next = LOOKS[idx];
            const dx = step > 0 ? -TURN_SLIDE : TURN_SLIDE;
            s3.pick = null;
            s3.turning = true;
            if (oPan.animate) oPan.animate(
                [{ transform: 'translateX(0)', filter: 'blur(0px)' }, { transform: `translateX(${dx}%)`, filter: 'blur(7px)' }],
                { duration: TURN_OUT_MS, easing: 'ease-in', fill: 'forwards' });
            s3.turnTimer = setTimeout(() => {
                s3.look = next;
                s3Render();
                if (oPan.animate) oPan.animate(
                    [{ transform: `translateX(${-dx}%)`, filter: 'blur(7px)' }, { transform: 'translateX(0)', filter: 'blur(0px)' }],
                    { duration: TURN_IN_MS, easing: 'ease-out', fill: 'forwards' });
                s3.turnTimer = setTimeout(() => { s3.turning = false; if (oPan.getAnimations) oPan.getAnimations().forEach(an => an.cancel()); }, TURN_IN_MS);
            }, TURN_OUT_MS);
        }

        function s3TryPick() {                  // 열쇠를 마우스로 클릭하면 줍기 시작
            if (s3.hidden || s3.turning || s3.view !== 'room' || s3.pick || s3.held) return;
            const kh = s3KeyHere();
            if (!kh) return;
            s3.pick = { view: s3.look, t: 0, key: kh };
            s3Render();
        }
        window.addEventListener('mousedown', (e) => { if (s3.running && !isPaused && e.button === 0) s3TryPick(); });

        function s3Enter() {
            if (s3.hidden) {                       // 장롱 안: 문 밀어내기
                if (s3.phase !== 'attack') return;
                s3.open = Math.max(0, s3.open - STAGE3.PRESS_PUSH);
                hStage.classList.remove('jolt');
                void hStage.offsetWidth;
                hStage.classList.add('jolt');
                s3Render();
            } else {                               // 밖: 열쇠 줍기 / 자물쇠에 열쇠 넣기
                if (s3.turning || s3.view === 'lock' || s3.pick) return;
                if (s3.look === 'F' && s3.held) { s3.view = 'lock'; layoutLock(); s3.retarget = 0; s3Render(); return; }
                if (s3.held) { s3.toast = { text: '이미 열쇠를 들고 있어요. 정면 자물쇠로 가세요', t: 1800 }; s3Render(); return; }
                const here = s3.keys.some(k => !k.taken && k.view === s3.look);
                s3.toast = { text: here ? '열쇠는 마우스로 열쇠를 클릭해서 주워요' : (s3.look === 'F' ? (s3KeysLeft() ? '열쇠가 있어야 자물쇠를 열 수 있어요' : '남은 열쇠가 없어요') : '이 방향에는 주울 열쇠가 없어요'), t: 1600 };
                s3Render();
            }
        }

        window.addEventListener('keydown', (e) => {
            if (!s3.running || isPaused) return;
            if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) s3Toggle(); return; }
            if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); if (!e.repeat) s3Enter(); return; }
            if (TURN_KEYS[e.code]) { e.preventDefault(); if (!e.repeat) s3Look(TURN_KEYS[e.code]); }
        });

        // --- 결과 처리 ---
        function stage3Stop() {
            s3.running = false;
            cancelAnimationFrame(s3.rafId);
            clearTimeout(s3.turnTimer);
            s3Fade.style.opacity = 0;
            isPaused = false;
            pauseOverlay.classList.add('hidden');
            s3Hud.classList.add('hidden');
            s3Prompt.innerHTML = ''; s3Prompt.dataset.h = '';
            s3Compass.innerHTML = '';
            s3.lockPicking = false;
            viewLock.classList.remove('active');
        }

        function s3Die(reason) {
            if (!s3.running) return;
            stage3Stop();
            stopLoops(0.02);
            playSound('jumpscare');
            const jumpscare = document.getElementById('jumpscare-container');
            const jumpscareImg = document.getElementById('jumpscare-img');
            jumpscareImg.src = JUMP3_SRC;                    // 스테이지 3 전용 점프스케어
            jumpscare.classList.remove('hidden');
            jumpscareImg.classList.add('jumpscare-anim');
            setTimeout(() => {
                jumpscare.classList.add('hidden');
                jumpscareImg.classList.remove('jumpscare-anim');
                jumpscareImg.src = JUMPSCARE_IMG_SRC;        // 다른 스테이지용으로 되돌림
                uiOverlay.classList.remove('hidden');
                uiTitle.textContent = "YOU DIED";
                uiTitle.className = TITLE_CLASS_DEAD;
                uiTitle.style.textShadow = '';
                uiSubtitle.textContent = reason;
                instructionBox.classList.add('hidden');
                instructionBox2.classList.add('hidden');
                instructionBox3.classList.add('hidden');
                currentStage = 3;                            // 스테이지 3에서 죽으면 스테이지 3부터
                btnStart.textContent = "스테이지 3 다시 시도";
            }, 1200);
        }

        function s3Win() {
            if (!s3.running) return;
            stage3Stop();
            stopLoops(0.6);
            playSound('escape');
            uiOverlay.classList.remove('hidden');
            uiTitle.textContent = "GAME CLEAR";
            uiTitle.className = TITLE_CLASS_WIN;
            uiTitle.style.textShadow = '0 0 20px rgba(0,255,0,0.8)';
            uiSubtitle.textContent = "자물쇠가 열렸습니다. 집을 빠져나왔습니다.";
            instructionBox.classList.remove('hidden');       // 처음부터 다시 할 때 스테이지 1 규칙을 보여줌
            instructionBox2.classList.add('hidden');
            instructionBox3.classList.add('hidden');
            currentStage = 1;
            btnStart.textContent = "처음부터 다시";
        }
