export type TsOutcome = { ok: true; value: string } | { ok: false; message: string };

// Inferred shape of a JSON value. `obj` keeps properties in a Map so a key such as "__proto__" stays data.
type Shape =
  | { kind: 'prim'; name: 'string' | 'number' | 'boolean' | 'null' }
  | { kind: 'obj'; props: Map<string, { shape: Shape; optional: boolean }> }
  | { kind: 'arr'; element: Shape | undefined }
  | { kind: 'union'; members: Shape[] };

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
// Names that cannot be declared as an interface/type name.
const RESERVED = new Set([
  'any', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if',
  'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'never', 'new', 'null', 'number',
  'object', 'package', 'private', 'protected', 'public', 'return', 'static', 'string', 'super',
  'switch', 'symbol', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'unknown', 'var',
  'void', 'while', 'with', 'yield',
]); // prettier-ignore

/** Why a name cannot be used as the root type name, or `undefined` if it is fine. */
export function validateTypeName(name: string): string | undefined {
  if (name === '') return 'Enter a name for the root type.';
  if (!IDENTIFIER.test(name)) {
    return 'Use letters, digits, _ or $ only, and do not start with a digit.';
  }
  if (RESERVED.has(name)) return `"${name}" is a reserved word. Choose another name.`;
  return undefined;
}

function inferShape(value: unknown): Shape {
  if (value === null) return { kind: 'prim', name: 'null' };
  if (typeof value === 'string') return { kind: 'prim', name: 'string' };
  if (typeof value === 'number') return { kind: 'prim', name: 'number' };
  if (typeof value === 'boolean') return { kind: 'prim', name: 'boolean' };
  if (Array.isArray(value)) {
    let element: Shape | undefined;
    for (const item of value as unknown[]) {
      const shape = inferShape(item);
      element = element ? mergeShapes(element, shape) : shape;
    }
    return { kind: 'arr', element };
  }
  const props = new Map<string, { shape: Shape; optional: boolean }>();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    props.set(key, { shape: inferShape(child), optional: false });
  }
  return { kind: 'obj', props };
}

function members(shape: Shape): Shape[] {
  return shape.kind === 'union' ? shape.members : [shape];
}

/** Combines two shapes: objects merge (a key missing from one side becomes optional), the rest form a union. */
function mergeShapes(a: Shape, b: Shape): Shape {
  const out: Shape[] = [];
  let object: Extract<Shape, { kind: 'obj' }> | undefined;
  let array: Extract<Shape, { kind: 'arr' }> | undefined;

  for (const member of [...members(a), ...members(b)]) {
    if (member.kind === 'obj') {
      if (!object) {
        object = { kind: 'obj', props: new Map(member.props) };
        out.push(object);
        continue;
      }
      const merged = new Map(object.props);
      for (const [key, prop] of member.props) {
        const existing = merged.get(key);
        merged.set(
          key,
          existing
            ? {
                shape: mergeShapes(existing.shape, prop.shape),
                optional: existing.optional || prop.optional,
              }
            : { shape: prop.shape, optional: true },
        );
      }
      for (const [key, prop] of object.props) {
        if (!member.props.has(key)) merged.set(key, { ...prop, optional: true });
      }
      object.props = merged;
    } else if (member.kind === 'arr') {
      if (!array) {
        array = { kind: 'arr', element: member.element };
        out.push(array);
      } else if (member.element) {
        array.element = array.element ? mergeShapes(array.element, member.element) : member.element;
      }
    } else if (
      member.kind === 'prim' &&
      !out.some((m) => m.kind === 'prim' && m.name === member.name)
    ) {
      out.push(member);
    }
  }
  return out.length === 1 ? (out[0] as Shape) : { kind: 'union', members: out };
}

function pascalCase(key: string): string {
  const words = key.match(/[A-Za-z0-9]+/g) ?? [];
  const name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  if (name === '') return 'Item';
  return /^[0-9]/.test(name) ? `_${name}` : name;
}

function propertyKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

/**
 * Generates TypeScript declarations from a JSON sample. The JSON is parsed with `JSON.parse` and only
 * inspected as data; the output is plain text and is never evaluated.
 */
export function jsonToTypeScript(input: string, rootName: string): TsOutcome {
  const nameProblem = validateTypeName(rootName);
  if (nameProblem) return { ok: false, message: nameProblem };
  if (input.trim() === '') return { ok: false, message: 'Enter some JSON to convert.' };

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'The input is not valid JSON.',
    };
  }

  const declarations: (string | null)[] = [];
  const nameByBody = new Map<string, string>();
  const used = new Set<string>([rootName]);

  const uniqueName = (base: string): string => {
    let name = base;
    for (let n = 2; used.has(name) || RESERVED.has(name); n += 1) name = `${base}${n}`;
    used.add(name);
    return name;
  };

  // Renders a shape as a type expression; objects become named interfaces (identical bodies are reused).
  const render = (shape: Shape, hint: string, forcedName?: string): string => {
    switch (shape.kind) {
      case 'prim':
        return shape.name;
      case 'arr': {
        if (!shape.element) return 'unknown[]';
        const inner = render(shape.element, `${hint}Item`);
        return shape.element.kind === 'union' ? `(${inner})[]` : `${inner}[]`;
      }
      case 'union': {
        // Keep `null` last so `string | null` reads naturally.
        const sorted = [...shape.members].sort((x, y) => Number(isNull(x)) - Number(isNull(y)));
        return sorted.map((m) => render(m, hint)).join(' | ');
      }
      case 'obj': {
        const slot = declarations.length;
        declarations.push(null);
        const lines = [...shape.props].map(
          ([key, prop]) =>
            `  ${propertyKey(key)}${prop.optional ? '?' : ''}: ${render(prop.shape, pascalCase(key))};`,
        );
        const body = lines.length > 0 ? `{\n${lines.join('\n')}\n}` : '{}';
        const existing = forcedName ? undefined : nameByBody.get(body);
        if (existing) return existing;
        const name = forcedName ?? uniqueName(hint);
        nameByBody.set(body, name);
        declarations[slot] = `export interface ${name} ${body}`;
        return name;
      }
    }
  };

  const root = inferShape(data);
  if (root.kind === 'obj') {
    render(root, rootName, rootName);
  } else {
    const expression = render(root, rootName);
    declarations.unshift(`export type ${rootName} = ${expression};`);
  }
  return { ok: true, value: declarations.filter((d): d is string => d !== null).join('\n\n') };
}

function isNull(shape: Shape): boolean {
  return shape.kind === 'prim' && shape.name === 'null';
}
