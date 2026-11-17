/**
 * When the sun rises and sets, worked out on the device (no internet
 * needed). Uses the standard "sunrise equation"; good to about a minute.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
/** Julian day of 1 January 1970, 00:00 UTC */
const JULIAN_1970 = 2440587.5;
const JULIAN_2000 = 2451545;

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/** Sunrise and sunset on the day of `date`, at latitude/longitude in degrees. */
export function sunTimes(date: Date, latitude: number, longitude: number): SunTimes {
  // The day number since 2000, counted at the place's local solar noon
  const julianDay = (date.getTime() / DAY_MS + JULIAN_1970);
  const n = Math.round(julianDay - JULIAN_2000 - 0.0009 + longitude / 360);
  const meanSolarNoon = n - longitude / 360;

  const meanAnomaly = (357.5291 + 0.98560028 * meanSolarNoon) % 360;
  const m = meanAnomaly * RAD;
  const center = 1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m);
  const eclipticLongitude = ((meanAnomaly + center + 180 + 102.9372) % 360) * RAD;
  const transit =
    JULIAN_2000 + meanSolarNoon + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * eclipticLongitude);

  const declination = Math.asin(Math.sin(eclipticLongitude) * Math.sin(23.4397 * RAD));
  const phi = latitude * RAD;
  const cosHourAngle =
    (Math.sin(-0.833 * RAD) - Math.sin(phi) * Math.sin(declination)) /
    (Math.cos(phi) * Math.cos(declination));
  // (Never true for Zurich, but keeps the maths safe near the poles)
  const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosHourAngle))) / RAD;

  const toDate = (julian: number) => new Date((julian - JULIAN_1970) * DAY_MS);
  return {
    sunrise: toDate(transit - hourAngle / 360),
    sunset: toDate(transit + hourAngle / 360),
  };
}
