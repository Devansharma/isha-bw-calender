const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'supabase', 'schema.sql'), 'utf8');
const categoryRepairSql = fs.readFileSync(path.join(root, 'supabase', 'repair-category-constraint.sql'), 'utf8');

test('starts in dark mode and includes the official local logo', () => {
  assert.match(html, /<body class="dark">/);
  assert.match(html, /<img src="images\/logo\.jpg" alt="Isha Foundation logo"/);
  assert.match(html, /Isha <b>Banaswadi<\/b>/);
});

test('keeps removed controls out of the visible app shell', () => {
  assert.doesNotMatch(html, />\s*Share\s*</i);
  assert.doesNotMatch(html, /My schedule/i);
  assert.doesNotMatch(html, /Notifications/i);
  assert.doesNotMatch(html, /Programs team/i);
});

test('renders fixed month navigation and month or agenda view controls', () => {
  assert.match(html, /id="prevMonth"/);
  assert.match(html, /id="todayBtn"/);
  assert.match(html, /id="nextMonth"/);
  assert.match(html, /id="monthYearDisplay"/);
  assert.match(html, /data-view="month"/);
  assert.match(html, /data-view="agenda"/);
  assert.match(html, /\.calendar-header\{display:grid;grid-template-columns:minmax\(0,1fr\) 270px/);
  assert.match(html, /\.view-controls\{justify-content:flex-end;min-width:270px;flex-shrink:0\}/);
});

test('keeps quick filters available with matching app handlers', () => {
  assert.match(html, /data-quick-filter="all">All events/);
  assert.match(html, /data-quick-filter="upcoming">Upcoming/);
  assert.match(html, /data-quick-filter="week">This week/);
  assert.match(app, /document\.querySelectorAll\('\[data-quick-filter\]'\)/);
  assert.match(app, /quickFilterTarget\(filteredEvents\(\), quickFilter, today\)/);
});

test('creation form requires only the compulsory event fields plus category and created by', () => {
  assert.match(html, /<input id="title" required/);
  assert.match(html, /<input id="startDate" type="date" required/);
  assert.match(html, /<input id="endDate" type="date" required/);
  assert.match(html, /<select id="category" required>/);
  assert.match(html, /<input id="createdBy" required/);
  assert.doesNotMatch(html, /id="time"/);
  assert.match(html, /Location <span class="optional">\(optional\)<\/span><input id="location"/);
  assert.match(html, /Notes <span class="optional">\(optional\)<\/span><textarea id="notes"/);
});

test('creation form exposes the allowed program categories and no lunar category', () => {
  for (const category of ['Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Others']) {
    assert.match(html, new RegExp(`<option>${category}</option>`));
    assert.match(html, new RegExp(`data-filter="${category}"`));
  }
  assert.doesNotMatch(html, /Guru Pooja/);
  assert.doesNotMatch(html, /<option>Lunar Observance<\/option>/);
});

test('event status, dashboard, upcoming panel, and hover tooltip are wired', () => {
  for (const status of ['Draft', 'Confirmed', 'Cancelled', 'Completed']) {
    assert.match(html, new RegExp(`<option>${status}</option>`));
  }
  assert.match(html, /id="dashboardBtn"/);
  assert.match(html, /id="dashboardStats"/);
  assert.match(html, /id="upcomingEvents"/);
  assert.match(html, /id="mobileUpcomingBtn"/);
  assert.match(html, /id="mobileUpcomingEvents"/);
  assert.match(html, /id="eventTooltip" role="tooltip"/);
  assert.match(app, /showTooltip/);
});

test('mobile layout can open and close the sidebar and has a floating create button', () => {
  assert.match(html, /id="menuBtn"/);
  assert.match(html, /id="closeMenu"/);
  assert.match(html, /id="mobileCreateBtn"/);
  assert.match(html, /id="mobileUpcomingModal"/);
  assert.match(html, /@media\(max-width:800px\)\{\.close-sidebar\{display:block\}\}/);
  assert.match(app, /\$\(\'#menuBtn\'\)\.onclick = \(\) => \$\(\'#sidebar\'\)\.classList\.toggle\(\'open\'\)/);
  assert.match(app, /\$\(\'#closeMenu\'\)\.onclick = \(\) => \$\(\'#sidebar\'\)\.classList\.remove\(\'open\'\)/);
  assert.match(app, /\$\(\'#mobileUpcomingBtn\'\)\.onclick = \(\) => \$\(\'#mobileUpcomingModal\'\)\.classList\.add\(\'open\'\)/);
  assert.match(app, /\$\(\'#mobileUpcomingEvents\'\)\.addEventListener\('click'/);
});

test('responsive CSS prevents full-page scrolling and supports compact screens', () => {
  assert.match(html, /html,body\{width:100%;height:100%;overflow:hidden\}/);
  assert.match(html, /\.app-shell\{height:100dvh;min-height:0\}/);
  assert.match(html, /\.calendar-grid\{flex:1;min-height:0;grid-template-rows:37px repeat\(6,minmax\(0,1fr\)\);overflow:hidden\}/);
  assert.match(html, /@media\(max-width:1050px\)\{\.calendar-layout\{grid-template-columns:1fr\}\.schedule-panel\{display:none\}\}/);
  assert.match(html, /@media\(max-width:1050px\)\{\.mobile-upcoming-btn\{display:inline-flex;align-items:center\}\}/);
  assert.match(html, /@media\(max-width:800px\)/);
  assert.match(html, /@media\(max-height:680px\) and \(min-width:801px\)/);
});

test('past and other-month date UI is intentionally non-interactive', () => {
  assert.match(html, /\.past-date\{/);
  assert.match(html, /\.blank-day\{cursor:default;pointer-events:none\}/);
  assert.match(app, /const dateAttribute = cell\.canCreate \? `data-date="\$\{key\}"` : ''/);
});

test('crowded date cells expose every event through a clear day list modal', () => {
  assert.match(app, /const maxEventsPerDayCell = 3/);
  assert.match(app, /dayEvents\.length > 1 \? dayEvents\.slice\(0, 1\) : dayEvents\.slice\(0, maxEventsPerDayCell\)/);
  assert.match(app, /dayEvents\.length > 1 \? `<button class="more-event"/);
  assert.match(app, /View all \$\{dayEvents\.length\} programs/);
  assert.match(app, /function openDayModal\(day\)/);
  assert.match(html, /id="dayModal"/);
  assert.match(html, /id="dayEventList"/);
  assert.match(html, /\.day-cell\{display:grid;grid-template-rows:auto minmax\(0,1fr\);gap:5px\}/);
  assert.match(html, /\.events\{min-height:0;margin-top:0;overflow:hidden/);
  assert.match(html, /\.more-event\{display:block;width:100%;border:0;background:transparent/);
  assert.match(html, /\.day-event-list\{display:grid;gap:9px;max-height:min\(58dvh,430px\);overflow:auto/);
  assert.match(html, /\.event\{height:auto!important;min-height:19px/);
  assert.match(html, /@media\(max-width:500px\)\{\.event\{min-height:14px;font-size:8px!important/);
});

test('Supabase anonymous shared calendar wiring and schema cover current fields', () => {
  assert.match(html, /@supabase\/supabase-js@2/);
  assert.match(html, /supabase-config\.js/);
  for (const column of ['start_date', 'end_date', 'category', 'status', 'created_by', 'location', 'notes']) {
    assert.match(schema, new RegExp(column));
  }
  assert.match(schema, /enable row level security/);
  assert.match(schema, /for insert/);
  assert.match(schema, /for update/);
  assert.match(schema, /for delete/);
});

test('Supabase category repair script matches the app categories', () => {
  assert.match(categoryRepairSql, /drop constraint if exists events_category_check/);
  assert.match(categoryRepairSql, /add constraint events_category_check/);
  for (const category of ['Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Others']) {
    assert.match(categoryRepairSql, new RegExp(`'${category}'`));
  }
  assert.match(categoryRepairSql, /where category = 'Guru Pooja'/);
  assert.match(categoryRepairSql, /where category = 'Lunar Observance'/);
});
