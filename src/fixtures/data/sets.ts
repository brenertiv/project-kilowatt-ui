/**
 * Named sample sets. Each entity exposes the same set names so a fixture can
 * offer them in one dropdown and every component state is one choice away.
 */
export type SampleSets<T> = {
  /** Nothing to show. */
  none: T[];
  /** A single record. */
  one: T[];
  /** Enough to see a list, not enough to page. */
  few: T[];
  /** One full page. */
  page: T[];
  /** Everything the sample portfolio holds. */
  all: T[];
  /** Optional fields missing, to exercise em dashes and hidden rows. */
  sparse: T[];
  /** Long names and descriptions, to exercise truncation and wrapping. */
  long: T[];
  /** Records the way bad data arrives: placeholder names such as `???` and `0`, empty descriptions. */
  placeholder: T[];
};

export const sampleSetNames = ['none', 'one', 'few', 'page', 'all', 'sparse', 'long', 'placeholder'] as const;

export type SampleSetName = (typeof sampleSetNames)[number];

export const pageSize = 25;

export function makeSets<T>(
  all: T[],
  shape: {
    sparse: (record: T, index: number) => T;
    long: (record: T, index: number) => T;
    placeholder: (record: T, index: number) => T;
  },
): SampleSets<T> {
  return {
    none: [],
    one: all.slice(0, 1),
    few: all.slice(0, 5),
    page: all.slice(0, pageSize),
    all,
    sparse: all.slice(0, 6).map(shape.sparse),
    long: all.slice(0, 4).map(shape.long),
    placeholder: all.slice(0, 6).map(shape.placeholder),
  };
}
