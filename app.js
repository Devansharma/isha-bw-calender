const seedEvents = [
  {id:'e1',title:'Inner Engineering Total',startDate:'2026-07-03',endDate:'2026-07-06',time:'09:30',category:'Inner Engineering',location:'Isha Yoga Center',notes:'Four-day residential program.'},
  {id:'e2',title:'Surya Kriya',startDate:'2026-07-05',endDate:'2026-07-05',time:'07:00',category:'Hatha Yoga',location:'Isha Yoga Center',notes:''},
  {id:'e3',title:'Guru Purnima Satsang',startDate:'2026-07-10',endDate:'2026-07-10',time:'18:30',category:'Isha Official Program',location:'Mahima Hall',notes:'Open to all participants.'},
  {id:'e4',title:'Guru Pooja',startDate:'2026-07-12',endDate:'2026-07-12',time:'10:00',category:'Advanced Isha Programs',location:'Isha Yoga Center',notes:''},
  {id:'e5',title:'Bhuta Shuddhi',startDate:'2026-07-16',endDate:'2026-07-16',time:'17:30',category:'Hatha Yoga',location:'Online',notes:''},
  {id:'e6',title:'Project GreenHands',startDate:'2026-07-18',endDate:'2026-07-18',time:'08:00',category:'Isha Official Program',location:'Coimbatore',notes:'Community tree planting.'},
  {id:'e7',title:'Inner Engineering Total',startDate:'2026-07-21',endDate:'2026-07-24',time:'09:30',category:'Inner Engineering',location:'Isha Yoga Center',notes:''},
  {id:'e8',title:'Devi Seva',startDate:'2026-07-24',endDate:'2026-07-24',time:'06:30',category:'Isha Official Program',location:'Linga Bhairavi',notes:''},
  {id:'e9',title:'Aumkar Meditation',startDate:'2026-07-24',endDate:'2026-07-24',time:'18:00',category:'Isha Official Program',location:'Online',notes:''},
  {id:'e10',title:'Angamardana',startDate:'2026-07-27',endDate:'2026-07-27',time:'07:00',category:'Hatha Yoga',location:'Isha Yoga Center',notes:''},
  {id:'e11',title:'Full Moon Flirtation',startDate:'2026-07-29',endDate:'2026-07-29',time:'19:00',category:'Sadhguru Special',location:'Isha Yoga Center',notes:''}
];

const lunarEvents = [
  ['Amavasya','2026-01-18'],['Purnima','2026-01-03'],['Shivaratri / Pancha Bhuta Kriya','2026-01-17'],
  ['Amavasya','2026-02-16'],['Purnima','2026-02-01'],['Mahashivaratri','2026-02-15'],
  ['Amavasya','2026-03-18'],['Purnima','2026-03-03'],['Shivaratri / Pancha Bhuta Kriya','2026-03-17'],
  ['Amavasya','2026-04-16'],['Purnima','2026-04-01'],['Purnima','2026-04-30'],['Shivaratri / Pancha Bhuta Kriya','2026-04-15'],
  ['Amavasya','2026-05-16'],['Purnima','2026-05-01'],['Purnima','2026-05-30'],['Shivaratri / Pancha Bhuta Kriya','2026-05-15'],
  ['Amavasya','2026-06-14'],['Purnima','2026-06-29'],['Shivaratri / Pancha Bhuta Kriya','2026-06-13'],
  ['Amavasya','2026-07-13'],['Purnima','2026-07-29'],['Shivaratri / Pancha Bhuta Kriya','2026-07-12'],
  ['Adi Amavasya','2026-08-12'],['Purnima','2026-08-27'],['Shivaratri / Pancha Bhuta Kriya','2026-08-11'],
  ['Amavasya','2026-09-10'],['Purnima','2026-09-26'],['Shivaratri / Pancha Bhuta Kriya','2026-09-09'],
  ['Mahalaya Amavasya','2026-10-09'],['Purnima','2026-10-25'],['Shivaratri / Pancha Bhuta Kriya','2026-10-08'],
  ['Amavasya','2026-11-08'],['Purnima','2026-11-24'],['Shivaratri / Pancha Bhuta Kriya','2026-11-07'],
  ['Amavasya','2026-12-08'],['Purnima','2026-12-23'],['Shivaratri / Pancha Bhuta Kriya','2026-12-07'],
  ['Yogeshwar Linga Consecration Day','2026-01-14'],['Saptarishi Avahanam, Spring Equinox','2026-03-20'],['Naga Panchami','2026-08-17'],['Naga Consecration Day','2026-10-25']
].map(([title, date], index) => ({id:`lunar-${index + 1}`,title,startDate:date,endDate:date,category:'Lunar Observance',location:'Isha / Sadhguru Sannidhi Bengaluru',notes:'Imported from the official Isha Lunar Calendar 2026.'}));

const $ = selector => document.querySelector(selector);
const grid = $('#calendarGrid');
const tooltip = $('#eventTooltip');
const toKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const isSupabaseConfigured = Boolean(window.SUPABASE_URL && window.SUPABASE_PUBLISHABLE_KEY && !window.SUPABASE_URL.includes('YOUR_') && !window.SUPABASE_PUBLISHABLE_KEY.includes('YOUR_'));
const supabaseClient = isSupabaseConfigured ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY) : null;
const {normalizeEvent: normalize, currentDateKey, validateEvent, databaseEvent, calendarEvent, filterEvents, monthEvents: getMonthEvents, calendarCells, nextEventSummary, dashboardSummary, modalDefaults, formatEventDate, tooltipDetails, quickFilterTarget, slug} = window.CalendarCore;
let events = [];
let viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let quickFilter = 'all';
let selectedDate = currentDateKey();
let activeView = 'month';
const maxEventsPerDayCell = 3;

function save() { localStorage.setItem('isha-calendar-events', JSON.stringify(events)); }
function defaultEvents() {
  const stored = JSON.parse(localStorage.getItem('isha-calendar-events') || 'null') || seedEvents;
  const current = stored.map(normalize);
  return current.filter(event => event.category !== 'Lunar Observance');
}
async function loadSharedEvents() {
  const {data, error} = await supabaseClient.from('events').select('*').order('start_date');
  if (error) { toast(`Could not load shared calendar: ${error.message}`); return; }
  events = data.filter(row => row.category !== 'Lunar Observance').map(calendarEvent);
  render();
}
async function initializeCalendar() {
  if (!supabaseClient) { events = defaultEvents(); save(); render(); return; }
  await loadSharedEvents();
  supabaseClient.channel('isha-calendar-events').on('postgres_changes', {event:'*', schema:'public', table:'events'}, loadSharedEvents).subscribe();
}
function activeFilters() { return [...document.querySelectorAll('[data-filter]:checked')].map(item => item.dataset.filter); }
function filteredEvents() {
  return filterEvents(events, {query:$('#searchInput').value, allowedCategories:activeFilters(), quickFilter});
}
function updateNextEvent() {
  $('#nextEvent').innerHTML = '<i></i><span></span>';
  $('#nextEvent span').textContent = nextEventSummary(events).text;
}
function updateSchedulePanels() {
  const upcoming = filteredEvents().filter(event => event.category !== 'Lunar Observance' && event.startDate >= currentDateKey()).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 5);
  $('#upcomingEvents').innerHTML = upcoming.length ? upcoming.map(event => `<div class="panel-event" data-id="${event.id}" data-initial="${(event.createdBy || '?').trim().charAt(0).toUpperCase()}"><b>${event.title}</b><span>${formatEventDate(event)}</span></div>`).join('') : '<div class="panel-empty">No upcoming programs.</div>';
}
function renderAgenda(monthEvents) {
  const agenda = $('#agendaView');
  const sorted = [...monthEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));
  agenda.innerHTML = sorted.length ? sorted.map(event => `<article class="agenda-item status-${slug(event.status)}" data-id="${event.id}"><div class="agenda-date">${new Intl.DateTimeFormat('en', {day:'numeric', month:'short'}).format(new Date(`${event.startDate}T00:00:00`))}</div><div><div class="agenda-title"><b>${event.title}</b><span class="status-badge">${event.status}</span></div><p>${event.category}${event.location ? ` · ${event.location}` : ''}</p><small>Created by ${event.createdBy || 'Program team'}</small></div></article>`).join('') : '<div class="agenda-empty">No programs match these filters this month.</div>';
}
function renderDashboard() {
  const summary = dashboardSummary(events);
  $('#dashboardStats').innerHTML = `<div><b>${summary.upcoming}</b><span>Upcoming</span></div><div><b>${summary.confirmed}</b><span>Confirmed</span></div><div><b>${summary.total}</b><span>Total programs</span></div>`;
  const categories = ['Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Others'];
  $('#dashboardCategories').innerHTML = categories.map(category => `<div><span>${category}</span><b>${summary.categories[category]}</b></div>`).join('');
}

function render() {
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const todayKey = currentDateKey();
  $('#monthTitle').textContent = new Intl.DateTimeFormat('en', {month:'long', year:'numeric'}).format(viewDate);
  $('#monthYearDisplay').textContent = new Intl.DateTimeFormat('en', {month:'long', year:'numeric'}).format(viewDate);
  const current = filteredEvents();
  const monthEvents = getMonthEvents(current, viewDate);
  $('#eventCount').textContent = events.length;
  $('#monthEventCount').textContent = monthEvents.length;
  updateNextEvent();
  updateSchedulePanels();
  renderAgenda(monthEvents);
  $('#monthView').hidden = activeView !== 'month';
  $('#agendaView').hidden = activeView !== 'agenda';
  grid.innerHTML = ['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day => `<div class="weekday">${day}</div>`).join('');
  const cells = calendarCells(current, viewDate, todayKey).map(cell => {
    const {key, number, isCurrentMonth, events:dayEvents} = cell;
    const visibleEvents = dayEvents.length > 1 ? dayEvents.slice(0, 1) : dayEvents.slice(0, maxEventsPerDayCell);
    const rendered = visibleEvents.map(event => {
      const continues = event.startDate !== event.endDate;
      const title = event.title || 'Untitled program';
      const label = continues && key !== event.startDate ? `↳ ${title}` : title;
      const rangePosition = !continues ? '' : key === event.startDate ? 'event-range-start' : key === event.endDate ? 'event-range-end' : 'event-range-middle';
      return `<div class="event event-${slug(event.category || 'community')} status-${slug(event.status)} ${rangePosition}" data-id="${event.id}">${label}</div>`;
    }).join('');
    const today = cell.isToday ? 'today' : '';
    const past = cell.isPast ? 'past-date' : '';
    const dateAttribute = cell.canCreate ? `data-date="${key}"` : '';
    const otherMonth = isCurrentMonth ? '' : 'other-month';
    const blank = isCurrentMonth ? '' : 'blank-day';
    const more = dayEvents.length > 1 ? `<button class="more-event" type="button" data-day="${key}">View all ${dayEvents.length} programs</button>` : '';
    return `<div class="day-cell ${otherMonth} ${today} ${past} ${blank}" ${dateAttribute}><span class="day-number">${number}</span><div class="events">${rendered}${more}</div></div>`;
  });
  grid.insertAdjacentHTML('beforeend', cells.join(''));
}

function openModal(day, event) {
  $('#eventModal').classList.add('open');
  $('#eventForm').reset();
  $('#eventId').value = event?.id || '';
  $('#modalTitle').textContent = event ? 'Edit event' : 'Create event';
  $('#deleteBtn').style.display = event ? 'block' : 'none';
  $('#title').value = event?.title || '';
  const defaults = modalDefaults(day, event);
  $('#startDate').min = defaults.minDate;
  $('#endDate').min = defaults.minDate;
  $('#startDate').value = defaults.startDate;
  $('#endDate').value = defaults.endDate;
  $('#category').value = defaults.category;
  $('#status').value = defaults.status;
  $('#createdBy').value = defaults.createdBy;
  $('#location').value = defaults.location;
  $('#notes').value = defaults.notes;
  setTimeout(() => $('#title').focus(), 30);
}
function closeModal() { $('#eventModal').classList.remove('open'); }
function openDayModal(day) {
  const dayEvents = filteredEvents().filter(event => event.category !== 'Lunar Observance' && event.startDate && event.endDate && event.startDate <= day && event.endDate >= day).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
  $('#dayModalTitle').textContent = new Intl.DateTimeFormat('en', {weekday:'long', day:'numeric', month:'long', year:'numeric'}).format(new Date(`${day}T00:00:00`));
  $('#dayEventList').innerHTML = dayEvents.length ? dayEvents.map(event => `<article class="day-event-item status-${slug(event.status)}" data-id="${event.id}"><b>${event.title}</b><span>${event.category} · ${event.status}</span><small>${formatEventDate(event)}${event.createdBy ? ` · Created by ${event.createdBy}` : ''}</small>${event.notes ? `<p>${event.notes}</p>` : ''}</article>`).join('') : '<div class="agenda-empty">No programs on this date.</div>';
  $('#dayModal').classList.add('open');
}
function closeDayModal() { $('#dayModal').classList.remove('open'); }
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
function positionTooltip(pointerEvent) {
  const padding = 14, width = tooltip.offsetWidth || 250, height = tooltip.offsetHeight || 110;
  const left = Math.min(pointerEvent.clientX + padding, window.innerWidth - width - padding);
  const top = Math.min(pointerEvent.clientY + padding, window.innerHeight - height - padding);
  tooltip.style.left = `${Math.max(padding, left)}px`;
  tooltip.style.top = `${Math.max(padding, top)}px`;
}
function showTooltip(pointerEvent, event) {
  tooltip.textContent = tooltipDetails(event);
  tooltip.classList.add('show');
  positionTooltip(pointerEvent);
}

grid.addEventListener('click', event => {
  const eventElement = event.target.closest('.event');
  if (eventElement) return openModal(null, events.find(item => item.id === eventElement.dataset.id));
  const moreElement = event.target.closest('.more-event');
  if (moreElement) return openDayModal(moreElement.dataset.day);
  const cell = event.target.closest('.day-cell');
  if (cell?.dataset.date) openModal(cell.dataset.date);
});
grid.addEventListener('mouseover', pointerEvent => {
  const eventElement = pointerEvent.target.closest('.event');
  if (eventElement) showTooltip(pointerEvent, events.find(item => item.id === eventElement.dataset.id));
});
grid.addEventListener('mousemove', pointerEvent => { if (pointerEvent.target.closest('.event')) positionTooltip(pointerEvent); });
grid.addEventListener('mouseout', pointerEvent => { if (pointerEvent.target.closest('.event')) tooltip.classList.remove('show'); });
$('#newEventBtn').onclick = () => openModal();
$('#closeModal').onclick = closeModal;
$('#cancelBtn').onclick = closeModal;
$('#eventModal').addEventListener('click', event => { if (event.target === $('#eventModal')) closeModal(); });
$('#eventForm').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#eventId').value;
  const data = {id:id || `e${Date.now()}`, title:$('#title').value.trim(), startDate:$('#startDate').value, endDate:$('#endDate').value, category:$('#category').value, status:$('#status').value, createdBy:$('#createdBy').value.trim(), location:$('#location').value.trim(), notes:$('#notes').value.trim()};
  const validationError = validateEvent(data);
  if (validationError) { toast(validationError); return; }
  if (supabaseClient) {
    const existing = events.some(item => item.id === id);
    const request = existing
      ? supabaseClient.from('events').update(databaseEvent(data)).eq('id', id)
      : supabaseClient.from('events').insert(databaseEvent(data));
    const {error} = await request;
    if (error) { toast(`Could not save event: ${error.message}`); return; }
    await loadSharedEvents();
  } else {
    events = id ? events.map(item => item.id === id ? data : item) : [...events, data];
    save(); render();
  }
  closeModal(); toast(id ? 'Event updated for everyone' : 'New program saved for everyone');
});
$('#startDate').addEventListener('change', event => { $('#endDate').min = event.target.value || currentDateKey(); });
$('#deleteBtn').onclick = async () => { const id = $('#eventId').value; if (id && confirm('Delete this event?')) { if (supabaseClient) { const {error} = await supabaseClient.from('events').delete().eq('id', id); if (error) return toast(`Could not delete event: ${error.message}`); await loadSharedEvents(); } else { events = events.filter(event => event.id !== id); save(); render(); } closeModal(); toast('Event deleted'); } };
$('#prevMonth').onclick = () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); render(); };
$('#nextMonth').onclick = () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); render(); };
$('#todayBtn').onclick = () => { viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); };
$('#searchInput').addEventListener('input', render);
document.querySelectorAll('[data-filter]').forEach(input => input.addEventListener('change', render));
document.querySelectorAll('[data-quick-filter]').forEach(button => button.addEventListener('click', () => {
  quickFilter = button.dataset.quickFilter;
  document.querySelectorAll('[data-quick-filter]').forEach(item => item.classList.toggle('active', item === button));
  const today = currentDateKey();
  const targetDate = quickFilterTarget(filteredEvents(), quickFilter, today);
  if (targetDate) { const target = new Date(`${targetDate}T00:00:00`); viewDate = new Date(target.getFullYear(), target.getMonth(), 1); }
  render();
}));
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { activeView = button.dataset.view; document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button)); render(); }));
$('#mobileCreateBtn').onclick = () => openModal(selectedDate);
document.querySelector('.schedule-panel').addEventListener('click', event => { const item = event.target.closest('.panel-event'); if (item) openModal(null, events.find(entry => entry.id === item.dataset.id)); });
$('#agendaView').addEventListener('click', event => { const item = event.target.closest('.agenda-item'); if (item) openModal(null, events.find(entry => entry.id === item.dataset.id)); });
$('#dayEventList').addEventListener('click', event => { const item = event.target.closest('.day-event-item'); if (item) { closeDayModal(); openModal(null, events.find(entry => entry.id === item.dataset.id)); } });
$('#dashboardBtn').onclick = () => { renderDashboard(); $('#dashboardModal').classList.add('open'); };
$('#closeDashboard').onclick = () => $('#dashboardModal').classList.remove('open');
$('#dashboardModal').addEventListener('click', event => { if (event.target === $('#dashboardModal')) $('#dashboardModal').classList.remove('open'); });
$('#closeDayModal').onclick = closeDayModal;
$('#dayModal').addEventListener('click', event => { if (event.target === $('#dayModal')) closeDayModal(); });
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
$('#closeMenu').onclick = () => $('#sidebar').classList.remove('open');
$('#addCalendar').onclick = () => toast('More program calendars can be added when connected to your team workspace');
$('#themeBtn').onclick = () => { document.body.classList.toggle('dark'); const dark = document.body.classList.contains('dark'); $('#themeBtn').textContent = dark ? '☀ Light' : '☾ Dark'; localStorage.setItem('isha-calendar-theme', dark ? 'dark' : 'light'); };
if (localStorage.getItem('isha-calendar-theme') === 'light') $('#themeBtn').click();
window.addEventListener('storage', event => { if (!supabaseClient && event.key === 'isha-calendar-events') { events = JSON.parse(event.newValue || '[]').map(normalize); render(); toast('Calendar updated by a teammate'); } });
initializeCalendar();
