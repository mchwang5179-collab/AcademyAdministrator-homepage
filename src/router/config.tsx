import type { RouteObject } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/home/page';
import AuthGuard from '@/components/feature/AuthGuard';
import AppLayout from '@/components/feature/AppLayout';
import Login from '@/pages/auth/login/page';
import Signup from '@/pages/auth/signup/page';
import Dashboard from '@/pages/dashboard/page';
import Students from '@/pages/students/page';
import Classes from '@/pages/classes/page';
import ClassDetail from '@/pages/classes/detail/page';
import Timetable from '@/pages/timetable/page';
import AttendancePage from '@/pages/attendance/page';
import MakeupPage from '@/pages/makeup/page';
import AbsenceCalendarPage from '@/pages/absence-calendar/page';
import ExamsPage from '@/pages/exams/page';
import ExamPapersPage from '@/pages/exam-papers/page';
import Teachers from '@/pages/teachers/page';
import Approvals from '@/pages/approvals/page';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/students',
        element: <Students />,
      },
      {
        path: '/classes',
        element: <Classes />,
      },
      {
        path: '/classes/:id',
        element: <ClassDetail />,
      },
      {
        path: '/timetable',
        element: <Timetable />,
      },
      {
        path: '/attendance',
        element: <AttendancePage />,
      },
      {
        path: '/makeup',
        element: <MakeupPage />,
      },
      {
        path: '/absence-calendar',
        element: <AbsenceCalendarPage />,
      },
      {
        path: '/exams',
        element: <ExamsPage />,
      },
      {
        path: '/exam-papers',
        element: <ExamPapersPage />,
      },
      {
        path: '/teachers',
        element: <Teachers />,
      },
      {
        path: '/approvals',
        element: <Approvals />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;