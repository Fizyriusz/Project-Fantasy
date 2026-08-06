import { DEFAULT_TUNING, SLIDERS, type TuningValues } from './tuningValues';

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
    interpolationInput.checked = values.interpolation;
    announce();
  });
  header.append(title, reset);

  const body = element('div', 'tuning-body');

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
    body.append(row);
  }

  const interpolationRow = element('label', 'tuning-row tuning-toggle');
  const interpolationCaption = element('span', 'tuning-caption');
  const interpolationReadout = element('span', 'tuning-readout');
  const interpolationInput = element('input');
  interpolationInput.type = 'checkbox';
  interpolationInput.checked = values.interpolation;

  const refreshInterpolation = (): void => {
    interpolationCaption.textContent = 'Interpolacja';
    interpolationReadout.textContent =
      values.interpolation === DEFAULT_TUNING.interpolation
        ? values.interpolation
          ? 'włączona'
          : 'wyłączona'
        : `${values.interpolation ? 'włączona' : 'wyłączona'}  (było ${
            DEFAULT_TUNING.interpolation ? 'włączona' : 'wyłączona'
          })`;
    interpolationReadout.classList.toggle(
      'tuning-changed',
      values.interpolation !== DEFAULT_TUNING.interpolation,
    );
  };

  interpolationInput.addEventListener('change', () => {
    values.interpolation = interpolationInput.checked;
    announce();
  });

  rows.push(refreshInterpolation);
  interpolationRow.append(interpolationCaption, interpolationInput, interpolationReadout);
  body.append(interpolationRow);

  // Collapsed out of the way for judging feel, because a panel in the corner
  // of the eye is itself a distraction.
  title.addEventListener('click', () => {
    host.classList.toggle('tuning-collapsed');
  });

  host.append(header, body);
  announce();
}
