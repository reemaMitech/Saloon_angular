import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from "sweetalert2";
import { NgxCustomModalComponent } from "ngx-custom-modal";
import { HttpClient } from "@angular/common/http";
import { ApiService } from 'src/app/api.service';
import { Router } from '@angular/router';


@Component({
//   selector: 'app-salon-register',
  templateUrl: './addSalon.html',
  styleUrls: ['./addSalon.css']
})
export class addSalonComponent implements OnInit {
  salonForm: FormGroup;

  constructor(private fb: FormBuilder,
    private http: HttpClient,
    private apiService: ApiService, private router: Router) {
    this.salonForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-z .]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z .]+$/)]],
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      ]]
    });
  }
  isLoading: boolean = false;

  ngOnInit(): void {}

  get f() {
    return this.salonForm.controls;
  }

//   submitSalon() {
//     if (this.salonForm.valid) {
//       console.log('Salon Registered:', this.salonForm.value);
//       // Add API call to submit the form data
//     } else {
//       console.log('Form is invalid');
//     }
//   }

submitSalon() {
    if (this.salonForm.invalid) {
      this.showMessage("Please fill all required fields.", "error");
      return;
    }
    console.log(' Registered salon data:', this.salonForm.value);
    this.isLoading = true;

    const formData = this.salonForm.value;
     // Concatenate firstName and lastName into a single 'name' field
  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  
    const requestBody = {
      name: fullName, // Merged firstName + lastName
      salon_name: formData.name, // Salon Name
      mobile: formData.mobile,
      password: formData.password,
    };

    // API endpoint to create salon
    const endpoint = `create/tbl_register`;

    this.apiService.post(endpoint, requestBody).subscribe(
      (response) => {
        this.isLoading = false;
        console.log("Salon registration response:", response);

        this.showMessage("Salon registered successfully.");
        this.salonForm.reset(); // Reset form after successful registration
           // Redirect to login page after successful registration
      this.router.navigate(['/auth/signin']);  
      },
      (error) => {
        this.isLoading = false;
        console.error("Error registering salon:", error);
        this.showMessage("Error registering salon.", "error");
      }
    );
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
  
}
