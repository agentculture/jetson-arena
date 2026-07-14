// Content for jetson-arena.com. The shape is fixed by ./types.ts; do not
// change the shape here. Keep every value honest: nothing is measured yet,
// so nothing in this file may read as a result — mission and method only.

import type { SiteData } from "./types";

const site: SiteData = {
  name: "Jetson Arena",
  url: "https://jetson-arena.com",
  description:
    "The arena for whole model stacks on Jetson devices. One question: how does a given Jetson handle a whole model pipeline? Latency, memory signature, and quality — with the Docker recipe to reproduce every published run.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/arena/", label: "Arena" },
  ],
  hero: {
    tagline: "The arena for whole model stacks on Jetson devices.",
    intro: [
      "Jetson Arena answers one question: how does a given Jetson device handle a whole model stack? Not a single model in isolation — the whole pipeline, every stage running together on the device they all have to share.",
      "Every published run will carry three things: its latency, end to end and per stage; its memory signature on unified memory; and an honest read of its quality — alongside the Docker recipe that reproduces it.",
      "Nothing is measured yet. The first target is chosen, and the method is public before any number is — so that when results land, they can be held to it.",
    ],
  },
};

export default site;
