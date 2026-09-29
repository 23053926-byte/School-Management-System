import { Faculty } from './faculty';

export interface Subject {
  _id?: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  course: string;
  semester: number;
  credits: number;
  faculty?: Faculty | string | null;
  description?: string;
  createdAt?: string;
}

export interface SubjectListResponse {
  success: boolean;
  count: number;
  totalSubjects: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  subjects: Subject[];
}

export interface AttendanceRow {
  _id?: string;
  student: {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    department: string;
    course: string;
    semester: number;
  };
  subject: {
    _id: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    department: string;
    course: string;
    semester: number;
    credits: number;
  };
  faculty: {
    _id: string;
    facultyId: string;
    name: string;
    email: string;
    department: string;
    designation: string;
  };
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
}

export interface MarksRow {
  _id?: string;
  student: { _id: string; studentId: string; name: string; email: string };
  subject: { _id: string; subjectCode: string; subjectName: string; credits: number };
  faculty: { _id: string; name: string };
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: string;
  gradePoint: number;
  result: 'Pass' | 'Fail';
  remarks?: string;
}