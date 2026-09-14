import { CHAPTERS as CHAPTER_META, CHAPTER_STARTS, SCENE_META, deckDuration } from './manifest.js';
import { SCENES as CH01 } from './ch01.jsx';
import { SCENES as CH02 } from './ch02.jsx';
import { SCENES as CH03 } from './ch03.jsx';
import { SCENES as CH04 } from './ch04.jsx';
import { SCENES as CH05 } from './ch05.jsx';
import { SCENES as CH06 } from './ch06.jsx';
import { SCENES as CH07 } from './ch07.jsx';
import { SCENES as CH08 } from './ch08.jsx';
import { SCENES as CH09 } from './ch09.jsx';
import { SCENES as CH10 } from './ch10.jsx';

/**
 * The full invention deck: the running order from manifest.js joined to the
 * pictures in the chapter files.
 *
 * The join is checked at import time in both directions, because the two halves
 * are edited for different reasons: a caption changes in the manifest, a
 * picture changes in a chapter file, and neither edit should be able to leave
 * the deck with a scene that renders nothing or a component nothing reaches.
 */

const MODULES = {
  ch01: CH01,
  ch02: CH02,
  ch03: CH03,
  ch04: CH04,
  ch05: CH05,
  ch06: CH06,
  ch07: CH07,
  ch08: CH08,
  ch09: CH09,
  ch10: CH10,
};

function build() {
  const claimed = new Set();
  const scenes = SCENE_META.map((meta) => {
    const module = MODULES[meta.module];
    if (!module) {
      throw new Error(`slides deck: scene "${meta.id}" names module "${meta.module}", which does not exist`);
    }
    const Scene = module[meta.id];
    if (!Scene) {
      throw new Error(`slides deck: scene "${meta.id}" has no picture in ${meta.module}.jsx`);
    }
    claimed.add(`${meta.module}:${meta.id}`);
    return {
      id: meta.id,
      title: meta.title,
      duration: meta.duration,
      caption: meta.caption,
      terms: meta.terms ?? [],
      chapter: meta.chapter,
      chapterTitle: meta.chapterTitle,
      Scene,
    };
  });

  for (const [name, module] of Object.entries(MODULES)) {
    for (const id of Object.keys(module)) {
      if (!claimed.has(`${name}:${id}`)) {
        throw new Error(`slides deck: ${name}.jsx exports a picture for "${id}", which no scene claims`);
      }
    }
  }

  return scenes;
}

/** Every scene in running order, ready for the player. */
export const SLIDE_SCENES = build();

/** The chapters, each carrying the index of its first scene. */
export const CHAPTERS = CHAPTER_META.map((chapter) => ({
  id: chapter.id,
  n: chapter.n,
  title: chapter.title,
  blurb: chapter.blurb,
  start: CHAPTER_STARTS[chapter.id],
  count: chapter.scenes.length,
}));

export { deckDuration };
