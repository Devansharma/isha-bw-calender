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

  function addDays(day, count) {
    const date = new Date(`${day}T00:00:00`);
    date.setDate(date.getDate() + count);
    return currentDateKey(date);
  }

  function slug(value = '') {
    return value.toLowerCase().replaceAll(' ', '-');
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

  function filterEvents(events, options = {}) {
    const {query = '', allowedCategories = permittedCategories, quickFilter = 'all', today = currentDateKey()} = options;
    const lowerQuery = query.trim().toLowerCase();
    const weekEndKey = addDays(today, 6);
    return events.filter(event => {
      const matchesProgram = !event.category || allowedCategories.includes(event.category);
      const matchesSearch = !lowerQuery || `${event.title || ''} ${event.location || ''} ${event.category || ''}`.toLowerCase().includes(lowerQuery);
      const matchesQuickFilter = quickFilter === 'all' || (quickFilter === 'upcoming' && event.endDate >= today) || (quickFilter === 'week' && event.startDate <= weekEndKey && event.endDate >= today);
      return matchesProgram && matchesSearch && matchesQuickFilter;
    });
  }

  function monthRange(viewDate) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    return {
      firstKey: currentDateKey(new Date(year, month, 1)),
      lastKey: currentDateKey(new Date(year, month + 1, 0))
    };
  }

  function monthEvents(events, viewDate) {
    const {firstKey, lastKey} = monthRange(viewDate);
    return events.filter(event => event.startDate && event.endDate && event.startDate <= lastKey && event.endDate >= firstKey);
  }

  function calendarCells(events, viewDate, today = currentDateKey()) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    return Array.from({length:42}, (_, index) => {
      let number;
      let date;
      let isCurrentMonth = true;
      if (index < startDay) {
        number = previousDays - startDay + index + 1;
        date = new Date(year, month - 1, number);
        isCurrentMonth = false;
      } else if (index >= startDay + daysInMonth) {
        number = index - startDay - daysInMonth + 1;
        date = new Date(year, month + 1, number);
        isCurrentMonth = false;
      } else {
        number = index - startDay + 1;
        date = new Date(year, month, number);
      }
      const key = currentDateKey(date);
      const dayEvents = isCurrentMonth ? events.filter(event => occursOn(event, key)) : [];
      return {key, number:isCurrentMonth ? number : '', isCurrentMonth, isToday:key === today, isPast:key < today, canCreate:isCurrentMonth && key >= today, events:dayEvents};
    });
  }

  function nextEventSummary(events, today = currentDateKey()) {
    const next = events.filter(event => event.category !== 'Lunar Observance' && event.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    if (!next) return {event:null, text:'No upcoming programs'};
    const days = Math.round((Date.parse(`${next.startDate}T00:00:00`) - Date.parse(`${today}T00:00:00`)) / 86400000);
    const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
    return {event:next, days, text:`Next: ${next.title} ${when}`};
  }

  function dashboardSummary(events, today = currentDateKey()) {
    const upcoming = events.filter(event => event.category !== 'Lunar Observance' && event.endDate >= today && event.status !== 'Cancelled');
    const categories = ['Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Others'];
    return {
      upcoming: upcoming.length,
      confirmed: upcoming.filter(event => event.status === 'Confirmed').length,
      total: events.filter(event => event.category !== 'Lunar Observance').length,
      categories: Object.fromEntries(categories.map(category => [category, events.filter(event => event.category === category).length]))
    };
  }

  function modalDefaults(day, event, today = currentDateKey()) {
    const selectedDate = day && day >= today ? day : today;
    return {
      id:event?.id || '',
      title:event?.title || '',
      startDate:event?.startDate || selectedDate,
      endDate:event?.endDate || selectedDate,
      category:event?.category || '',
      status:event?.status || 'Draft',
      createdBy:event?.createdBy || '',
      location:event?.location || '',
      notes:event?.notes || '',
      minDate:today
    };
  }

  function formatEventDate(event, locale = 'en') {
    if (!event.startDate) return 'Date not set';
    const options = {day:'numeric', month:'short', year:'numeric'};
    const start = new Intl.DateTimeFormat(locale, options).format(new Date(`${event.startDate}T00:00:00`));
    if (!event.endDate || event.endDate === event.startDate) return start;
    const end = new Intl.DateTimeFormat(locale, options).format(new Date(`${event.endDate}T00:00:00`));
    return `${start} - ${end}`;
  }

  function tooltipDetails(event) {
    return [event.title || 'Untitled program', formatEventDate(event), event.category, event.status, event.createdBy && `Created by: ${event.createdBy}`, event.location, event.notes].filter(Boolean).join('\n');
  }

  function quickFilterTarget(events, quickFilter, today = currentDateKey()) {
    if (quickFilter === 'all' || quickFilter === 'week') return today;
    if (quickFilter !== 'upcoming') return null;
    return events.filter(event => event.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]?.startDate || today;
  }

  const api = {permittedCategories, normalizeEvent, occursOn, currentDateKey, addDays, slug, validateEvent, databaseEvent, calendarEvent, filterEvents, monthRange, monthEvents, calendarCells, nextEventSummary, dashboardSummary, modalDefaults, formatEventDate, tooltipDetails, quickFilterTarget};
  root.CalendarCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
