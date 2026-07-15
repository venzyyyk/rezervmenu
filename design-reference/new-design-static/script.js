/**
 * 
 * @param {string} name 
 * @param {string} cat 
 * @returns {string} 
 */
function fakePhoto(name, cat) {
  const g = CAT_GRADIENTS[cat] || ['#2A2E24', '#4a503f'];
  const safe = (name || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  const lines = [];
  let cur = '';
  
  safe.split(' ').forEach(w => {
    if ((cur + ' ' + w).trim().length > 22) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  });
  
  if (cur) lines.push(cur);

  const txt = lines
    .slice(0, 2)
    .map(
      (l, i) =>
        `<text x="300" y="${360 + i * 34}" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#fff" fill-opacity="0.95">${l}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="440" viewBox="0 0 600 440">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${g[0]}"/>
        <stop offset="1" stop-color="${g[1]}"/>
      </linearGradient>
      <radialGradient id="v" cx="0.5" cy="0.4" r="0.75">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
      </radialGradient>
    </defs>
    <rect width="600" height="440" fill="url(#g)"/>
    <rect width="600" height="440" fill="url(#v)"/>
    <g transform="translate(300 165)" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <g transform="scale(3.2) translate(-12 -12)">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
      </g>
    </g>
    ${txt}
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

let currentVenue = 'dry-leaf';
let allDishes = {};

/**
 * С
 * @param {string} venueId 
 */
function buildVenue(venueId) {
  const vd = DATA[venueId];
  allDishes = {};

  vd.order.forEach(cat =>
    vd.menu[cat].items.forEach(d => (allDishes[d.id] = { ...d, cat }))
  );

  const content = document.getElementById('menuContent');
  let html = '';

  vd.order.forEach(cat => {
    html += `<section class="cat-section" data-cat="${cat}">
      <div class="cat-title">
        <h2>${vd.menu[cat].title}</h2>
        <div class="cat-title-line"></div>
      </div>
      <div class="dish-grid">`;

    html += vd.menu[cat].items
      .map(d => {
        const size = d.size ? `<span class="dc-size">${d.size}</span>` : '';
        return `<div class="dish-card" data-id="${d.id}">
          <div class="dc-img">
            <img data-img="${d.id}" alt="${d.name}" loading="lazy">
            <div class="dc-overlay"></div>
          </div>
          <div class="dc-body">
            <div class="dc-name">${d.name}</div>
            <div class="dc-foot">
              <span class="dc-price">${d.price} ₴</span>
              ${size}
            </div>
          </div>
        </div>`;
      })
      .join('');

    html += '</div></section>';
  });

  content.innerHTML = html;


  content.querySelectorAll('.dish-card').forEach(card =>
    card.addEventListener('click', () => openModal(card.dataset.id))
  );


  content.querySelectorAll('img[data-img]').forEach(img => {
    const d = allDishes[img.dataset.img];
    const fake = fakePhoto(d.name, d.cat);
    img.addEventListener('error', function () {
      if (this.src !== fake) this.src = fake;
    });
    img.src = d.img ? d.img : fake;
  });
}

/**
 * 
 * @param {string} id 
 */
function openVenue(id) {
  currentVenue = id;
  const v = VENUES[id];

  document.documentElement.style.setProperty('--accent', v.accent);
  document.getElementById('venueName').textContent = v.name;
  document.getElementById('venueAddr').textContent = v.addr;
  document.getElementById('venueDot').style.background = v.accent;
  document.getElementById('dmPhone').textContent = v.phone;

  buildVenue(id);
  document.getElementById('menuContent').scrollTop = 0;
  document.getElementById('hero').classList.remove('active');
  document.getElementById('menu').classList.add('active');
}


function goHome() {
  closeModal();
  document.getElementById('menu').classList.remove('active');
  document.getElementById('hero').classList.add('active');
}

/**
 * 
 * @param {string} id 
 */
function openModal(id) {
  const d = allDishes[id];
  if (!d) return;

  const wrap = document.getElementById('dmImgWrap');
  const fake = fakePhoto(d.name, d.cat);
  const img = document.createElement('img');

  img.alt = d.name;
  img.addEventListener('error', function () {
    if (this.src !== fake) this.src = fake;
  });
  img.src = d.img ? d.img : fake;

  wrap.innerHTML = '';
  wrap.appendChild(img);

  document.getElementById('dmCat').textContent = DATA[currentVenue].menu[d.cat].title;
  document.getElementById('dmTitle').textContent = d.name;
  document.getElementById('dmDesc').textContent = d.desc || '';
  document.getElementById('dmPrice').textContent = d.price + ' ₴';
  document.getElementById('dmSize').textContent = d.size || '';

  document.getElementById('backdrop').classList.add('open');
  document.getElementById('dishModal').classList.add('open');
}


function closeModal() {
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('dishModal').classList.remove('open');
}


document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
