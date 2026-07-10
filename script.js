/* ==========================================================================
   Sida Megar Indah Residence - INTERACTIVE SCRIPTS
   ========================================================================== */

// --- PUSAT DATA HARGA (BERDASARKAN PRICELIST JULI-AGUSTUS 2026) ---
const propertyData = {
  ready: [
    {
      id: 'ready-40',
      price: 320000000,
      landAreas: [{ area: 80, price: 320000000 }]
    },
    {
      id: 'ready-45',
      price: 366000000,
      landAreas: [
        { area: 95, price: 366000000 },
        { area: 102, price: 379000000 },
        { area: 125, price: 423000000 }
      ]
    },
    {
      id: 'ready-54',
      price: 412000000,
      landAreas: [
        { area: 103, price: 412000000 },
        { area: 108, price: 421000000 }
      ]
    }
  ],
  indent: [
    {
      id: 'indent-40',
      price: 352000000,
      landAreas: [{ area: 85, price: 352000000 }]
    },
    {
      id: 'indent-45',
      price: 391000000,
      landAreas: [
        { area: 95, price: 391000000 },
        { area: 96, price: 488000000 }
      ]
    },
    {
      id: 'indent-55',
      price: 444000000,
      landAreas: [
        { area: 100, price: 444000000 },
        { area: 116, price: 467000000 },
        { area: 117, price: 469000000 },
        { area: 131, price: 495000000 },
        { area: 147, price: 526000000 }
      ]
    }
  ]
};

/**
 * Otomatis memperbarui harga dan tombol di HTML berdasarkan propertyData
 */
function syncPricesFromData() {
  const allUnits = [...propertyData.ready, ...propertyData.indent];

  allUnits.forEach(unit => {
    const unitElement = document.getElementById(unit.id);
    if (!unitElement) return;

    // 1. Update data-price pada slide parent
    const parentSlide = unitElement.closest('.unit-slide');
    if (parentSlide) parentSlide.dataset.price = unit.price;

    // 2. Update Tampilan Harga Utama
    const priceDisplay = unitElement.querySelector('.unit-price');
    if (priceDisplay) {
      const isIndent = unit.id.includes('indent');
      const promoSpan = priceDisplay.querySelector('span') ? priceDisplay.querySelector('span').outerHTML : '';
      priceDisplay.innerHTML = `${isIndent ? 'Mulai ' : ''}${formatCurrency(unit.price)} ${promoSpan}`;
    }

    // Update Judul (H3) jika ada (menyesuaikan tipe/luas default)
    const unitTitle = unitElement.querySelector('h3');
    if (unitTitle && unit.landAreas.length > 0) {
        const typeMatch = unitTitle.innerText.match(/Tipe (\d+)/);
        const type = typeMatch ? typeMatch[1] : '';
        const status = unit.id.includes('ready') ? '(Siap Huni)' : '(Pesan Bangun)';
        unitTitle.innerText = `Tipe ${type} / ${unit.landAreas[0].area} ${status}`;
    }

    // 3. Update Tombol Pilihan Luas Tanah & Harga KPR tombol
    const sizeButtonsContainer = unitElement.querySelector('.size-buttons');
    if (sizeButtonsContainer && unit.landAreas) {
      sizeButtonsContainer.innerHTML = ''; // Kosongkan
      unit.landAreas.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = `size-btn ${index === 0 ? 'active' : ''}`;
        btn.dataset.price = item.price;
        btn.innerText = item.area;
        btn.onclick = function() {
          selectLandArea(this, unit.id, item.area.toString());
        };
        sizeButtonsContainer.appendChild(btn);
      });

      // Update spek tanah awal jika ada
      const specLand = unitElement.querySelector('.spec-land');
      if (specLand) specLand.innerText = unit.landAreas[0].area;
    }

    // 4. Update Tombol Hitung Pembayaran awal
    const calcBtn = unitElement.querySelector('.btn-outline');
    if (calcBtn) {
      calcBtn.onclick = function() { loadPriceKPR(unit.price); };
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Jalankan sinkronisasi data sebelum inisialisasi lainnya
  syncPricesFromData();

  // Initialize KPR Calculator
  calculateKPR();

  // Initialize Gallery Carousel
  initCarousel();

  // Initialize Units Carousel (Pesan Bangun)
  initUnitsCarousel();

  // Initialize Ready Units Carousel (Rumah Siap Huni)
  initReadyCarousel();

  // Initialize Scroll Event for Header
  window.addEventListener('scroll', handleHeaderScroll);
  handleHeaderScroll(); // Run once at load
});

/* ==========================================================================
   4. CAROUSEL SYSTEM (MODULAR)
   ========================================================================== */
function createCarousel(config) {
  const track = document.getElementById(config.trackId);
  const prevBtn = document.getElementById(config.prevBtnId);
  const nextBtn = document.getElementById(config.nextBtnId);
  const dotsContainer = document.getElementById(config.dotsContainerId);
  const slides = track ? track.querySelectorAll(config.slideSelector) : [];
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot, .carousel-dot') : [];

  if (!track || slides.length === 0) return null;

  let currentIndex = 0;
  let interval;

  function update() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update active states
    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle('active', isActive);

      // Callback for special actions (like KPR sync)
      if (isActive && config.onUpdate) config.onUpdate(slide);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function next() {
    currentIndex = (currentIndex + 1) % slides.length;
    update();
  }

  function prev() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    update();
  }

  function jump(index) {
    currentIndex = index;
    update();
    if (config.autoPlay) resetAuto();
  }

  // Events
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); if (config.autoPlay) resetAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); if (config.autoPlay) resetAuto(); });

  // Touch Swipe
  let startX = 0;
  track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].screenX;
    if (endX < startX - 50) next();
    if (endX > startX + 50) prev();
    if (config.autoPlay) resetAuto();
  }, { passive: true });

  // AutoPlay logic
  function startAuto() { if (config.autoPlay) interval = setInterval(next, config.intervalTime || 5000); }
  function resetAuto() { clearInterval(interval); startAuto(); }

  if (config.autoPlay) {
    startAuto();
    track.parentElement.addEventListener('mouseenter', () => clearInterval(interval));
    track.parentElement.addEventListener('mouseleave', startAuto);
  }

  update();
  return { next, prev, jump, getIndex: () => currentIndex };
}

// Global Carousel Instances
let galleryCarousel, readyCarousel, indentCarousel;

document.addEventListener('DOMContentLoaded', () => {
  calculateKPR();

  // 1. Gallery Carousel
  galleryCarousel = createCarousel({
    trackId: 'carousel-track',
    prevBtnId: 'carousel-prev',
    nextBtnId: 'carousel-next',
    dotsContainerId: 'carousel-dots',
    slideSelector: '.carousel-slide',
    autoPlay: true
  });

  // 2. Ready Units Carousel
  readyCarousel = createCarousel({
    trackId: 'ready-carousel-track',
    prevBtnId: 'ready-prev-btn',
    nextBtnId: 'ready-next-btn',
    dotsContainerId: 'ready-carousel-dots',
    slideSelector: '.unit-slide',
    onUpdate: (slide) => { if(slide.dataset.price) loadPriceKPR(slide.dataset.price); }
  });

  // 3. Indent Units Carousel
  indentCarousel = createCarousel({
    trackId: 'units-carousel-track',
    prevBtnId: 'units-prev-btn',
    nextBtnId: 'units-next-btn',
    dotsContainerId: 'units-carousel-dots',
    slideSelector: '.unit-slide',
    onUpdate: (slide) => { if(slide.dataset.price) loadPriceKPR(slide.dataset.price); }
  });

  window.addEventListener('scroll', handleHeaderScroll);
  handleHeaderScroll();
});

// Helper functions for dot clicks (mapped to new system)
function jumpToSlide(index) { if(galleryCarousel) galleryCarousel.jump(index); }
function jumpToReadySlide(index) { if(readyCarousel) readyCarousel.jump(index); }
function jumpToUnitSlide(index) { if(indentCarousel) indentCarousel.jump(index); }


/* ==========================================================================
   1. NAVIGATION & SCROLL EVENTS
   ========================================================================== */
const header = document.getElementById('header');
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

function handleHeaderScroll() {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}

// Mobile Menu Toggle
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when clicking a nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

/* ==========================================================================
   3. KPR CALCULATOR ENGINE (MODIFIED TO MANUAL CALCULATION FORMAT)
   ========================================================================== */
const propertyPriceInput = document.getElementById('kpr-property-price');
const downPaymentInput = document.getElementById('kpr-down-payment');
const tenureInput = document.getElementById('kpr-tenure');

// Core Cash Payment Calculation
function calculateKPR() {
  const price = parseFloat(propertyPriceInput.value) || 0;
  const dpAmount = parseFloat(downPaymentInput.value) || 0;
  let tenureMonths = parseInt(tenureInput.value) || 0;

  // Enforce Max Tenor 60 Months
  if (tenureMonths > 60) {
    tenureMonths = 60;
    tenureInput.value = 60;
  }

  // 3. Persentase DP: (DP / Harga) * 100
  let dpPercent = 0;
  if (price > 0) {
    dpPercent = (dpAmount / price) * 100;
  }

  // 4. Sisa Pembayaran: Harga - DP
  const remainingPayment = price - dpAmount;
  
  // 6. Angsuran Bulanan: Sisa / Tenor
  let monthlyPayment = 0;
  if (remainingPayment > 0 && tenureMonths > 0) {
    monthlyPayment = remainingPayment / tenureMonths;
  }

  // Update UI Elements
  const formattedMonthly = formatCurrency(Math.round(monthlyPayment));
  const formattedRemaining = formatCurrency(Math.round(remainingPayment));

  // Update inputs displays
  const dpDisplay = document.getElementById('kpr-dp-percent-display');
  const loanDisplay = document.getElementById('kpr-loan-amount-display');

  if (dpDisplay) dpDisplay.value = `${dpPercent.toFixed(1)}%`;
  if (loanDisplay) loanDisplay.value = formattedRemaining.replace('Rp ', '');

  document.getElementById('kpr-monthly-payment').innerText = `${formattedMonthly} x ${tenureMonths}`;
  document.getElementById('sum-property-price').innerText = formatCurrency(price);
  document.getElementById('sum-down-payment').innerText = formatCurrency(Math.round(dpAmount));
  document.getElementById('sum-dp-percent').innerText = `${dpPercent.toFixed(1)}%`;
  document.getElementById('sum-loan-amount').innerText = formattedRemaining;
  document.getElementById('sum-tenure-months').innerText = `${tenureMonths} Bulan`;
  document.getElementById('sum-monthly-installment').innerText = `${formattedMonthly} x ${tenureMonths} Bulan`;
}

function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// Preset values from "Hitung Pembayaran" buttons
function loadPriceKPR(price) {
  propertyPriceInput.value = price;
  // Default DP 20% when unit selected
  downPaymentInput.value = price * 0.2;
  calculateKPR();
}

// Share simulated payment configuration to sales
function shareKPRWhatsapp() {
  const price = formatCurrency(parseFloat(propertyPriceInput.value));
  const dpAmount = formatCurrency(parseFloat(downPaymentInput.value));
  const dpPercent = document.getElementById('sum-dp-percent').innerText;
  const sisa = document.getElementById('sum-loan-amount').innerText;
  const tenor = tenureInput.value;
  const monthly = document.getElementById('kpr-monthly-payment').innerText;

  const text = `Halo Sida Megar Indah Residence, saya telah membuat simulasi pembayaran di website dengan rincian berikut:
1. Harga Rumah: ${price}
2. Down Payment (DP): ${dpAmount}
3. Persentase DP: ${dpPercent}
4. Sisa Pembayaran: ${sisa}
5. Tenor: ${tenor} Bulan
6. Angsuran Bulanan: ${monthly}

Saya tertarik dan ingin berkonsultasi mengenai rencana pembayaran ini lebih lanjut.`;

  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/62895712480008?text=${encodedText}`, '_blank');
}



/* ==========================================================================
   6. CONTACT FORM & SUBMISSION
   ========================================================================== */
function selectUnitContact(unitName) {
  const selectElement = document.getElementById('contact-unit');
  if (selectElement) {
    selectElement.value = unitName;
  }
}

/**
 * Shopee-style Land Area Selection
 * @param {HTMLElement} element - The button clicked
 * @param {string} unitType - The base unit type
 * @param {string} landArea - The specific land area
 */
function selectLandArea(element, unitId, landArea) {
  // 1. Manage Active State (Visual)
  const buttons = element.parentElement.querySelectorAll('.size-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');

  // 2. Update the land area display & Price in the unit section
  // Since Tabs are removed, we only look for units in carousels/slides
  const unitContainer = document.querySelector(`.unit-slide#${unitId}`) || document.getElementById(unitId);

  if (unitContainer) {
    const landAreaDisplay = unitContainer.querySelector('.spec-land');
    if (landAreaDisplay) {
      landAreaDisplay.innerText = landArea;
    }

    // Update Price Display if data-price exists
    const newPrice = element.dataset.price;
    if (newPrice) {
      const priceDisplay = unitContainer.querySelector('.unit-price');
      if (priceDisplay) {
        const promoSpan = priceDisplay.querySelector('span');
        const isIndent = unitId.includes('indent');
        priceDisplay.innerHTML = `${isIndent ? 'Mulai ' : ''}${formatCurrency(parseInt(newPrice))} ${promoSpan ? promoSpan.outerHTML : ''}`;
      }

      // Update the H3 Title to match selected land area
      const unitTitle = unitContainer.querySelector('h3');
      if (unitTitle) {
        const typeMatch = unitTitle.innerText.match(/Tipe (\d+)/);
        const type = typeMatch ? typeMatch[1] : '';
        const status = unitId.includes('ready') ? '(Siap Huni)' : '(Pesan Bangun)';
        unitTitle.innerText = `Tipe ${type} / ${landArea} ${status}`;
      }

      // Sync with KPR Simulator
      loadPriceKPR(newPrice);
    }
  }

  // 3. Trigger Denah Modal
  toggleFloorplan(unitId, landArea);
}

function submitForm(event) {
  event.preventDefault();
  
  const name = document.getElementById('contact-name').value;
  const phone = document.getElementById('contact-phone').value;
  const unit = document.getElementById('contact-unit').value;
  const message = document.getElementById('contact-message').value;

  const text = `Halo Admin Sida Megar Indah Residence, saya ingin menanyakan informasi unit perumahan:
- Nama: ${name}
- No. WhatsApp: ${phone}
- Pilihan Unit: ${unit}
- Pesan Tambahan: ${message}

Mohon informasi harga promosi dan jadwal survei lokasi. Terima kasih.`;

  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/62895712480008?text=${encodedText}`, '_blank');
}

/* ==========================================================================
   7. FLOATING SEARCH PROPERTY
   ========================================================================== */
function searchProperty() {
  const type = document.getElementById('search-type').value;
  const status = document.getElementById('search-status').value;

  // Jump to specific section first
  const targetHash = status === 'ready' ? '#ready-home' : '#custom-build';
  window.location.hash = targetHash;

  // Select which carousel to target
  const isReady = status === 'ready';

  // Logic for Tipe Unit selection
  if (type === 'all') {
    // If all, just go to the section (first slide)
    if (isReady) jumpToReadySlide(0);
    else jumpToUnitSlide(0);
  } else {
    // Specific type mapping
    if (isReady) {
      if (type === '40') jumpToReadySlide(0);
      else if (type === '45') jumpToReadySlide(1);
      else if (type === '54' || type === '70') jumpToReadySlide(2);
    } else {
      if (type === '40') jumpToUnitSlide(0);
      else if (type === '45') jumpToUnitSlide(1);
      else if (type === '54' || type === '55') jumpToUnitSlide(2);
    }
  }
}


/* ==========================================================================
   8. FLOOR PLAN MODAL & DYNAMIC SVG DRAWING
   ========================================================================== */
const modal = document.getElementById('floorplan-modal');
const modalTitle = document.getElementById('modal-title');
const modalBodySvg = document.getElementById('modal-body-svg');
const modalBlockInfo = document.getElementById('modal-block-info');

const blockMapping = {
  // Unit Tipe (Utama) & Ready Stock
  'tipe-40/80': 'Blok B8 - B11',
  'ready-40/80': 'Blok B8 - B11',
  'tipe-45/95': 'Blok A2',
  'ready-45/95': 'Blok A2',
  'tipe-45/102': 'Blok A3',
  'ready-45/102': 'Blok A3',
  'tipe-45/125': 'Blok A7',
  'ready-45/125': 'Blok A7',
  'tipe-54/103': 'Blok B4',
  'ready-54/103': 'Blok B4',
  'tipe-54/108': 'Blok B3',
  'ready-54/108': 'Blok B3',

  // Unit Pesan Bangun (Indent) - Berdasarkan Gambar Baru
  'indent-40/85': 'Blok C3 - C6',
  'indent-45/95': 'Blok C1',
  'indent-45/96': 'Blok C2',
  'indent-55/100': 'Blok A1',
  'indent-55/116': 'Blok B2 & B7',
  'indent-55/117': 'Blok B1',
  'indent-55/131': 'Blok B6',
  'indent-55/147': 'Blok B5'
};

const floorplans = {
  'tipe-40': {
    title: 'Denah Ruangan Tipe 40',
    svg: `<svg viewBox="0 0 400 500" width="100%" height="350px" style="background:#fff;">
      <!-- Grid/Outlines -->
      <rect x="20" y="20" width="360" height="460" fill="none" stroke="#15241b" stroke-width="4"/>
      <!-- Rooms dividers -->
      <!-- Carport border -->
      <line x1="20" y1="300" x2="180" y2="300" stroke="#15241b" stroke-width="3" />
      <line x1="180" y1="300" x2="180" y2="480" stroke="#15241b" stroke-width="3" />
      <!-- Small Garden in front -->
      <rect x="180" y="300" width="200" height="180" fill="#e2f5e9" stroke="#15241b" stroke-width="3"/>
      <!-- Terrace -->
      <rect x="100" y="260" width="80" height="40" fill="#f3f7f4" stroke="#15241b" stroke-width="3"/>
      
      <!-- Inside Rooms -->
      <!-- Living room -->
      <rect x="20" y="140" width="200" height="120" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Kitchen / dining -->
      <rect x="20" y="20" width="160" height="120" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Bedroom 1 (Front) -->
      <rect x="220" y="150" width="160" height="110" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Bedroom 2 (Back) -->
      <rect x="220" y="20" width="160" height="110" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Toilet -->
      <rect x="180" y="20" width="40" height="70" fill="#f1f5f9" stroke="#15241b" stroke-width="3"/>
      <!-- Back Garden -->
      <rect x="20" y="20" width="360" height="0" fill="#e2f5e9" stroke="#15241b" stroke-width="3"/> 
      
      <!-- Text Labels -->
      <text x="100" y="400" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" fill="#64748b" text-anchor="middle">CARPORT</text>
      <text x="280" y="400" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" fill="#1e6b37" text-anchor="middle">TAMAN DEPAN</text>
      <text x="140" y="285" font-family="'Outfit', sans-serif" font-size="12" font-weight="600" fill="#15241b" text-anchor="middle">TERAS</text>
      <text x="120" y="200" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" fill="#15241b" text-anchor="middle">R. TAMU</text>
      <text x="300" y="210" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" fill="#15241b" text-anchor="middle">K. TIDUR 1</text>
      <text x="300" y="80" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" fill="#15241b" text-anchor="middle">K. TIDUR 2</text>
      <text x="90" y="80" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" fill="#15241b" text-anchor="middle">DAPUR</text>
      <text x="200" y="60" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">KM</text>
    </svg>`
  },
  'tipe-45': {
    title: 'Denah Ruangan Tipe 45/90',
    svg: `<svg viewBox="0 0 400 500" width="100%" height="350px" style="background:#fff;">
      <rect x="20" y="20" width="360" height="460" fill="none" stroke="#15241b" stroke-width="4"/>
      <!-- Carport -->
      <line x1="20" y1="280" x2="200" y2="280" stroke="#15241b" stroke-width="3" />
      <line x1="200" y1="280" x2="200" y2="480" stroke="#15241b" stroke-width="3" />
      <!-- Garden Front -->
      <rect x="200" y="280" width="180" height="200" fill="#e2f5e9" stroke="#15241b" stroke-width="3"/>
      <!-- Terrace -->
      <rect x="120" y="240" width="80" height="40" fill="#f3f7f4" stroke="#15241b" stroke-width="3"/>
      <!-- Back yard garden -->
      <rect x="20" y="20" width="360" height="60" fill="#e2f5e9" stroke="#15241b" stroke-width="3"/>

      <!-- Inner layout -->
      <!-- Living room -->
      <rect x="20" y="140" width="220" height="100" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Bedroom 1 -->
      <rect x="240" y="170" width="140" height="110" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Bedroom 2 -->
      <rect x="240" y="80" width="140" height="90" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Bedroom 3 / Guest -->
      <rect x="20" y="80" width="110" height="60" fill="#fafbf9" stroke="#15241b" stroke-width="3"/>
      <!-- Toilet 1 -->
      <rect x="130" y="80" width="60" height="60" fill="#f1f5f9" stroke="#15241b" stroke-width="3"/>
      <!-- Toilet 2 (Ensuite for master bedroom 1) -->
      <rect x="190" y="80" width="50" height="60" fill="#f1f5f9" stroke="#15241b" stroke-width="3"/>

      <!-- Text labels -->
      <text x="110" y="380" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" fill="#64748b" text-anchor="middle">CARPORT</text>
      <text x="290" y="380" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" fill="#1e6b37" text-anchor="middle">TAMAN DEPAN</text>
      <text x="200" y="55" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" fill="#1e6b37" text-anchor="middle">TAMAN BELAKANG</text>
      <text x="130" y="195" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" fill="#15241b" text-anchor="middle">R. KELUARGA</text>
      <text x="310" y="230" font-family="'Outfit', sans-serif" font-size="13" font-weight="700" fill="#15241b" text-anchor="middle">K. UTAMA</text>
      <text x="310" y="130" font-family="'Outfit', sans-serif" font-size="13" font-weight="700" fill="#15241b" text-anchor="middle">K. TIDUR 2</text>
      <text x="75" y="115" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" fill="#15241b" text-anchor="middle">K. ANAK</text>
      <text x="160" y="115" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">KM 1</text>
      <text x="215" y="115" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">KM 2</text>
    </svg>`
  },
  'tipe-54': {
    title: 'Denah Ruangan Tipe 54/55',
    svg: `<svg viewBox="0 0 500 500" width="100%" height="350px" style="background:#fff;">
      <!-- Main Split View for 2 floors -->
      <!-- Floor 1 -->
      <g transform="translate(10, 20) scale(0.95)">
        <rect x="10" y="10" width="220" height="420" fill="none" stroke="#15241b" stroke-width="4"/>
        <text x="120" y="30" font-family="'Outfit', sans-serif" font-size="14" font-weight="800" fill="#15241b" text-anchor="middle">LANTAI 1</text>
        <rect x="10" y="270" width="120" height="160" fill="#e2e8e4" stroke="#15241b" stroke-width="2"/>
        <text x="70" y="360" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" fill="#64748b" text-anchor="middle">CARPORT (2 MOBIL)</text>
        <rect x="130" y="290" width="100" height="140" fill="#e2f5e9" stroke="#15241b" stroke-width="2"/>
        <text x="180" y="370" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" fill="#1e6b37" text-anchor="middle">TAMAN</text>
        
        <!-- Interior Lvl 1 -->
        <rect x="10" y="160" width="220" height="110" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="120" y="215" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" fill="#15241b" text-anchor="middle">R. TAMU & VOID</text>
        <rect x="10" y="80" width="140" height="80" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="80" y="125" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">DAPUR + R. MAKAN</text>
        <rect x="150" y="80" width="80" height="80" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="190" y="125" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">K. TAMU</text>
        <rect x="10" y="40" width="60" height="40" fill="#f1f5f9" stroke="#15241b" stroke-width="2"/>
        <text x="40" y="65" font-family="'Outfit', sans-serif" font-size="10" font-weight="700" fill="#15241b" text-anchor="middle">KM 1</text>
        <rect x="70" y="40" width="160" height="40" fill="#e2f5e9" stroke="#15241b" stroke-width="2"/>
        <text x="150" y="65" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#1e6b37" text-anchor="middle">TAMAN BLK</text>
      </g>
      
      <!-- Floor 2 -->
      <g transform="translate(250, 20) scale(0.95)">
        <rect x="10" y="10" width="220" height="420" fill="none" stroke="#15241b" stroke-width="4"/>
        <text x="120" y="30" font-family="'Outfit', sans-serif" font-size="14" font-weight="800" fill="#15241b" text-anchor="middle">LANTAI 2</text>
        
        <!-- Interior Lvl 2 -->
        <rect x="10" y="240" width="130" height="140" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="75" y="310" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" fill="#15241b" text-anchor="middle">K. UTAMA</text>
        <rect x="140" y="240" width="90" height="140" fill="#f1f5f9" stroke="#15241b" stroke-width="2"/>
        <text x="185" y="310" font-family="'Outfit', sans-serif" font-size="10" font-weight="700" fill="#15241b" text-anchor="middle">KM UTAMA</text>
        
        <rect x="10" y="140" width="220" height="100" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="120" y="195" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" fill="#15241b" text-anchor="middle">R. KELUARGA ATAS</text>
        
        <rect x="10" y="40" width="100" height="100" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="60" y="95" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">K. ANAK 1</text>
        <rect x="110" y="40" width="120" height="100" fill="#fafbf9" stroke="#15241b" stroke-width="2"/>
        <text x="170" y="95" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#15241b" text-anchor="middle">K. ANAK 2</text>
      </g>
    </svg>`
  }
};

function toggleFloorplan(unitType, landArea = '') {
  if (modal && modalTitle && modalBodySvg) {
    // Normalize unitType to match floorplans keys
    let typeKey = unitType;
    let baseType = '';

    // Map various IDs to the available floorplan data
    if (unitType.includes('40') || unitType.includes('36')) {
      typeKey = 'tipe-40';
      baseType = '40';
    } else if (unitType.includes('45')) {
      typeKey = 'tipe-45';
      baseType = '45';
    } else if (unitType.includes('54') || unitType.includes('55') || unitType.includes('70')) {
      typeKey = 'tipe-54';
      baseType = '54';
    }

    const data = floorplans[typeKey];
    if (data) {
      const areaSuffix = landArea ? ` (Luas Tanah ${landArea} m²)` : '';
      modalTitle.innerText = data.title + areaSuffix;
      modalBodySvg.innerHTML = data.svg;

      // Update Block Information
      if (modalBlockInfo) {
        const blockKey = `${unitType}/${landArea}`;
        const blockName = blockMapping[blockKey];
        if (blockName) {
          modalBlockInfo.style.display = 'block';
          modalBlockInfo.innerHTML = `<i class="fa-solid fa-location-dot"></i> Unit Tersedia: <span style="color: var(--secondary);">${blockName}</span>`;
        } else {
          modalBlockInfo.style.display = 'none';
        }
      }

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Disable background scroll
    }
  }
}

function closeFloorplanModal() {
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scroll
  }
}

// Close modal if clicking outside the white card content
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeFloorplanModal();
    }
  });
}
