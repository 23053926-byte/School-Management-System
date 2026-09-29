export interface Student {
  _id?: string;

  studentId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  department: string;
  course: string;
  semester: string;
  admissionYear: string;
  profilePicture?: string;
}