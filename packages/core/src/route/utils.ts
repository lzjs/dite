import path from 'path';

const escapeStart = '[';
const escapeEnd = ']';

// TODO: Cleanup and write some tests for this function
export function createRoutePath(partialRouteId: string): string | undefined {
  let result = '';
  let rawSegmentBuffer = '';

  let inEscapeSequence = 0;
  let skipSegment = false;
  for (let i = 0; i < partialRouteId.length; i++) {
    const char = partialRouteId.charAt(i);
    const lastChar = i > 0 ? partialRouteId.charAt(i - 1) : undefined;
    const nextChar =
      i < partialRouteId.length - 1 ? partialRouteId.charAt(i + 1) : undefined;

    const isNewEscapeSequence = () => {
      return (
        !inEscapeSequence && char === escapeStart && lastChar !== escapeStart
      );
    };

    const isCloseEscapeSequence = () => {
      return inEscapeSequence && char === escapeEnd && nextChar !== escapeEnd;
    };

    const isStartOfLayoutSegment = () =>
      char === '_' && nextChar === '_' && !rawSegmentBuffer;

    if (skipSegment) {
      if (char === '/' || char === '.' || char === path.win32.sep) {
        skipSegment = false;
      }
      continue;
    }

    if (isNewEscapeSequence()) {
      inEscapeSequence++;
      continue;
    }

    if (isCloseEscapeSequence()) {
      inEscapeSequence--;
      continue;
    }

    if (inEscapeSequence) {
      result += char;
      continue;
    }

    if (char === '/' || char === path.win32.sep || char === '.') {
      if (rawSegmentBuffer === 'index' && result.endsWith('index')) {
        result = result.replace(/\/?index$/, '');
      } else {
        result += '/';
      }
      rawSegmentBuffer = '';
      continue;
    }

    if (isStartOfLayoutSegment()) {
      skipSegment = true;
      continue;
    }

    rawSegmentBuffer += char;

    if (char === '$') {
      result += typeof nextChar === 'undefined' ? '*' : ':';
      continue;
    }

    result += char;
  }

  if (rawSegmentBuffer === 'index' && result.endsWith('index')) {
    result = result.replace(/\/?index$/, '');
  }

  return result || undefined;
}

export function findParentRouteId(
  routeIds: string[],
  childRouteId: string,
): string | undefined {
  return routeIds.find((id) => childRouteId.startsWith(`${id}/`));
}

export function createRouteId(file: string) {
  return normalizeSlashes(stripFileExtension(file));
}

export function normalizeSlashes(file: string) {
  return file.split(path.win32.sep).join('/');
}

function stripFileExtension(file: string) {
  return file.replace(/\.[a-z\d]+$/i, '');
}

export function createRouteRegex(routePath: string) {
  const dyPaths = routePath.split('/');
  const paths = dyPaths.filter(Boolean).map((p) => {
    if (p.startsWith(':')) {
      return '([^/]+?)';
    }
    return p;
  });
  return '^' + path.join('/', ...paths) + '(?:/)?$';
}
