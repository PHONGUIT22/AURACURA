/**
 * Calendar service for generating and downloading RFC-5545 .ICS calendar files.
 */
interface CalendarEventInput {
  title: string;
  description: string;
  location: string;
  startDate?: Date;
  durationHours?: number;
}

export const calendarService = {
  downloadIcsEvent(event: CalendarEventInput) {
    if (typeof window === 'undefined') return;

    const start = event.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default tomorrow
    const end = new Date(start.getTime() + (event.durationHours || 2) * 60 * 60 * 1000);

    const formatIcsDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const clean = (text: string) => text.replace(/\n/g, '\\n').replace(/,/g, '\\,');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CuraVIP//Executive Concierge Protocol//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:curavip-${Date.now()}@curavip.ai`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${clean(event.title)}`,
      `DESCRIPTION:${clean(event.description)}`,
      `LOCATION:${clean(event.location)}`,
      'STATUS:CONFIRMED',
      'CLASS:PUBLIC',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: CuraVIP Executive Dining Session',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
