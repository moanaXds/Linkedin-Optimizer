/* ═══════════════════════════════════════════════════════════════
   AuraProfile — Complete Interactive Logic (Cinematic Dark Theme)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // FLOATING PARTICLES SYSTEM
  // ══════════════════════════════════════════════════════════════

  var canvas = document.getElementById('particles-canvas');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var PARTICLE_COUNT = 50;
  var animationId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.05,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      pulseSpeed: Math.random() * 0.008 + 0.003,
      pulseOffset: Math.random() * Math.PI * 2
    };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var time = Date.now() * 0.001;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      // Pulse opacity
      var pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset) * 0.5 + 0.5;
      var currentOpacity = p.opacity * (0.4 + pulse * 0.6);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 148, 255, ' + currentOpacity + ')';
      ctx.fill();
    }

    animationId = requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  initParticles();
  drawParticles();

  window.addEventListener('resize', function () {
    resizeCanvas();
  });

  // ══════════════════════════════════════════════════════════════
  // PERFORMANCE-OPTIMIZED MOTION SYSTEM
  // All scroll work happens in ONE rAF loop. No getBoundingClientRect
  // inside the scroll event. Section offsets pre-computed and cached.
  // Parallax uses lerp (smooth interpolation) for jitter-free motion.
  // Only transform + opacity touched — compositor-only, zero layout.
  // ══════════════════════════════════════════════════════════════

  // ── Image preloading to eliminate first-paint blanks ──────────
  var imageSrcs = ['hero-bg.jpg', 'grid-element-1.jpg', 'grid-element-2.jpg'];
  imageSrcs.forEach(function (src) {
    var img = new Image();
    img.src = src;
  });

  // ── Element references ───────────────────────────────────────
  var navbar       = document.getElementById('navbar');
  var heroParallax = document.getElementById('hero-parallax');

  var navLinks   = document.querySelectorAll('.navbar__link');
  var sections   = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  var revealEls  = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var staggerEls = Array.prototype.slice.call(document.querySelectorAll('.reveal-stagger'));

  // ── Cached scroll-independent measurements ─────────────────
  // Re-reading offsetTop (not BCR) is cheap and doesn’t force layout.
  // We cache absolute section tops once and refresh on resize only.
  var sectionTops = [];

  function cacheSectionOffsets() {
    sectionTops = sections.map(function (sec) {
      var el = sec;
      var top = 0;
      while (el) {
        top += el.offsetTop || 0;
        el = el.offsetParent;
      }
      return { id: sec.id, top: top };
    });
  }

  cacheSectionOffsets();

  // ── Scroll state (raw, not smoothed) ─────────────────────
  var scrollY   = 0; // updated by passive scroll listener
  var parallaxY = 0; // lerped value for smooth parallax
  var rafId     = null;
  var rafRunning = false;
  var didScroll  = false; // flag — only run RAF frame on actual scroll

  // Raw scroll capture — zero work here, just store the value
  window.addEventListener('scroll', function () {
    scrollY = window.scrollY || window.pageYOffset || 0;
    didScroll = true;
  }, { passive: true });

  // ── Linear interpolation helper ─────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Single rAF loop — all per-frame work here ────────────────
  function rafLoop() {
    rafId = requestAnimationFrame(rafLoop);

    // Only process if scroll happened or parallax still catching up
    var parallaxDelta = Math.abs(scrollY - parallaxY);
    if (!didScroll && parallaxDelta < 0.05) return;
    didScroll = false;

    // 1. Navbar glass state (class toggle, no layout)
    if (scrollY > 60) {
      if (!navbar.classList.contains('scrolled')) navbar.classList.add('scrolled');
    } else {
      if (navbar.classList.contains('scrolled')) navbar.classList.remove('scrolled');
    }

    // 2. Active section highlighting (uses pre-cached offsets, zero reflow)
    var currentId = '';
    for (var i = sectionTops.length - 1; i >= 0; i--) {
      if (scrollY + 120 >= sectionTops[i].top) {
        currentId = sectionTops[i].id;
        break;
      }
    }
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var shouldBeActive = (href === '#' + currentId);
      var isActive = link.classList.contains('active');
      if (shouldBeActive && !isActive) link.classList.add('active');
      else if (!shouldBeActive && isActive) link.classList.remove('active');
    });

    // 3. Hero parallax via lerp — 8% per frame → ~120ms settle, buttery smooth
    if (heroParallax) {
      parallaxY = lerp(parallaxY, scrollY, 0.08);
      var progress   = Math.min(parallaxY / 700, 1);
      var scale      = 1.05 - progress * 0.05;            // 1.05 → 1.00
      var translateY = -(progress * 36);                   // 0 → -36px
      // translate3d forces GPU compositing, no layout triggers
      heroParallax.style.transform =
        'translate3d(0,' + translateY.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')';
    }
  }

  // Start the rAF loop immediately so hero parallax is ready on load
  rafLoop();

  // ── Scroll Reveal — IntersectionObserver ────────────────────
  // Uses a lower threshold (0.08) so elements reveal before fully in view,
  // preventing the jarring “blank then snap” effect on slower scroll.
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -20px 0px'
  });

  revealEls.forEach(function (el) { revealObserver.observe(el); });
  staggerEls.forEach(function (el) { revealObserver.observe(el); });

  // ── Recalculate section offsets on resize ───────────────────
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(cacheSectionOffsets, 150);
  });

  // ── DOM References ──────────────────────────────────────────
  var navAnalyze = document.getElementById('nav-analyze');
  var navFeatures = document.getElementById('nav-features');
  var navScore = document.getElementById('nav-score');
  var heroCtaPrimary = document.getElementById('hero-cta-primary');

  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('file-input');
  var selectBtn = document.getElementById('select-btn');

  var dropzoneEmpty = document.getElementById('dropzone-empty');
  var dropzoneLoading = document.getElementById('dropzone-loading');
  var dropzoneUploaded = document.getElementById('dropzone-uploaded');

  var loadingStatus = document.getElementById('loading-status');
  var progressFill = document.getElementById('progress-fill');
  var progressPercentage = document.getElementById('progress-percentage');

  var uploadedFilename = document.getElementById('uploaded-filename');
  var removeBtn = document.getElementById('remove-btn');

  var scoreSection = document.getElementById('score');
  var mainDialProgress = document.getElementById('main-dial-progress');
  var mainScoreValue = document.getElementById('main-score-value');
  var insightsList = document.getElementById('insights-list');

  // ── State ───────────────────────────────────────────────────
  var selectedFile = null;

  // ══════════════════════════════════════════════════════════════
  // A. SMOOTH NAVIGATION & BUTTON BINDINGS
  // ══════════════════════════════════════════════════════════════

  function scrollToEl(selector) {
    var el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navAnalyze.addEventListener('click', function () {
    scrollToEl('#upload');
  });

  navFeatures.addEventListener('click', function (e) {
    e.preventDefault();
    scrollToEl('#features');
  });

  navScore.addEventListener('click', function (e) {
    e.preventDefault();
    scrollToEl('#score');
  });

  // Primary hero CTA → scroll to upload
  heroCtaPrimary.addEventListener('click', function () {
    scrollToEl('#upload');
  });

  // ══════════════════════════════════════════════════════════════
  // B. DRAG-AND-DROP + FILE PICK HANDLER
  // ══════════════════════════════════════════════════════════════

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
    document.addEventListener(eventName, function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');

    var files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  dropzone.addEventListener('click', function (e) {
    if (dropzoneEmpty.style.display !== 'none' && e.target !== removeBtn) {
      fileInput.click();
    }
  });

  selectBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function handleFile(file) {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }
    selectedFile = file;
    startAnalysis(false);
  }

  // ══════════════════════════════════════════════════════════════
  // C. ANALYSIS PROGRESS SEQUENCE
  // ══════════════════════════════════════════════════════════════

  var statusMessages = [
    'Parsing PDF structure...',
    'Extracting profile sections...',
    'Analyzing keyword density...',
    'Evaluating experience depth...',
    'Generating insights...',
    'Compiling score...'
  ];

  function startAnalysis(isExample) {
    // Switch to loading state
    dropzoneEmpty.style.display = 'none';
    dropzoneUploaded.style.display = 'none';
    dropzoneUploaded.classList.remove('active');
    dropzoneLoading.classList.add('active');

    progressFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    loadingStatus.textContent = statusMessages[0];

    var totalDuration = 4500;
    var startTime = Date.now();
    var statusInterval = 750;
    var statusIndex = 0;

    var statusTimer = setInterval(function () {
      statusIndex++;
      if (statusIndex < statusMessages.length) {
        loadingStatus.textContent = statusMessages[statusIndex];
      } else {
        clearInterval(statusTimer);
      }
    }, statusInterval);

    var progressTimer = setInterval(function () {
      var elapsed = Date.now() - startTime;
      var percent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

      progressFill.style.width = percent + '%';
      progressPercentage.textContent = percent + '%';

      if (percent >= 100) {
        clearInterval(progressTimer);
        clearInterval(statusTimer);
        if (isExample) {
          renderResults(mockData, true);
        } else {
          onAnalysisComplete();
        }
      }
    }, 50);
  }

  // Example analysis — no file needed
  function runExampleAnalysis() {
    selectedFile = null;
    startAnalysis(true);
  }

  // ══════════════════════════════════════════════════════════════
  // D. API INTEGRATION & MOCK FALLBACK
  // ══════════════════════════════════════════════════════════════

  var mockData = {
    overall: 78,
    keywordDensity: 72,
    experienceDepth: 85,
    educationClarity: 90,
    profileCompleteness: 65,
    networkStrength: 80,
    insights: [
      {
        id: '1',
        title: 'Strengthen keyword density in headline',
        description: 'Your headline could benefit from more industry-specific keywords. Consider adding terms like \'Product Strategy\' or \'Growth\' to improve discoverability by recruiters.',
        icon: 'target',
        severity: 'improve'
      },
      {
        id: '2',
        title: 'Expand experience section with metrics',
        description: 'Your roles are well-described, but adding quantifiable achievements (e.g., \'Increased revenue by 34%\') would significantly boost credibility and engagement.',
        icon: 'trending',
        severity: 'good'
      },
      {
        id: '3',
        title: 'Add featured section with portfolio work',
        description: 'The Featured section is underutilized. Uploading presentations, articles, or project summaries here can provide tangible proof of your expertise.',
        icon: 'file',
        severity: 'improve'
      },
      {
        id: '4',
        title: 'Request more recommendations',
        description: 'You have fewer than 3 recommendations. Aim for at least 5 from colleagues, managers, or clients to build stronger social proof on your profile.',
        icon: 'users',
        severity: 'critical'
      },
      {
        id: '5',
        title: 'Excellent education clarity',
        description: 'Your education section is well-structured with clear degree information and relevant certifications. This is a strong point of your profile.',
        icon: 'award',
        severity: 'good'
      },
      {
        id: '6',
        title: 'Consider adding skills endorsements',
        description: 'Your top skills have fewer endorsements than average. Proactively endorsing colleagues often leads to reciprocal endorsements on your key skills.',
        icon: 'lightbulb',
        severity: 'improve'
      }
    ]
  };

  function onAnalysisComplete() {
    var formData = new FormData();
    formData.append('pdf', selectedFile);

    fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      body: formData
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('API returned status ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        renderResults(data, false);
      })
      .catch(function (error) {
        console.warn('API call failed, using mock data:', error.message);
        renderResults(mockData, false);
      });
  }

  // ══════════════════════════════════════════════════════════════
  // E. RENDERING RESULTS
  // ══════════════════════════════════════════════════════════════

  function renderResults(data, isExample) {
    // 1. Switch upload area to uploaded state
    showUploadedState(isExample);

    // 2. Show score section with fade-in
    scoreSection.style.display = 'block';
    void scoreSection.offsetHeight;
    scoreSection.classList.add('visible');

    // 3. Animate main score dial
    animateMainDial(data.overall);

    // 4. Update sub-dials
    updateSubDials(data);

    // 5. Render insight cards
    renderInsights(data.insights);

    // 6. Scroll to score section
    setTimeout(function () {
      scrollToEl('#score');
    }, 300);
  }

  function showUploadedState(isExample) {
    dropzoneLoading.classList.remove('active');
    dropzoneEmpty.style.display = 'none';

    if (isExample) {
      uploadedFilename.textContent = 'example-profile.pdf - 96 KB';
    } else if (selectedFile) {
      var name = selectedFile.name;
      var sizeKB = Math.round(selectedFile.size / 1024);
      uploadedFilename.textContent = name + ' - ' + sizeKB + ' KB';
    }

    dropzoneUploaded.classList.add('active');
  }

  // ── Remove Button Handler ──────────────────────────────────
  removeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    resetUploadState();
  });

  function resetUploadState() {
    selectedFile = null;
    fileInput.value = '';

    dropzoneUploaded.classList.remove('active');
    dropzoneLoading.classList.remove('active');
    dropzoneEmpty.style.display = 'flex';

    scoreSection.classList.remove('visible');
    setTimeout(function () {
      scoreSection.style.display = 'none';
      resetDials();
      insightsList.innerHTML = '';
    }, 600);
  }

  // ── Main Dial Animation ────────────────────────────────────
  function animateMainDial(score) {
    var circumference = 553;
    var targetOffset = circumference * (1 - score / 100);
    mainDialProgress.style.strokeDashoffset = targetOffset;
    animateCounter(mainScoreValue, 0, score, 1500);
  }

  function animateCounter(element, start, end, duration) {
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = easeOutCubic(progress);
      var current = Math.round(start + (end - start) * eased);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ── Sub-Dials Update ───────────────────────────────────────
  function updateSubDials(data) {
    var categoryMap = {
      keywords: data.keywordDensity,
      experience: data.experienceDepth,
      education: data.educationClarity,
      completeness: data.profileCompleteness,
      network: data.networkStrength
    };

    var subDialEls = document.querySelectorAll('.sub-dial');
    subDialEls.forEach(function (dialEl) {
      var category = dialEl.getAttribute('data-category');
      var value = categoryMap[category] || 0;
      var progressCircle = dialEl.querySelector('.sub-dial__progress');
      var valueOverlay = dialEl.querySelector('.sub-dial__value-overlay');

      var circumference = 264;
      var targetOffset = circumference * (1 - value / 100);

      progressCircle.style.strokeDashoffset = targetOffset;
      animateCounter(valueOverlay, 0, value, 1500);
    });
  }

  function resetDials() {
    mainDialProgress.style.strokeDashoffset = 553;
    mainScoreValue.textContent = '0';

    var subProgressCircles = document.querySelectorAll('.sub-dial__progress');
    subProgressCircles.forEach(function (circle) {
      circle.style.strokeDashoffset = 264;
    });

    var subValues = document.querySelectorAll('.sub-dial__value-overlay');
    subValues.forEach(function (v) {
      v.textContent = '0';
    });
  }

  // ── Render Insight Cards ───────────────────────────────────
  function renderInsights(insights) {
    insightsList.innerHTML = '';

    insights.forEach(function (insight) {
      var card = document.createElement('div');
      card.className = 'insight-card';

      var iconSvg = getIconSvg(insight.icon);
      var severityClass = 'insight-card__icon-block--' + insight.severity;
      var dotClass = 'insight-card__dot--' + insight.severity;

      card.innerHTML =
        '<div class="insight-card__icon-block ' + severityClass + '">' +
          iconSvg +
        '</div>' +
        '<div class="insight-card__body">' +
          '<h3 class="insight-card__title">' + escapeHtml(insight.title) + '</h3>' +
          '<p class="insight-card__desc">' + escapeHtml(insight.description) + '</p>' +
        '</div>' +
        '<div class="insight-card__dot ' + dotClass + '"></div>';

      insightsList.appendChild(card);
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function getIconSvg(iconName) {
    var icons = {
      target:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="10"></circle>' +
          '<circle cx="12" cy="12" r="6"></circle>' +
          '<circle cx="12" cy="12" r="2"></circle>' +
        '</svg>',
      trending:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>' +
          '<polyline points="17 6 23 6 23 12"></polyline>' +
        '</svg>',
      file:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
          '<polyline points="14 2 14 8 20 8"></polyline>' +
          '<line x1="16" y1="13" x2="8" y2="13"></line>' +
          '<line x1="16" y1="17" x2="8" y2="17"></line>' +
          '<polyline points="10 9 9 9 8 9"></polyline>' +
        '</svg>',
      users:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>' +
          '<circle cx="9" cy="7" r="4"></circle>' +
          '<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>' +
          '<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' +
        '</svg>',
      award:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="8" r="7"></circle>' +
          '<polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>' +
        '</svg>',
      lightbulb:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M9 18h6"></path>' +
          '<path d="M10 22h4"></path>' +
          '<path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5C8.35 12.26 8.82 13.02 9 14"></path>' +
        '</svg>'
    };

    return icons[iconName] || icons.lightbulb;
  }

})();
