import { NestedPath, isNestedPath } from '../lib/group-paths-recursive';
import { Path } from '../lib/query-types';

export const DEDUPE_ALIAS_PREFIX = 'd';

export const dedupeGroupedPathsRecursive = (
  grouped: (Path | NestedPath)[],
): (Path | NestedPath)[] => {
  const dedupeCounters = new Map<string, number>();

  return grouped.map((p, idx, a) => {
    if (!isNestedPath(p)) return p;

    // dedupe current nested path if there is another path with the same `path`
    if (a.some((i, itemIdx) => i.path === p.path && idx !== itemIdx)) {
      const counter = dedupeCounters.get(p.path) || 0;
      dedupeCounters.set(p.path, counter + 1);
      const alias = [DEDUPE_ALIAS_PREFIX, counter, p.path].join('_');
      return {
        ...p,
        alias,
        declaration: `${alias}:${p.declaration}`,
        paths: dedupeGroupedPathsRecursive(p.paths),
      };
    }

    return {
      ...p,
      paths: dedupeGroupedPathsRecursive(p.paths),
    };
  });
};
