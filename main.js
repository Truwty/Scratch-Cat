// ── CURSOR ────────────────────────────────────────────
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
function bindCursorHovers() {
  document.querySelectorAll('a,button,input,textarea,select').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}
bindCursorHovers();

// ── NAV ───────────────────────────────────────────────
const navbar = document.getElementById('navbar');
const isHeroPage = document.getElementById('hero') !== null;
if (!isHeroPage && navbar) navbar.classList.add('solid');
window.addEventListener('scroll', () => {
  if (isHeroPage) navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// Hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// Active link
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.href === window.location.href || window.location.pathname.endsWith(a.getAttribute('href'))) {
    a.classList.add('active');
  }
});

// ── REVEAL ────────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 70);
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(r => revealObserver.observe(r));

// ── STORAGE HELPERS ───────────────────────────────────
const DEFAULT_PASSWORD = 'Password';
const getAdminPassword = () => localStorage.getItem('sc_admin_pw') || DEFAULT_PASSWORD;
const getShows = () => { try { return JSON.parse(localStorage.getItem('sc_shows') || '[]'); } catch { return []; } };
const saveShows = s => localStorage.setItem('sc_shows', JSON.stringify(s));
const getAdminImages = () => { try { return JSON.parse(localStorage.getItem('sc_gallery') || '[]'); } catch { return []; } };
const saveAdminImages = imgs => localStorage.setItem('sc_gallery', JSON.stringify(imgs));

// ── SHOWS ─────────────────────────────────────────────
function renderShows(containerId = 'dynamicShows', noShowsId = 'noShows') {
  const shows = getShows();
  const container = document.getElementById(containerId);
  const noShows = document.getElementById(noShowsId);
  if (!container) return;
  const upcoming = shows.filter(s => new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date)-new Date(b.date));
  if (noShows) noShows.style.display = upcoming.length === 0 ? 'block' : 'none';
  container.innerHTML = upcoming.map(s => {
    const d = new Date(s.date);
    const day = d.toLocaleDateString('en-GB', {day:'2-digit'});
    const mon = d.toLocaleDateString('en-GB', {month:'short'}).toUpperCase();
    const year = d.getFullYear();
    return `<div class="show-item">
      <div class="show-date-block"><span class="show-day">${day}</span><span class="show-mon">${mon}</span><span class="show-year">${year}</span></div>
      <div class="show-info"><p class="show-venue-name">${s.venue}</p><p class="show-city">${s.city || ''}</p></div>
      ${s.link ? `<a class="show-ticket-btn" href="${s.link}" target="_blank" rel="noopener">Tickets &#8599;</a>` : '<span class="show-free">Free Entry</span>'}
    </div>`;
  }).join('');
}

function renderAdminShowList() {
  const list = document.getElementById('adminShowList');
  if (!list) return;
  const shows = getShows();
  list.innerHTML = shows.length ? shows.map((s,i) => `<li><span>${new Date(s.date).toLocaleDateString('en-GB')} — ${s.venue}, ${s.city}</span><button onclick="deleteShow(${i})">&#215; Remove</button></li>`).join('') : '<li style="color:var(--grey);font-size:.8rem;">No shows added yet.</li>';
}

function addShow() {
  const date = document.getElementById('showDate').value;
  const venue = document.getElementById('showVenue').value.trim();
  const city = document.getElementById('showCity').value.trim();
  const link = document.getElementById('showLink').value.trim();
  if (!date || !venue) { alert('Please fill in date and venue.'); return; }
  const shows = getShows(); shows.push({date,venue,city,link}); saveShows(shows);
  ['showDate','showVenue','showCity','showLink'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  renderShows(); renderAdminShowList();
}

function deleteShow(i) {
  const shows = getShows(); shows.splice(i,1); saveShows(shows);
  renderShows(); renderAdminShowList();
}

// ── GALLERY ADMIN ─────────────────────────────────────
function renderAdminGalleryExtra() {
  const extra = document.getElementById('adminGalleryExtra');
  if (extra) extra.innerHTML = getAdminImages().map(src => `<div class="gallery-item"><img src="${src}" loading="lazy" /></div>`).join('');
  const preview = document.getElementById('adminGalleryList');
  if (preview) preview.innerHTML = getAdminImages().map((src,i) => `<div style="position:relative;"><img class="prev-img" src="${src}" /><button onclick="removeAdminImage(${i})" style="position:absolute;top:2px;right:2px;background:rgba(255,50,80,.8);border:none;color:#fff;width:18px;height:18px;font-size:10px;cursor:pointer;line-height:18px;padding:0;">&#215;</button></div>`).join('');
}

function addGalleryImages() {
  const files = document.getElementById('galleryUpload')?.files;
  if (!files || !files.length) return;
  const imgs = getAdminImages(); let loaded = 0;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => { imgs.push(e.target.result); loaded++; if(loaded===files.length){saveAdminImages(imgs);renderAdminGalleryExtra();} };
    reader.readAsDataURL(file);
  });
  const upload = document.getElementById('galleryUpload'); if (upload) upload.value = '';
}

function removeAdminImage(i) {
  const imgs = getAdminImages(); imgs.splice(i,1); saveAdminImages(imgs); renderAdminGalleryExtra();
}

// ── PASSWORD ──────────────────────────────────────────
function changePassword() {
  const np = document.getElementById('newPassword')?.value;
  const cp = document.getElementById('confirmPassword')?.value;
  const err = document.getElementById('pwError');
  if (!np || np !== cp) { if(err) err.style.display='block'; return; }
  if (err) err.style.display = 'none';
  localStorage.setItem('sc_admin_pw', np);
  ['newPassword','confirmPassword'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  alert('Password updated!');
}

// ── ADMIN MODAL ───────────────────────────────────────
function openAdminLogin() { document.getElementById('adminLoginModal')?.classList.add('active'); setTimeout(()=>document.getElementById('adminPassword')?.focus(),100); }
function closeAdminLogin() { document.getElementById('adminLoginModal')?.classList.remove('active'); const pw=document.getElementById('adminPassword'); if(pw)pw.value=''; const err=document.getElementById('adminError'); if(err)err.style.display='none'; }
function checkAdminPassword() {
  const val = document.getElementById('adminPassword')?.value;
  if (val === getAdminPassword()) {
    closeAdminLogin();
    const panel = document.getElementById('admin-panel');
    if (panel) { panel.classList.add('active'); renderAdminShowList(); renderAdminGalleryExtra(); panel.scrollIntoView({behavior:'smooth'}); }
  } else {
    const err = document.getElementById('adminError'); if(err) err.style.display='block';
  }
}
function logoutAdmin() { document.getElementById('admin-panel')?.classList.remove('active'); window.scrollTo({top:0,behavior:'smooth'}); }

// ── INIT ──────────────────────────────────────────────
renderShows();
renderAdminGalleryExtra();
