/* benzeen.app scripts: one file, so the Content-Security-Policy can allow scripts from this site only.
   Each part does nothing on pages without its elements. */

/* Gentle scroll-in for sections. */
(function () {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var els = document.querySelectorAll(".band h2, .steps li, .feat, .shots img, .uae li, .privacy-in, .faq details, .end-in > *, .doc section");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) return;  // already on screen: leave it be
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.setProperty("--i", Math.min(i, 6));
    el.classList.add("reveal");
    el.addEventListener("transitionend", function done() {
      el.classList.remove("reveal", "in");
      el.style.removeProperty("--i");
      el.removeEventListener("transitionend", done);
    });
    io.observe(el);
  });
})();

/* Fuel guide: how many litres the amount buys. */
(function () {
  var amount = document.getElementById("amount"), grade = document.getElementById("grade"), out = document.getElementById("litres");
  if (!amount || !grade || !out) return;
  amount.form.addEventListener("submit", function (e) { e.preventDefault(); });
  function update() {
    var aed = parseFloat(String(amount.value).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(",", "."));
    var price = parseFloat(grade.value);
    out.textContent = aed > 0 && price > 0 ? (aed / price).toFixed(2) : "–";
  }
  amount.addEventListener("input", update);
  grade.addEventListener("change", update);
  update();
})();

/* Charts (tools/site/charts.py): hover, tap and keyboard tooltips. They only repeat what the tables show. */
(function () {
  var hiders = [];
  function fill(tip, title, rows) {
    tip.textContent = "";
    var t = document.createElement("div");
    t.className = "tip-t";
    t.textContent = title;
    tip.appendChild(t);
    rows.forEach(function (r) {
      var row = document.createElement("div"), v = document.createElement("b"), n = document.createElement("span");
      row.className = "tip-r";
      if (r.k) { var key = document.createElement("i"); key.className = "key-line " + r.k; row.appendChild(key); }
      v.textContent = r.v;
      n.textContent = r.n;
      row.appendChild(v);
      row.appendChild(n);
      tip.appendChild(row);
    });
    tip.hidden = false;
  }

  document.querySelectorAll(".lc").forEach(function (lc) {
    var fig = lc.parentNode, data = JSON.parse(fig.querySelector("script[type='application/json']").textContent);
    var plot = lc.querySelector(".lc-plot"), cross = plot.querySelector(".lc-cross"), tip = plot.querySelector(".chart-tip");
    var dots = plot.querySelectorAll(".lc-dot[hidden]"), last = data.x.length - 1, cur = -1;
    function show(i) {
      cur = i;
      cross.style.left = data.x[i] + "%";
      cross.hidden = false;
      data.s.forEach(function (s, j) {
        dots[j].style.left = data.x[i] + "%";
        dots[j].style.top = s.y[i] + "px";
        dots[j].hidden = false;
      });
      fill(tip, data.t[i], data.s.map(function (s) { return { k: s.k, v: s.v[i], n: s.n }; }));
      var w = plot.clientWidth, px = data.x[i] / 100 * w, tw = tip.offsetWidth, left = px + 14;
      if (left + tw > w) left = px - 14 - tw;
      if (left < 0) left = Math.max(0, Math.min(w - tw, px - tw / 2));
      tip.style.left = left + "px";
    }
    function hide() {
      cur = -1;
      cross.hidden = tip.hidden = true;
      dots.forEach(function (d) { d.hidden = true; });
    }
    function nearest(clientX) {
      var r = plot.getBoundingClientRect(), x = (clientX - r.left) / r.width * 100, best = 0;
      data.x.forEach(function (v, i) { if (Math.abs(v - x) < Math.abs(data.x[best] - x)) best = i; });
      return best;
    }
    plot.addEventListener("pointermove", function (e) { show(nearest(e.clientX)); });
    plot.addEventListener("pointerdown", function (e) { show(nearest(e.clientX)); });
    plot.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && document.activeElement !== plot) hide(); });
    plot.addEventListener("focus", function () { show(cur < 0 ? last : cur); });
    plot.addEventListener("blur", hide);
    plot.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { hide(); return; }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var from = cur < 0 ? last : cur, dir = e.key === "ArrowRight" ? 1 : -1, best = -1;
      data.x.forEach(function (v, i) {
        var d = (v - data.x[from]) * dir;
        if (d > 0 && (best < 0 || d < (data.x[best] - data.x[from]) * dir)) best = i;
      });
      if (best >= 0) show(best);
    });
    hiders.push([fig, hide]);
  });

  document.querySelectorAll(".tl-wrap").forEach(function (fig) {
    var tl = fig.querySelector(".tl"), tip = fig.querySelector(".chart-tip"), on = null;
    var bars = Array.prototype.slice.call(fig.querySelectorAll(".tl-bar"));
    function segs(bar) { return Array.prototype.slice.call(bar.querySelectorAll(".tl-seg")); }
    function show(seg) {
      if (on) on.classList.remove("on");
      on = seg;
      seg.classList.add("on");
      fill(tip, seg.parentNode.getAttribute("data-name"), [{ v: seg.getAttribute("data-v"), n: seg.getAttribute("data-d") }]);
      var fr = fig.getBoundingClientRect(), sr = seg.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.max(0, Math.min(fr.width - tw, sr.left - fr.left + sr.width / 2 - tw / 2));
      var top = sr.top - fr.top - th - 8;
      if (top < 0) top = sr.bottom - fr.top + 8;
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    }
    function hide() {
      if (on) on.classList.remove("on");
      on = null;
      tip.hidden = true;
    }
    tl.addEventListener("pointerover", function (e) { var s = e.target.closest(".tl-seg"); if (s) show(s); });
    tl.addEventListener("pointerdown", function (e) { var s = e.target.closest(".tl-seg"); if (s) show(s); });
    tl.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && document.activeElement !== tl) hide(); });
    tl.addEventListener("focus", function () { show(on || segs(bars[0])[0]); });
    tl.addEventListener("blur", hide);
    tl.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { hide(); return; }
      if (!on) return;
      var bar = on.parentNode, list = segs(bar), i = list.indexOf(on), next = null;
      if (e.key === "ArrowRight") next = list[i + 1];
      else if (e.key === "ArrowLeft") next = list[i - 1];
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        var nb = bars[bars.indexOf(bar) + (e.key === "ArrowDown" ? 1 : -1)];
        if (nb) {
          var r = on.getBoundingClientRect(), mid = r.left + r.width / 2;
          next = segs(nb).filter(function (s) { var q = s.getBoundingClientRect(); return q.left <= mid && q.right >= mid; })[0] || segs(nb)[0];
        }
      } else return;
      e.preventDefault();
      if (next) show(next);
    });
    hiders.push([fig, hide]);
  });

  document.addEventListener("pointerdown", function (e) {
    hiders.forEach(function (h) { if (!h[0].contains(e.target)) h[1](); });
  });
})();

/* Guides: ask Google AdSense to fill each ad unit (its loader is in the page head). One push per unit. */
(function () {
  var units = document.querySelectorAll("ins.adsbygoogle");
  if (!units.length) return;
  window.adsbygoogle = window.adsbygoogle || [];
  units.forEach(function () { window.adsbygoogle.push({}); });
})();
