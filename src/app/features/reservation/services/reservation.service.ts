import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
  })
  export class ReservationService {
    constructor(private http: HttpClient) {}
  
    getRegions(): Observable<any[]> {
        return this.http.get<any[]>(`/regions`);
    }
  
    createReservation(reservation: any): Observable<any> {
        return this.http.post<any[]>(`/reservation`, reservation);
    }

    getReservationById(id: string): Observable<any> {
        return this.http.get<any[]>(`/reservation/${id}`);
    }

    validateReservation(reservation: any): Observable<any> {
        return this.http.post<any[]>(`/reservation/validate`, reservation);
    }
  }