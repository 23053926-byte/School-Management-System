export interface Faculty {
  _id?: string;
  facultyId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  department: string;
  designation: string;
  qualification: string;
  experience?: number;
  joiningDate?: string;
  address?: string;
  profilePicture?: string | null;
  createdAt?: string;
}

export interface FacultyListResponse {
  success: boolean;
  count: number;
  totalFaculty: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  faculties: Faculty[];
}