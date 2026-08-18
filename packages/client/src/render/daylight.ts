import { AmbientLight, Color, DirectionalLight, Group, type Scene } from 'three';

/**
 * How the sky looks at one hour of the day.
 *
 * A table rather than a run of conditions in the drawing code. Adding dusk a
 * shade redder, or a moonlit night that is not quite so blue, is a number here
 * — the same reason floors and walls keep their colours in tables
 * (docs/02-architektura.md, "Dane, nie kod").
 *
 * Kept in the client because a colour has never been the simulation's
 * business; the simulation says what hour it is and stops there.
 */
interface SkyAtHour {
  readonly hour: number;
  readonly sunColour: number;
  readonly sunIntensity: number;
  readonly ambientColour: number;
  readonly ambientIntensity: number;
  readonly skyColour: number;
}

/**
 * Midnight first and midnight last, so the day joins up without the reading
 * code having to know that it wraps.
 *
 * Night is deliberately not black. There is no torch in the game yet
 * (docs/06-roadmapa.md puts it in Etap 3), so a true night would mean a few
 * minutes an hour of being unable to play at all. This is recorded in
 * docs/08-do-obserwacji.md as something to revisit once there is light to
 * carry.
 */
const SKY: readonly SkyAtHour[] = [
  {
    hour: 0,
    sunColour: 0x93a6d4,
    sunIntensity: 1.35,
    ambientColour: 0x6a7aa6,
    ambientIntensity: 1.3,
    skyColour: 0x0d1119,
  },
  {
    hour: 5,
    sunColour: 0x9aa4cf,
    sunIntensity: 1.4,
    ambientColour: 0x737ca4,
    ambientIntensity: 1.35,
    skyColour: 0x121826,
  },
  {
    hour: 7,
    sunColour: 0xd8926a,
    sunIntensity: 1.6,
    ambientColour: 0x8f8281,
    ambientIntensity: 1.15,
    skyColour: 0x33302f,
  },
  {
    hour: 10,
    sunColour: 0xfff2dc,
    sunIntensity: 2.6,
    ambientColour: 0xdfe4ea,
    ambientIntensity: 1.5,
    skyColour: 0x2c3430,
  },
  {
    hour: 14,
    sunColour: 0xffffff,
    sunIntensity: 2.7,
    ambientColour: 0xe6e9ee,
    ambientIntensity: 1.55,
    skyColour: 0x2c3430,
  },
  {
    hour: 18,
    sunColour: 0xffd9a8,
    sunIntensity: 2.1,
    ambientColour: 0xcbbfb2,
    ambientIntensity: 1.3,
    skyColour: 0x38322a,
  },
  {
    hour: 20,
    sunColour: 0xc9744f,
    sunIntensity: 1.3,
    ambientColour: 0x93807a,
    ambientIntensity: 1.05,
    skyColour: 0x272320,
  },
  {
    hour: 22,
    sunColour: 0x96a6d3,
    sunIntensity: 1.42,
    ambientColour: 0x7079a2,
    ambientIntensity: 1.36,
    skyColour: 0x10141e,
  },
  {
    hour: 24,
    sunColour: 0x93a6d4,
    sunIntensity: 1.35,
    ambientColour: 0x6a7aa6,
    ambientIntensity: 1.3,
    skyColour: 0x0d1119,
  },
];

/** How far off the world the light is put. Only its direction matters. */
const LIGHT_DISTANCE_METRES = 60;

/**
 * How high the light is allowed to get, and how low it may fall.
 *
 * Never at the horizon: a light lying flat catches the sides of things and
 * leaves the ground unlit, which read as broken rather than as dusk. And never
 * overhead either, however much noon would like it to be — straight down lights
 * roofs and the tops of walls and leaves every wall face black, which is most
 * of what this camera looks at.
 */
const LOWEST_LIGHT = 0.3;
const HIGHEST_LIGHT = 0.75;

/**
 * How far the light stands to the south of the world, whatever the hour.
 *
 * Keeps a face of every building lit even at noon, and keeps that face the same
 * one all day — the sun is not allowed to swing round with the camera.
 */
const SOUTHWARD = 0.5;

export interface Daylight {
  readonly group: Group;

  /** Where the world is in its day, from 0 at midnight to 1 at the next. */
  setTimeOfDay(timeOfDay: number): void;
}

export function createDaylight(scene: Scene): Daylight {
  const group = new Group();

  const ambient = new AmbientLight(0xffffff, 1);
  const sun = new DirectionalLight(0xffffff, 1);
  group.add(ambient, sun);

  const sunColour = new Color();
  const ambientColour = new Color();
  const skyColour = new Color();

  function setTimeOfDay(timeOfDay: number): void {
    const hour = ((timeOfDay % 1) + 1) % 1 * 24;
    const [before, after, mix] = surrounding(hour);

    sun.color.copy(blend(sunColour, before.sunColour, after.sunColour, mix));
    sun.intensity = before.sunIntensity + (after.sunIntensity - before.sunIntensity) * mix;
    ambient.color.copy(blend(ambientColour, before.ambientColour, after.ambientColour, mix));
    ambient.intensity =
      before.ambientIntensity + (after.ambientIntensity - before.ambientIntensity) * mix;
    scene.background = blend(skyColour, before.skyColour, after.skyColour, mix).clone();

    // Six in the morning is due east, noon overhead, six in the evening due
    // west. Past dusk the same arc runs on and becomes the moon's, which is
    // near enough for a sky nobody can look up at.
    const alongTheDay = (hour / 24 - 0.25) * Math.PI * 2;
    const height = LOWEST_LIGHT + (HIGHEST_LIGHT - LOWEST_LIGHT) * Math.abs(Math.sin(alongTheDay));
    sun.position.set(
      Math.cos(alongTheDay) * LIGHT_DISTANCE_METRES,
      height * LIGHT_DISTANCE_METRES,
      SOUTHWARD * LIGHT_DISTANCE_METRES,
    );
  }

  setTimeOfDay(0.5);

  return { group, setTimeOfDay };
}

/** The two entries an hour falls between, and how far it is between them. */
function surrounding(hour: number): [SkyAtHour, SkyAtHour, number] {
  for (let index = 1; index < SKY.length; index += 1) {
    const after = SKY[index];
    if (hour <= after.hour) {
      const before = SKY[index - 1];
      const span = after.hour - before.hour;
      return [before, after, span === 0 ? 0 : (hour - before.hour) / span];
    }
  }
  const last = SKY[SKY.length - 1];
  return [last, last, 0];
}

function blend(into: Color, from: number, to: number, mix: number): Color {
  return into.setHex(from).lerp(new Color(to), mix);
}
