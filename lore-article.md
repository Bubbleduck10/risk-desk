# We Forked BlackRock's Risk System and Pointed It at a Memecoin

There is a piece of software called Aladdin.

If you don't know what it is: it is BlackRock's risk platform, and it is the most consequential piece of software in asset management. Pension funds run on it. Insurers run on it. Sovereign wealth funds and central banks run on it. Estimates put the assets analyzed through it somewhere around twenty-one trillion dollars — a number large enough that people write conspiracy theories about it, some of which are only slightly wrong.

Aladdin's job is to answer one question, continuously, for almost everyone who matters: *what happens to what you own if things go badly?*

BlackRock open-sourced the SDK for it. Apache-2.0. Anyone may fork it.

So we forked it, and we asked it about one memecoin.

## There was a problem, and the problem was the funniest part

Aladdin's APIs and its Data Cloud require an **entitlement**. You need to be a client. You need credentials. You need, broadly speaking, to be the kind of institution that has twenty-one trillion dollars nearby.

We are not. So we deleted the parts that required permission.

Out went the generated institutional client surface — 18,210 lines of it. Out went the Data Cloud client. Out went the authentication modules whose entire purpose was to prove to BlackRock that we were allowed to be there.

**145 files changed. 27,228 deletions.**

What remained was the shape of a risk system with nothing to be risky about. So we gave it something.

## The Risk Desk

We added one module: a risk desk with a coverage universe of exactly one asset, running on public market data, requiring permission from no one. It computes what any real desk computes:

- **Value at risk**, historical and non-parametric, at 95% and 99%, one-day
- **Realized volatility**, annualized
- **Maximum drawdown**, peak to trough
- **Sharpe ratio**, risk-free rate assumed zero — because anyone holding this asset has already expressed a view on the risk-free rate
- **Diversification benefit**, reported for completeness, hardcoded to `0.0`, with a docstring explaining that a portfolio of one asset does not have one

Then we ran it. Against a live Solana token, 180 daily observations, it printed:

```
  realized volatility   78.9% annualized
  maximum drawdown      71.1%
  value at risk (95%)   6.8% of position, 1-day
  value at risk (99%)   10.8% of position, 1-day
  sharpe ratio          -2.11
  diversification       0.0% (coverage universe: 1)
```

Those are not decorative numbers. That is the module running. The website recomputes the identical measures live in your browser, from live market data, and produces the identical figures. Nothing on it is illustrative.

## The license made us confess

Apache-2.0, section 4(b), requires that modified files carry prominent notices stating that you changed them.

So the README of a fork of BlackRock's risk platform is now legally obligated to state that we deleted the institutional surface and pointed the remainder at a memecoin. We complied fully, in detail, and without being asked twice. It is the most rigorous disclosure in this sector, and we were required to write it.

## What the desk is actually for

Here is the part that is not a joke.

Every measure on that site is real, and every measure says the same thing: this is extremely risky. Value at risk in the double digits *per day*. Drawdowns that would end a career at a real fund. A negative Sharpe ratio, which formally means you were not compensated for any of it.

Institutional risk management exists to tell people in suits what they already suspect, with more decimal places and better fonts. We have simply applied it to an asset where everyone already knows the answer and nobody wants the decimal places.

The desk will report them anyway. Every day. On one coin.

Risk was always the product. We are the first ones to measure it properly.

**Notice from the desk.** The Risk Desk is a parody and none of this is financial advice. $RISK is a meme coin. The risk measures are real — that is the joke, and it is also the warning.

BlackRock has no affiliation with this project and has not endorsed it. Aladdin® is BlackRock's trademark, referenced here descriptively, to state truthfully what this is a fork of. The upstream project remains excellent, which is the entire reason this is funny.
