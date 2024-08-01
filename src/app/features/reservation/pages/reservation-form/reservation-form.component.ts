import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReservationService } from '../../services/reservation.service';
import { Router } from '@angular/router';


/**
 * @title Expansion panel as accordion
 */
@Component({
  selector: 'app-reservation-form',
  templateUrl: 'reservation-form.component.html',
  styleUrl: 'reservation-form.component.css',
  standalone: true,
  providers: [
    provideNativeDateAdapter(),
    ReservationService
  ],
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatSliderModule,
    MatDividerModule,
    MatCardModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationFormComponent {
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  readonly startDate = new Date(2024, 6, 24);
  readonly minDate = new Date(2024, 6, 24);
  readonly maxDate = new Date(2024, 6, 31);
  readonly availableHours: string[] = ['6:00pm', '6:30pm', '7:00pm', '7:30pm', '8:00pm', '8:30pm', '9:00pm', '9:30pm', '10:00pm'];
  public availableRegions: string[] = [ 'MAIN_HALL', 'BAR', 'RIVERSIDE', 'RIVERSIDE_SMOKING'];
  readonly mapRegionToString: any = { 'MAIN_HALL': 'Main hall', 'BAR': 'Bar', 'RIVERSIDE': 'Riverside', 'RIVERSIDE_SMOKING': 'Riverside (smoking allowed)'};
  readonly regionsSpecs: any = {
    'MAIN_HALL': { childrenAllowed: true, smokingAllowed: false, maxSeating: 12 },
    'BAR': { childrenAllowed: false, smokingAllowed: false, maxSeating: 4 },
    'RIVERSIDE': { childrenAllowed: true, smokingAllowed: false, maxSeating: 8 },
    'RIVERSIDE_SMOKING': { childrenAllowed: false, smokingAllowed: true, maxSeating: 6 }
  };
  step = signal(0);
  reservationForm = this.fb.group({
    date: [null, Validators.required],
    time: [null, Validators.required],
    name: [null, Validators.required],
    email: [null, [Validators.required, Validators.email]],
    phone: [null, [Validators.required, Validators.pattern('^[- +()0-9]+$')]],
    numberOfPeople: [0, [Validators.required, Validators.pattern('[0-9]+'), Validators.max(12), Validators.min(1)]],
    numberOfChildren: [0, [Validators.required, Validators.pattern('[0-9]+'), Validators.max(0), Validators.min(0)]],
    region: [null, Validators.required],
    smokers: [false, Validators.required],
    isBirthdayParty: [false, Validators.required],
    nameOfBirthdayPerson: null
  });

  numberOfPeopleErrorMessage = signal('');
  numberOfChildrenErrorMessage = signal('');
  dateErrorMessage = signal('');

  constructor(
    private _snackBar: MatSnackBar,
    private router: Router
  ) {

    merge(this.reservationForm.get('date')!.statusChanges, this.reservationForm.get('date')!.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.updateDateErrorMessage();
      });

    merge(this.reservationForm.get('numberOfPeople')!.statusChanges, this.reservationForm.get('numberOfPeople')!.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.reservationForm.get('numberOfPeople')!.valid) {
          this.updateChildrenControlValidators();
        }
        setTimeout(() => this.setAvailableRegions());
        this.updatePeopleErrorMessage();
      });

    merge(this.reservationForm.get('numberOfChildren')!.statusChanges, this.reservationForm.get('numberOfChildren')!.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.reservationForm.get('numberOfChildren')!.valid) {
          if (this.reservationForm.value.numberOfChildren! > 0) {
            this.reservationForm.get('smokers')!.setValue(false);
            this.reservationForm.get('smokers')!.disable();
          } else {
            this.reservationForm.get('smokers')!.enable();
          }
        }
        setTimeout(() => this.setAvailableRegions());
        this.updateChildrenErrorMessage();
      });

    merge(this.reservationForm.get('smokers')!.statusChanges, this.reservationForm.get('numberOfPeople')!.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        setTimeout(() => this.setAvailableRegions());
      });
  }

  setAvailableRegions() {
    let availableRegions: string[] = [];
    for (const region in this.regionsSpecs) {
      if (this.reservationForm.get('numberOfPeople')!.valid) {
        if (this.regionsSpecs[region].maxSeating < this.reservationForm.value.numberOfPeople!) continue;
      }
      if (this.reservationForm.get('numberOfChildren')!.valid && this.reservationForm.value.numberOfChildren! > 0) {
        if (!this.regionsSpecs[region].childrenAllowed) continue;
      }
      if (this.reservationForm.get('smokers')!.valid && this.reservationForm.value.smokers) {
        if (!this.regionsSpecs[region].smokingAllowed) continue;
      }
      availableRegions = [...availableRegions, region];
    }
    this.availableRegions = availableRegions;
  }

  updatePeopleErrorMessage() {
    if (this.reservationForm.get('numberOfPeople')!.hasError('required')) {
      this.numberOfPeopleErrorMessage.set(`The number of people is required`);
    } else if (this.reservationForm.get('numberOfPeople')!.hasError('pattern')) {
      this.numberOfPeopleErrorMessage.set('Please enter a valid number');
    } else if (this.reservationForm.get('numberOfPeople')!.hasError('max')) {
      this.numberOfPeopleErrorMessage.set(`The number of people can't be more than 12`);
    } else if (this.reservationForm.get('numberOfPeople')!.hasError('min')) {
      this.numberOfPeopleErrorMessage.set(`The number of people can't be less than 1`);
    } else {
      this.numberOfPeopleErrorMessage.set('');
    }
  }

  updateChildrenErrorMessage() {
    if (this.reservationForm.get('numberOfChildren')!.hasError('required')) {
      this.numberOfChildrenErrorMessage.set(`The number of children is required`);
    } else if (this.reservationForm.get('numberOfChildren')!.hasError('pattern')) {
      this.numberOfChildrenErrorMessage.set('Please enter a valid number');
    } else if (this.reservationForm.get('numberOfChildren')!.hasError('max')) {
      this.numberOfChildrenErrorMessage.set(`More children than people`);
    } else if (this.reservationForm.get('numberOfChildren')!.hasError('min')) {
      this.numberOfChildrenErrorMessage.set(`The number of children can't be less than 0`);
    } else {
      this.numberOfChildrenErrorMessage.set('');
    }
  }

  updateDateErrorMessage() {
    if (this.reservationForm.get('date')!.hasError('required')) {
      this.dateErrorMessage.set(`The date is required`);
    } else if (this.reservationForm.get('date')!.hasError('matDatepickerParse')) {
      this.dateErrorMessage.set('Please enter a valid date');
    } else if (this.reservationForm.get('date')!.hasError('matDatepickerMax')) {
      this.dateErrorMessage.set(`The date must be before 07/31/2024`);
    } else if (this.reservationForm.get('date')!.hasError('matDatepickerMin')) {
      this.dateErrorMessage.set(`The date must be after 07/24/2024`);
    } else {
      this.dateErrorMessage.set('');
    }
    

  }

  updateChildrenControlValidators() {
    const numberOfPeople = this.reservationForm.get('numberOfPeople')!.value;
    this.reservationForm.get('numberOfChildren')?.setValidators([Validators.required, Validators.pattern('[0-9]+'), Validators.max(numberOfPeople!), Validators.min(0)]);
    this.reservationForm.get('numberOfChildren')?.updateValueAndValidity();
  }

  onSubmit(): void {
    this.reservationService.validateReservation(this.reservationForm.value).subscribe(isValid => {
      if (isValid) {
        this.reservationService.createReservation(this.reservationForm.value).subscribe(reservation => {
          console.log('reservation', reservation);
          this.router.navigate(['/reservation', reservation.id]);
        });
      } else {
        const snackBarRef = this._snackBar.open('There is not enough free capacity on this region to make your reservation', 'Change date/time');
        snackBarRef.onAction().subscribe(() => {
          snackBarRef.dismiss();
          this.setStep(1);
        });
      }
    });
  }

  setStep(index: number) {
    this.step.set(index);
  }

  nextStep() {
    this.step.update(i => i + 1);
  }

  prevStep() {
    this.step.update(i => i - 1);
  }

  goToReview() {
    if (this.reservationForm.valid) {
      this.setStep(3);
    } else {
      this.reservationForm.markAllAsTouched();
    }
  }
}
