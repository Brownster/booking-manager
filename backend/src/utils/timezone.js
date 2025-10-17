import moment from 'moment-timezone';

export const isValidTimezone = (timezone) => Boolean(timezone && moment.tz.zone(timezone));

export const toTimezone = (date, timezone) => moment(date).tz(timezone);

export const convertToUtc = (date, timezone) => moment.tz(date, timezone).utc();

export const describeTimezone = (timezone) => {
  if (!isValidTimezone(timezone)) {
    return null;
  }

  const now = moment().tz(timezone);
  return {
    name: timezone,
    offset: now.format('Z')
  };
};
