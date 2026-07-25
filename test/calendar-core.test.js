const test = require('node:test');
const assert = require('node:assert/strict');
const {
  permittedCategories,
  normalizeEvent,
  occursOn,
  currentDateKey,
  addDays,
  slug,
  validateEvent,
  databaseEvent,
  calendarEvent,
  filterEvents,
  monthRange,
  monthEvents,
  calendarCells,
  nextEventSummary,
  dashboardSummary,
  modalDefaults,
  formatEventDate,
  tooltipDetails,
  quickFilterTarget
} = require('../calendar-core.js');

const validEvent = {
  id: 'test-1', title: 'Inner Engineering Total', startDate: '2026-07-03', endDate: '2026-07-06',
  category: 'Inner Engineering', status: 'Confirmed', createdBy: 'Program team', location: 'Banaswadi', notes: 'Test event'
};

const eventSet = [
  {...validEvent},
  {id:'test-2', title:'Surya Kriya', startDate:'2026-07-25', endDate:'2026-07-25', category:'Hatha Yoga', status:'Draft', createdBy:'Anand', location:'Banaswadi', notes:''},
  {id:'test-3', title:'Samyama Sadhana', startDate:'2026-07-28', endDate:'2026-08-02', category:'Advanced Isha Programs', status:'Confirmed', createdBy:'Team', location:'', notes:'Bring mats'},
  {id:'test-4', title:'Volunteer Meet', startDate:'2026-08-08', endDate:'2026-08-08', category:'Others', status:'Cancelled', createdBy:'Team', location:'Online', notes:''},
  {id:'test-5', title:'Official Satsang', startDate:'2026-08-10', endDate:'2026-08-10', category:'Isha Official Program', status:'Completed', createdBy:'Team', location:'Banaswadi', notes:''},
  {id:'lunar-1', title:'Purnima', startDate:'2026-07-29', endDate:'2026-07-29', category:'Lunar Observance', status:'Draft', createdBy:'Isha', location:'', notes:''}
];

test('keeps the allowed program categories in sync with the creation form', () => {
  assert.deepEqual(permittedCategories.filter(category => category !== 'Lunar Observance'), [
    'Inner Engineering',
    'Hatha Yoga',
    'Advanced Isha Programs',
    'Isha Official Program',
    'Others'
  ]);
});

test('shows a multi-day event on every date in its range', () => {
  assert.equal(occursOn(validEvent, '2026-07-03'), true);
  assert.equal(occursOn(validEvent, '2026-07-05'), true);
  assert.equal(occursOn(validEvent, '2026-07-06'), true);
  assert.equal(occursOn(validEvent, '2026-07-02'), false);
  assert.equal(occursOn(validEvent, '2026-07-07'), false);
});

test('normalizes legacy events and unknown categories safely', () => {
  const event = normalizeEvent({id: 'legacy-1', date: '2026-07-10', category: 'Guru Pooja'});
  assert.equal(event.category, 'Advanced Isha Programs');
  assert.equal(event.startDate, '2026-07-10');
  assert.equal(event.endDate, '2026-07-10');
  assert.equal(event.status, 'Draft');
  assert.equal(normalizeEvent({id:'odd', date:'2026-07-11', category:'Sadhguru Special'}).category, 'Isha Official Program');
  assert.equal(normalizeEvent({id:'empty', date:'2026-07-11'}).category, '');
});

test('enforces all mandatory event fields and date order', () => {
  assert.equal(validateEvent({...validEvent, title: ''}, '2026-07-01'), 'Program name is required');
  assert.equal(validateEvent({...validEvent, startDate: ''}, '2026-07-01'), 'Start date is required');
  assert.equal(validateEvent({...validEvent, endDate: ''}, '2026-07-01'), 'End date is required');
  assert.equal(validateEvent({...validEvent, endDate: '2026-07-02'}, '2026-07-01'), 'End date must be on or after the start date');
  assert.equal(validateEvent({...validEvent, startDate: '2026-07-24'}, '2026-07-25'), 'Events cannot be scheduled in the past');
  assert.equal(validateEvent({...validEvent, category:'Guru Pooja'}, '2026-07-01'), 'Choose a valid program category');
  assert.equal(validateEvent({...validEvent, category:'Lunar Observance'}, '2026-07-01'), 'Choose a valid program category');
  assert.equal(validateEvent({...validEvent, createdBy: ''}, '2026-07-01'), 'Created by is required');
  assert.equal(validateEvent(validEvent, '2026-07-01'), null);
  assert.equal(validateEvent({...validEvent, category:'Others'}, '2026-07-01'), null);
  assert.equal(validateEvent({...validEvent, location:'', notes:''}, '2026-07-01'), null);
});

test('round-trips an event between calendar and Supabase formats', () => {
  const row = databaseEvent(validEvent);
  assert.deepEqual(row, {id:'test-1', title:'Inner Engineering Total', start_date:'2026-07-03', end_date:'2026-07-06', category:'Inner Engineering', status:'Confirmed', created_by:'Program team', location:'Banaswadi', notes:'Test event'});
  assert.deepEqual(calendarEvent(row), validEvent);
  assert.deepEqual(databaseEvent({...validEvent, status:'', createdBy:'', location:'', notes:''}), {
    id:'test-1', title:'Inner Engineering Total', start_date:'2026-07-03', end_date:'2026-07-06', category:'Inner Engineering', status:'Draft', created_by:'Isha Banaswadi team', location:null, notes:null
  });
  assert.equal(calendarEvent({...row, location:null, notes:null}).location, '');
});

test('uses local calendar dates instead of UTC-derived dates', () => {
  assert.equal(currentDateKey(new Date(2026, 6, 25)), '2026-07-25');
  assert.equal(addDays('2026-07-25', 6), '2026-07-31');
});

test('builds stable css slugs for event category and status classes', () => {
  assert.equal(slug('Advanced Isha Programs'), 'advanced-isha-programs');
  assert.equal(slug(''), '');
});

test('filters events by program category, search, upcoming, and this week', () => {
  assert.deepEqual(filterEvents(eventSet, {
    allowedCategories:['Hatha Yoga', 'Advanced Isha Programs'],
    query:'banaswadi',
    quickFilter:'all',
    today:'2026-07-25'
  }).map(event => event.id), ['test-2']);

  assert.deepEqual(filterEvents(eventSet, {
    allowedCategories:permittedCategories,
    quickFilter:'upcoming',
    today:'2026-07-25'
  }).map(event => event.id), ['test-2', 'test-3', 'test-4', 'test-5', 'lunar-1']);

  assert.deepEqual(filterEvents(eventSet, {
    allowedCategories:permittedCategories,
    quickFilter:'week',
    today:'2026-07-25'
  }).map(event => event.id), ['test-2', 'test-3', 'lunar-1']);
});

test('finds events that overlap the visible month including multi-month spans', () => {
  assert.deepEqual(monthRange(new Date(2026, 6, 1)), {firstKey:'2026-07-01', lastKey:'2026-07-31'});
  assert.deepEqual(monthEvents(eventSet, new Date(2026, 6, 1)).map(event => event.id), ['test-1', 'test-2', 'test-3', 'lunar-1']);
  assert.deepEqual(monthEvents(eventSet, new Date(2026, 7, 1)).map(event => event.id), ['test-3', 'test-4', 'test-5']);
});

test('builds a fixed 6-week month grid with blank other-month dates and inert past dates', () => {
  const cells = calendarCells(eventSet, new Date(2026, 6, 1), '2026-07-25');
  assert.equal(cells.length, 42);
  assert.equal(cells[0].isCurrentMonth, false);
  assert.equal(cells[0].number, '');
  assert.equal(cells.find(cell => cell.key === '2026-07-24').isPast, true);
  assert.equal(cells.find(cell => cell.key === '2026-07-24').canCreate, false);
  assert.equal(cells.find(cell => cell.key === '2026-07-25').isToday, true);
  assert.equal(cells.find(cell => cell.key === '2026-07-25').canCreate, true);
  assert.deepEqual(cells.find(cell => cell.key === '2026-07-29').events.map(event => event.id), ['test-3', 'lunar-1']);
});

test('keeps every same-day event available in a crowded calendar cell', () => {
  const crowdedEvents = Array.from({length:6}, (_, index) => ({
    id:`crowded-${index + 1}`,
    title:`Program ${index + 1}`,
    startDate:'2026-07-25',
    endDate:'2026-07-25',
    category:'Others',
    status:'Confirmed',
    createdBy:'Team'
  }));
  const day = calendarCells(crowdedEvents, new Date(2026, 6, 1), '2026-07-25').find(cell => cell.key === '2026-07-25');
  assert.deepEqual(day.events.map(event => event.id), ['crowded-1', 'crowded-2', 'crowded-3', 'crowded-4', 'crowded-5', 'crowded-6']);
});

test('summarizes next event timing for the top bar', () => {
  assert.equal(nextEventSummary(eventSet, '2026-07-25').text, 'Next: Surya Kriya today');
  assert.equal(nextEventSummary(eventSet, '2026-07-27').text, 'Next: Samyama Sadhana tomorrow');
  assert.equal(nextEventSummary(eventSet, '2026-08-03').text, 'Next: Volunteer Meet in 5 days');
  assert.equal(nextEventSummary([{...eventSet[5]}], '2026-07-25').text, 'No upcoming programs');
});

test('summarizes dashboard counts without counting cancelled as upcoming', () => {
  assert.deepEqual(dashboardSummary(eventSet, '2026-07-25'), {
    upcoming:3,
    confirmed:1,
    total:5,
    categories:{
      'Inner Engineering':1,
      'Hatha Yoga':1,
      'Advanced Isha Programs':1,
      'Isha Official Program':1,
      Others:1
    }
  });
});

test('sets creation modal defaults and protects past clicked dates', () => {
  assert.deepEqual(modalDefaults('2026-07-24', null, '2026-07-25'), {
    id:'',
    title:'',
    startDate:'2026-07-25',
    endDate:'2026-07-25',
    category:'',
    status:'Draft',
    createdBy:'',
    location:'',
    notes:'',
    minDate:'2026-07-25'
  });
  assert.equal(modalDefaults('2026-07-28', null, '2026-07-25').startDate, '2026-07-28');
  assert.equal(modalDefaults(null, validEvent, '2026-07-25').startDate, '2026-07-03');
});

test('formats agenda dates and hover tooltip details', () => {
  assert.equal(formatEventDate({...validEvent, startDate:''}), 'Date not set');
  assert.equal(formatEventDate({...validEvent, endDate:'2026-07-03'}), 'Jul 3, 2026');
  assert.equal(formatEventDate(validEvent), 'Jul 3, 2026 - Jul 6, 2026');
  assert.equal(formatEventDate(validEvent, 'en-IN'), '3 Jul 2026 - 6 Jul 2026');
  assert.equal(tooltipDetails(validEvent), 'Inner Engineering Total\nJul 3, 2026 - Jul 6, 2026\nInner Engineering\nConfirmed\nCreated by: Program team\nBanaswadi\nTest event');
});

test('chooses predictable target months for quick filter buttons', () => {
  assert.equal(quickFilterTarget(eventSet, 'all', '2026-07-25'), '2026-07-25');
  assert.equal(quickFilterTarget(eventSet, 'week', '2026-07-25'), '2026-07-25');
  assert.equal(quickFilterTarget(eventSet, 'upcoming', '2026-07-26'), '2026-07-28');
  assert.equal(quickFilterTarget([], 'upcoming', '2026-07-26'), '2026-07-26');
});
