(() => {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");
  if (stored) root.setAttribute("data-theme", stored);

  function currentTheme() {
    if (root.getAttribute("data-theme")) return root.getAttribute("data-theme");
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  // Guarded: this whole file is one IIFE, so a page without the toggle would
  // otherwise throw here and take the feed and reading progress down with it.
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      if (document.startViewTransition) {
        document.startViewTransition(() => applyTheme(next));
      } else {
        applyTheme(next);
      }
    });
  }

  // Home only: reveal the wordmark in the sticky pill once the hero name is gone.
  // Hysteresis avoids flicker at the threshold so the CSS transition can finish.
  const heroName = document.querySelector(".title-page .signature");
  if (heroName) {
    let headerQueued = false;
    let compact = false;
    const ENTER_AT = 8;  // become compact when hero bottom clears this
    const LEAVE_AT = 56; // expand again only when hero is clearly back
    const syncHomeHeader = () => {
      const bottom = heroName.getBoundingClientRect().bottom;
      let next = compact;
      if (!compact && bottom <= ENTER_AT) next = true;
      if (compact && bottom > LEAVE_AT) next = false;
      if (next === compact) return;
      compact = next;
      document.body.classList.toggle("header-compact", compact);
    };
    const onHomeScroll = () => {
      if (headerQueued) return;
      headerQueued = true;
      requestAnimationFrame(() => {
        headerQueued = false;
        syncHomeHeader();
      });
    };
    window.addEventListener("scroll", onHomeScroll, { passive: true });
    window.addEventListener("resize", onHomeScroll);
    syncHomeHeader();
  }

  const tabLinks = document.querySelectorAll(".tabs a[data-tab]");
  const sections = [...tabLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = document.querySelector(`.tabs a[href="#${entry.target.id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            tabLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // In-house posts: add one entry per post you write as its own file under writing/.
  // { title: "Post title", link: "writing/post-slug.html", pubDate: "2026-07-01" }
  const LOCAL_POSTS = [
    { title: "The Evolution of the Agent Harness", link: "presentations/the-evolution-of-agent-harness/", pubDate: "2026-08-10" },
    { title: "Organizational Cognition", link: "writing/organizational-cognition.html", pubDate: "2026-07-29" },
  ];

  // Used only if the live Medium fetch fails, so the section never comes up empty.
  const MEDIUM_FALLBACK = [
    { title: "The 8 Levels of Financial Freedom. Which One Are You?", link: "https://chnmy.medium.com/the-8-levels-of-financial-freedom-which-one-are-you-6671e0b0882c", pubDate: "2026-05-04" },
    { title: "Will Discounting Your SaaS Make You Rich or Destroy Your Business?", link: "https://chnmy.medium.com/will-discounting-your-saas-make-you-rich-or-destroy-your-business-40bb34ea9071", pubDate: "2023-08-16" },
    { title: "Engineering behind a Search Bar", link: "https://chnmy.medium.com/engineering-behind-a-search-bar-51516504da1d", pubDate: "2023-08-09" },
    { title: "Maximising Success with Weighted Load Balancing", link: "https://chnmy.medium.com/maximizing-success-with-weighted-load-balancing-14898b15c2ee", pubDate: "2023-07-20" },
  ];

  // A bare "YYYY-MM-DD" is parsed as UTC midnight, which reads as the previous day
  // (and sometimes the previous month) west of Greenwich. Pin those to a local date
  // instead. Medium's feed sends "YYYY-MM-DD HH:MM:SS", which is already local.
  function parsePubDate(dateInput) {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
    if (!dateOnly) return new Date(dateInput);
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  function formatTicketDate(dateInput) {
    const d = parsePubDate(dateInput);
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = String(d.getFullYear()).slice(-2);
    return `${month} '${year}`;
  }

  function renderTicketList(list, items) {
    list.textContent = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.link;
      if (/^https?:\/\//.test(item.link)) {
        a.target = "_blank";
        a.rel = "noopener";
      }

      const title = document.createElement("span");
      title.className = "ticket-title";
      title.textContent = item.title;

      const date = document.createElement("span");
      date.className = "ticket-date";
      date.textContent = formatTicketDate(item.pubDate);

      a.append(title, date);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  const list = document.getElementById("ticket-list");
  if (list) {
    const feedUrl = "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent("https://chnmy.medium.com/feed");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    fetch(feedUrl, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad response"))))
      .then((data) => {
        if (!data.items || !data.items.length) throw new Error("empty feed");
        return data.items;
      })
      .catch(() => MEDIUM_FALLBACK)
      .then((mediumItems) => {
        const combined = [...LOCAL_POSTS, ...mediumItems]
          .sort((a, b) => parsePubDate(b.pubDate) - parsePubDate(a.pubDate))
          .slice(0, 8);
        renderTicketList(list, combined);
      })
      .finally(() => clearTimeout(timeout));
  }

  // Auto-numbers any post's numbered <h2>N. Title</h2> headings.
  // Future posts need no manual markup.
  const post = document.querySelector(".post");
  if (post) {
    const headings = [...post.querySelectorAll("h2")];
    headings.forEach((h2, i) => {
      h2.id = `s${i + 1}`;
      const match = h2.textContent.match(/^(\d+)[.)]\s*(.*)$/);
      if (match) {
        h2.innerHTML = `<span class="h2-num">${match[1]}</span>${match[2]}`;
        // Keep the plain-text label; the reading bar can't reuse the numbered
        // markup, which renders as "4A Taxonomy" once the span is stripped.
        h2.dataset.label = `${match[1]}. ${match[2]}`;
      } else {
        h2.dataset.label = h2.textContent.trim();
      }
    });

    // Close each block of content with a divider whose weight matches the depth
    // of the block it ends: green for a section, white for a subsection, faint
    // grey below that. Section-level rules are already authored in the markup as
    // <hr class="post-hr">, so only the deeper ones are generated here.
    const RULE_DEPTH = { H2: 1, H3: 2, H4: 3 };
    const blockHeadings = [...post.querySelectorAll("h2, h3, h4")];

    blockHeadings.forEach((heading, i) => {
      const depth = RULE_DEPTH[heading.tagName];
      const prev = blockHeadings[i - 1];
      // Only divide when a block of this depth is genuinely closing. The first
      // subsection of a section closes nothing — the intro copy above it belongs
      // to the section, which gets its own rule at the section boundary.
      if (!prev || RULE_DEPTH[prev.tagName] < depth) return;
      if (depth === 1) return;
      const rule = document.createElement("hr");
      rule.className = `post-rule post-rule--${depth}`;
      heading.parentNode.insertBefore(rule, heading);
    });

    // The final section has no following heading to hang its closing rule on.
    if (blockHeadings.length) {
      const endRule = document.createElement("hr");
      endRule.className = "post-rule post-rule--1";
      post.appendChild(endRule);
    }

    // Progress as a pipe: the essay's metaphor (free pipes, accumulation
    // inside). Same scroll math as before; the chrome is the design move.
    const progress = document.createElement("div");
    progress.className = "reading-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Reading progress through the essay");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", "0");

    const pipe = document.createElement("div");
    pipe.className = "reading-progress-pipe";
    const bar = document.createElement("div");
    bar.className = "reading-progress-bar";
    pipe.appendChild(bar);
    progress.appendChild(pipe);
    document.body.appendChild(progress);

    const updateProgress = () => {
      const top = post.offsetTop;
      const scrollable = post.offsetHeight - window.innerHeight;
      const pct = scrollable > 0
        ? Math.min(1, Math.max(0, (window.scrollY - top) / scrollable))
        : 1;
      bar.style.width = `${pct * 100}%`;
      bar.classList.toggle("has-fill", pct > 0.002);
      progress.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
    };

    // Fill the last two breadcrumb levels in the site header with the section and
    // subsection being read. "Writing" and the article title are static markup;
    // only these two track scrolling.
    const header = document.querySelector(".site-header");
    const crumbH1 = header && header.querySelector(".crumb-h1");
    const crumbH2 = header && header.querySelector(".crumb-h2");

    // Document order matters: walking it lets a new h2 clear the stale h3 that
    // belonged to the previous section.
    const crumbNodes = [...post.querySelectorAll("h2, h3")];

    const updateCrumb = () => {
      if (!crumbH1 || !crumbH2) return;
      // A heading counts as "current" once it passes under the header.
      const threshold = header.offsetHeight + 12;

      let h2 = null;
      let h3 = null;
      for (const node of crumbNodes) {
        if (node.getBoundingClientRect().top > threshold) break;
        if (node.tagName === "H2") {
          h2 = node;
          h3 = null;
        } else {
          h3 = node;
        }
      }

      const h2Text = h2 ? h2.dataset.label || h2.textContent.trim() : "";
      const h3Text = h3 ? h3.textContent.trim() : "";
      if (crumbH1.textContent !== h2Text) crumbH1.textContent = h2Text;
      if (crumbH2.textContent !== h3Text) crumbH2.textContent = h3Text;
      // Hidden rather than empty, so no orphan "›" separator is drawn.
      crumbH1.hidden = !h2Text;
      crumbH2.hidden = !h3Text;
      // Highlight the deepest level in view — the subsection when inside one,
      // otherwise the section itself.
      crumbH1.classList.toggle("is-current", !!h2Text && !h3Text);
      crumbH2.classList.toggle("is-current", !!h3Text);
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        updateProgress();
        updateCrumb();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateProgress();
    updateCrumb();
  }
})();
