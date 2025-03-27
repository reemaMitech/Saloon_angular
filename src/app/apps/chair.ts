import { Component, OnInit, ViewChild  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgxCustomModalComponent } from 'ngx-custom-modal';
import { HttpClient } from "@angular/common/http";
import { ApiService } from 'src/app/api.service';
import Swal from "sweetalert2";
import { ChangeDetectorRef } from "@angular/core";

@Component({
//   selector: 'app-chair',
  templateUrl: './chair.html',
//   styleUrls: ['./chair.css'],
})
export class ChairComponent implements OnInit {
@ViewChild('addChairModal') addChairModal!: NgxCustomModalComponent;
  chairsList: any[] = [
    // { id: 1, chair_name: 'Chair A', location: 'Room 101' },
    // { id: 2, chair_name: 'Chair B', location: 'Room 102' },
  ];
  filteredChairsList = [...this.chairsList];
  searchChair: string = '';
  displayType: string = 'list'; // Default to 'list' view

  params!: FormGroup;
  isLoading: boolean = false;

  constructor(  private fb: FormBuilder,
    private http: HttpClient,
    private apiService: ApiService,private cdr: ChangeDetectorRef) {
    this.params = this.fb.group({
        id: [''],
        chair_name: [''],
        location: [''],
      });
  }

  ngOnInit(): void {
    this.fetchChairs();
  }

  // ngAfterViewInit() {
  //   console.log("Modal reference:", this.addChairModal); 
  // }

 
  fetchChairs() {
    // this.http.get(`http://localhost/salonClinic/read/tbl_chairs`).subscribe(
      this.apiService.get("read/tbl_chairs").subscribe(

      (response: any) => {
        if (response.status === 200) {
          this.chairsList = response.data;
          this.searchChairs();
        } else {
          this.showMessage(response.message, "error");
        }
      },
      (error) => {
        console.error("Error fetching chairs:", error);
        this.showMessage("Error fetching chairs.", "error");
      }
    );
  }

  searchChairs() {
    this.filteredChairsList = this.chairsList.filter((chair) =>
      chair.chair_name.toLowerCase().includes(this.searchChair.toLowerCase())
    );
  }

  editChair(chair?: any) {
    console.log('Opening modal for:', chair ? 'Edit' : 'Add');
    if (chair) {
      this.params.patchValue(chair);
    } else {
      this.params.reset();
    }
    this.addChairModal.open();
  }

  deleteChair(formData: any) {
    const requestBody = {};
    const endpoint = `delete/tbl_chairs/${formData.id}`;
    this.apiService.post(endpoint,requestBody).subscribe(
    // this.http.post(`http://localhost/salonClinic/delete/tbl_chairs/${formData.id}`,requestBody).subscribe(
        (response) => {
          console.log("Delete response:", response);
          this.chairsList = this.chairsList.filter(
            (d) => d.id !== formData.id
          );
          this.fetchChairs();

          this.showMessage("Chair has been deleted successfully.");
          this.addChairModal.close();
        },
        (error) => {
          console.error("Error deleting Chair:", error);
          this.showMessage("Error deleting Chair.", "error");
        }
      );
  }

  goBackToList() {
    this.displayType = 'list'; // Switch back to list view
  }

  saveChair() {
    if (this.params.invalid) {
      this.showMessage("Please fill all required fields.", "error");
      return;
    }

    this.isLoading = true; // Set loading to true when starting the request

    const formData = this.params.value;
    const requestBody = {
      chair_name: formData.chair_name,
      location: formData.location,
    };

    if (this.addChairModal) {
      console.log("Modal reference exists:", this.addChairModal);
    } else {
      console.error("Modal reference is undefined!");
    }

    if (formData.id) {
      // Update user in the API
      // this.http.post(`http://localhost/salonClinic/update/tbl_chairs/${formData.id}`,requestBody).subscribe(
        const endpoint = `update/tbl_chairs/${formData.id}`;
        this.apiService.post(endpoint,requestBody).subscribe(

        (response) => {
            this.isLoading = false; // Reset loading state
            console.log("Update response:", response);
            let user: any = this.chairsList.find((d) => d.id === formData.id);
            if (user) {
              user.chair_name = formData.chair_name;
              user.location = formData.location;
            }
            this.showMessage("Chair has been updated successfully.");
            this.fetchChairs();

            console.log("Modal reference:", this.addChairModal);
            // this.addChairModal.close();
            setTimeout(() => {
              this.addChairModal.close();
              this.cdr.detectChanges(); // Force UI update
            }, 100);
          },
          (error) => {
            this.isLoading = false; // Reset loading state in case of error
            console.error("Error updating Chair:", error);
            this.showMessage("Error updating Chair.", "error");
          }
        );
    } else {
      // Add user to the API
    
      // this.http.post("http://localhost/salonClinic/create/tbl_chairs", requestBody).subscribe(
        const endpoint = `create/tbl_chairs`;
        this.apiService.post(endpoint,requestBody).subscribe(

        (response) => {
            this.isLoading = false; // Reset loading state
            console.log("Create response:", response);
            let newUser = {
              id: this.chairsList.length
                ? Math.max(...this.chairsList.map((u) => u.id)) + 1
                : 1,
                chair_name: formData.chair_name,
                location: formData.location,
            };
            this.chairsList.unshift(newUser);
            this.searchChairs();
            this.fetchChairs();

            this.showMessage("Chair has been saved successfully.");
            console.log("Modal reference:", this.addChairModal);
            // this.addChairModal.close();
            setTimeout(() => {
              this.addChairModal.close();
              this.cdr.detectChanges(); // Force UI update
            }, 100);
          },
          (error) => {
            this.isLoading = false; // Reset loading state in case of error
            console.error("Error saving branch:", error);
            this.showMessage("Error saving branch.", "error");
          }
        );
    }
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
