/* THE RISK DESK — the same measures the forked Python module computes,
   recomputed live in the browser. Nothing on this page is illustrative. */
(() => {
  const $ = (id) => document.getElementById(id);
  const ANNUALIZATION_DAYS = 365;
  const GT = "https://api.geckoterminal.com/api/v2";

  const pct = (x, digits = 1) =>
    x == null || isNaN(x) ? "—" : (x * 100).toFixed(digits) + "%";
  const fmtUsd = (n) => {
    if (n == null || isNaN(n)) return "—";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + n.toFixed(2);
  };
  const fmtPrice = (n) =>
    n == null || isNaN(n) ? "—" : n >= 1 ? "$" + n.toFixed(4) : "$" + n.toPrecision(4);

  /* ---------- risk measures (mirrors aladdinsdk/riskdesk/risk.py) ---------- */
  const stdev = (xs) => {
    if (xs.length < 2) return 0;
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  };
  const historicalVar = (returns, confidence) => {
    if (!returns.length) return 0;
    const ordered = [...returns].sort((a, b) => a - b);
    let i = Math.floor((1 - confidence) * ordered.length);
    i = Math.min(Math.max(i, 0), ordered.length - 1);
    return Math.abs(Math.min(ordered[i], 0));
  };
  const maxDrawdown = (closes) => {
    let peak = -Infinity, worst = 0;
    for (const p of closes) {
      peak = Math.max(peak, p);
      if (peak > 0) worst = Math.min(worst, (p - peak) / peak);
    }
    return Math.abs(worst);
  };
  const realizedVol = (returns) =>
    returns.length < 2 ? 0 : stdev(returns) * Math.sqrt(ANNUALIZATION_DAYS);
  const sharpe = (returns) => {
    if (returns.length < 2) return null;
    const s = stdev(returns);
    if (s === 0) return null;
    const m = returns.reduce((a, b) => a + b, 0) / returns.length;
    return (m / s) * Math.sqrt(ANNUALIZATION_DAYS);
  };

  /* ---------- market data ----------
     The daily series changes once a day; the public feed rate-limits callers
     who forget that. Cache it, and refresh only the price often. */
  let seriesCache = { ca: null, at: 0, closes: null };
  const SERIES_TTL_MS = 10 * 60 * 1000;

  const fetchSeries = async (ca) => {
    const pools = await (await fetch(`${GT}/networks/${CONFIG.chain}/tokens/${ca}/pools?page=1`)).json();
    const pool = (pools.data || [])[0]?.attributes?.address;
    if (!pool) throw new Error("no pools");
    const res = await (
      await fetch(`${GT}/networks/${CONFIG.chain}/pools/${pool}/ohlcv/day?aggregate=1&limit=180&currency=usd`)
    ).json();
    const rows = res?.data?.attributes?.ohlcv_list || [];
    if (!rows.length) throw new Error("no history");
    return rows.sort((a, b) => a[0] - b[0]).map((r) => parseFloat(r[4]));
  };

  const fetchToken = async (ca) => {
    const res = await (await fetch(`${GT}/networks/${CONFIG.chain}/tokens/${ca}`)).json();
    return res?.data?.attributes || {};
  };

  /* ---------- render ---------- */
  const render = async () => {
    const ca = CONFIG.contractAddress;
    if (!ca) {
      $("feed").textContent = "FEED: NO COVERAGE — ASSET NOT LISTED";
      $("hero-var").textContent = "not yet measurable";
      $("obs").textContent = "the desk holds nothing, the only riskless position available to it";
      $("buy").href = CONFIG.twitterUrl;
      $("buy").textContent = "FOLLOW THE LISTING ›";
      return;
    }
    try {
      const fresh =
        seriesCache.ca === ca &&
        seriesCache.closes &&
        Date.now() - seriesCache.at < SERIES_TTL_MS;
      const [closes, token] = await Promise.all([
        fresh ? Promise.resolve(seriesCache.closes) : fetchSeries(ca),
        fetchToken(ca),
      ]);
      seriesCache = { ca, at: fresh ? seriesCache.at : Date.now(), closes };
      const returns = [];
      for (let i = 1; i < closes.length; i++) {
        if (closes[i - 1] > 0) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
      }

      const v95 = historicalVar(returns, 0.95);
      const v99 = historicalVar(returns, 0.99);
      const sr = sharpe(returns);

      $("var95").textContent = pct(v95);
      $("var99").textContent = pct(v99);
      $("vol").textContent = pct(realizedVol(returns));
      $("mdd").textContent = pct(maxDrawdown(closes));
      $("sharpe").textContent = sr == null ? "—" : sr.toFixed(2);
      $("worst").textContent = returns.length ? pct(Math.min(...returns)) : "—";
      $("best").textContent = returns.length ? "+" + pct(Math.max(...returns)) : "—";
      $("px").textContent = fmtPrice(parseFloat(token.price_usd));
      $("mcap").textContent =
        "market cap " + fmtUsd(parseFloat(token.market_cap_usd || token.fdv_usd));
      $("hero-var").textContent = pct(v99, 1) + " in a day";
      $("obs").textContent = `${closes.length} daily observations · historical, non-parametric`;
      $("feed").textContent = "FEED: LIVE";
      $("feed").classList.add("live");
      $("buy").href = "https://pump.fun/coin/" + ca;
      $("buy").textContent = "TAKE THE RISK ›";
    } catch {
      $("feed").textContent = "FEED: INSUFFICIENT HISTORY — DESK STANDING BY";
      $("hero-var").textContent = "not yet measurable";
      $("obs").textContent = "insufficient history to measure; the risk is present regardless";
      $("buy").href = "https://pump.fun/coin/" + ca;
    }
  };

  $("x").href = CONFIG.twitterUrl;
  $("lore").href = CONFIG.loreUrl;

  const ca = new URLSearchParams(location.search).get("ca");
  if (ca) CONFIG.contractAddress = ca;
  render();
  setInterval(render, CONFIG.pollMs);
})();
