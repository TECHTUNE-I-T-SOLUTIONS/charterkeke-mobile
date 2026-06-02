import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export type RideReceiptAudience = 'rider' | 'driver';
export type RideReceiptFormat = 'pdf' | 'image';

type AnyRide = Record<string, any>;

function money(value: unknown) {
  const amount = Number(value || 0);
  return `₦${Number.isFinite(amount) ? amount.toLocaleString() : '0'}`;
}

function text(value: unknown, fallback = 'Not available') {
  const output = String(value ?? '').trim();
  return output || fallback;
}

function dateTime(value: unknown) {
  if (!value) return 'Not available';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function receiptNumber(ride: AnyRide) {
  return `CK-${String(ride.id || 'ride').replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

export function normalizeRideReceipt(ride: AnyRide, audience: RideReceiptAudience) {
  const fare = Number(ride.fare_amount ?? ride.fare ?? 0);
  const platformFee = Number(ride.platform_fee ?? 0);
  const total = audience === 'rider' ? fare + platformFee : fare;
  const driverEarnings = Number(ride.driver_earnings ?? Math.max(0, fare - platformFee));
  const driver = ride.drivers || ride.driver || {};
  const driverUser = driver.users || ride.driver_user || {};
  const riderUser = ride.users || ride.rider || ride.rider_user || {};

  return {
    id: text(ride.id),
    number: receiptNumber(ride),
    status: text(ride.status, 'pending').toUpperCase(),
    createdAt: dateTime(ride.created_at || ride.createdAt),
    completedAt: ride.completed_at ? dateTime(ride.completed_at) : '',
    pickup: text(ride.pickup_zone || ride.pickup),
    dropoff: text(ride.destination_zone || ride.destination || ride.dropoff),
    pickupDescription: text(ride.pickup_description, ''),
    dropoffDescription: text(ride.destination_description, ''),
    distance: Number(ride.distance_km || ride.distance || 0),
    duration: Number(ride.duration_minutes || ride.duration || 0),
    fare,
    platformFee,
    total,
    driverEarnings,
    paymentMethod: text(ride.payment_method, 'Wallet'),
    riderName: text(`${riderUser.first_name || ''} ${riderUser.last_name || ''}`.trim(), 'Rider'),
    riderPhone: text(riderUser.phone_number, ''),
    driverName: text(`${driverUser.first_name || driver.first_name || ''} ${driverUser.last_name || driver.last_name || ''}`.trim(), 'Driver'),
    driverPhone: text(driverUser.phone_number || driver.phone_number, ''),
    vehicle: text(driver.vehicle_type || ride.vehicle_type, 'Keke'),
    plateNumber: text(driver.plate_number || ride.plate_number, ''),
  };
}

function escapeHtml(raw: unknown) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderRideReceiptHtml(ride: AnyRide, audience: RideReceiptAudience) {
  const data = normalizeRideReceipt(ride, audience);
  const isDriver = audience === 'driver';
  return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f6f2ec; color: #171717; font-family: Arial, Helvetica, sans-serif; }
    .page { max-width: 760px; margin: 0 auto; padding: 28px; }
    .receipt { background: #fff; border: 1px solid #f0dec8; border-radius: 26px; overflow: hidden; box-shadow: 0 18px 54px rgba(24,24,27,.10); }
    .hero { background: #111; color: #fff; padding: 28px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo { width: 58px; height: 58px; border-radius: 16px; object-fit: cover; border: 1px solid rgba(255,138,0,.45); }
    .eyebrow { color: #ff8a00; font-size: 12px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 4px 0 0; font-size: 30px; line-height: 1.12; }
    .meta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
    .pill { padding: 9px 12px; border-radius: 999px; background: rgba(255,255,255,.09); font-size: 12px; font-weight: 800; }
    .content { padding: 28px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 1px solid #f0dec8; border-radius: 18px; padding: 18px; background: #fffdf9; }
    .label { color: #7c5b37; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 8px; }
    .value { color: #171717; font-size: 16px; line-height: 1.45; font-weight: 800; }
    .muted { color: #6b7280; font-size: 13px; line-height: 1.45; margin-top: 6px; }
    .route { margin: 18px 0; border: 1px solid #f0dec8; border-radius: 20px; overflow: hidden; }
    .route-row { display: grid; grid-template-columns: 26px 1fr; gap: 14px; padding: 18px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; background: #ff8a00; margin: 5px auto 0; }
    .line { width: 2px; min-height: 48px; background: #e9d8c2; margin: 6px auto; }
    .square { width: 12px; height: 12px; border: 2px solid #111; margin: 0 auto; }
    .fare { background: #111; color: #fff; border-radius: 20px; padding: 20px; margin-top: 18px; }
    .fare-row { display: flex; justify-content: space-between; gap: 14px; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.12); }
    .fare-row:last-child { border-bottom: 0; }
    .fare-total { color: #ff8a00; font-size: 28px; font-weight: 900; }
    .footer { background: #ff8a00; color: #111; padding: 16px 28px; font-size: 13px; font-weight: 800; }
    @media (max-width: 640px) { .page { padding: 12px; } .grid { grid-template-columns: 1fr; } h1 { font-size: 24px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="receipt">
      <div class="hero">
        <div class="brand">
          <img class="logo" src="https://admin.charterkeke.com/charter%20keke.png" />
          <div>
            <div class="eyebrow">Charter Keke</div>
            <h1>${isDriver ? 'Driver Ride Sheet' : 'Ride Receipt'}</h1>
          </div>
        </div>
        <div class="meta">
          <div class="pill">${escapeHtml(data.number)}</div>
          <div class="pill">${escapeHtml(data.status)}</div>
          <div class="pill">${escapeHtml(data.createdAt)}</div>
        </div>
      </div>
      <div class="content">
        <div class="grid">
          <div class="card"><div class="label">Rider</div><div class="value">${escapeHtml(data.riderName)}</div><div class="muted">${escapeHtml(data.riderPhone)}</div></div>
          <div class="card"><div class="label">Driver</div><div class="value">${escapeHtml(data.driverName)}</div><div class="muted">${escapeHtml(data.vehicle)} ${escapeHtml(data.plateNumber)}</div></div>
        </div>
        <div class="route">
          <div class="route-row">
            <div><div class="dot"></div><div class="line"></div><div class="square"></div></div>
            <div>
              <div class="label">Pickup</div>
              <div class="value">${escapeHtml(data.pickup)}</div>
              ${data.pickupDescription ? `<div class="muted">${escapeHtml(data.pickupDescription)}</div>` : ''}
              <div style="height:22px"></div>
              <div class="label">Dropoff</div>
              <div class="value">${escapeHtml(data.dropoff)}</div>
              ${data.dropoffDescription ? `<div class="muted">${escapeHtml(data.dropoffDescription)}</div>` : ''}
            </div>
          </div>
        </div>
        <div class="grid">
          <div class="card"><div class="label">Distance</div><div class="value">${data.distance ? `${data.distance.toFixed(1)} km` : 'Not calculated'}</div></div>
          <div class="card"><div class="label">Duration</div><div class="value">${data.duration ? `${Math.round(data.duration)} min` : 'Not calculated'}</div></div>
        </div>
        <div class="fare">
          <div class="fare-row"><span>Ride fare</span><strong>${money(data.fare)}</strong></div>
          ${isDriver ? `<div class="fare-row"><span>Platform fee</span><strong>-${money(data.platformFee)}</strong></div>` : `<div class="fare-row"><span>Platform and booking fee</span><strong>${money(data.platformFee)}</strong></div>`}
          <div class="fare-row"><span>${isDriver ? 'Driver earning' : 'Total payable'}</span><span class="fare-total">${money(isDriver ? data.driverEarnings : data.total)}</span></div>
        </div>
      </div>
      <div class="footer">Keep this ${isDriver ? 'ride sheet' : 'receipt'} for pickup confirmation and support reference.</div>
    </div>
  </div>
</body>
</html>`;
}

export function renderRideReceiptSvg(ride: AnyRide, audience: RideReceiptAudience) {
  const data = normalizeRideReceipt(ride, audience);
  const isDriver = audience === 'driver';
  const lines = [
    ['Rider', data.riderName],
    ['Driver', `${data.driverName} ${data.plateNumber ? `- ${data.plateNumber}` : ''}`],
    ['Pickup', data.pickup],
    ['Dropoff', data.dropoff],
    ['Distance', data.distance ? `${data.distance.toFixed(1)} km` : 'Not calculated'],
    ['Duration', data.duration ? `${Math.round(data.duration)} min` : 'Not calculated'],
    [isDriver ? 'Driver earning' : 'Total payable', money(isDriver ? data.driverEarnings : data.total)],
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#f6f2ec"/>
  <rect x="70" y="70" width="940" height="1210" rx="42" fill="#ffffff" stroke="#f0dec8" stroke-width="3"/>
  <rect x="70" y="70" width="940" height="250" rx="42" fill="#111111"/>
  <text x="120" y="150" fill="#ff8a00" font-family="Arial" font-size="26" font-weight="900" letter-spacing="5">CHARTER KEKE</text>
  <text x="120" y="212" fill="#ffffff" font-family="Arial" font-size="54" font-weight="900">${isDriver ? 'Driver Ride Sheet' : 'Ride Receipt'}</text>
  <text x="120" y="274" fill="#ffffff" opacity=".82" font-family="Arial" font-size="28">${escapeHtml(data.number)} • ${escapeHtml(data.status)}</text>
  <rect x="120" y="370" width="840" height="120" rx="24" fill="#fff8ef" stroke="#f0dec8" stroke-width="2"/>
  <text x="150" y="420" fill="#7c5b37" font-family="Arial" font-size="22" font-weight="900">CREATED</text>
  <text x="150" y="460" fill="#171717" font-family="Arial" font-size="30" font-weight="800">${escapeHtml(data.createdAt)}</text>
  ${lines.map((row, index) => {
    const y = 560 + index * 92;
    const isTotal = index === lines.length - 1;
    return `<text x="150" y="${y}" fill="#7c5b37" font-family="Arial" font-size="22" font-weight="900">${escapeHtml(row[0]).toUpperCase()}</text>
    <text x="150" y="${y + 40}" fill="${isTotal ? '#ff8a00' : '#171717'}" font-family="Arial" font-size="${isTotal ? 42 : 30}" font-weight="900">${escapeHtml(row[1]).slice(0, 46)}</text>`;
  }).join('')}
  <rect x="70" y="1190" width="940" height="90" fill="#ff8a00"/>
  <text x="120" y="1247" fill="#111111" font-family="Arial" font-size="26" font-weight="900">Affordable Keke rides in Lagos</text>
</svg>`;
}

async function ensureSharingAvailable() {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
}

export async function exportRideReceipt(ride: AnyRide, audience: RideReceiptAudience, format: RideReceiptFormat) {
  if (!ride?.id) throw new Error('Ride details are not ready yet.');

  if (format === 'pdf') {
    const { uri } = await Print.printToFileAsync({
      html: renderRideReceiptHtml(ride, audience),
      base64: false,
    });
    const target = `${FileSystem.documentDirectory}${receiptNumber(ride)}.pdf`;
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  }

  throw new Error('Image receipts are generated from the on-screen receipt template.');
}

export async function shareRideReceipt(ride: AnyRide, audience: RideReceiptAudience, format: RideReceiptFormat) {
  await ensureSharingAvailable();
  const uri = await exportRideReceipt(ride, audience, format);
  await Sharing.shareAsync(uri, {
    dialogTitle: `Share ${format === 'pdf' ? 'PDF' : 'image'} ride receipt`,
    mimeType: format === 'pdf' ? 'application/pdf' : 'image/svg+xml',
    UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.svg-image',
  });
  return uri;
}

export async function saveCapturedRideReceiptImage(sourceUri: string, ride: AnyRide) {
  const target = `${FileSystem.documentDirectory}${receiptNumber(ride)}.png`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
}

export async function shareReceiptFile(uri: string, format: RideReceiptFormat) {
  await ensureSharingAvailable();
  await Sharing.shareAsync(uri, {
    dialogTitle: `Share ${format === 'pdf' ? 'PDF' : 'image'} ride receipt`,
    mimeType: format === 'pdf' ? 'application/pdf' : 'image/png',
    UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.png',
  });
}
