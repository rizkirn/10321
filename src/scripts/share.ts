import {
	getBedtimeMinutes,
	getRoutineSlots
} from './routine';

const shareButton =
	document.querySelector<HTMLButtonElement>(
		'#share-routine'
	);

const saveButton =
	document.querySelector<HTMLButtonElement>(
		'#save-routine'
	);

const shareStatus =
	document.querySelector<HTMLElement>(
		'#share-routine-status'
	);

const WIDTH = 1080;
const HEIGHT = 1350;

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
	total: number
) {
	const normalized =
		normalizeMinutes(total);

	const hours =
		Math.floor(
			normalized / 60
		);

	const minutes =
		normalized % 60;

	return `${String(hours).padStart(
		2,
		'0'
	)}.${String(minutes).padStart(
		2,
		'0'
	)}`;
}

/* =========================
   Image helpers
========================= */

function loadImage(
	src: string
) {
	return new Promise<HTMLImageElement>(
		(resolve, reject) => {
			const image =
				new Image();

			image.onload =
				() => resolve(image);

			image.onerror =
				() => reject(
					new Error(
						`Gagal memuat ${src}`
					)
				);

			image.src = src;
		}
	);
}

function drawCoverImage(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement,
	canvasWidth: number,
	canvasHeight: number
) {
	const imageRatio =
		image.width /
		image.height;

	const canvasRatio =
		canvasWidth /
		canvasHeight;

	let sourceX = 0;
	let sourceY = 0;

	let sourceWidth =
		image.width;

	let sourceHeight =
		image.height;

	if (
		imageRatio >
		canvasRatio
	) {
		sourceWidth =
			image.height *
			canvasRatio;

		sourceX =
			(
				image.width -
				sourceWidth
			) / 2;
	} else {
		sourceHeight =
			image.width /
			canvasRatio;

		sourceY =
			(
				image.height -
				sourceHeight
			) / 2;
	}

	ctx.drawImage(
		image,
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		0,
		0,
		canvasWidth,
		canvasHeight
	);
}

function roundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	ctx.beginPath();

	ctx.roundRect(
		x,
		y,
		width,
		height,
		radius
	);
}

/* =========================
   Generate image
========================= */

async function createRoutineImage() {
	await document.fonts.ready;

	const canvas =
		document.createElement(
			'canvas'
		);

	canvas.width = WIDTH;
	canvas.height = HEIGHT;

	const ctx =
		canvas.getContext(
			'2d'
		);

	if (!ctx) {
		throw new Error(
			'Canvas tidak tersedia.'
		);
	}

	const bedtime =
		getBedtimeMinutes();

	const slots =
		getRoutineSlots();

	/* =========================
	   Background
	========================= */

	const background =
		await loadImage(
			'/backgrounds/background-mobile.webp'
		);

	drawCoverImage(
		ctx,
		background,
		WIDTH,
		HEIGHT
	);

	/*
	 * Cream overlay supaya
	 * background tetap terlihat,
	 * tapi konten tetap mudah dibaca.
	 */

	ctx.fillStyle =
		'rgba(248, 241, 232, 0.32)';

	ctx.fillRect(
		0,
		0,
		WIDTH,
		HEIGHT
	);

	/* =========================
	   Header
	========================= */

	ctx.textAlign =
		'center';

	ctx.fillStyle =
		'#a96872';

	ctx.font =
		'700 38px Gaegu';

	ctx.fillText(
		'rutinitas sebelum tidur',
		WIDTH / 2,
		82
	);

	ctx.fillStyle =
		'#594b51';

	ctx.font =
		'700 108px Gaegu';

	ctx.fillText(
		'10 · 3 · 2 · 1',
		WIDTH / 2,
		190
	);

	ctx.fillStyle =
		'#6e6065';

	ctx.font =
		'600 27px "Nunito Sans"';

	ctx.fillText(
		'Versiku untuk 10, 3, 2, dan 1 jam sebelum tidur',
		WIDTH / 2,
		250
	);

	/* =========================
	   Routine data
	========================= */

	const icons: Record<
		string,
		string
	> = {
		caffeine:
			'/icons/kopi.webp',

		meal:
			'/icons/makan.webp',

		drink:
			'/icons/minum.webp',

		screen:
			'/icons/layar.webp'
	};

	const rows = [
		...slots.map(
			slot => ({
				time:
					formatTime(
						bedtime -
							slot.hours *
								60
					),

				text:
					slot.text,

				icon:
					icons[
						slot.activity
					],

				bedtime:
					false
			})
		),

		{
			time:
				formatTime(
					bedtime
				),

			text:
				'Waktunya tidur',

			icon:
				'/icons/tidur.webp',

			bedtime:
				true
		}
	];

	const loadedIcons =
		await Promise.all(
			rows.map(
				row =>
					loadImage(
						row.icon
					)
			)
		);

	/* =========================
	   Cards
	========================= */

	const cardX = 85;
	const cardWidth = 910;

	const cardHeight = 136;
	const cardGap = 18;

	let y = 320;

	rows.forEach(
		(row, index) => {
			/*
			 * Sedikit separation
			 * sebelum bedtime.
			 */

			if (row.bedtime) {
				y += 8;
			}

			/* Card background */

			if (row.bedtime) {
				ctx.fillStyle =
					'rgba(237, 205, 208, 0.94)';
			} else {
				ctx.fillStyle =
					index % 2 === 0
						? 'rgba(255, 250, 244, 0.94)'
						: 'rgba(241, 237, 243, 0.94)';
			}

			roundedRect(
				ctx,
				cardX,
				y,
				cardWidth,
				cardHeight,
				30
			);

			ctx.fill();

			/* Border */

			ctx.lineWidth = 2;

			ctx.strokeStyle =
				row.bedtime
					? '#d9a8ae'
					: '#dfd4cf';

			ctx.stroke();

			/* Time */

			ctx.textAlign =
				'left';

			ctx.fillStyle =
				row.bedtime
					? '#704d54'
					: '#594b51';

			ctx.font =
				'700 53px Gaegu';

			ctx.fillText(
				row.time,
				125,
				y + 84
			);

			/* Icon */

			const image =
				loadedIcons[
					index
				];

			const iconSize =
				64;

			ctx.drawImage(
				image,
				330,
				y +
					(
						cardHeight -
						iconSize
					) /
						2,
				iconSize,
				iconSize
			);

			/* Activity */

			ctx.fillStyle =
				row.bedtime
					? '#62464c'
					: '#493f43';

			ctx.font =
				'700 31px "Nunito Sans"';

			ctx.fillText(
				row.text,
				425,
				y + 82
			);

			y +=
				cardHeight +
				cardGap;
		}
	);

	/* =========================
	   Footer CTA
	========================= */

	const ctaWidth = 620;
	const ctaHeight = 56;

	const ctaX =
		(WIDTH - ctaWidth) / 2;

	const ctaY = 1165;

	/* URL dimensions */

	const urlWidth = 255;
	const urlHeight = 44;

	const urlX =
		ctaX +
		ctaWidth -
		urlWidth -
		6;

	const urlY =
		ctaY +
		(ctaHeight - urlHeight) / 2;

	/* =========================
	   Outer CTA
	========================= */

	ctx.fillStyle =
		'rgba(232, 225, 235, 0.96)';

	roundedRect(
		ctx,
		ctaX,
		ctaY,
		ctaWidth,
		ctaHeight,
		28
	);

	ctx.fill();

	ctx.lineWidth = 2;

	ctx.strokeStyle =
		'rgba(205, 191, 211, 0.95)';

	ctx.stroke();

	/* =========================
	   CTA text
	========================= */

	const ctaTextCenterX =
		ctaX +
		(urlX - ctaX) / 2;

	ctx.textAlign = 'center';

	ctx.textBaseline = 'middle';

	ctx.fillStyle =
		'#67566d';

	ctx.font =
		'700 27px Gaegu';

	ctx.fillText(
		'buat rutinitasmu sendiri',
		ctaTextCenterX,
		ctaY + ctaHeight / 2
	);

	/* =========================
	   URL capsule
	========================= */

	ctx.fillStyle =
		'rgba(255, 250, 244, 0.96)';

	roundedRect(
		ctx,
		urlX,
		urlY,
		urlWidth,
		urlHeight,
		22
	);

	ctx.fill();

	ctx.lineWidth = 2;

	ctx.strokeStyle =
		'rgba(218, 205, 199, 0.95)';

	ctx.stroke();

	/* =========================
	   URL text
	========================= */

	ctx.textAlign = 'center';

	ctx.textBaseline = 'middle';

	ctx.fillStyle =
		'#665a5e';

	ctx.font =
		'700 20px "Nunito Sans"';

	ctx.fillText(
		'10321.rizkirn.my.id',
		urlX + urlWidth / 2,
		urlY + urlHeight / 2
	);

	/* Reset baseline */

	ctx.textBaseline = 'alphabetic';

	/* =========================
	   Export
	========================= */

	return new Promise<Blob>(
		(resolve, reject) => {
			canvas.toBlob(
				blob => {
					if (blob) {
						resolve(
							blob
						);

						return;
					}

					reject(
						new Error(
							'Gagal membuat gambar.'
						)
					);
				},
				'image/png'
			);
		}
	);
}

/* =========================
   Actions
========================= */

function setLoading(
	message: string
) {
	if (shareButton) {
		shareButton.disabled =
			true;
	}

	if (saveButton) {
		saveButton.disabled =
			true;
	}

	if (shareStatus) {
		shareStatus.hidden =
			false;

		shareStatus.textContent =
			message;
	}
}

function stopLoading() {
	if (shareButton) {
		shareButton.disabled =
			false;
	}

	if (saveButton) {
		saveButton.disabled =
			false;
	}
}

function createRoutineFile(
	blob: Blob
) {
	return new File(
		[blob],
		'rutinitas-10321.png',
		{
			type:
				'image/png'
		}
	);
}

/* =========================
   Share image
========================= */

async function shareRoutine() {
	if (!shareButton) {
		return;
	}

	setLoading(
		'Membuat gambar...'
	);

	try {
		const blob =
			await createRoutineImage();

		const file =
			createRoutineFile(
				blob
			);

		if (
			navigator.share &&
			(
				!navigator.canShare ||
				navigator.canShare({
					files: [
						file
					]
				})
			)
		) {
			await navigator.share({
				files: [
					file
				],

				title:
					'Rutinitas 10·3·2·1-ku',

				text:
					'Rutinitas 10·3·2·1-ku 🌙\nhttps://10321.rizkirn.my.id/'
			});

			if (
				shareStatus
			) {
				shareStatus.textContent =
					'✓ Gambar berhasil dibagikan.';
			}

			return;
		}

		if (shareStatus) {
			shareStatus.textContent =
				'Browser ini tidak mendukung berbagi gambar. Gunakan Simpan gambar.';
		}
	} catch (error) {
		if (
			error instanceof
				DOMException &&
			error.name ===
				'AbortError'
		) {
			if (
				shareStatus
			) {
				shareStatus.hidden =
					true;
			}

			return;
		}

		console.error(
			error
		);

		if (shareStatus) {
			shareStatus.textContent =
				'Gambar belum berhasil dibagikan. Coba lagi.';
		}
	} finally {
		stopLoading();
	}
}

/* =========================
   Save image
========================= */

async function saveRoutine() {
	if (!saveButton) {
		return;
	}

	setLoading(
		'Membuat gambar...'
	);

	try {
		const blob =
			await createRoutineImage();

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
			'rutinitas-10321.png';

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

		if (shareStatus) {
			shareStatus.textContent =
				'✓ Gambar berhasil disimpan.';
		}
	} catch (error) {
		console.error(
			error
		);

		if (shareStatus) {
			shareStatus.textContent =
				'Gambar belum berhasil disimpan. Coba lagi.';
		}
	} finally {
		stopLoading();
	}
}

/* =========================
   Events
========================= */

shareButton?.addEventListener(
	'click',
	shareRoutine
);

saveButton?.addEventListener(
	'click',
	saveRoutine
);