import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Render the existing global-component page with lightweight hook/UI stubs.
// The callbacks and async save lifecycle run unchanged from the production JSX.
function harness({ type = null, onSave = async () => {}, loadCategories = async () => ({ data: [{ id: 7, name: 'Engineering' }] }) } = {}) {
  const states = [];
  let cursor = 0;
  let mounted = false;
  let effects = [];
  const component = name => Object.assign(() => {}, { displayName: name });
  const window = {
    PulseUI: Object.fromEntries(['Icon','Avatar','Pill','Button','Card','Skeleton'].map(n => [n, component(n)])),
    PulseForm: Object.fromEntries(['Field','Input','Textarea','Select','Checkbox','Toggle'].map(n => [n, component(n)])),
    PulseOverlay: Object.fromEntries(['Drawer','Dropdown','DropdownItem','DropdownDivider','ConfirmDialog'].map(n => [n, component(n)])),
    PulseLayout: { PageHeader: component('PageHeader'), Tabs: component('Tabs') },
    PulseAPI: { Categories: { list: loadCategories } },
  };
  window.PulseUI.TOKENS = {};
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: 'fragment',
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect(effect) { if (!mounted) effects.push(effect); },
    useMemo: fn => fn(),
  };
  const source = readFileSync(new URL('../src/components/pages/AdminPages.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS } }).outputText;
  const context = vm.createContext({ window, React: react, exports: {}, require: () => react });
  vm.runInContext(code, context);
  function render() {
    cursor = 0;
    const tree = context.TypeDrawer({ type, onSave, onClose() {} });
    for (const effect of effects) effect();
    effects = [];
    mounted = true;
    return tree;
  }
  const fields = tree => tree.props.children.flat(Infinity).filter(n => n?.type?.displayName === 'Field');
  return {
    render,
    field: (tree, label) => fields(tree).find(n => n.props.label === label),
    control: (tree, label) => fields(tree).find(n => n.props.label === label).props.children[0],
    submit: tree => tree.props.footer.props.children[1].props.onClick(),
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('create loads categories and sends the backend severity and category fields', async () => {
  let payload;
  const h = harness({ onSave: async data => { payload = data; } });
  let tree = h.render();
  await tick();
  tree = h.render();
  assert.equal(h.control(tree, 'Category').props.options[0].value, 7);
  assert.deepEqual(Array.from(h.control(tree, 'Default severity').props.options), ['critical','high','medium','low']);
  h.control(tree, 'Name').props.onChange('  Air conditioning  ');
  h.control(tree, 'Category').props.onChange('7');
  h.control(tree, 'Default severity').props.onChange('critical');
  await h.submit(h.render());
  assert.equal(payload.name, 'Air conditioning');
  assert.equal(payload.issue_category_id, 7);
  assert.equal(payload.default_severity, 'critical');
  assert.equal('category' in payload, false);
});

test('edit preserves a category foreign key and permits clearing optional defaults', async () => {
  let payload;
  const h = harness({ type: { name: 'Noise', issue_category_id: 7, default_severity: 'critical', is_active: false }, onSave: async data => { payload = data; } });
  let tree = h.render();
  assert.equal(h.control(tree, 'Category').props.value, 7);
  assert.equal(h.control(tree, 'Default severity').props.value, 'critical');
  h.control(tree, 'Category').props.onChange('');
  h.control(tree, 'Default severity').props.onChange('');
  await h.submit(h.render());
  assert.equal(payload.issue_category_id, null);
  assert.equal(payload.default_severity, null);
  assert.equal(payload.is_active, false);
});

test('failed saves display field errors and allow retry without an unhandled rejection', async () => {
  let reject;
  let calls = 0;
  const h = harness({ onSave: () => { calls++; return new Promise((_, r) => { reject = r; }); } });
  let tree = h.render();
  h.control(tree, 'Name').props.onChange('Noise');
  const pending = h.submit(h.render());
  tree = h.render();
  assert.equal(tree.props.footer.props.children[1].props.disabled, true);
  await h.submit(tree);
  assert.equal(calls, 1);
  reject({ message: 'Validation failed', errors: { default_severity: ['The selected default severity is invalid.'] } });
  await pending;
  tree = h.render();
  assert.equal(h.field(tree, 'Default severity').props.error, 'The selected default severity is invalid.');
  assert.equal(tree.props.footer.props.children[1].props.disabled, false);
});

test('category load failures are shown and invalid names or severity prevent saving', async () => {
  let calls = 0;
  const h = harness({ onSave: async () => { calls++; }, loadCategories: async () => { throw new Error('Unavailable'); } });
  h.render();
  await tick();
  let tree = h.render();
  assert.match(h.field(tree, 'Category').props.error, /Could not load categories/);
  await h.submit(tree);
  assert.equal(calls, 0);
  h.control(tree, 'Name').props.onChange('Noise');
  h.control(tree, 'Default severity').props.onChange('urgent');
  await h.submit(h.render());
  assert.equal(calls, 0);
  assert.match(h.field(h.render(), 'Default severity').props.error, /valid severity/);
});
