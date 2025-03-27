import { HttpClient } from "@angular/common/http";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { ApiService } from 'src/app/api.service';


import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from "@angular/forms";
import Swal from "sweetalert2";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: "app-schedule",
  styleUrl: "./schedule.css",
  templateUrl: "./schedule.html",
})
export class ScheduleComponent implements OnInit {
  scheduleForm!: FormGroup;
  branches: any[] = []; // Property to hold the branches
  // consultants: any[] = []; // Property to hold the consultants
  displayType: string = "list";
  isLoading: boolean = false;
  servicemst: any[] = []; // Store API response
  bufferTime: number = 0;  // Store buffer time
  eachSlot: number = 0;    // Store slot duration
  form: FormGroup;
  selectedService: any;
  generatedSlots: string[] = [];
  selectedServiceId: number | null = null; // Store selected serviceId

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialog: MatDialog,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef

  ) {
    this.form = this.fb.group({
      service: ['']
    });
  }

  ngOnInit() {
    this.scheduleForm = this.fb.group({
      schedules: this.fb.array([]),
      // bufferTime: [0, Validators.required],
      // eachslots: [30, Validators.required],
      branch: ["", Validators.required], // Include branch in the form
      service: ['', Validators.required],
      // consultant: ["", Validators.required], // Include consultant in the form
      // slotcount: [1, Validators.required], // Include slot count
      // Price: ["", Validators.required], // Include price
    });

    this.addAllDays(); // Add days of the week on initialization
    this.fetchBranches(); // Fetch branches on initialization
    // this.fetchConsultants(); // Fetch consultants on initialization
    this.fetchServices();

     // Listen to form control changes
     this.form.get('service')?.valueChanges.subscribe(serviceId => {
      this.selectedService = this.servicemst.find(service => service.id == serviceId);
      console.log('Selected Service:', this.selectedService);
    });
    
  }
  fetchBranches() {
    this.http
      // .get<any>("http://localhost/salonClinic/read/tbl_branch")
      this.apiService.get("read/tbl_branch").subscribe(
        (response) => {
          if (response.status === 200) {
            this.branches = response.data; // Assign the fetched branches
          } else {
            console.error("Error fetching branches:", response.message);
          }
        },
        (error) => {
          console.error("Error fetching branches:", error);
        }
      );
  }

  fetchServices() {
    this.apiService.get("read/tbl_servicemst").subscribe(
      (response: any) => {
        if (response.status === 200) {
          this.servicemst = response.data; 
          
          // Assuming bufferTime and eachSlot are fields in the API response
          if (this.servicemst.length > 0) {
            this.bufferTime = this.servicemst[0].BufferTime; // Assign buffer time
            this.eachSlot = this.servicemst[0].Duration; // Assign slot duration
            // console.log(this.bufferTime);
            // console.log(this.eachSlot);
          }
        } else {
          this.showMessage(response.message, "error");
        }
      },
      (error) => {
        console.error("Error fetching Data:", error);
        this.showMessage("Error fetching Data.", "error");
      }
    );
  }

    // Handle dropdown selection change

    
    onServiceChange(event: Event) {
      this.selectedServiceId = Number((event.target as HTMLSelectElement).value);
      const selectedService = this.servicemst.find(service => service.id == this.selectedServiceId);
    
      if (selectedService) {
        this.bufferTime = selectedService.bufferTime;
        this.eachSlot = selectedService.duration;
      }
    }

  

  // fetchConsultants() {
  //   const role = "Consultant"; // Define the role you want to filter by
  //   const endpoint = `get_where_condition_data/tbl_register/${role}`;

  //   // this.apiService.get("read/tbl_branch").subscribe(
  //     this.apiService.get(endpoint).subscribe(

  //   // this.http
  //   //   .get<any>(
  //   //     `http://localhost/salonClinic/get_where_condition_data/tbl_register/${role}`
  //   //   )
  //     // .subscribe(
  //       (response) => {
  //         if (response.status === 200) {
  //           this.consultants = response.data; // Assign the fetched consultants
  //         } else {
  //           console.error("Error fetching consultants:", response.message);
  //         }
  //       },
  //       (error) => {
  //         console.error("Error fetching consultants:", error);
  //       }
  //     );
  // }

  get schedules() {
    return this.scheduleForm.get("schedules") as FormArray;
  }



  addAllDays() {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    daysOfWeek.forEach((day) => {
      this.schedules.push(
        this.fb.group({
          day: [day],
          startTime: [""], // No default validators
          endTime: [""], // No default validators
        })
      );
    });
  }

  // addNewScheduleBelow(index: number) {
  //   const currentSchedule = this.schedules.at(index);
  //   const day = currentSchedule.get("day")?.value;

  //   if (day) {
  //     const newSchedule = this.fb.group({
  //       day: [day, Validators.required],
  //       startTime: ["", Validators.required],
  //       endTime: ["", Validators.required],
  //     });
  //     this.schedules.insert(index + 1, newSchedule);
  //   }
  // }
  addNewScheduleBelow(index: number) {
    const currentSchedule = this.schedules.at(index);
    const day = currentSchedule.get("day")?.value;
    const previousEndTime = currentSchedule.get("endTime")?.value;

    if (day) {
      const newSchedule = this.fb.group({
        day: [day, Validators.required],
        startTime: ["", [Validators.required]],
        endTime: ["", [Validators.required]],
      });

      // Save the previous end time as metadata for the new schedule
      newSchedule
        .get("startTime")
        ?.setValidators([
          Validators.required,
          (control) => this.timeValidator(control, previousEndTime),
        ]);

      this.schedules.insert(index + 1, newSchedule);
    }
  }

  // Validator function for the start time
  timeValidator(control: AbstractControl, previousEndTime: string | null) {
    if (previousEndTime && control.value && control.value <= previousEndTime) {
      return { invalidTime: true };
    }
    return null;
  }

  // Validator function for end time
  endTimeValidator(control: AbstractControl, startTime: string | null) {
    if (startTime && control.value && control.value <= startTime) {
      return { invalidEndTime: true };
    }
    return null;
  }

  deleteSchedule(index: number) {
    this.schedules.removeAt(index);
  }

  // Method to handle changes in day slot times
  onDaySlotChange(index: number) {
    const schedule = this.schedules.at(index) as FormGroup;
    const startTime = schedule.get("startTime");
    const endTime = schedule.get("endTime");

    if (startTime?.value || endTime?.value) {
      // Add required validators for active days
      startTime?.setValidators([Validators.required]);
      endTime?.setValidators([Validators.required]);
    } else {
      // Clear validators if the day is not being used
      startTime?.clearValidators();
      endTime?.clearValidators();
    }

    // Update validation status
    startTime?.updateValueAndValidity();
    endTime?.updateValueAndValidity();
  }

  // calculateSlots(
  //   startTime: string,
  //   endTime: string,
  //   bufferTime: number,
  //   slotDuration: number
  // ): string[] {
  //   const slots: string[] = [];
  //   const start = new Date(`1970-01-01T${startTime}:00`);
  //   const end = new Date(`1970-01-01T${endTime}:00`);
  //   const buffer = bufferTime * 60000;

  //   let currentSlotStartTime = start;

  //   while (currentSlotStartTime < end) {
  //     const nextSlotEndTime = new Date(
  //       currentSlotStartTime.getTime() + slotDuration * 60000
  //     );
  //     if (nextSlotEndTime <= end) {
  //       slots.push(
  //         currentSlotStartTime.toLocaleTimeString([], {
  //           hour: "numeric",
  //           minute: "numeric",
  //           hour12: true,
  //         })
  //       );
  //     }
  //     currentSlotStartTime = new Date(
  //       currentSlotStartTime.getTime() + slotDuration * 60000 + buffer
  //     );
  //   }

  //   return slots;
  // }

  calculateSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const buffer = this.bufferTime * 60000; // Use selected buffer time
    const slotDuration = this.eachSlot * 60000; // Use selected duration
  
    let currentSlotStartTime = start;
  
    while (currentSlotStartTime < end) {
      const nextSlotEndTime = new Date(currentSlotStartTime.getTime() + slotDuration);
  
      if (nextSlotEndTime <= end) {
        slots.push(
          currentSlotStartTime.toLocaleTimeString([], {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })
        );
      }
  
      currentSlotStartTime = new Date(currentSlotStartTime.getTime() + slotDuration + buffer);
    }
  
    this.generatedSlots = slots; // Update generated slots for UI
    this.cdr.markForCheck(); // Notify Angular about the change
    return slots;
  }
  
  
  
  
  

  onSubmit() {
    if (this.scheduleForm.invalid) {
      this.schedules.controls.forEach((control, index) => {
        const startTime = control.get("startTime")?.value;
        const endTime = control.get("endTime")?.value;
  
        if (!startTime && !endTime) {
          console.log(`Schedule ${index + 1} is optional and skipped.`);
          return;
        }
  
        if (control.invalid) {
          console.log(`Schedule ${index + 1} is invalid`, control.errors);
        }
      });
  
      this.showMessage(
        "Please fill out all required fields correctly for active days.",
        "error"
      );
      this.scheduleForm.markAllAsTouched();
      return;
    }
  
    // Debug: Print form values before submission
    console.log("Form Values:", this.scheduleForm.value);
  
    this.isLoading = true;
    const requestBody = {
      service_id: this.selectedServiceId,  // ✅ Include selected service ID
      schedules: this.scheduleForm.value.schedules.map((schedule: any) => {
        const startTime = schedule.startTime;
        const endTime = schedule.endTime;
        const bufferTime = this.scheduleForm.value.bufferTime;
        const eachSlot = this.scheduleForm.value.eachslots;
        const slots = this.calculateSlots(startTime, endTime);
        // const slots = this.calculateSlots(startTime, endTime);
  
        return {
          branch: this.scheduleForm.value.branch,
          // consultant: this.scheduleForm.value.consultant,
          // slotcount: this.scheduleForm.value.slotcount,
          // Price: this.scheduleForm.value.Price,
          day: schedule.day,
          startTime: startTime,
          endTime: endTime,
          slots: slots,
          // bufferTime: bufferTime, // Add bufferTime explicitly
        };
      }),
    };
  
    // Debug: Check if bufferTime is included
    console.log("Request Body:", requestBody);
  
    this.apiService.post("savescedule/tbl_slots", requestBody).subscribe(
      (response) => {
        console.log("Create response:", response);
        this.showMessage("Schedule has been saved successfully.");
        this.scheduleForm.reset();
        this.isLoading = false;
      },
      (error) => {
        console.error("Error occurred:", error);
        this.showMessage("Error saving schedule.", "error");
        this.isLoading = false;
      }
    ).add(() => {
      this.isLoading = false;
    });
  }
  

  showMessage(msg = "", type = "success") {
    const toast: any = Swal.mixin({
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 3000,
      customClass: { container: "toast" },
    });
    toast.fire({
      icon: type,
      title: msg,
      padding: "10px 20px",
    });
  }

  closeModal() {
    this.dialog.closeAll();
  }

  
}
