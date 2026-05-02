/* VOID Theme JS - main.js */
(function() {
  'use strict';

  // --- Dark Mode ---
  function initTheme() {
    var saved = localStorage.getItem('void-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.body.classList.add('theme-dark');
    }
  }
  initTheme();

  function toggleTheme() {
    document.body.classList.toggle('theme-dark');
    var isDark = document.body.classList.contains('theme-dark');
    localStorage.setItem('void-theme', isDark ? 'dark' : 'light');
    // Update icon
    var btn = document.querySelector('.btn-theme');
    if (btn) btn.textContent = isDark ? '☀' : '☾';
  }

  // --- Header Headroom ---
  function initHeadroom() {
    var header = document.querySelector('.header');
    if (!header) return;
    var lastScroll = 0;
    var threshold = 100;
    window.addEventListener('scroll', function() {
      var curr = window.pageYOffset;
      if (curr > threshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      if (curr > lastScroll && curr > threshold) {
        header.classList.add('headroom--unpinned');
        header.classList.remove('headroom--pinned');
      } else {
        header.classList.add('headroom--pinned');
        header.classList.remove('headroom--unpinned');
      }
      lastScroll = curr;
    }, { passive: true });
  }

  // --- Back to Top ---
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });
    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Reading Progress ---
  function initReadingProgress() {
    var bar = document.querySelector('.reading-progress');
    if (!bar) return;
    window.addEventListener('scroll', function() {
      var h = document.documentElement;
      var pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  // --- Mobile Menu ---
  function initMobileMenu() {
    var menuBtn = document.querySelector('.btn-menu');
    var mobileNav = document.querySelector('.mobile-nav');
    var closeBtn = document.querySelector('.mobile-nav .btn-close');
    if (!menuBtn || !mobileNav) return;
    menuBtn.addEventListener('click', function() { mobileNav.classList.add('active'); });
    if (closeBtn) closeBtn.addEventListener('click', function() { mobileNav.classList.remove('active'); });
    mobileNav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { mobileNav.classList.remove('active'); });
    });
  }

  // --- Theme Toggle Button ---
  function initThemeToggle() {
    var btn = document.querySelector('.btn-theme');
    if (!btn) return;
    btn.textContent = document.body.classList.contains('theme-dark') ? '☀' : '☾';
    btn.addEventListener('click', toggleTheme);
  }

  // --- Code Copy ---
  function initCodeCopy() {
    document.querySelectorAll('.post-content pre code').forEach(function(block) {
      var pre = block.parentElement;
      // Add copy button
      var copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy';
      copyBtn.textContent = 'Copy';
      pre.style.position = 'relative';
      pre.appendChild(copyBtn);
      copyBtn.addEventListener('click', function() {
        var text = block.textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function() {
            copyBtn.textContent = 'Copied!';
            setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
          });
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.textContent = 'Copied!';
          setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
        }
      });
    });
  }

  // --- External Links ---
  function initExternalLinks() {
    var domain = window.location.hostname;
    document.querySelectorAll('.post-content a[href]').forEach(function(a) {
      try {
        var url = new URL(a.href);
        if (url.hostname && url.hostname !== domain) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      } catch(e) {}
    });
  }

  // --- Scroll Animation for Post Cards ---
  function initScrollAnimation() {
    var cards = document.querySelectorAll('.post-card');
    if (!cards.length || !('IntersectionObserver' in window)) {
      cards.forEach(function(c) { c.classList.add('done'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('done');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(function(card) { observer.observe(card); });
  }

  // --- Code Language Label ---
  function initCodeLang() {
    document.querySelectorAll('.post-content pre code').forEach(function(block) {
      var classes = block.className;
      var match = classes.match(/language-(\w+)/);
      if (match) {
        var label = document.createElement('span');
        label.className = 'code-lang';
        label.textContent = match[1];
        block.parentElement.appendChild(label);
      }
    });
  }

  // --- Init All ---
  document.addEventListener('DOMContentLoaded', function() {
    initHeadroom();
    initBackToTop();
    initReadingProgress();
    initMobileMenu();
    initThemeToggle();
    initCodeCopy();
    initCodeLang();
    initExternalLinks();
    initScrollAnimation();
  });
})();
