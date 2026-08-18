import {
  DEFAULT_TUNING,
  GROUPS,
  SLIDERS,
  TOGGLES,
  type TuningGroup,
  type TuningToggleKey,
  type TuningValues,
} from './tuningValues';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const created = document.createElement(tag);
  if (className !== undefined) {
    created.className = className;
  }
  return created;
}

/**
 * A development panel for feeling out numbers, not a game menu.
 *
 * Every control shows the value in force and, when it differs, the value it
 * started as. Nothing here is discoverable by design: it is meant to be read
 * at a glance while walking around.
 */
export function createTuningPanel(
  host: HTMLElement,
  values: TuningValues,
  onChange: (values: TuningValues) => void,
): void {
  const rows: Array<() => void> = [];

  function announce(): void {
    for (const refresh of rows) {
      refresh();
    }
    onChange(values);
  }

  const header = element('div', 'tuning-header');
  const title = element('span');
  title.textContent = 'strojenie';
  const reset = element('button');
  reset.type = 'button';
  reset.textContent = 'reset';
  reset.addEventListener('click', () => {
    Object.assign(values, DEFAULT_TUNING);
    for (const slider of body.querySelectorAll('input[type=range]')) {
      const input = slider as HTMLInputElement;
      const key = input.dataset['key'] as keyof TuningValues | undefined;
      if (key !== undefined) {
        input.value = String(values[key]);
      }
    }
    for (const checkbox of checkboxes) {
      const key = checkbox.dataset['key'] as TuningToggleKey | undefined;
      if (key !== undefined) {
        checkbox.checked = values[key];
      }
    }
    announce();
  });
  header.append(title, reset);

  const body = element('div', 'tuning-body');

  /**
   * One drawer per group, opened by clicking its heading.
   *
   * All shut to begin with. With five groups open at once the panel is longer
   * than the window, and the point of it is to be glanceable while walking
   * about, not to be scrolled.
   */
  const drawers = new Map<TuningGroup, HTMLElement>();

  for (const group of GROUPS) {
    const drawer = element('div', 'tuning-group tuning-shut');
    const heading = element('div', 'tuning-group-heading');
    heading.textContent = group.label;
    const contents = element('div', 'tuning-group-body');

    heading.addEventListener('click', () => {
      drawer.classList.toggle('tuning-shut');
    });

    drawer.append(heading, contents);
    body.append(drawer);
    drawers.set(group.key, contents);
  }

  function drawerFor(group: TuningGroup): HTMLElement {
    const found = drawers.get(group);
    if (found === undefined) {
      throw new Error(`Tuning group '${group}' has no drawer`);
    }
    return found;
  }

  for (const definition of SLIDERS) {
    const row = element('label', 'tuning-row');

    const caption = element('span', 'tuning-caption');
    const readout = element('span', 'tuning-readout');

    const input = element('input');
    input.type = 'range';
    input.min = String(definition.min);
    input.max = String(definition.max);
    input.step = String(definition.step);
    input.value = String(values[definition.key]);
    input.dataset['key'] = definition.key;

    const refresh = (): void => {
      const current = values[definition.key];
      const original = DEFAULT_TUNING[definition.key];
      caption.textContent = definition.label;
      readout.textContent =
        current === original
          ? `${current} ${definition.unit}`
          : `${current} ${definition.unit}  (było ${original})`;
      readout.classList.toggle('tuning-changed', current !== original);
    };

    input.addEventListener('input', () => {
      values[definition.key] = Number(input.value);
      announce();
    });

    rows.push(refresh);
    row.append(caption, input, readout);
    drawerFor(definition.group).append(row);
  }

  const checkboxes: HTMLInputElement[] = [];

  for (const definition of TOGGLES) {
    const row = element('label', 'tuning-row tuning-toggle');
    const caption = element('span', 'tuning-caption');
    const readout = element('span', 'tuning-readout');

    const input = element('input');
    input.type = 'checkbox';
    input.checked = values[definition.key];
    input.dataset['key'] = definition.key;
    checkboxes.push(input);

    const word = (on: boolean): string => (on ? definition.whenOn : definition.whenOff);

    const refresh = (): void => {
      const current = values[definition.key];
      const original = DEFAULT_TUNING[definition.key];
      caption.textContent = definition.label;
      readout.textContent =
        current === original ? word(current) : `${word(current)}  (było ${word(original)})`;
      readout.classList.toggle('tuning-changed', current !== original);
    };

    input.addEventListener('change', () => {
      values[definition.key] = input.checked;
      announce();
    });

    rows.push(refresh);
    row.append(caption, input, readout);
    drawerFor(definition.group).append(row);
  }

  // Collapsed out of the way for judging feel, because a panel in the corner
  // of the eye is itself a distraction.
  title.addEventListener('click', () => {
    host.classList.toggle('tuning-collapsed');
  });

  host.append(header, body);
  announce();
}
