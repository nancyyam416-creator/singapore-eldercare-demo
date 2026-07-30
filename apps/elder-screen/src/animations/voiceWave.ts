const easingIn = { x: [0.42, 0.42, 0.42], y: [1, 1, 1] };
const easingOut = { x: [0.58, 0.58, 0.58], y: [0, 0, 0] };

const scaleFrames = (values: number[], offset: number) => {
  const times = [0, 12, 24, 36, 48, 60];
  return times.map((time, index) => {
    const value = values[(index + offset) % values.length];
    if (index === times.length - 1) return { t: time, s: [100, value, 100] };
    const nextValue = values[(index + 1 + offset) % values.length];
    return {
      i: easingIn,
      o: easingOut,
      t: time,
      s: [100, value, 100],
      e: [100, nextValue, 100],
    };
  });
};

const createBar = (index: number, x: number, values: number[]) => ({
  ddd: 0,
  ind: index + 1,
  ty: 4,
  nm: `Voice bar ${index + 1}`,
  sr: 1,
  ks: {
    o: { a: 0, k: 100, ix: 11 },
    r: { a: 0, k: 0, ix: 10 },
    p: { a: 0, k: [x, 48, 0], ix: 2 },
    a: { a: 0, k: [0, 0, 0], ix: 1 },
    s: { a: 1, k: scaleFrames(values, index), ix: 6 },
  },
  ao: 0,
  shapes: [
    {
      ty: "gr",
      it: [
        { d: 1, ty: "rc", s: { a: 0, k: [8, 36], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, r: { a: 0, k: 4, ix: 4 }, nm: "Bar shape" },
        { ty: "fl", c: { a: 0, k: [1, 1, 1, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: "White fill" },
        { ty: "tr", p: { a: 0, k: [0, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: "Transform" },
      ],
      nm: "Voice bar",
      np: 2,
      cix: 2,
      bm: 0,
      ix: 1,
      mn: "ADBE Vector Group",
      hd: false,
    },
  ],
  ip: 0,
  op: 60,
  st: 0,
  bm: 0,
});

const voiceWaveAnimation = {
  v: "5.12.2",
  fr: 30,
  ip: 0,
  op: 60,
  w: 96,
  h: 96,
  nm: "Voice message wave",
  ddd: 0,
  assets: [],
  layers: [
    createBar(0, 20, [48, 92, 64, 112, 58]),
    createBar(1, 34, [72, 126, 54, 98, 68]),
    createBar(2, 48, [110, 62, 138, 76, 118]),
    createBar(3, 62, [62, 108, 72, 132, 54]),
    createBar(4, 76, [88, 54, 116, 66, 102]),
  ],
};

export default voiceWaveAnimation;
