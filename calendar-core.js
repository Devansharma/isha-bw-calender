(function (root) {
  const permittedCategories = ['Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Others', 'Lunar Observance'];

  function normalizeEvent(event) {
    if (event.id === 'e4') event = {...event, title:'Guru Pooja', category:'Advanced Isha Programs'};
    if (event.category === 'Guru Pooja') event = {...event, category:'Advanced Isha Programs'};
    const category = permittedCategories.includes(event.category) ? event.category : (event.category ? 'Isha Official Program' : '');
    return {...event, category, status:event.status || 'Draft', startDate:event.startDate || event.date, endDate:event.endDate || event.date};
  }

  function occursOn(event, day) {
    return Boolean(event.startDate && event.endDate && event.startDate <= day && event.endDate >= day);
  }

  function currentDateKey(reference = new Date()) {
    return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}-${String(reference.getDate()).padStart(2, '0')}`;
  }

  function validateEvent(event, today = currentDateKey()) {
    if (!event.title?.trim()) return 'Program name is required';
    if (!event.startDate) return 'Start date is required';
    if (!event.endDate) return 'End date is required';
    if (event.startDate < today) return 'Events cannot be scheduled in the past';
    if (event.endDate < event.startDate) return 'End date must be on or after the start date';
    if (!permittedCategories.includes(event.category) || event.category === 'Lunar Observance') return 'Choose a valid program category';
    if (!event.createdBy?.trim()) return 'Created by is required';
    return null;
  }

  function databaseEvent(event) {
    return {id:event.id, title:event.title, start_date:event.startDate, end_date:event.endDate, category:event.category, status:event.status || 'Draft', created_by:event.createdBy || 'Isha Banaswadi team', location:event.location || null, notes:event.notes || null};
  }

  function calendarEvent(row) {
    return normalizeEvent({id:row.id, title:row.title, startDate:row.start_date, endDate:row.end_date, category:row.category, status:row.status, createdBy:row.created_by, location:row.location || '', notes:row.notes || ''});
  }

  const api = {permittedCategories, normalizeEvent, occursOn, currentDateKey, validateEvent, databaseEvent, calendarEvent};
  root.CalendarCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
