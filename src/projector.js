'use strict';

(function() {
  var pageReady = false; // true once render-page has completed
  var pendingUpdates = []; // queued syllable-updates that arrived before page was ready

  // render-page: load chapter and render a specific page
  window.electronAPI.on('render-page', function(data) {
    pageReady = false;
    dataLayer.fetchChapter(data.chapter).then(function() {
      if (data.displayMode) {
        renderer.setMode(data.displayMode);
      }
      var page = dataLayer.getPage(data.pageIndex);
      if (page) {
        renderer.renderPage(page);
      }
      pageReady = true;
      // Flush any syllable updates that arrived during fetch
      for (var i = 0; i < pendingUpdates.length; i++) {
        applySyllableUpdate(pendingUpdates[i]);
      }
      pendingUpdates = [];
    }).catch(function(err) {
      console.error('[projector] render-page fetch failed:', err);
      pageReady = true; // unblock so future updates aren't stuck
      pendingUpdates = [];
    });
  });

  // --- Pointer positioning ---
  var pointer = document.getElementById('pointer');
  var lastPointerLine = -1; // track which line the pointer is on for line-change detection

  function positionPointerAbove(el, beatMs, durationMs) {
    var rect = el.getBoundingClientRect();
    var newTop = (rect.top - 40) + 'px';
    var isEnglish = renderer.getMode() === 'english';

    if (isEnglish && durationMs) {
      // English mode: snap to left edge of element, then sweep to right over the line duration
      var startLeft = (rect.left - 18) + 'px';
      var endLeft = (rect.right - 18) + 'px';
      var topChanged = Math.abs(rect.top - lastPointerLine) > 10;
      pointer.style.transition = 'none';
      pointer.style.left = startLeft;
      pointer.style.top = newTop;
      pointer.style.display = 'block';
      pointer.offsetWidth; // force reflow
      pointer.style.transition = 'left ' + (durationMs / 1000) + 's linear, top 0.15s ease-out';
      pointer.style.left = endLeft;
      lastPointerLine = rect.top;
    } else {
      // Asterisk mode: glide from current toward next syllable
      var newLeft = (rect.left + rect.width / 2 - 18) + 'px';
      var transMs = beatMs || 150;
      var transition = 'left ' + (transMs / 1000) + 's linear, top 0.15s ease-out';

      if (pointer.style.display === 'none') {
        pointer.style.transition = 'none';
        pointer.style.left = newLeft;
        pointer.style.top = newTop;
        pointer.style.display = 'block';
        pointer.offsetWidth;
        pointer.style.transition = transition;
        lastPointerLine = rect.top;
      } else if (Math.abs(rect.top - lastPointerLine) > 10) {
        pointer.style.transition = 'none';
        pointer.style.top = newTop;
        pointer.offsetWidth;
        pointer.style.transition = transition;
        pointer.style.left = newLeft;
        lastPointerLine = rect.top;
      } else {
        pointer.style.transition = transition;
        pointer.style.left = newLeft;
        pointer.style.top = newTop;
      }
    }
  }

  function hidePointer() {
    pointer.style.display = 'none';
    lastPointerLine = -1;
  }

  // syllable-update: highlight individual syllables
  function applySyllableUpdate(data) {
    var elems = renderer.getSyllableElements();
    if (data.index >= 0 && data.index < elems.length) {
      if (data.state === 'active') {
        elems[data.index].classList.add('active');
        positionPointerAbove(elems[data.index], data.beatMs, data.durationMs);
      } else if (data.state === 'done') {
        elems[data.index].classList.remove('active');
        elems[data.index].classList.add('done');
      }
    }
  }

  window.electronAPI.on('syllable-update', function(data) {
    if (!pageReady) {
      pendingUpdates.push(data);
      return;
    }
    applySyllableUpdate(data);
  });

  // animation-reset: clear all highlights
  window.electronAPI.on('animation-reset', function() {
    var elems = renderer.getSyllableElements();
    for (var i = 0; i < elems.length; i++) {
      elems[i].classList.remove('active');
      elems[i].classList.remove('done');
    }
    hidePointer();
  });

  // countdown: show/hide countdown overlay
  window.electronAPI.on('countdown', function(data) {
    var overlay = document.getElementById('countdown-overlay');
    var numberEl = overlay.querySelector('.countdown-number');
    if (data.number > 0) {
      numberEl.textContent = data.number;
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  });

  // display-mode: switch asterisk/english
  window.electronAPI.on('display-mode', function(data) {
    renderer.setMode(data.mode);
    hidePointer(); // reset pointer state so next active syllable snaps cleanly
  });

  // spm-change: pace indicator watermark
  window.electronAPI.on('spm-change', function(data) {
    var el = document.getElementById('pace-indicator');
    if (data.indicator) {
      el.textContent = data.indicator;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });

  // show-instruction: display instruction overlay
  window.electronAPI.on('show-instruction', function(data) {
    var overlay = document.getElementById('instruction-overlay');
    var content = overlay.querySelector('.instruction-content');
    while (content.firstChild) content.removeChild(content.firstChild);

    if (data.image) {
      var img = document.createElement('img');
      img.className = 'instruction-image';
      img.src = data.image;
      img.alt = data.text || '';
      content.appendChild(img);
    }
    if (data.text) {
      var div = document.createElement('div');
      div.className = 'instruction-text';
      if (data.color) div.style.color = data.color;
      div.textContent = data.text;
      content.appendChild(div);
    }
    overlay.style.display = 'flex';
  });

  // dismiss-instruction: hide overlay
  window.electronAPI.on('dismiss-instruction', function() {
    document.getElementById('instruction-overlay').style.display = 'none';
  });
})();
