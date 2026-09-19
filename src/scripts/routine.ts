type ActivityKey = keyof typeof activities;

type Slot = {
	hours: number;
	activity: ActivityKey;
};

const activities = {
	caffeine: {
		icon: '/icons/kopi.webp',
		text: 'Berhenti minum kafein'
	},

	meal: {
		icon: '/icons/makan.webp',
		text: 'Selesaikan makan'
	},

	drink: {
		icon: '/icons/minum.webp',
		text: 'Batasi minum'
	},

	screen: {
		icon: '/icons/layar.webp',
		text: 'Tinggalkan layar'
	}
};

const slots: Slot[] = [
	{
		hours: 10,
		activity: 'caffeine'
	},
	{
		hours: 3,
		activity: 'meal'
	},
	{
		hours: 2,
		activity: 'drink'
	},
	{
		hours: 1,
		activity: 'screen'
	}
];

const STORAGE_KEY = '10321-routine';

const routine =
	document.querySelector<HTMLElement>(
		'#routine'
	)!;

const sleepInput =
	document.querySelector<HTMLInputElement>(
		'#sleep-time'
	)!;

const status =
	document.querySelector<HTMLElement>(
		'#status'
	)!;

const pickerButton =
	document.querySelector<HTMLButtonElement>(
		'#time-picker-button'
	)!;

const pickerPanel =
	document.querySelector<HTMLElement>(
		'#time-picker-panel'
	)!;

const pickerHour =
	document.querySelector<HTMLInputElement>(
		'#picker-hour'
	)!;

const pickerMinute =
	document.querySelector<HTMLInputElement>(
		'#picker-minute'
	)!;

const pickerDone =
	document.querySelector<HTMLButtonElement>(
		'#time-picker-done'
	)!;

const resetButton =
	document.querySelector<HTMLButtonElement>(
		'#reset-routine'
	)!;

let bedtimeMinutes = 22 * 60;

let selected: number | null = null;
let suppressClick = false;

let pointerX = 0;
let pointerY = 0;
let animationFrame = 0;

let drag: {
	from: number;
	to: number;

	startX: number;
	startY: number;

	offsetX: number;
	offsetY: number;

	card: HTMLElement;
	ghost: HTMLElement | null;

	active: boolean;
	pointerType: string;
} | null = null;

/* =========================
   Storage
========================= */

function saveRoutine() {
	const data = {
		bedtimeMinutes,

		activities: slots.map(
			slot => slot.activity
		)
	};

	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(data)
		);
	} catch {
		// Storage may be unavailable.
	}
}

function loadRoutine() {
	try {
		const saved =
			localStorage.getItem(
				STORAGE_KEY
			);

		if (!saved) return;

		const data = JSON.parse(saved);

		if (
			typeof data.bedtimeMinutes ===
				'number' &&
			data.bedtimeMinutes >= 0 &&
			data.bedtimeMinutes < 1440
		) {
			bedtimeMinutes =
				data.bedtimeMinutes;
		}

		if (
			Array.isArray(
				data.activities
			) &&
			data.activities.length ===
				slots.length
		) {
			const validActivities =
				Object.keys(activities);

			const isValid =
				data.activities.every(
					(activity: string) =>
						validActivities.includes(
							activity
						)
				);

			const isUnique =
				new Set(
					data.activities
				).size ===
				slots.length;

			if (
				isValid &&
				isUnique
			) {
				slots.forEach(
					(slot, index) => {
						slot.activity =
							data.activities[
								index
							];
					}
				);
			}
		}
	} catch {
		try {
			localStorage.removeItem(
				STORAGE_KEY
			);
		} catch {
			// Ignore unavailable storage.
		}
	}
}

function resetRoutine() {
	bedtimeMinutes = 22 * 60;

	slots[0].activity = 'caffeine';
	slots[1].activity = 'meal';
	slots[2].activity = 'drink';
	slots[3].activity = 'screen';

	selected = null;

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Storage may be unavailable.
	}

	syncPickerFromBedtime();
	render();

	status.textContent =
		'Rutinitas sudah dikembalikan ke pengaturan awal.';
}

/* =========================
   Time
========================= */

function normalizeMinutes(
	total: number
) {
	return (
		((total % 1440) + 1440) %
		1440
	);
}

function formatTime(
	totalMinutes: number
) {
	const normalized =
		normalizeMinutes(
			totalMinutes
		);

	const hours =
		Math.floor(
			normalized / 60
		);

	const minutes =
		normalized % 60;

	return `${String(hours).padStart(
		2,
		'0'
	)}:${String(minutes).padStart(
		2,
		'0'
	)}`;
}

function formatDisplayTime(
	totalMinutes: number
) {
	return formatTime(
		totalMinutes
	).replace(':', '.');
}

function parseTime(
	value: string
) {
	const cleaned =
		value
			.trim()
			.replace('.', ':');

	const match =
		cleaned.match(
			/^(\d{1,2})(?::(\d{0,2}))?$/
		);

	if (!match) {
		return null;
	}

	const hours =
		Number(match[1]);

	const minutePart =
		match[2] ?? '';

	const minutes =
		minutePart === ''
			? 0
			: Number(
					minutePart
				);

	if (
		hours < 0 ||
		hours > 23 ||
		minutes < 0 ||
		minutes > 59
	) {
		return null;
	}

	return (
		hours * 60 +
		minutes
	);
}

function syncPickerFromBedtime() {
	const hours =
		Math.floor(
			bedtimeMinutes / 60
		);

	const minutes =
		bedtimeMinutes % 60;

	pickerHour.value =
		String(hours).padStart(
			2,
			'0'
		);

	pickerMinute.value =
		String(minutes).padStart(
			2,
			'0'
		);

	sleepInput.value =
		formatTime(
			bedtimeMinutes
		);
}

function updateBedtime(
	minutes: number
) {
	bedtimeMinutes =
		normalizeMinutes(
			minutes
		);

	syncPickerFromBedtime();

	selected = null;

	saveRoutine();
	render();
}

function commitTypedTime() {
	const parsed =
		parseTime(
			sleepInput.value
		);

	if (parsed === null) {
		sleepInput.value =
			formatTime(
				bedtimeMinutes
			);

		return;
	}

	updateBedtime(parsed);
}

function getPickerMinutes() {
	let hours =
		Number(
			pickerHour.value
		);

	let minutes =
		Number(
			pickerMinute.value
		);

	if (
		!Number.isFinite(hours)
	) {
		hours = 0;
	}

	if (
		!Number.isFinite(minutes)
	) {
		minutes = 0;
	}

	hours =
		(
			(Math.trunc(hours) % 24) +
			24
		) % 24;

	minutes =
		(
			(Math.trunc(minutes) % 60) +
			60
		) % 60;

	return (
		hours * 60 +
		minutes
	);
}

function commitPicker() {
	updateBedtime(
		getPickerMinutes()
	);
}

function openPicker() {
	syncPickerFromBedtime();

	pickerPanel.hidden = false;

	pickerButton.setAttribute(
		'aria-expanded',
		'true'
	);

	sleepInput.setAttribute(
		'aria-expanded',
		'true'
	);
}

function closePicker() {
	pickerPanel.hidden = true;

	pickerButton.setAttribute(
		'aria-expanded',
		'false'
	);

	sleepInput.setAttribute(
		'aria-expanded',
		'false'
	);
}

function togglePicker() {
	if (pickerPanel.hidden) {
		openPicker();
	} else {
		closePicker();
	}
}

function stepTime(
	part: 'hour' | 'minute',
	direction: number
) {
	let minutes =
		getPickerMinutes();

	if (part === 'hour') {
		minutes +=
			direction * 60;
	} else {
		minutes +=
			direction * 5;
	}

	updateBedtime(minutes);
}

/* =========================
   Routine render
========================= */

function render() {
	const bedtime =
		formatDisplayTime(
			bedtimeMinutes
		);

	routine.innerHTML = `
		${slots
			.map(
				(slot, index) => {
					const activity =
						activities[
							slot.activity
						];

					return `
						<button
							type="button"
							class="routine-item ${
								selected ===
								index
									? 'selected'
									: ''
							}"
							data-index="${index}"
							draggable="false"
							aria-pressed="${
								selected ===
								index
							}"
							aria-label="${
								slot.hours
							} jam sebelum tidur, ${
								activity.text
							}"
						>
							<span class="routine-time">
								${formatDisplayTime(
									bedtimeMinutes -
										slot.hours *
											60
								)}
							</span>

							<span class="routine-activity">
								<span
									class="activity-icon"
									aria-hidden="true"
								>
									<img
										src="${activity.icon}"
										alt=""
										draggable="false"
									/>
								</span>

								<span class="activity-text">
									${activity.text}
								</span>
							</span>

							<span class="routine-offset">
								${slot.hours} jam sebelumnya
							</span>

							<span
								class="drag-handle"
								aria-hidden="true"
							>
								≡
							</span>
						</button>
					`;
				}
			)
			.join('')}

		<div class="routine-item bedtime">
			<span class="routine-time">
				${bedtime}
			</span>

			<span class="routine-activity">
				<span
					class="activity-icon"
					aria-hidden="true"
				>
					<img
						src="/icons/tidur.webp"
						alt=""
						draggable="false"
					/>
				</span>

				<span class="activity-text">
					Waktunya tidur
				</span>
			</span>
		</div>
	`;

	bindCards();
}

/* =========================
   Swap
========================= */

function swap(
	a: number,
	b: number
) {
	const activity =
		slots[a].activity;

	slots[a].activity =
		slots[b].activity;

	slots[b].activity =
		activity;

	selected = null;

	saveRoutine();
	render();
}

function choose(
	index: number
) {
	if (selected === null) {
		selected = index;

		status.textContent =
			'Pilih aktivitas lain untuk menukar waktunya.';

		render();

		return;
	}

	if (selected === index) {
		selected = null;

		status.textContent =
			'Kamu juga bisa tap dua aktivitas untuk menukarnya.';

		render();

		return;
	}

	swap(
		selected,
		index
	);

	status.textContent =
		'Waktunya sudah ditukar.';
}

/* =========================
   Drag
========================= */

function bindCards() {
	const cards =
		routine.querySelectorAll<HTMLElement>(
			'button.routine-item'
		);

	cards.forEach(card => {
		card.addEventListener(
			'pointerdown',
			event => {
				if (
					event.pointerType === 'mouse' &&
					event.button !== 0
				) {
					return;
				}

				if (
					event.pointerType === 'touch' &&
					!(event.target as Element).closest(
						'.drag-handle'
					)
				) {
					return;
				}

				const rect =
					card.getBoundingClientRect();

				drag = {
					from: Number(
						card.dataset.index
					),

					to: Number(
						card.dataset.index
					),

					startX:
						event.clientX,

					startY:
						event.clientY,

					offsetX:
						event.clientX -
						rect.left,

					offsetY:
						event.clientY -
						rect.top,

					card,

					ghost: null,

					active: false,

					pointerType:
						event.pointerType
				};
			}
		);

		card.addEventListener(
			'click',
			() => {
				if (suppressClick) {
					return;
				}

				choose(
					Number(
						card.dataset.index
					)
				);
			}
		);
	});
}

function startVisualDrag(
	event: PointerEvent
) {
	if (
		!drag ||
		drag.active
	) {
		return;
	}

	drag.active = true;
	suppressClick = true;

	const rect =
		drag.card.getBoundingClientRect();

	const ghost =
		drag.card.cloneNode(
			true
		) as HTMLElement;

	const left =
		Math.round(
			event.clientX -
				drag.offsetX
		);

	const top =
		Math.round(
			event.clientY -
				drag.offsetY
		);

	ghost.classList.remove(
		'selected',
		'drag-source',
		'drag-over'
	);

	ghost.classList.add(
		'drag-ghost'
	);

	ghost.removeAttribute(
		'data-index'
	);

	ghost.setAttribute(
		'aria-hidden',
		'true'
	);

	Object.assign(
		ghost.style,
		{
			width:
				`${rect.width}px`,

			height:
				`${rect.height}px`,

			transform:
				`translate3d(${left}px, ${top}px, 0)`,

			opacity: '0'
		}
	);

	drag.ghost = ghost;

	drag.card.classList.add(
		'drag-source'
	);

	document.body.appendChild(
		ghost
	);

	requestAnimationFrame(
		() => {
			if (
				ghost.isConnected
			) {
				ghost.style.opacity =
					'.96';
			}
		}
	);

	status.textContent =
		'Lepaskan di aktivitas yang ingin ditukar.';
}

function clearTargets() {
	routine
		.querySelectorAll(
			'.drag-over'
		)
		.forEach(element => {
			element.classList.remove(
				'drag-over'
			);
		});
}

function findTarget(
	x: number,
	y: number
) {
	return (
		document
			.elementsFromPoint(
				x,
				y
			)
			.map(element =>
				element.closest<HTMLElement>(
					'button.routine-item[data-index]'
				)
			)
			.find(
				element =>
					element &&
					element !==
						drag?.card
			) ?? null
	);
}

function updateDragFrame() {
	animationFrame = 0;

	if (!drag?.ghost) {
		return;
	}

	const left =
		Math.round(
			pointerX -
				drag.offsetX
		);

	const top =
		Math.round(
			pointerY -
				drag.offsetY
		);

	drag.ghost.style.transform =
		`translate3d(${left}px, ${top}px, 0)`;

	clearTargets();

	const target =
		findTarget(
			pointerX,
			pointerY
		);

	if (target) {
		const index =
			Number(
				target.dataset
					.index
			);

		drag.to = index;

		if (
			index !==
			drag.from
		) {
			target.classList.add(
				'drag-over'
			);
		}
	} else {
		drag.to =
			drag.from;
	}
}

function scheduleDragFrame(
	x: number,
	y: number
) {
	pointerX = x;
	pointerY = y;

	if (animationFrame) {
		return;
	}

	animationFrame =
		requestAnimationFrame(
			updateDragFrame
		);
}

function finishDrag() {

	if (!drag) {
		return;
	}

	if (animationFrame) {
		cancelAnimationFrame(
			animationFrame
		);

		animationFrame = 0;
	}

	const {
		from,
		to,
		active,
		ghost,
		card
	} = drag;

	clearTargets();

	if (!active) {
		drag = null;
		return;
	}

	card.classList.remove(
		'drag-source'
	);

	if (ghost) {
		ghost.style.opacity =
			'0';
	}

	drag = null;

	window.setTimeout(
		() => {
			ghost?.remove();

			if (
				from !== to
			) {
				swap(
					from,
					to
				);

				status.textContent =
					'Waktunya sudah ditukar.';
			} else {
				render();
			}

			requestAnimationFrame(
				() => {
					suppressClick =
						false;
				}
			);
		},
		80
	);
}

document.addEventListener(
	'pointermove',
	event => {
		if (!drag) {
			return;
		}

		const distance =
			Math.hypot(
				event.clientX -
					drag.startX,

				event.clientY -
					drag.startY
			);

		const threshold =
			drag.pointerType ===
			'mouse'
				? 2
				: 7;

		if (
			!drag.active &&
			distance < threshold
		) {
			return;
		}

		event.preventDefault();

		startVisualDrag(
			event
		);

		scheduleDragFrame(
			event.clientX,
			event.clientY
		);
	},
	{
		passive: false
	}
);

document.addEventListener(
	'pointerup',
	finishDrag
);

document.addEventListener(
	'pointercancel',
	finishDrag
);

/* =========================
   Time picker events
========================= */

pickerButton.addEventListener(
	'click',
	togglePicker
);

sleepInput.addEventListener(
	'focus',
	openPicker
);

sleepInput.addEventListener(
	'keydown',
	event => {
		if (
			event.key ===
			'Enter'
		) {
			commitTypedTime();

			closePicker();

			sleepInput.blur();
		}

		if (
			event.key ===
			'Escape'
		) {
			sleepInput.value =
				formatTime(
					bedtimeMinutes
				);

			closePicker();

			sleepInput.blur();
		}
	}
);

sleepInput.addEventListener(
	'blur',
	() => {
		commitTypedTime();
	}
);

document
	.querySelectorAll<HTMLButtonElement>(
		'.time-step'
	)
	.forEach(button => {
		button.addEventListener(
			'click',
			() => {
				const part =
					button.dataset
						.part as
						| 'hour'
						| 'minute';

				const direction =
					Number(
						button.dataset
							.direction
					);

				stepTime(
					part,
					direction
				);
			}
		);
	});

pickerHour.addEventListener(
	'change',
	commitPicker
);

pickerMinute.addEventListener(
	'change',
	commitPicker
);

pickerDone.addEventListener(
	'click',
	() => {
		commitPicker();
		closePicker();
	}
);

document.addEventListener(
	'pointerdown',
	event => {
		if (
			pickerPanel.hidden
		) {
			return;
		}

		const target =
			event.target as Node;

		if (
			pickerPanel.contains(
				target
			) ||
			pickerButton.contains(
				target
			) ||
			sleepInput.contains(
				target
			)
		) {
			return;
		}

		commitPicker();
		closePicker();
	}
);

resetButton.addEventListener(
	'click',
	resetRoutine
);

/* =========================
   Public routine data
========================= */

export function getBedtimeMinutes() {
	return bedtimeMinutes;
}

export function getRoutineSlots() {
	return slots.map(slot => ({
		hours: slot.hours,
		activity: slot.activity,
		text:
			activities[
				slot.activity
			].text
	}));
}

/* =========================
   Init
========================= */

loadRoutine();
syncPickerFromBedtime();
render();