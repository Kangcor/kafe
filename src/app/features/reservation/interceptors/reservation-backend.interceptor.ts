import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';

const regionsKey = 'kafe-mocked-regions';
let regions: any = JSON.parse(localStorage.getItem(regionsKey)!) ||
{
  'MAIN_HALL': { maxCapacity: 40, childrenAllowed: true, smokingAllowed: false, maxSeating: 12, reservationsCalendar: {} },
  'BAR': { maxCapacity: 14, childrenAllowed: false, smokingAllowed: false, maxSeating: 4, reservationsCalendar: {} },
  'RIVERSIDE': { maxCapacity: 30, childrenAllowed: true, smokingAllowed: false, maxSeating: 8, reservationsCalendar: {} },
  'RIVERSIDE_SMOKING': { maxCapacity: 20, childrenAllowed: false, smokingAllowed: true, maxSeating: 6, reservationsCalendar: {} }
};
const reservationsKey = 'kafe-mocked-reservations';
let reservations: any[] = JSON.parse(localStorage.getItem(reservationsKey)!) || [];

export function loggingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const { url, method, headers, body } = req;

  return handleRoute();

  function handleRoute() {
    switch (true) {
      case url.endsWith('/reservation/validate') && method === 'POST':
        return checkReservationCapacity();
      case url.endsWith('/reservation') && method === 'POST':
        return addReservation();
      case url.endsWith('/regions') && method === 'GET':
        return getRegions();
      case url.match(/\/reservation\/\d+$/) && method === 'GET':
        return getReservationById();
      default:
        return next(req);
    }

    function getRegions() {
      return ok(regions);
    }

    function getReservationById() {
      const id = idFromUrl();
      if (id < reservations.length) {
        return ok(reservations[id]);
      } else {
        return error('Reservation not found');
      }

    }

    function checkReservationCapacity() {
      const reservation: any = body
      const calendar = regions[reservation.region].reservationsCalendar;
      const [month, day, year] = [
        reservation.date.getMonth(),
        reservation.date.getDate(),
        reservation.date.getFullYear(),
      ];
      const date = `${month}-${day}-${year}`;
      if (date in calendar) {
        let reservationCalendarDay = calendar[date]
        const mapHourToId: any = { '6:00pm': 0, '6:30pm': 1, '7:00pm': 2, '7:30pm': 3, '8:00pm': 4, '8:30pm': 5, '9:00pm': 6, '9:30pm': 7, '10:00pm': 8, '10:30pm': 9, '11:00pm': 10, '11:30pm': 11 }
        const hourID: number = mapHourToId[reservation.time];
        const slotsToCheck = reservationCalendarDay.slice(hourID, hourID + 4);
        if (slotsToCheck.every((slotCapacity: number) => {
          return slotCapacity + parseInt(reservation.numberOfPeople) <= regions[reservation.region].maxCapacity;
        })) {
          return ok(true);
        } else {
          return ok(false)
        }
      } else if (reservation.numberOfPeople <= regions[reservation.region].maxCapacity) {
        return ok(true);
      } else {
        return ok(false)
      }
    }

    function addReservation() {
      const reservation: any = body
      reservation.id = reservations.length;
      reservations.push(reservation);
      localStorage.setItem(reservationsKey, JSON.stringify(reservations));
      addReservationToRegion(reservation);
      console.log('reservation returned', reservation);
      return ok(reservation);
    }

    function addReservationToRegion(reservation: any) {
      const calendar = regions[reservation.region].reservationsCalendar;
      const [month, day, year] = [
        reservation.date.getMonth(),
        reservation.date.getDate(),
        reservation.date.getFullYear(),
      ];
      const date = `${month}-${day}-${year}`;
      let reservationCalendarDay = date in calendar ? calendar[date] : Array(12).fill(0);
      const mapHourToId: any = { '6:00pm': 0, '6:30pm': 1, '7:00pm': 2, '7:30pm': 3, '8:00pm': 4, '8:30pm': 5, '9:00pm': 6, '9:30pm': 7, '10:00pm': 8, '10:30pm': 9, '11:00pm': 10, '11:30pm': 11 }
      const hourID: number = mapHourToId[reservation.time];
      reservationCalendarDay = reservationCalendarDay.map((occupation: any, index: any) => {
        if (index < hourID) return occupation;
        else if (index <= hourID + 3) return occupation + parseInt(reservation.numberOfPeople);
        else return occupation;
      })
      calendar[date] = reservationCalendarDay;
      localStorage.setItem(regionsKey, JSON.stringify(regions));
    }

    function ok(body?: any) {
      return of(new HttpResponse({ status: 200, body }))
        .pipe(delay(500));
    }

    function error(message: string) {
      return throwError(() => ({ error: { message } }))
        .pipe(materialize(), delay(500), dematerialize());
    }

    function idFromUrl() {
      const urlParts = url.split('/');
      return parseInt(urlParts[urlParts.length - 1]);
    }
  }
}
