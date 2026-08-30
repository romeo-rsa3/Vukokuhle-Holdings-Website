(function(){
  "use strict";

  /* ---------- Sticky header ---------- */
  var header = document.querySelector('.site-header');
  function onScroll(){
    if(!header) return;
    if(window.scrollY > 12){ header.classList.add('is-scrolled'); }
    else { header.classList.remove('is-scrolled'); }
  }
  document.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');
  if(toggle && panel){
    toggle.addEventListener('click', function(){
      var open = toggle.classList.toggle('is-open');
      panel.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        toggle.classList.remove('is-open');
        panel.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Scroll reveal (content is visible by default; JS arms the
     pre-animation hidden state right before observing, so nothing ever
     depends on JS to be seen) ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){
      // Skip arming if already in (or near) the viewport on load, so
      // above-the-fold content never flashes hidden.
      var rect = el.getBoundingClientRect();
      if(rect.top > window.innerHeight * 0.92){
        el.classList.add('js-armed');
      } else {
        el.classList.add('is-visible');
      }
      io.observe(el);
    });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var btn = item.querySelector('.faq-q');
    var ans = item.querySelector('.faq-a');
    if(!btn || !ans) return;
    btn.addEventListener('click', function(){
      var isOpen = item.classList.contains('is-open');
      // close siblings within same list
      var list = item.closest('.faq-list');
      if(list){
        list.querySelectorAll('.faq-item.is-open').forEach(function(open){
          if(open !== item){
            open.classList.remove('is-open');
            open.querySelector('.faq-a').style.maxHeight = null;
            open.querySelector('.faq-q').setAttribute('aria-expanded','false');
          }
        });
      }
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      ans.style.maxHeight = !isOpen ? (ans.scrollHeight + 'px') : null;
    });
  });

  /* ---------- Animated counters ---------- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'),10) : 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = target * eased;
      el.textContent = val.toFixed(decimals) + suffix;
      if(progress < 1){ requestAnimationFrame(step); }
      else { el.textContent = target.toFixed(decimals) + suffix; }
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if('IntersectionObserver' in window && counters.length){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function(el){ cio.observe(el); });
  }

  /* ---------- Sector tabs (sectors.html) ---------- */
  var tabs = document.querySelectorAll('.sector-tab');
  if(tabs.length){
    function activateSector(target){
      tabs.forEach(function(t){ t.classList.toggle('is-active', t.getAttribute('data-target') === target); });
      document.querySelectorAll('.sector-panel').forEach(function(p){
        p.style.display = (p.id === target) ? 'block' : 'none';
      });
    }
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        activateSector(tab.getAttribute('data-target'));
        history.replaceState(null, '', '#' + tab.getAttribute('data-target'));
      });
    });
    var initial = window.location.hash ? window.location.hash.substring(1) : null;
    var validTargets = Array.prototype.map.call(tabs, function(t){ return t.getAttribute('data-target'); });
    if(initial && validTargets.indexOf(initial) !== -1){ activateSector(initial); }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Contact form: Formspree submission with validate + success/error states ---------- */
  var form = document.getElementById('contact-form');
  if(form){
    var errorEl = document.getElementById('form-error');
    var confirmEl = document.getElementById('form-confirm');
    var submitBtn = document.getElementById('form-submit-btn');
    var submitBtnDefaultHTML = submitBtn ? submitBtn.innerHTML : '';

    function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    function showError(msg){
      if(!errorEl) return;
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').trim();
      var email = (data.get('email') || '').trim();
      var message = (data.get('message') || '').trim();

      if(confirmEl) confirmEl.hidden = true;

      if(!name || !email || !message || !isValidEmail(email)){
        showError(
          (!isValidEmail(email) && email)
            ? 'That email address doesn\u2019t look right — please check it and try again.'
            : 'Please fill in your name, email and message before sending.'
        );
        var firstInvalid = form.querySelector(!name ? '#name' : (!email || !isValidEmail(email)) ? '#email' : '#message');
        if(firstInvalid) firstInvalid.focus();
        return;
      }

      // Safety net: the form hasn't been connected to Formspree yet (placeholder ID still in place)
      if(form.action.indexOf('YOUR_FORM_ID') !== -1){
        showError('This form isn\u2019t connected yet — please email us directly at vukile@vukokuhle.co.za for now.');
        return;
      }

      if(errorEl) errorEl.style.display = 'none';
      if(submitBtn){ submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…'; }

      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function(response){
        if(response.ok){
          form.reset();
          if(confirmEl){ confirmEl.hidden = false; confirmEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        } else {
          response.json().then(function(json){
            var msg = (json && json.errors && json.errors.length) ? json.errors.map(function(x){return x.message;}).join(', ') : null;
            showError(msg || 'Something went wrong sending your message — please try again, or email us directly at vukile@vukokuhle.co.za.');
          }).catch(function(){
            showError('Something went wrong sending your message — please try again, or email us directly at vukile@vukokuhle.co.za.');
          });
        }
      }).catch(function(){
        showError('Couldn\u2019t reach the server — check your connection and try again, or email us directly at vukile@vukokuhle.co.za.');
      }).finally(function(){
        if(submitBtn){ submitBtn.disabled = false; submitBtn.innerHTML = submitBtnDefaultHTML; }
      });
    });

    // Clear error state as the person starts fixing the form
    form.addEventListener('input', function(){
      if(errorEl && errorEl.style.display === 'block'){ errorEl.style.display = 'none'; }
    });
  }
})();
