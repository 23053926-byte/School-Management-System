import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { LookupService } from '../../services/lookup.service';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-student.html',
  styleUrl: './add-student.css'
})
export class AddStudentComponent {

  student = {
    studentId: '',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    department: '',
    course: '',
    semester: '',
    admissionYear: ''
  };

  departments: string[] = [
    'CSE',
    'ECE',
    'EEE',
    'ME',
    'CE'
  ];

  semesters: string[] = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'Sem_NUR', 'LKG', 'UKG'
  ];

  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedFile: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private studentService: StudentService,
    private lookup: LookupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.lookup.refreshStudents();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  clearPhoto(): void {
    this.selectedFile = null;
    this.photoPreview = null;
  }

  addStudent(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.student.studentId ||
      !this.student.name ||
      !this.student.email ||
      !this.student.phone ||
      !this.student.department ||
      !this.student.course ||
      !this.student.semester ||
      !this.student.admissionYear
    ) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    this.loading = true;

    this.studentService.addStudent(this.student).subscribe({

      next: (response) => {

        console.log('Add student response:', response);

        // Upload photo if selected
        if (this.selectedFile && response.student?._id) {
          this.studentService.uploadProfilePicture(response.student._id, this.selectedFile).subscribe({
            next: () => {
              this.loading = false;
              this.successMessage = 'Student added successfully with profile picture.';
              setTimeout(() => {
                this.router.navigate(['/app/students']);
              }, 1000);
            },
            error: (error) => {
              console.error('Photo upload error:', error);
              this.loading = false;
              this.successMessage = 'Student added successfully, but photo upload failed.';
              setTimeout(() => {
                this.router.navigate(['/app/students']);
              }, 1000);
            }
          });
        } else {
          this.loading = false;
          this.successMessage = response.message || 'Student added successfully.';
          setTimeout(() => {
            this.router.navigate(['/app/students']);
          }, 1000);
        }
      },

      error: (error) => {

        console.error('Error adding student:', error);

        this.loading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to add student. Please try again.';
      }

    });
  }

  cancel(): void {
    this.router.navigate(['/app/students']);
  }
}
