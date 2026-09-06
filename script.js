// Loader word animation
  const word = "ZERAMON";
  const wordEl = document.getElementById('loaderWord');
  word.split('').forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.animationDelay = (1.15 + i * 0.07) + 's';
    wordEl.appendChild(s);
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loader').classList.add('hide');
    }, 2400);
  });

  // Header scroll state
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  const navOverlay = document.getElementById('navOverlay');

  function closeMenu(){
    siteNav.classList.remove('open');
    navToggle.classList.remove('active');
    navOverlay.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
  function toggleMenu(){
    const isOpen = siteNav.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navOverlay.classList.toggle('open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  }

  navToggle.addEventListener('click', toggleMenu);
  navOverlay.addEventListener('click', closeMenu);
  siteNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // ---------- Live Roblox game data (name, icon, visits, active players, likes) ----------
  // Change this to whichever placeId you want the site to pull live data from.
  const PLACE_ID = '97770628016535';

  async function fetchGameStats(){
    try {
      const universeRes = await fetch(`https://apis.roproxy.com/universes/v1/places/${PLACE_ID}/universe`);
      if (!universeRes.ok) throw new Error('universe lookup failed: ' + universeRes.status);
      const universeData = await universeRes.json();
      const universeId = universeData.universeId;
      if (!universeId) throw new Error('no universeId returned for this placeId');

      const [gameRes, votesRes, iconRes] = await Promise.all([
        fetch(`https://games.roproxy.com/v1/games?universeIds=${universeId}`),
        fetch(`https://games.roproxy.com/v1/games/votes?universeIds=${universeId}`),
        fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`)
      ]);
      if (!gameRes.ok || !votesRes.ok) throw new Error('game data fetch failed: ' + gameRes.status + ' / ' + votesRes.status);

      const gameData = await gameRes.json();
      const votesData = await votesRes.json();
      const info = gameData.data && gameData.data[0];
      const votes = votesData.data && votesData.data[0];

      const visitsEl = document.getElementById('statVisits');
      const playersEl = document.getElementById('statPlayers');
      const likesEl = document.getElementById('statLikes');
      const nameEl = document.getElementById('gameName');
      const iconImgEl = document.getElementById('gameIconImg');
      const iconLetterEl = document.getElementById('gameIconLetter');

      if (info && visitsEl) visitsEl.dataset.count = info.visits;
      if (info && playersEl) playersEl.dataset.count = info.playing;
      if (votes && likesEl) likesEl.dataset.count = votes.upVotes;
      if (info && nameEl) nameEl.textContent = info.name;

      if (iconRes.ok) {
        const iconData = await iconRes.json();
        const iconInfo = iconData.data && iconData.data[0];
        if (iconInfo && iconInfo.imageUrl && iconImgEl) {
          iconImgEl.src = iconInfo.imageUrl;
          iconImgEl.style.display = 'block';
          if (iconLetterEl) iconLetterEl.style.display = 'none';
        }
      }
    } catch (err) {
      console.warn('Could not load live Zeramon game data, showing fallback name/icon/numbers.', err);
    }
  }
  fetchGameStats();

  // Count-up stats
  const stats = document.querySelectorAll('.stat .num');
  let counted = false;
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !counted) {
        counted = true;
        stats.forEach(stat => {
          const target = parseInt(stat.dataset.count, 10);
          const duration = 1400;
          const start = performance.now();
          function tick(now){
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            stat.textContent = Math.floor(eased * target).toLocaleString('en-US');
            if (p < 1) requestAnimationFrame(tick);
            else stat.textContent = target.toLocaleString('en-US');
          }
          requestAnimationFrame(tick);
        });
      }
    });
  }, { threshold: 0.4 });
  const panel = document.querySelector('.game-panel');
  if (panel) statObserver.observe(panel);

  // Ambient hero particles
  const particleContainer = document.getElementById('particles');
  const count = 26;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1.5;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = (Math.random() * 20) + '%';
    p.style.animationDuration = (8 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    particleContainer.appendChild(p);
  }
