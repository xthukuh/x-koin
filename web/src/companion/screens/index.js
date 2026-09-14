/*
 * Every screen, imported for its side effect: each file calls registerScreen so
 * the phone frame can find it by name. Importing this module once is enough.
 */
export { default as Onboard } from './Onboard.jsx';
export { default as Main } from './Main.jsx';
export { default as Attach } from './Attach.jsx';
export { default as Buy } from './Buy.jsx';
export { default as Send } from './Send.jsx';
export { default as Withdraw } from './Withdraw.jsx';
