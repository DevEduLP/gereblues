// ===== MENU HAMBÚRGUER =====
const hamburgerBtn = document.getElementById("hamburger-btn");
const mainNav = document.getElementById("main-nav");

if (hamburgerBtn && mainNav) {
  hamburgerBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  document.querySelectorAll("#main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

// ===== REVEAL GENÉRICO (suas seções .reveal) =====
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        sectionObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

document
  .querySelectorAll(".reveal")
  .forEach((el) => sectionObserver.observe(el));

// ===== GALERIA: mostrar 4, botão "Ver todas", revelar o resto =====
(function setupGaleria() {
  const grid = document.querySelector(".galeria-grid");
  if (!grid) return;

  const imagens = Array.from(grid.querySelectorAll(".galeria-img"));
  if (imagens.length <= 4) return; // nada a fazer se tiver 4 ou menos

  // Esconde a partir da 5ª imagem
  imagens.forEach((img, idx) => {
    if (idx >= 4) img.classList.add("is-hidden");
  });

  // Injeta o container + botão se ainda não existir
  let containerBotao = grid.nextElementSibling;
  const precisaCriar =
    !containerBotao ||
    !containerBotao.classList.contains("ver-todas-container");

  if (precisaCriar) {
    containerBotao = document.createElement("div");
    containerBotao.className = "ver-todas-container";
    grid.after(containerBotao);
  }

  // Cria/substitui o botão
  containerBotao.innerHTML = "";
  const btn = document.createElement("button");
  btn.id = "btn-ver-todas";
  btn.type = "button";
  btn.textContent = "Ver todas as imagens";
  containerBotao.appendChild(btn);

  // Observer exclusivo para animar somente quando as extras entrarem na viewport
  const galeriaObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          // alterna esquerda/direita
          const idx = Number(e.target.dataset.gIndex || 0);
          const dirClass = idx % 2 === 0 ? "fade-left" : "fade-right";
          e.target.classList.add(dirClass);
          galeriaObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  // Clique do botão: revela todas as escondidas com animação alternada
  btn.addEventListener("click", () => {
    const escondidas = Array.from(
      grid.querySelectorAll(".galeria-img.is-hidden")
    );
    escondidas.forEach((img, i) => {
      // marca para alternar a direção (baseia-se no índice relativo entre as escondidas)
      img.dataset.gIndex = i;
      img.classList.remove("is-hidden"); // mostra
      img.style.opacity = "0"; // garante que a animação vá de 0 -> 1
      galeriaObserver.observe(img); // anima quando aparecer
    });

    // Opcional: esconder o botão depois de revelar
    btn.style.display = "none";
  });
})();


(function LightboxMobileOnly(){
  const MOBILE_BP = 900;                 // breakpoint
  const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
  const grid = document.querySelector('.galeria-grid');
  if (!grid) return;

  let lb = null;                         // root do lightbox
  let handlers = {};                     // refs p/ remover listeners
  const getImgs = () => Array.from(document.querySelectorAll('.galeria-grid .galeria-img'));

  // ============== BUILD / DESTROY ==============
  function buildLightbox(){
    if (lb) return; // já montado
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox__stage" role="dialog" aria-modal="true" aria-label="Galeria">
        <div class="lightbox__topbar">
          <div class="lb-chip" id="lb-counter">1 / 1</div>
        </div>

        <!-- Botão X no canto superior direito -->
        <button class="lightbox__close" title="Fechar (Esc)" aria-label="Fechar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>

        <button class="lightbox__navbtn lightbox__prev" title="Anterior (←)" aria-label="Anterior">&#10094;</button>
        <button class="lightbox__navbtn lightbox__next" title="Próxima (→)" aria-label="Próxima">&#10095;</button>

        <div class="lightbox__viewport">
          <img class="lightbox__img" alt="">
          <div class="lightbox__hit left"></div>
          <div class="lightbox__hit right"></div>
        </div>

        <div class="lightbox__caption" id="lb-caption"></div>
        <div class="lightbox__progress" id="lb-progress"></div>

        <div class="lightbox__thumbs">
          <button class="lb-th-nav" data-dir="-1" aria-label="Rolar para a esquerda">&#10094;</button>
          <div class="lb-th-scroll">
            <div class="lb-th-list" id="lb-th-list"></div>
          </div>
          <button class="lb-th-nav" data-dir="1" aria-label="Rolar para a direita">&#10095;</button>
        </div>
      </div>
    `;
    document.body.appendChild(lb);
    wireUp();
  }

  function destroyLightbox(){
    if (!lb) return;
    unwire();
    lb.remove();
    lb = null;
  }

  // ============== STATE / UI ==============
  let idx = 0;
  function ui(){
    const refs = {
      imgEl     : lb.querySelector('.lightbox__img'),
      captionEl : lb.querySelector('#lb-caption'),
      counterEl : lb.querySelector('#lb-counter'),
      progEl    : lb.querySelector('#lb-progress'),
      thList    : lb.querySelector('#lb-th-list'),
      thScroll  : lb.querySelector('.lb-th-scroll'),
      btnClose  : lb.querySelector('.lightbox__close'),
      btnPrev   : lb.querySelector('.lightbox__prev'),
      btnNext   : lb.querySelector('.lightbox__next'),
      hitLeft   : lb.querySelector('.lightbox__hit.left'),
      hitRight  : lb.querySelector('.lightbox__hit.right'),
    };
    return refs;
  }

  function buildThumbs(activeIndex = 0){
    const { thList } = ui();
    const imgs = getImgs();
    thList.innerHTML = '';
    imgs.forEach((el, i) => {
      const btn = document.createElement('button');
      btn.className = 'lb-th' + (i === activeIndex ? ' active' : '');
      btn.innerHTML = `<img src="${el.getAttribute('src')}" alt="">`;
      btn.addEventListener('click', () => setImage(i));
      thList.appendChild(btn);
    });
    ensureThumbVisible(activeIndex);
  }

  function ensureThumbVisible(i){
    const { thList, thScroll } = ui();
    const th = thList.children[i];
    if (!th) return;
    const tr = th.getBoundingClientRect();
    const sr = thScroll.getBoundingClientRect();
    if (tr.left < sr.left || tr.right > sr.right){
      thScroll.scrollTo({ left: th.offsetLeft - 20, behavior: 'smooth' });
    }
  }

  function updateThumbActive(i){
    const { thList } = ui();
    Array.from(thList.children).forEach((el, k)=>{
      el.classList.toggle('active', k === i);
    });
    ensureThumbVisible(i);
  }

  function updateCounter(){
    const { counterEl, progEl } = ui();
    const total = getImgs().length || 1;
    counterEl.textContent = `${idx + 1} / ${total}`;
    progEl.style.transform = `scaleX(${(idx + 1) / total})`;
  }

  function setImage(i){
    const imgs = getImgs();
    if (!imgs.length) return;
    if (i < 0) i = imgs.length - 1;
    if (i >= imgs.length) i = 0;
    idx = i;

    const { imgEl, captionEl } = ui();
    const src = imgs[idx].getAttribute('src');
    const alt = imgs[idx].getAttribute('alt') || '';

    // crossfade suave
    imgEl.classList.remove('is-in');
    void imgEl.offsetWidth; // reflow
    imgEl.src = src;
    imgEl.alt = alt;
    captionEl.textContent = alt;
    requestAnimationFrame(()=> imgEl.classList.add('is-in'));

    updateCounter();
    updateThumbActive(idx);
    preload(idx + 1); preload(idx - 1);
  }

  function preload(i){
    const imgs = getImgs();
    if (i < 0 || i >= imgs.length) return;
    const s = imgs[i].getAttribute('src');
    if (!s) return;
    const im = new Image(); im.src = s;
  }

  function openAt(i){
    if (!lb) buildLightbox();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    buildThumbs(i);
    setImage(i);
  }
  function closeLB(){
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // ============== EVENTS ==============
  function wireUp(){
    const {
      btnClose, btnNext, btnPrev, hitLeft, hitRight,
      imgEl, thScroll
    } = ui();

    // Clique nas imagens da galeria (MOBILE ONLY)
    handlers.gridClick = (e)=>{
      if (!mq.matches) return; // garante mobile-only
      const img = e.target.closest('.galeria-img');
      if (!img) return;
      const list = getImgs();
      openAt(list.indexOf(img));
    };
    grid.addEventListener('click', handlers.gridClick);

    // Botões
    handlers.close = () => closeLB();
    handlers.next  = () => setImage(idx + 1);
    handlers.prev  = () => setImage(idx - 1);

    btnClose.addEventListener('click', handlers.close);
    btnNext .addEventListener('click', handlers.next);
    btnPrev .addEventListener('click', handlers.prev);
    hitLeft .addEventListener('click', handlers.prev);
    hitRight.addEventListener('click', handlers.next);

    // Teclado (só quando aberto)
    handlers.keydown = (e)=>{
      if (!lb || !lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowRight') handlers.next();
      if (e.key === 'ArrowLeft')  handlers.prev();
    };
    window.addEventListener('keydown', handlers.keydown);

    // Swipe mobile
    let tx=0, ty=0;
    handlers.tstart = (e)=>{
      if (!e.touches.length) return;
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    };
    handlers.tend = (e)=>{
      if (!tx) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 80) (dx < 0 ? handlers.next() : handlers.prev());
      tx=0; ty=0;
    };
    imgEl.addEventListener('touchstart', handlers.tstart, {passive:true});
    imgEl.addEventListener('touchend',   handlers.tend,   {passive:true});

    // Scroll das thumbs
    handlers.thNav = (e)=>{
      const btn = e.currentTarget;
      const dir = Number(btn.dataset.dir) || 1;
      thScroll.scrollBy({ left: dir * 240, behavior: 'smooth' });
    };
    lb.querySelectorAll('.lb-th-nav').forEach(b=>{
      b.addEventListener('click', handlers.thNav);
    });
  }

  function unwire(){
    if (!lb) return;
    const {
      btnClose, btnNext, btnPrev, hitLeft, hitRight,
      imgEl
    } = ui();

    grid.removeEventListener('click', handlers.gridClick);
    window.removeEventListener('keydown', handlers.keydown);
    btnClose.removeEventListener('click', handlers.close);
    btnNext .removeEventListener('click', handlers.next);
    btnPrev .removeEventListener('click', handlers.prev);
    hitLeft .removeEventListener('click', handlers.prev);
    hitRight.removeEventListener('click', handlers.next);
    imgEl.removeEventListener('touchstart', handlers.tstart);
    imgEl.removeEventListener('touchend',   handlers.tend);
    lb.querySelectorAll('.lb-th-nav').forEach(b=>{
      b.removeEventListener('click', handlers.thNav);
    });
    handlers = {};
  }

  // ============== BOOTSTRAP ==============
  function enableIfMobile(){
    if (mq.matches){
      // Em mobile: só constrói quando precisar abrir. O listener de grid já é ligado em wireUp.
      // Para garantir o click handler, montamos o lb (sem abrir) e alojamos listeners.
      if (!lb) buildLightbox();
    } else {
      // Em desktop: fecha e remove tudo
      closeLB();
      destroyLightbox();
    }
  }

  mq.addEventListener('change', enableIfMobile);
  enableIfMobile();
})();

(function setupVideos() {
  const grid = document.querySelector(".videos-grid");
  if (!grid) return;

  const videos = Array.from(grid.querySelectorAll(".video-embed.hidden"));
  const btn = document.getElementById("btn-ver-mais-videos");
  if (!btn || videos.length === 0) return;

  btn.addEventListener("click", () => {
    videos.forEach((video) => video.classList.remove("hidden"));
    btn.style.display = "none";
  });
})();
