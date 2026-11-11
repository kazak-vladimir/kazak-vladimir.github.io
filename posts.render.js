// Finds the posts and renders every [data-posts] list on the page.
// On GitHub Pages it reads the writing/ folder straight from the repository, so a dropped-in PDF
// shows up without any build step. Opened from disk it falls back to writing/posts.js.
(function () {
  function parse(name) {
    var stem = name.replace(/\.pdf$/i, "");
    var m = stem.match(/^(\d{4}-\d{2}-\d{2})[ _-]+(.+)$/);
    var title = (m ? m[2] : stem).replace(/_/g, " ").trim();
    return { file: name, stem: stem, date: m ? m[1] : "", title: title,
             slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), summary: "" };
  }
  function repo() {
    var h = location.hostname;
    if (!/\.github\.io$/.test(h)) return null;
    var owner = h.split(".")[0], first = location.pathname.split("/")[1] || "";
    var isProject = first && first !== "writing" && !/\.html$/.test(first);
    return { owner: owner, name: isProject ? first : h };
  }
  function fromGitHub(r) {
    return fetch("https://api.github.com/repos/" + r.owner + "/" + r.name + "/contents/writing")
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (items) {
        var txt = {};
        items.forEach(function (i) { if (/\.txt$/i.test(i.name)) txt[i.name.replace(/\.txt$/i, "")] = i.download_url; });
        var posts = items.filter(function (i) { return /\.pdf$/i.test(i.name); }).map(function (i) { return parse(i.name); });
        return Promise.all(posts.map(function (p) {
          if (!txt[p.stem]) return p;
          return fetch(txt[p.stem]).then(function (r) { return r.text(); })
            .then(function (t) { p.summary = t.split(/\r?\n/)[0].trim(); return p; }, function () { return p; });
        }));
      })
      .then(function (posts) {
        posts.sort(function (a, b) { return b.date.localeCompare(a.date); });
        return posts;
      });
  }
  window.getPosts = function () {
    var local = window.POSTS || [];
    var r = repo();
    if (!r) return Promise.resolve(local);
    return fromGitHub(r).catch(function () { return local; });
  };

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var fmt = function (d) { return d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : ""; };

  window.getPosts().then(function (posts) {
    if (!posts.length) document.querySelectorAll("[data-needs-posts]").forEach(function (el) { el.hidden = true; });
    else document.querySelectorAll("[data-needs-posts]").forEach(function (el) { el.hidden = false; });
    document.querySelectorAll("[data-posts]").forEach(function (list) {
      var base = list.getAttribute("data-base") || "";
      var limit = parseInt(list.getAttribute("data-limit") || "0", 10);
      var items = limit ? posts.slice(0, limit) : posts;
      var section = list.closest("[data-hide-empty]");
      if (!items.length) { if (section) section.hidden = true; else list.outerHTML = '<p class="empty">No posts yet.</p>'; return; }
      if (section) section.hidden = false;
      list.innerHTML = items.map(function (p) {
        return '<li><a href="' + base + 'read.html#' + p.slug + '"><div><h3>' + esc(p.title) + "</h3>" +
          (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") + '</div><time datetime="' + p.date + '">' + fmt(p.date) + "</time></a></li>";
      }).join("");
    });
  });
})();
