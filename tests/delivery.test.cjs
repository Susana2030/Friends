const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'personajes.html', 'temporadas.html', 'galeria.html', 'quiz.html', 'contacto.html'];

test('delivery: six pages have valid local resources, anchors and unique IDs', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, page + ': unique IDs');
    assert.match(html, /name="viewport"/);
    assert.equal((html.match(/id="audio-toggle"/g) || []).length, 1);
    const nav = html.match(/<nav\b[\s\S]*?<\/nav>/)[0];
    assert.doesNotMatch(nav, />Contacto<|cafe\.html/);
    assert.match(nav, /class="cafe-nav-link" href="contacto.html#formulario"/);
    for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(https?:|data:)/.test(value)) continue;
      const [file, hash] = value.split('#');
      const resolved = path.join(root, decodeURIComponent(file || page));
      assert.ok(fs.existsSync(resolved), page + ': missing ' + value);
      if (hash && resolved.endsWith('.html')) {
        assert.ok(fs.readFileSync(resolved, 'utf8').includes('id="' + hash + '"'), page + ': missing anchor ' + value);
      }
    }
    const stack = [], voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
    for (const match of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(\/?)([a-z][\w:-]*)\b[^>]*>/gi)) {
      const tag = match[2].toLowerCase();
      if (voids.has(tag) || /\/\s*>$/.test(match[0])) continue;
      if (match[1]) assert.equal(stack.pop(), tag, page + ': tag nesting');
      else stack.push(tag);
    }
    assert.equal(stack.length, 0, page + ': unclosed elements');
  }
});

test('delivery: all runtime modules parse and season videos are retained', () => {
  for (const name of fs.readdirSync(path.join(root, 'js'))) {
    if (name.endsWith('.js')) new vm.Script(fs.readFileSync(path.join(root, 'js', name), 'utf8'), { filename: name });
  }
  const seasons = fs.readFileSync(path.join(root, 'temporadas.html'), 'utf8');
  assert.equal((seasons.match(/class="season-video-link"/g) || []).length, 10);
});
