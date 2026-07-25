const test = require('node:test');
const assert = require('node:assert/strict');
const {normalizeEvent, occursOn, validateEvent, databaseEvent, calendarEvent} = require('../calendar-core.js');

const validEvent = {
  id: 'test-1', title: 'Inner Engineering Total', startDate: '2026-07-03', endDate: '2026-07-06',
  category: 'Inner Engineering', status: 'Confirmed', createdBy: 'Program team', location: 'Banaswadi', notes: 'Test event'
};

test('shows a multi-day event on every date in its range', () => {
  assert.equal(occursOn(validEvent, '2026-07-03'), true);
  assert.equal(occursOn(validEvent, '2026-07-05'), true);
  assert.equal(occursOn(validEvent, '2026-07-06'), true);
  assert.equal(occursOn(validEvent, '2026-07-07'), false);
});

test('migrates legacy categories to Advanced Isha Programs', () => {
  const event = normalizeEvent({id: 'legacy-1', date: '2026-07-10', category: 'Guru Pooja'});
  assert.equal(event.category, 'Advanced Isha Programs');
  assert.equal(event.startDate, '2026-07-10');
  assert.equal(event.endDate, '2026-07-10');
});

test('enforces all mandatory event fields and date order', () => {
  assert.equal(validateEvent({...validEvent, title: ''}, '2026-07-01'), 'Program name is required');
  assert.equal(validateEvent({...validEvent, endDate: '2026-07-02'}, '2026-07-01'), 'End date must be on or after the start date');
  assert.equal(validateEvent({...validEvent, startDate: '2026-07-24'}, '2026-07-25'), 'Events cannot be scheduled in the past');
  assert.equal(validateEvent({...validEvent, createdBy: ''}, '2026-07-01'), 'Created by is required');
  assert.equal(validateEvent(validEvent, '2026-07-01'), null);
  assert.equal(validateEvent({...validEvent, category:'Others'}, '2026-07-01'), null);
});

test('round-trips an event between calendar and Supabase formats', () => {
  const row = databaseEvent(validEvent);
  assert.deepEqual(row, {id:'test-1', title:'Inner Engineering Total', start_date:'2026-07-03', end_date:'2026-07-06', category:'Inner Engineering', status:'Confirmed', created_by:'Program team', location:'Banaswadi', notes:'Test event'});
  assert.deepEqual(calendarEvent(row), validEvent);
});
