import {
	getRoutineSlots
} from './routine';

type ScheduleMode =
	| 'once'
	| 'weekly'
	| 'daily';

type RoutineSlot = {
	hours: number;
	activity: string;
	text: string;
};

const modeButtons =
	document.querySelectorAll<HTMLButtonElement>(
		'.schedule-mode'
	);

const panels =
	document.querySelectorAll<HTMLElement>(
		'.schedule-panel'
	);

const onceDate =
	document.querySelector<HTMLInputElement>(
		'#schedule-date'
	)!;

const weeklyStartDate =
	document.querySelector<HTMLInputElement>(
		'#weekly-start-date'
	)!;

const weeklyDuration =
	document.querySelector<HTMLSelectElement>(
		'#weekly-duration'
	)!;

const dailyStartDate =
	document.querySelector<HTMLInputElement>(
		'#daily-start-date'
	)!;

const dailyDuration =
	document.querySelector<HTMLSelectElement>(
		'#daily-duration'
	)!;

const weekdayButtons =
	document.querySelectorAll<HTMLButtonElement>(
		'.weekday'
	);

const addCalendarButton =
	document.querySelector<HTMLButtonElement>(
		'#add-calendar'
	)!;

const calendarStatus =
	document.querySelector<HTMLElement>(
		'#calendar-status'
	)!;

const sleepInput =
	document.querySelector<HTMLInputElement>(
		'#sleep-time'
	)!;

let scheduleMode: ScheduleMode =
	'once';

/* =========================
   Constants
========================= */

const WEEKDAYS = [
	'SU',
	'MO',
	'TU',
	'WE',
	'TH',
	'FR',
	'SA'
];

/* =========================
   Date helpers
========================= */

function formatDateInput(
	date: Date
) {
	const year =
		date.getFullYear();

	const month =
		String(
			date.getMonth() + 1
		).padStart(2, '0');

	const day =
		String(
			date.getDate()
		).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function getToday() {
	return formatDateInput(
		new Date()
	);
}

function parseDateInput(
	value: string
) {
	const [
		year,
		month,
		day
	] = value
		.split('-')
		.map(Number);

	if (
		!year ||
		!month ||
		!day
	) {
		return null;
	}

	const date =
		new Date(
			year,
			month - 1,
			day,
			0,
			0,
			0,
			0
		);

	/*
	 * Prevent invalid dates such as
	 * 2026-02-31 from rolling over.
	 */
	if (
		date.getFullYear() !== year ||
		date.getMonth() !==
			month - 1 ||
		date.getDate() !== day
	) {
		return null;
	}

	return date;
}

function addDays(
	date: Date,
	days: number
) {
	const result =
		new Date(date);

	result.setDate(
		result.getDate() +
			days
	);

	return result;
}

/* =========================
   Bedtime
========================= */

function getBedtimeFromInput() {
	const match =
		sleepInput.value
			.trim()
			.match(
				/^(\d{1,2}):(\d{2})$/
			);

	if (!match) {
		return null;
	}

	const hours =
		Number(match[1]);

	const minutes =
		Number(match[2]);

	if (
		hours < 0 ||
		hours > 23 ||
		minutes < 0 ||
		minutes > 59
	) {
		return null;
	}

	return {
		hours,
		minutes
	};
}

function createSleepDate(
	dateValue: string
) {
	const date =
		parseDateInput(
			dateValue
		);

	const bedtime =
		getBedtimeFromInput();

	if (
		!date ||
		!bedtime
	) {
		return null;
	}

	date.setHours(
		bedtime.hours,
		bedtime.minutes,
		0,
		0
	);

	return date;
}

/* =========================
   Schedule mode
========================= */

function setScheduleMode(
	mode: ScheduleMode
) {
	scheduleMode = mode;

	modeButtons.forEach(
		button => {
			const active =
				button.dataset.mode ===
				mode;

			button.classList.toggle(
				'active',
				active
			);

			button.setAttribute(
				'aria-pressed',
				String(active)
			);
		}
	);

	panels.forEach(panel => {
		const active =
			panel.dataset.mode ===
				mode;

		panel.hidden = !active;
	});
}

/* =========================
   Weekdays
========================= */

function toggleWeekday(
	button: HTMLButtonElement
) {
	const active =
		button.getAttribute(
			'aria-pressed'
		) === 'true';

	button.setAttribute(
		'aria-pressed',
		String(!active)
	);

	button.classList.toggle(
		'active',
		!active
	);
}

function getSelectedWeekdays() {
	return Array.from(
		weekdayButtons
	)
		.filter(
			button =>
				button.getAttribute(
					'aria-pressed'
				) === 'true'
		)
		.map(
			button =>
				button.dataset.day!
		);
}

/*
 * Shift an RRULE weekday.
 *
 * Example:
 * MO + (-1) = SU
 */
function shiftWeekday(
	weekday: string,
	shift: number
) {
	const index =
		WEEKDAYS.indexOf(
			weekday
		);

	if (index === -1) {
		return weekday;
	}

	const shifted =
		(
			(index + shift) %
				7 +
			7
		) % 7;

	return WEEKDAYS[
		shifted
	];
}

function shiftWeekdays(
	weekdays: string[],
	shift: number
) {
	return weekdays.map(
		weekday =>
			shiftWeekday(
				weekday,
				shift
			)
	);
}

/* =========================
   ICS helpers
========================= */

function pad(
	value: number
) {
	return String(value)
		.padStart(2, '0');
}

function formatICSLocal(
	date: Date
) {
	return (
		`${date.getFullYear()}` +
		`${pad(
			date.getMonth() + 1
		)}` +
		`${pad(
			date.getDate()
		)}` +
		'T' +
		`${pad(
			date.getHours()
		)}` +
		`${pad(
			date.getMinutes()
		)}` +
		`${pad(
			date.getSeconds()
		)}`
	);
}

function formatICSUTC(
	date: Date
) {
	return (
		`${date.getUTCFullYear()}` +
		`${pad(
			date.getUTCMonth() + 1
		)}` +
		`${pad(
			date.getUTCDate()
		)}` +
		'T' +
		`${pad(
			date.getUTCHours()
		)}` +
		`${pad(
			date.getUTCMinutes()
		)}` +
		`${pad(
			date.getUTCSeconds()
		)}` +
		'Z'
	);
}

function escapeICS(
	value: string
) {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;');
}

function createUID(
	index: number
) {
	const random =
		Math.random()
			.toString(36)
			.slice(2);

	return (
		`10321-${Date.now()}-` +
		`${index}-${random}` +
		'@10321'
	);
}

/* =========================
   Event timing
========================= */

function createEventStart(
	sleepDate: Date,
	slot: RoutineSlot | null
) {
	const start =
		new Date(
			sleepDate
		);

	if (slot) {
		start.setHours(
			start.getHours() -
				slot.hours
		);
	}

	return start;
}

/*
 * Calculate how many calendar days
 * the event is shifted relative to
 * the sleep date.
 *
 * Example:
 *
 * sleep:
 * Monday 00:30
 *
 * caffeine:
 * Sunday 14:30
 *
 * shift = -1
 */
function getCalendarDayShift(
	sleepDate: Date,
	eventDate: Date
) {
	const sleepDay =
		new Date(
			sleepDate.getFullYear(),
			sleepDate.getMonth(),
			sleepDate.getDate()
		);

	const eventDay =
		new Date(
			eventDate.getFullYear(),
			eventDate.getMonth(),
			eventDate.getDate()
		);

	return Math.round(
		(
			eventDay.getTime() -
			sleepDay.getTime()
		) /
			86400000
	);
}

/* =========================
   Recurrence duration
========================= */

function getDuration() {
	if (
		scheduleMode ===
		'weekly'
	) {
		return weeklyDuration.value;
	}

	if (
		scheduleMode ===
		'daily'
	) {
		return dailyDuration.value;
	}

	return null;
}

/*
 * Duration always refers to the
 * SLEEP DATE range.
 *
 * Example:
 *
 * start sleep date = Sep 21
 * duration = 7 days
 *
 * final sleep date = Sep 27
 */
function getFinalSleepDate(
	sleepDate: Date
) {
	const duration =
		getDuration();

	if (
		!duration ||
		duration === 'none'
	) {
		return null;
	}

	const days =
		Number(duration);

	if (
		!Number.isFinite(days) ||
		days <= 0
	) {
		return null;
	}

	const finalDate =
		addDays(
			sleepDate,
			days - 1
		);

	finalDate.setHours(
		23,
		59,
		59,
		999
	);

	return finalDate;
}

/*
 * RRULE UNTIL must also respect
 * an event that occurs on the
 * previous calendar day.
 */
function getEventUntil(
	sleepDate: Date,
	dayShift: number
) {
	const finalSleepDate =
		getFinalSleepDate(
			sleepDate
		);

	if (!finalSleepDate) {
		return null;
	}

	const eventUntil =
		addDays(
			finalSleepDate,
			dayShift
		);

	eventUntil.setHours(
		23,
		59,
		59,
		999
	);

	return eventUntil;
}

/* =========================
   Recurrence
========================= */

function createRRule(
	sleepDate: Date,
	eventDate: Date
) {
	if (
		scheduleMode ===
		'once'
	) {
		return null;
	}

	const dayShift =
		getCalendarDayShift(
			sleepDate,
			eventDate
		);

	const until =
		getEventUntil(
			sleepDate,
			dayShift
		);

	if (
		scheduleMode ===
		'daily'
	) {
		let rule =
			'FREQ=DAILY';

		if (until) {
			rule +=
				`;UNTIL=${formatICSUTC(
					until
				)}`;
		}

		return rule;
	}

	const sleepWeekdays =
		getSelectedWeekdays();

	const eventWeekdays =
		shiftWeekdays(
			sleepWeekdays,
			dayShift
		);

	let rule =
		'FREQ=WEEKLY;' +
		`BYDAY=${eventWeekdays.join(
			','
		)}`;

	if (until) {
		rule +=
			`;UNTIL=${formatICSUTC(
				until
			)}`;
	}

	return rule;
}

/* =========================
   Event
========================= */

function createEvent(
	slot: RoutineSlot | null,
	sleepDate: Date,
	index: number
) {
	const start =
		createEventStart(
			sleepDate,
			slot
		);

	const end =
		new Date(
			start.getTime() +
				15 * 60 * 1000
		);

	const title =
		slot
			? slot.text
			: 'Waktunya tidur';

	const rrule =
		createRRule(
			sleepDate,
			start
		);

	const lines = [
		'BEGIN:VEVENT',

		`UID:${createUID(
			index
		)}`,

		`DTSTAMP:${formatICSUTC(
			new Date()
		)}`,

		`DTSTART:${formatICSLocal(
			start
		)}`,

		`DTEND:${formatICSLocal(
			end
		)}`,

		`SUMMARY:${escapeICS(
			title
		)}`,

		'DESCRIPTION:Bagian dari rutinitas 10·3·2·1 sebelum tidur.'
	];

	if (rrule) {
		lines.push(
			`RRULE:${rrule}`
		);
	}

	lines.push(
		'BEGIN:VALARM',
		'TRIGGER:-PT30M',
		'ACTION:DISPLAY',
		`DESCRIPTION:${escapeICS(
			title
		)}`,
		'END:VALARM',
		'END:VEVENT'
	);

	return lines.join(
		'\r\n'
	);
}

/* =========================
   Calendar generation
========================= */

function getScheduleDate() {
	if (
		scheduleMode ===
		'once'
	) {
		return onceDate.value;
	}

	if (
		scheduleMode ===
		'weekly'
	) {
		return weeklyStartDate.value;
	}

	return dailyStartDate.value;
}

function validateSchedule() {
	const date =
		getScheduleDate();

	if (!date) {
		window.alert(
			'Pilih tanggal terlebih dahulu.'
		);

		return false;
	}

	if (
		!getBedtimeFromInput()
	) {
		window.alert(
			'Waktu tidur tidak valid.'
		);

		return false;
	}

	if (
		scheduleMode ===
			'weekly' &&
		getSelectedWeekdays()
			.length === 0
	) {
		window.alert(
			'Pilih setidaknya satu hari.'
		);

		return false;
	}

	return true;
}

function generateCalendar() {
	if (!validateSchedule()) {
		return;
	}

	const sleepDate =
		createSleepDate(
			getScheduleDate()
		);

	if (!sleepDate) {
		return;
	}

	const slots =
		getRoutineSlots();

	const events = [
		...slots.map(
			(slot, index) =>
				createEvent(
					slot,
					sleepDate,
					index
				)
		),

		createEvent(
			null,
			sleepDate,
			slots.length
		)
	];

	const calendar = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//10.3.2.1//Rutinitas Tidur//ID',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',

		...events,

		'END:VCALENDAR'
	].join('\r\n');

	downloadCalendar(
		calendar
	);

	calendarStatus.hidden =
		false;

	calendarStatus.textContent =
		'✓ Kalender berhasil dibuat. Buka file untuk menambahkannya ke aplikasi kalender.';

	window.setTimeout(
		() => {
			calendarStatus.hidden = true;
		},
		6000
	);
}

/* =========================
   Download
========================= */

function downloadCalendar(
	content: string
) {
	const blob =
		new Blob(
			[content],
			{
				type:
					'text/calendar;charset=utf-8'
			}
		);

	const url =
		URL.createObjectURL(
			blob
		);

	const link =
		document.createElement(
			'a'
		);

	link.href = url;

	link.download =
		'10321-rutinitas-tidur.ics';

	document.body.appendChild(
		link
	);

	link.click();
	link.remove();

	window.setTimeout(
		() => {
			URL.revokeObjectURL(
				url
			);
		},
		1000
	);
}

/* =========================
   Events
========================= */

modeButtons.forEach(
	button => {
		button.addEventListener(
			'click',
			() => {
				const mode =
					button.dataset
						.mode as
						ScheduleMode;

				setScheduleMode(
					mode
				);
			}
		);
	}
);

weekdayButtons.forEach(
	button => {
		button.addEventListener(
			'click',
			() => {
				toggleWeekday(
					button
				);
			}
		);
	}
);

const dateInputs = [
	onceDate,
	weeklyStartDate,
	dailyStartDate
];

addCalendarButton.addEventListener(
	'click',
	generateCalendar
);

/* =========================
   Init
========================= */

function initSchedule() {
	const today =
		getToday();

	onceDate.value =
		onceDate.value ||
		today;

	weeklyStartDate.value =
		weeklyStartDate.value ||
		today;

	dailyStartDate.value =
		dailyStartDate.value ||
		today;

	setScheduleMode(
		scheduleMode
	);
}

initSchedule();