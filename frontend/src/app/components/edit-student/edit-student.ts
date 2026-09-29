import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { StudentService } from '../../services/student.service';
import { LookupService } from '../../services/lookup.service';

@Component({
  selector: 'app-edit-student',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './edit-student.html',
  styleUrl: './edit-student.css'
})
export class EditStudentComponent implements OnInit {

  studentId: string = '';

  saving: boolean = false;
  uploadingPhoto: boolean = false;

  errorMessage: string = '';
  successMessage: string = '';

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
    admissionYear: '',
    profilePicture: ''
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

  selectedFile: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private studentService: StudentService,
    private lookup: LookupService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.lookup.refreshStudents();

    this.studentId =
      this.route.snapshot.paramMap.get('id') || '';

    console.log(
      'Edit Student ID:',
      this.studentId
    );

    if (!this.studentId) {

      this.errorMessage =
        'Student ID not found.';

      this.cdr.detectChanges();

      return;
    }

    this.loadStudent();
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

  loadStudent(): void {

    console.log(
      'Loading student:',
      this.studentId
    );

    this.studentService
      .getStudentById(this.studentId)
      .subscribe({

        next: (response: any) => {

          console.log(
            'GET STUDENT RESPONSE:',
            response
          );

          const data =
            response?.student ||
            response?.data ||
            response;

          if (!data) {

            this.errorMessage =
              'Student data was not returned by the server.';

            this.cdr.detectChanges();

            return;
          }

          this.student = {

            studentId:
              data.studentId || '',

            name:
              data.name || '',

            email:
              data.email || '',

            phone:
              data.phone || '',

            dateOfBirth:
              data.dateOfBirth
                ? String(data.dateOfBirth).substring(0, 10)
                : '',

            gender:
              data.gender || '',

            address:
              data.address || '',

            department:
              data.department || '',

            course:
              data.course || '',

            semester:
              data.semester !== undefined &&
              data.semester !== null
                ? String(data.semester)
                : '',

            admissionYear:
              data.admissionYear !== undefined &&
              data.admissionYear !== null
                ? String(data.admissionYear)
                : '',

            profilePicture:
              data.profilePicture || ''
          };

          console.log(
            'Student Loaded:',
            this.student
          );

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'GET STUDENT ERROR:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to load student details.';

          this.cdr.detectChanges();
        }

      });
  }


  updateStudent(): void {

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

      this.errorMessage =
        'Please fill all required fields.';

      return;
    }

    this.saving = true;

    console.log(
      'Updating student:',
      this.student
    );

    this.studentService
      .updateStudent(
        this.studentId,
        this.student
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'UPDATE STUDENT RESPONSE:',
            response
          );

          // Upload photo if selected
          if (this.selectedFile) {
            this.uploadingPhoto = true;
            this.studentService.uploadProfilePicture(this.studentId, this.selectedFile).subscribe({
              next: () => {
                this.saving = false;
                this.uploadingPhoto = false;
                this.successMessage = 'Student updated successfully with new profile picture.';
                this.cdr.detectChanges();
                setTimeout(() => {
                  this.router.navigate(['/app/students']);
                }, 1000);
              },
              error: (error) => {
                console.error('Photo upload error:', error);
                this.saving = false;
                this.uploadingPhoto = false;
                this.successMessage = 'Student updated successfully, but photo upload failed.';
                this.cdr.detectChanges();
                setTimeout(() => {
                  this.router.navigate(['/app/students']);
                }, 1000);
              }
            });
          } else {
            this.saving = false;

            this.successMessage =
              response?.message ||
              'Student updated successfully.';

            this.cdr.detectChanges();

            setTimeout(() => {

              this.router.navigate([
                '/app/students'
              ]);

            }, 1000);
          }
        },

        error: (error: any) => {

          console.error(
            'UPDATE STUDENT ERROR:',
            error
          );

          this.saving = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to update student. Please try again.';

          this.cdr.detectChanges();
        }

      });
  }


  cancel(): void {

    this.router.navigate([
      '/app/students'
    ]);
  }

}
