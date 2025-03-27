import { Component, ViewChild } from "@angular/core";
import { toggleAnimation } from "src/app/shared/animations";
import Swal from "sweetalert2";
import { NgxCustomModalComponent } from "ngx-custom-modal";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { ApiService } from 'src/app/api.service';

@Component({
  templateUrl: "./Service.html",
  animations: [toggleAnimation],
})
export class ServiceComponent {
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private apiService: ApiService,
  ) {}

  displayType = "list";
  @ViewChild("addContactModal") addContactModal!: NgxCustomModalComponent;
  params!: FormGroup;
  
  filterdContactsList: any = [];
  searchUser = "";
  // contactList: any[] = []; // Initialize contactList as an empty array
  servicemst: any[] = []; 

  initForm() {
    this.params = this.fb.group({
      id: [''], // ✅ Include 'id' field
      name: [''],
      duration: [''],
      bufferTime: [''],
      price: [''],
      // slotcount: [''],
      needRepetition: ['no'], // Default value
      repetitionFrequency: [''], 
    });
  }
  

  ngOnInit() {

    this.initForm(); // Initialize form in ngOnInit
    this.fetchServices(); // Fetch Dataes on initialization
  }

  onRepetitionChange(value: string) {
    this.params.patchValue({ needRepetition: value }); // ✅ Proper form update
  
    if (value === 'no') {
      this.params.controls['repetitionFrequency'].setValue(null); // ✅ Clear frequency
    }
  }
  

  // fetchServices() {
  //   this.serviceService.getServices().subscribe((res: any) => {
  //     if (res.status === 200) {
  //       this.servicemst = res.data;
  //     }
  //   });
  // }

  fetchServices() {
    // this.http.get("http://localhost/OPDClinic/read/tbl_servicemst").subscribe(
      this.apiService.get("read/tbl_servicemst").subscribe(
      (response: any) => {
        if (response.status === 200) {
          this.servicemst = response.data; // Assign data to contactList
          this.searchContacts(); // Update filtered list
        } else {
          this.showMessage(response.message, "error");
        }
      },
      (error) => {
        console.error("Error fetching Dataes:", error);
        this.showMessage("Error fetching Dataes.", "error");
      }
    );
  }

  searchContacts() {
    this.filterdContactsList = this.servicemst.filter((d) =>
      d.name.toLowerCase().includes(this.searchUser.toLowerCase())
    );
  }

  editService(user: any = null) {
    console.log('Editing Service:', user); // Debugging line
    this.addContactModal.open();
    this.initForm(); // Ensure form is initialized
  
    if (user) {
      this.params.patchValue({
        id: user.id || '',
        name: user.name || '',
        price: user.price || '',
        duration: user.duration || '',
        bufferTime: user.bufferTime || '',
        // slotcount: user.perslotcustomer || ''
      });
    }
  }
  
  
  

  saveService() {
    console.log(this.params.value); // Check if values are present
    if (this.params.invalid) {
      this.showMessage("Please fill all required fields.", "error");
      return;
    }
  
    const formData = this.params.value;
    console.log("Form Data:", formData); // ✅ Check what is inside formData
  
    // Construct the request body with all necessary fields
    const requestBody = {
      name: formData.name,
      duration: formData.duration,
      bufferTime: formData.bufferTime,
      price: formData.price,
      needRepetition: formData.needRepetition, // ✅ Add needRepetition
      repetitionFrequency: formData.needRepetition === 'yes' ? formData.repetitionFrequency : null, // ✅ Add repetitionFrequency conditionally
      is_active:  "Y" , // Ensure correct format
      is_deleted:  "N", // Ensure correct format
    };
  
    console.log("Request Body:", requestBody); // ✅ Check request payload
  
    if (formData.id) {
      this.apiService.post(`update/tbl_servicemst/${formData.id}`, requestBody).subscribe(
        (response) => {
          console.log("Update response:", response);
          this.fetchServices();
          this.showMessage("Data has been updated successfully.");
          this.addContactModal.close();
        },
        (error) => {
          console.error("Error updating Data:", error);
          this.showMessage("Error updating Data.", "error");
        }
      );
    } else {
      this.apiService.post(`create/tbl_servicemst`, requestBody).subscribe(
        (response) => {
          console.log("Create response:", response);
          this.fetchServices();
          this.showMessage("Data has been saved successfully.");
          this.addContactModal.close();
        },
        (error) => {
          console.error("Error saving Data:", error);
          this.showMessage("Error saving Data.", "error");
        }
      );
    }
  }
  
  

  deleteService(formData: any) {
    const requestBody = {};

    // this.http.post(`http://localhost/OPDClinic/delete/tbl_servicemst/${formData.id}`,requestBody).subscribe(
      this.apiService.post(`delete/tbl_servicemst/${formData.id}`, requestBody).subscribe(   

      (response) => {
          console.log("Delete response:", response);
          this.servicemst = this.servicemst.filter(
            (d) => d.id !== formData.id
          );
          this.fetchServices();
          this.showMessage("Data has been deleted successfully.");
          this.addContactModal.close();
        },
        (error) => {
          console.error("Error deleting Data:", error);
          this.showMessage("Error deleting Data.", "error");
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

  // onRepetitionChange(value: string) {
  //   this.params.patchValue({ needRepetition: value }); // ✅ Update form control properly
  
  //   if (value === 'no') {
  //     this.params.controls['repetitionFrequency'].setValue(null);
  //   }
  // }
  
  
  
}
