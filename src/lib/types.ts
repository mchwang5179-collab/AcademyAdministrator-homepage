export type Student = {
  id: string;
  name: string;
  birth_date: string | null;
  school: string | null;
  grade: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  notes: string | null;
  created_at: string;
};

export type ClassRoom = {
  id: string;
  name: string;
  subject: string | null;
  teacher_id: string | null;
  description: string | null;
  created_at: string;
};

export type TimetableSlot = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'early_leave' | 'makeup';

export type AbsenceType = '가족행사' | '학교행사' | '병결' | '무단결석' | '개인사정';

export type MakeupStatus = 'pending' | 'completed';

export type Attendance = {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  absence_type: AbsenceType | null;
  makeup_date: string | null;
  makeup_time: string | null;
  makeup_status: MakeupStatus | null;
  makeup_completed_date: string | null;
  created_at: string;
};

export type ExamTerm = '중간고사' | '기말고사';

export type ExamSchedule = {
  id: string;
  school: string;
  grade: string;
  term: ExamTerm;
  subject: string;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  exam_range: string | null;
  created_at: string;
};

export type ExamPaper = {
  id: string;
  title: string | null;
  school: string | null;
  grade: string | null;
  term: string | null;
  subject: string | null;
  image_url: string | null;
  cleaned_image_url: string | null;
  answer: string | null;
  created_at: string;
};