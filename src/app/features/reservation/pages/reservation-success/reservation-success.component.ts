import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-success',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './reservation-success.component.html',
  styleUrl: './reservation-success.component.css'
})
export class ReservationSuccessComponent {
  
  readonly mapRegionToString: any = { 'MAIN_HALL': 'Main hall', 'BAR': 'Bar', 'RIVERSIDE': 'Riverside', 'RIVERSIDE_SMOKING': 'Riverside (smoking allowed)'};
  private reservationId: string = '';
  public reservation: any = null;

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.reservationId = params['id'];
      this.reservationService.getReservationById(this.reservationId).subscribe((reservation) => this.reservation = reservation);
    });
  }
}
