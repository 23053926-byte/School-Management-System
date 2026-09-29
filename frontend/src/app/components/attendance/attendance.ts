import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { AttendanceService } from '../../services/attendance.service';
import { LookupService } from '../../services/lookup.service';
import { Student } from '../../models/student';
import { Subject } from '../../models/subject';
import { Faculty } from '../../models/faculty';

export interface BulkStudentStatus {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: 'Present' | 'Absent' | 'Late' | '';
}

export interface YoloDetectedStudent {
  _id: string;
  studentId: string;
  name: string;
  similarity: number;
  status: 'Present' | 'Absent';
  boxCoords: [number, number, number, number];
}

@Component({
  selector: 'app-attendance',
  imports: [FormsModule, DatePipe, CommonModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceComponent implements OnInit {
  @ViewChild('canvas') canvasRef: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('video') videoRef: ElementRef<HTMLVideoElement> | undefined;

  private attendanceService = inject(AttendanceService);
  private lookup = inject(LookupService);
  private cdr = inject(ChangeDetectorRef);

  // ---- Tabs ----
  activeTab: 'list' | 'manual' | 'yolo' = 'list';

  // ---- Records list ----
  records: any[] = [];
  selectedStatus = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  total = 0;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // ---- Lookups ----
  students: Student[] = [];
  subjects: Subject[] = [];
  faculties: Faculty[] = [];

  // ---- Bulk attendance mode ----
  showBulkMode = false;
  bulkSubject = '';
  bulkDate = new Date().toISOString().substring(0, 10);
  bulkFaculty = '';
  bulkStudents: BulkStudentStatus[] = [];
  bulkLoading = false;
  bulkSaving = false;
  bulkError = '';
  bulkSuccess = '';

  // ---- Single record modal ----
  showModal = false;
  saving = false;
  formError = '';
  editingId: string | null = null;
  form = {
    student: '',
    subject: '',
    faculty: '',
    date: '',
    status: 'Present',
    remarks: ''
  };

  // ---- YOLO AI Attendance ----
  yoloMode: 'upload' | 'webcam' | 'detect' | 'confirm' = 'upload';
  yoloSubject = '';
  yoloFaculty = '';
  yoloDate = new Date().toISOString().substring(0, 10);
  yoloDepartment = '';
  yoloSemester = '';
  yoloDetecting = false;
  yoloDetectError = '';
  yoloSelectedFile: File | null = null;
  yoloImagePreview: string | null = null;
  yoloDetectedStudents: YoloDetectedStudent[] = [];
  yoloImageWidth = 0;
  yoloImageHeight = 0;
  yoloImagePath: string | null = null;
  webcamActive = false;
  webcamStream: MediaStream | null = null;
  yoloConfirming = false;

  departments: string[] = ['CSE', 'ECE', 'EEE', 'ME', 'CE'];
  semesters: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sem_NUR', 'LKG', 'UKG'];

  ngOnInit(): void {
    this.loadAttendance();
    this.loadLookups();
  }

  ngOnDestroy(): void {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
    }
  }

  loadAttendance(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    let filters: Record<string, string> = {};
    if (this.selectedStatus) filters['status'] = this.selectedStatus;
    this.attendanceService.getAttendance(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (res) => {
        this.records = res.attendance || [];
        this.total = res.totalAttendance || 0;
        this.totalPages = res.totalPages || 1;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.records = [];
        this.total = 0;
        this.totalPages = 1;
        this.loading = false;
        this.errorMessage = 'Unable to load attendance.';
        this.cdr.markForCheck();
        console.error('[Attendance] Load error:', err);
      }
    });
  }

  loadLookups(): void {
    this.lookup.getStudents().subscribe((s) => (this.students = s));
    this.lookup.getSubjects().subscribe((s) => (this.subjects = s));
    this.lookup.getFaculties().subscribe((f) => (this.faculties = f));
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAttendance();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadAttendance();
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Present': return 'badge-success';
      case 'Absent': return 'badge-danger';
      case 'Late': return 'badge-warning';
      default: return 'badge-neutral';
    }
  }

  // ===================== BULK ATTENDANCE =====================
  startBulkMode(): void {
    if (this.faculties.length === 0) {
      this.bulkError = 'No faculty members found. Please add faculty members first.';
      setTimeout(() => (this.bulkError = ''), 4000);
      return;
    }

    if (this.subjects.length === 0) {
      this.bulkError = 'No subjects found. Please add subjects first.';
      setTimeout(() => (this.bulkError = ''), 4000);
      return;
    }

    this.showBulkMode = true;
    this.bulkSubject = '';
    this.bulkDate = new Date().toISOString().substring(0, 10);
    this.bulkFaculty = this.faculties.length > 0 ? (this.faculties[0]._id || '') : '';
    this.bulkStudents = [];
  }

  exitBulkMode(): void {
    this.showBulkMode = false;
    this.bulkStudents = [];
  }

  loadBulkStudents(): void {
    if (!this.bulkSubject) {
      this.bulkStudents = [];
      return;
    }
    this.bulkLoading = true;
    const subject = this.subjects.find((s) => s._id === this.bulkSubject);
    if (!subject) {
      this.bulkStudents = [];
      this.bulkLoading = false;
      return;
    }
    const dept = subject.department;
    const sem = subject.semester;
    const matchingStudents = this.students.filter(
      (s) => s.department === dept && String(s.semester) === String(sem)
    );
    this.bulkStudents = matchingStudents.map((s) => ({
      studentId: s._id || '',
      studentName: s.name,
      studentCode: s.studentId,
      status: ''
    }));
    this.bulkLoading = false;
    console.log('[Attendance] Bulk students loaded:', this.bulkStudents.length);
  }

  setStatus(studentId: string, status: string): void {
    const s = this.bulkStudents.find((x) => x.studentId === studentId);
    if (s) s.status = status as any;
  }

  setAllStatus(status: string): void {
    this.bulkStudents.forEach((s) => (s.status = status as any));
  }

  saveBulkAttendance(): void {
    const toSave = this.bulkStudents.filter((s) => s.status !== '');
    if (toSave.length === 0) {
      this.bulkError = 'Please select a status for at least one student.';
      return;
    }
    this.bulkSaving = true;
    this.bulkError = '';
    this.bulkSuccess = '';
    let completed = 0;
    let failed = 0;
    const total = toSave.length;
    toSave.forEach((s) => {
      this.attendanceService.markAttendance({
        student: s.studentId,
        subject: this.bulkSubject,
        faculty: this.bulkFaculty,
        date: this.bulkDate,
        status: s.status
      }).subscribe({
        next: () => {
          completed++;
          if (completed + failed === total) {
            this.bulkSaving = false;
            this.bulkSuccess = 'Attendance saved for ' + completed + ' student(s).' + (failed > 0 ? ' ' + failed + ' failed.' : '');
            setTimeout(() => (this.bulkSuccess = ''), 3000);
            this.exitBulkMode();
            this.loadAttendance();
          }
        },
        error: (err) => {
          failed++;
          console.error('[Attendance] Bulk save error for', s.studentName, err);
          if (completed + failed === total) {
            this.bulkSaving = false;
            this.bulkError = 'Saved ' + completed + ' student(s). ' + failed + ' failed.';
            setTimeout(() => (this.bulkError = ''), 4000);
            this.exitBulkMode();
            this.loadAttendance();
          }
        }
      });
    });
  }

  // ===================== SINGLE RECORD =====================
  openMark(): void {
    this.form = { student: '', subject: '', faculty: '', date: new Date().toISOString().substring(0, 10), status: 'Present', remarks: '' };
    this.formError = '';
    this.editingId = null;
    this.showModal = true;
  }

  openEdit(record: any): void {
    this.editingId = record._id || null;
    this.form = {
      student: record.student?._id || '',
      subject: record.subject?._id || '',
      faculty: record.faculty?._id || '',
      date: record.date ? record.date.substring(0, 10) : '',
      status: record.status || 'Present',
      remarks: record.remarks || ''
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  save(): void {
    this.formError = '';
    if (!this.form.student || !this.form.subject || !this.form.faculty || !this.form.date) {
      this.formError = 'Please select student, subject, faculty and date.';
      return;
    }
    this.saving = true;

    const request = this.editingId
      ? this.attendanceService.updateAttendance(this.editingId, this.form)
      : this.attendanceService.markAttendance(this.form);

    request.subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = res?.message || (this.editingId ? 'Attendance updated.' : 'Attendance marked successfully.');
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadAttendance();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || (this.editingId ? 'Unable to update attendance.' : 'Unable to mark attendance.');
      }
    });
  }

  deleteRecord(id: string | undefined): void {
    if (!id) return;
    this.attendanceService.deleteAttendance(id).subscribe({
      next: (res) => {
        this.successMessage = res?.message || 'Attendance record deleted.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadAttendance();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to delete the record.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadAttendance(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadAttendance(); }
  }

  // ===================== YOLO FACE DETECTION =====================

  switchTab(tab: 'list' | 'manual' | 'yolo'): void {
    this.activeTab = tab;
    if (tab !== 'yolo') {
      this.stopWebcam();
    }
    this.cdr.markForCheck();
  }

  onYoloFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.yoloSelectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.yoloImagePreview = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  clearYoloImage(): void {
    this.yoloSelectedFile = null;
    this.yoloImagePreview = null;
    this.yoloDetectedStudents = [];
    this.yoloMode = 'upload';
    this.cdr.markForCheck();
  }

  startWebcam(): void {
    this.yoloMode = 'webcam';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(stream => {
      this.webcamStream = stream;
      setTimeout(() => {
        if (this.videoRef) {
          this.videoRef.nativeElement.srcObject = stream;
        }
      }, 100);
      this.webcamActive = true;
      this.cdr.markForCheck();
    }).catch(err => {
      this.yoloDetectError = 'Unable to access webcam: ' + err.message;
      this.cdr.markForCheck();
    });
  }

  captureSnapshot(): void {
    if (!this.videoRef || !this.canvasRef) return;

    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          this.yoloSelectedFile = new File([blob], 'webcam-snapshot.jpg', { type: 'image/jpeg' });
          this.yoloImagePreview = canvas.toDataURL('image/jpeg');
          this.stopWebcam();
          this.yoloMode = 'detect';
          this.cdr.markForCheck();
        }
      });
    }
  }

  stopWebcam(): void {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    this.webcamActive = false;
    this.cdr.markForCheck();
  }

  detectYoloFaces(): void {
    if (!this.yoloSelectedFile) {
      this.yoloDetectError = 'Please select or capture an image first.';
      return;
    }

    if (!this.yoloDepartment || !this.yoloSemester) {
      this.yoloDetectError = 'Please select department and semester.';
      return;
    }

    this.yoloDetecting = true;
    this.yoloDetectError = '';
    const formData = new FormData();
    formData.append('classImage', this.yoloSelectedFile);
    formData.append('department', this.yoloDepartment);
    formData.append('semester', this.yoloSemester);

    this.attendanceService.yoloDetect(formData).subscribe({
      next: (res) => {
        this.yoloDetecting = false;
        this.yoloDetectError = '';
        this.yoloImageWidth = res.imageWidth;
        this.yoloImageHeight = res.imageHeight;
        this.yoloImagePath = res.imagePath || null;

        // Convert YOLO detections to our format
        this.yoloDetectedStudents = res.detections
          .filter((d: any) => d.matchedStudent)
          .map((d: any) => ({
            _id: d.matchedStudent._id,
            studentId: d.matchedStudent.studentId,
            name: d.matchedStudent.name,
            similarity: d.matchedStudent.similarity,
            status: 'Present' as const,
            boxCoords: d.box
          }));

        this.yoloMode = 'confirm';
        this.drawBoundingBoxes();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.yoloDetecting = false;
        this.yoloDetectError = err?.error?.message || 'Face detection failed.';
        this.cdr.markForCheck();
      }
    });
  }

  drawBoundingBoxes(): void {
    if (!this.canvasRef || !this.yoloImagePreview) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      this.yoloDetectedStudents.forEach(student => {
        const [x1, y1, x2, y2] = student.boxCoords;
        const width = x2 - x1;
        const height = y2 - y1;

        // Draw rectangle
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, width, height);

        // Draw label background
        const label = `${student.name} (${Math.round(student.similarity * 100)}%)`;
        const textMetrics = ctx.measureText(label);
        const textHeight = 20;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(x1, y1 - textHeight - 5, textMetrics.width + 10, textHeight);

        // Draw label text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(label, x1 + 5, y1 - 7);
      });
    };
    img.src = this.yoloImagePreview;
  }

  toggleStudentStatus(index: number): void {
    if (this.yoloDetectedStudents[index]) {
      this.yoloDetectedStudents[index].status =
        this.yoloDetectedStudents[index].status === 'Present' ? 'Absent' : 'Present';
    }
  }

  confirmYoloAttendance(): void {
    if (!this.yoloSubject || !this.yoloFaculty) {
      this.yoloDetectError = 'Please select subject and faculty.';
      return;
    }

    if (this.yoloDetectedStudents.length === 0) {
      this.yoloDetectError = 'No students detected.';
      return;
    }

    this.yoloConfirming = true;
    this.yoloDetectError = '';

    const payload = {
      subject: this.yoloSubject,
      faculty: this.yoloFaculty,
      date: this.yoloDate,
      records: this.yoloDetectedStudents.map(s => ({
        student: s._id,
        status: s.status,
        confidence: s.similarity
      }))
    };

    this.attendanceService.yoloMark(payload).subscribe({
      next: (res) => {
        this.yoloConfirming = false;
        this.successMessage = `Attendance marked for ${this.yoloDetectedStudents.length} student(s).`;
        setTimeout(() => (this.successMessage = ''), 3000);
        this.clearYoloImage();
        this.yoloDetectedStudents = [];
        this.activeTab = 'list';
        this.loadAttendance();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.yoloConfirming = false;
        this.yoloDetectError = err?.error?.message || 'Failed to mark attendance.';
        this.cdr.markForCheck();
      }
    });
  }
}