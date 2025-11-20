// Matching game with WebAudio background music (simple synth loop)
(function(){
    const icons = ['🎓','🎵','🎾','📷','🏆','🌊']; // 6 pairs

    const board = document.getElementById('board');
    const movesEl = document.getElementById('moves');
    const timeEl = document.getElementById('time');
    const restartBtn = document.getElementById('restart');
    const message = document.getElementById('message');
    const toggleMusicBtn = document.getElementById('toggleMusic');

    let cards = [];
    let first = null, second = null;
    let lock = false;
    let moves = 0;
    let matches = 0;
    let timer = null, seconds = 0;

    // WebAudio state
    let audioCtx = null;
    let musicInterval = null;
    let isMusicPlaying = false;

    function formatTime(s){ const m = Math.floor(s/60); const ss = String(s%60).padStart(2,'0'); return `${m}:${ss}` }
    function startTimer(){ if(timer) return; timer = setInterval(()=>{ seconds++; timeEl.textContent = formatTime(seconds); },1000); }
    function stopTimer(){ clearInterval(timer); timer = null; }

    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }

    function buildBoard(){
        board.innerHTML = '';
        cards = shuffle(icons.concat(icons)).map((val,idx)=>{
            const el = document.createElement('button');
            el.className = 'card';
            el.setAttribute('data-value', val);
            el.setAttribute('aria-label', 'Hidden card');
            el.innerHTML = `<div class="front"></div><div class="back">${val}</div>`;
            el.addEventListener('click', onCardClick, { once: false });
            return el;
        });
        cards.forEach(c => board.appendChild(c));
        moves = 0; movesEl.textContent = moves; seconds = 0; timeEl.textContent = formatTime(seconds); matches = 0; stopTimer(); message.textContent = 'Good luck — click any two cards to begin.';
    }

    function onCardClick(e){
        const el = e.currentTarget;
        // ensure audio context is resumed on user gesture if created
        if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        if(lock || el.classList.contains('flipped')) return;
        if(!timer) startTimer();
        // start music automatically on first user flip if user pressed Play Music previously
        if(!audioCtx && isMusicPlaying) startMusic();

        el.classList.add('flipped');
        if(!first){ first = el; return; }
        if(el === first) return;
        second = el; moves++; movesEl.textContent = moves; lock = true;

        if(first.dataset.value === second.dataset.value){
            first.setAttribute('aria-label','Matched card');
            second.setAttribute('aria-label','Matched card');
            matches++;
            message.textContent = `Nice! You found a match (${first.dataset.value}).`;
            setTimeout(()=>{ first=null; second=null; lock=false; if(matches === icons.length) onWin(); }, 500);
        } else {
            message.textContent = 'Not a match — try again.';
            setTimeout(()=>{ first.classList.remove('flipped'); second.classList.remove('flipped'); first=null; second=null; lock=false; }, 700);
        }
    }

    function onWin(){ stopTimer(); message.textContent = `You matched all pairs in ${moves} moves and ${formatTime(seconds)} — well done!`; }

    restartBtn.addEventListener('click', ()=>{ buildBoard(); });

    // --- Simple WebAudio synth loop (no external file required) ---
    function initAudio(){
        if(audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playNote(freq, time=0.18){
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g); g.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + time);
        o.start(now); o.stop(now + time + 0.02);
    }

    // simple arpeggio sequence using a pentatonic-ish set
    const melody = [440, 523.25, 659.25, 880, 587.33, 783.99];
    function startMusic(){
        initAudio();
        if(isMusicPlaying) return; // already playing
        // ensure audio context allowed by user gesture
        if(audioCtx.state === 'suspended') audioCtx.resume();
        let i = 0;
        musicInterval = setInterval(()=>{
            try{ playNote(melody[i % melody.length], 0.35); }catch(e){}
            i++;
        }, 400);
        isMusicPlaying = true;
        if(toggleMusicBtn) toggleMusicBtn.textContent = 'Pause Music';
    }

    function stopMusic(){
        if(musicInterval){ clearInterval(musicInterval); musicInterval = null; }
        isMusicPlaying = false;
        if(toggleMusicBtn) toggleMusicBtn.textContent = 'Play Music';
    }

    function toggleMusic(){
        if(!audioCtx) initAudio();
        if(isMusicPlaying) stopMusic(); else startMusic();
    }

    if(toggleMusicBtn) toggleMusicBtn.addEventListener('click', ()=>{
        // user gesture; safe to start/resume audio
        toggleMusic();
        toggleMusicBtn.setAttribute('aria-pressed', String(isMusicPlaying));
    });

    // initialize
    buildBoard();
})();
