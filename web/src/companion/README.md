# Companion app phone

The xKoin Companion app, drawn inside a phone frame so a presentation page can point at a real screen instead of describing one.

```jsx
import { Phone, HIGHLIGHTS, SCREEN_NAMES } from '../companion/index.js';

<Phone screen="buy" scale={0.55} highlight="buy" />
<Phone screen="send" scale={0.55} t={clock} />
```

Importing `./index.js` is enough: it pulls in every screen, and each screen registers itself with the frame.

## Phone props

| Prop | Meaning |
|---|---|
| `screen` | one of `SCREEN_NAMES`: onboard, main, attach, buy, send, unlock, withdraw |
| `scale` | 1 draws the 390x844 design size; 0.5 draws it half size |
| `highlight` | names one control to outline with an accent pulse, or null |
| `t` | scene clock in ms; buy and send animate, the rest ignore it |
| `label` | accessible label, defaults to "Companion app, <screen> screen" |

The frame is a static picture (`role="img"`), not a working app. Nothing inside takes a click.

## Highlight keys

`HIGHLIGHTS` in `index.js` is the same table in code, screen name to keys.

| Screen | Keys |
|---|---|
| onboard | seed, confirm, create, restore |
| main | address, meter, balance, wallet, buy, send, withdraw, receive, attach, node, recent, tabs |
| attach | status, attach, node, session, free, nearby, pause |
| buy | amount, presets, method, phone, steps, deposit, buy, confirm |
| send | to, qr, amount, settles, send, confirm |
| unlock | amount, to, signed, gas, unlock |
| withdraw | amount, short, payout, steps, charges, withdraw |

A name that no screen knows highlights nothing. The pulse is a CSS animation that stops under `prefers-reduced-motion`.

## Animation

Buy and Send are pure functions of `t` in milliseconds, so the player's pause, scrub and replay work without the screen knowing about them.

| Time | Buy | Send |
|---|---|---|
| 0.3 to 1.2 s | amount counts to 100 | recipient lands |
| 0.9 to 1.7 s | preset and method select | amount counts to 50 |
| 1.8 to 2.1 s | number appears, meter option ticks | |
| 2.5 s | button presses | button presses |
| 3.5 s | confirmation sheet | settlement sheet |

`t` of 0 or undefined renders the static wireframe, which is what a still infographic wants.

## Adding a screen

1. Draw it as an artboard in `./wireframes/<Name>.dc.html` at 390x844.
2. Port it to `./screens/<Name>.jsx`: markup only, no hard-coded colours. Every hex in the artboard has a token in `../theme.css`; sizes stay in px because the frame scales them.
3. Put new classes in `./screens.css` with the `xk-app-` prefix.
4. Name the controls a story might point at with `hl(highlight, 'key')` from `./screens/hl.js`, and list them in the comment at the top of the file.
5. Call `registerScreen('<name>', <Name>)` at the bottom of the file, add the file to `./screens/index.js`, the name to `SCREEN_NAMES` in `./Phone.jsx`, and the keys to `HIGHLIGHTS` in `./index.js`.
