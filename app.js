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
const toKey = date => date.toISOString().slice(0, 10);
const isSupabaseConfigured = Boolean(window.SUPABASE_URL && window.SUPABASE_PUBLISHABLE_KEY && !window.SUPABASE_URL.includes('YOUR_') && !window.SUPABASE_PUBLISHABLE_KEY.includes('YOUR_'));
const supabaseClient = isSupabaseConfigured ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY) : null;
const normalize = event => {
  if (event.id === 'e4') event = {...event, title:'Guru Pooja', category:'Advanced Isha Programs'};
  if (event.category === 'Guru Pooja') event = {...event, category:'Advanced Isha Programs'};
  const permitted = ['Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Lunar Observance'];
  const category = permitted.includes(event.category) ? event.category : (event.category ? 'Isha Official Program' : '');
  return {...event, category, startDate:event.startDate || event.date, endDate:event.endDate || event.date};
};
let events = [];
let viewDate = new Date(2026, 6, 1);

function save() { localStorage.setItem('isha-calendar-events', JSON.stringify(events)); }
function defaultEvents() {
  const stored = JSON.parse(localStorage.getItem('isha-calendar-events') || 'null') || seedEvents;
  const current = stored.map(normalize);
  const ids = new Set(current.map(event => event.id));
  return [...current, ...lunarEvents.filter(event => !ids.has(event.id))];
}
function databaseEvent(event) {
  return {id:event.id, title:event.title, start_date:event.startDate, end_date:event.endDate, category:event.category, created_by:event.createdBy || 'Isha Banaswadi team', location:event.location || null, notes:event.notes || null};
}
function calendarEvent(row) {
  return normalize({id:row.id, title:row.title, startDate:row.start_date, endDate:row.end_date, category:row.category, createdBy:row.created_by, location:row.location || '', notes:row.notes || ''});
}
async function loadSharedEvents() {
  const {data, error} = await supabaseClient.from('events').select('*').order('start_date');
  if (error) { toast(`Could not load shared calendar: ${error.message}`); return; }
  if (data.length === 0) {
    const {data:{session}} = await supabaseClient.auth.getSession();
    if (!session) { events = []; render(); return; }
    const initial = defaultEvents();
    const {error: seedError} = await supabaseClient.from('events').upsert(initial.map(databaseEvent));
    if (seedError) { toast(`Could not create initial calendar: ${seedError.message}`); return; }
    events = initial;
  } else events = data.map(calendarEvent);
  render();
}
async function updateAuthButton() {
  if (!supabaseClient) { $('#authBtn').style.display = 'none'; return; }
  const {data:{session}} = await supabaseClient.auth.getSession();
  $('#authBtn').textContent = session ? 'Sign out' : 'Sign in';
}
async function initializeCalendar() {
  if (!supabaseClient) { events = defaultEvents(); save(); render(); return; }
  await updateAuthButton();
  await loadSharedEvents();
  supabaseClient.auth.onAuthStateChange(async () => { await updateAuthButton(); await loadSharedEvents(); });
  supabaseClient.channel('isha-calendar-events').on('postgres_changes', {event:'*', schema:'public', table:'events'}, loadSharedEvents).subscribe();
}
function slug(value) { return value.toLowerCase().replaceAll(' ', '-'); }
function activeFilters() { return [...document.querySelectorAll('[data-filter]:checked')].map(item => item.dataset.filter); }
function occursOn(event, day) { return event.startDate && event.endDate && event.startDate <= day && event.endDate >= day; }
function filteredEvents() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const allowed = activeFilters();
  return events.filter(event => (!event.category || allowed.includes(event.category)) && (!query || `${event.title} ${event.location} ${event.category}`.toLowerCase().includes(query)));
}

function render() {
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  $('#monthTitle').textContent = new Intl.DateTimeFormat('en', {month:'long', year:'numeric'}).format(viewDate);
  $('#monthYearDisplay').textContent = new Intl.DateTimeFormat('en', {month:'long', year:'numeric'}).format(viewDate);
  const current = filteredEvents();
  const firstKey = toKey(new Date(year, month, 1));
  const lastKey = toKey(new Date(year, month + 1, 0));
  const monthEvents = current.filter(event => event.startDate && event.endDate && event.startDate <= lastKey && event.endDate >= firstKey);
  $('#eventCount').textContent = events.length;
  $('#monthEventCount').textContent = monthEvents.length;
  grid.innerHTML = ['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day => `<div class="weekday">${day}</div>`).join('');
  const first = new Date(year, month, 1), startDay = first.getDay(), daysInMonth = new Date(year, month + 1, 0).getDate(), previousDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    let number, date, otherMonth = '';
    if (i < startDay) { number = previousDays - startDay + i + 1; date = new Date(year, month - 1, number); otherMonth = 'other-month'; }
    else if (i >= startDay + daysInMonth) { number = i - startDay - daysInMonth + 1; date = new Date(year, month + 1, number); otherMonth = 'other-month'; }
    else { number = i - startDay + 1; date = new Date(year, month, number); }
    const key = toKey(date);
    const dayEvents = current.filter(event => occursOn(event, key));
    const rendered = dayEvents.slice(0, 3).map(event => {
      const continues = event.startDate !== event.endDate;
      const title = event.title || 'Untitled program';
      const label = continues && key !== event.startDate ? `↳ ${title}` : title;
      return `<div class="event event-${slug(event.category || 'community')}" data-id="${event.id}">${label}</div>`;
    }).join('');
    const today = key === '2026-07-24' ? 'today' : '';
    cells.push(`<div class="day-cell ${otherMonth} ${today}" data-date="${key}"><span class="day-number">${number}</span><div class="events">${rendered}${dayEvents.length > 3 ? `<div class="more-event">+${dayEvents.length - 3} more</div>` : ''}</div></div>`);
  }
  grid.insertAdjacentHTML('beforeend', cells.join(''));
}

function openModal(day, event) {
  $('#eventModal').classList.add('open');
  $('#eventForm').reset();
  $('#eventId').value = event?.id || '';
  $('#modalTitle').textContent = event ? 'Edit event' : 'Create event';
  $('#deleteBtn').style.display = event ? 'block' : 'none';
  $('#title').value = event?.title || '';
  $('#startDate').value = event?.startDate || day || toKey(new Date());
  $('#endDate').value = event?.endDate || day || toKey(new Date());
  $('#category').value = event?.category || '';
  $('#createdBy').value = event?.createdBy || '';
  $('#location').value = event?.location || '';
  $('#notes').value = event?.notes || '';
  setTimeout(() => $('#title').focus(), 30);
}
function closeModal() { $('#eventModal').classList.remove('open'); }
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
function formatEventDate(event) {
  if (!event.startDate) return 'Date not set';
  const options = {day:'numeric', month:'short', year:'numeric'};
  const start = new Intl.DateTimeFormat('en', options).format(new Date(`${event.startDate}T00:00:00`));
  if (!event.endDate || event.endDate === event.startDate) return start;
  const end = new Intl.DateTimeFormat('en', options).format(new Date(`${event.endDate}T00:00:00`));
  return `${start} - ${end}`;
}
function positionTooltip(pointerEvent) {
  const padding = 14, width = tooltip.offsetWidth || 250, height = tooltip.offsetHeight || 110;
  const left = Math.min(pointerEvent.clientX + padding, window.innerWidth - width - padding);
  const top = Math.min(pointerEvent.clientY + padding, window.innerHeight - height - padding);
  tooltip.style.left = `${Math.max(padding, left)}px`;
  tooltip.style.top = `${Math.max(padding, top)}px`;
}
function showTooltip(pointerEvent, event) {
  const details = [event.title || 'Untitled program', formatEventDate(event), event.category, event.createdBy && `Created by: ${event.createdBy}`, event.location, event.notes].filter(Boolean);
  tooltip.textContent = details.join('\n');
  tooltip.classList.add('show');
  positionTooltip(pointerEvent);
}

grid.addEventListener('click', event => {
  const eventElement = event.target.closest('.event');
  if (eventElement) return openModal(null, events.find(item => item.id === eventElement.dataset.id));
  const cell = event.target.closest('.day-cell');
  if (cell) openModal(cell.dataset.date);
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
  const data = {id:id || `e${Date.now()}`, title:$('#title').value.trim(), startDate:$('#startDate').value, endDate:$('#endDate').value, category:$('#category').value, createdBy:$('#createdBy').value.trim(), location:$('#location').value.trim(), notes:$('#notes').value.trim()};
  if (data.startDate && data.endDate && data.endDate < data.startDate) { toast('End date must be on or after the start date'); return; }
  if (supabaseClient) {
    const {data:{session}} = await supabaseClient.auth.getSession();
    if (!session) { toast('Sign in before editing the shared calendar'); return; }
    const {error} = await supabaseClient.from('events').upsert(databaseEvent(data));
    if (error) { toast(`Could not save event: ${error.message}`); return; }
    await loadSharedEvents();
  } else {
    events = id ? events.map(item => item.id === id ? data : item) : [...events, data];
    save(); render();
  }
  closeModal(); toast(id ? 'Event updated for the team' : 'New program added to the calendar');
});
$('#deleteBtn').onclick = async () => { const id = $('#eventId').value; if (id && confirm('Delete this event?')) { if (supabaseClient) { const {data:{session}} = await supabaseClient.auth.getSession(); if (!session) return toast('Sign in before editing the shared calendar'); const {error} = await supabaseClient.from('events').delete().eq('id', id); if (error) return toast(`Could not delete event: ${error.message}`); await loadSharedEvents(); } else { events = events.filter(event => event.id !== id); save(); render(); } closeModal(); toast('Event deleted'); } };
$('#prevMonth').onclick = () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); render(); };
$('#nextMonth').onclick = () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); render(); };
$('#todayBtn').onclick = () => { viewDate = new Date(2026, 6, 1); render(); };
$('#searchInput').addEventListener('input', render);
document.querySelectorAll('[data-filter]').forEach(input => input.addEventListener('change', render));
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
$('#addCalendar').onclick = () => toast('More program calendars can be added when connected to your team workspace');
$('#themeBtn').onclick = () => { document.body.classList.toggle('dark'); const dark = document.body.classList.contains('dark'); $('#themeBtn').textContent = dark ? '☀ Light' : '☾ Dark'; localStorage.setItem('isha-calendar-theme', dark ? 'dark' : 'light'); };
if (localStorage.getItem('isha-calendar-theme') === 'light') $('#themeBtn').click();
$('#authBtn').onclick = async () => {
  if (!supabaseClient) return;
  const {data:{session}} = await supabaseClient.auth.getSession();
  if (session) { await supabaseClient.auth.signOut({scope:'local'}); events = defaultEvents(); render(); toast('Signed out'); return; }
  const email = window.prompt('Enter your Isha team email address');
  if (!email) return;
  const {error} = await supabaseClient.auth.signInWithOtp({email, options:{emailRedirectTo:window.location.href}});
  toast(error ? `Could not send sign-in link: ${error.message}` : 'Check your email for the secure sign-in link');
};
window.addEventListener('storage', event => { if (!supabaseClient && event.key === 'isha-calendar-events') { events = JSON.parse(event.newValue || '[]').map(normalize); render(); toast('Calendar updated by a teammate'); } });
initializeCalendar();
