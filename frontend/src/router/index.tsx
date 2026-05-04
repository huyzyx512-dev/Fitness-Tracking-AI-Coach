import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout }    from '@/components/layout/AppLayout'
import { AuthLayout }   from '@/components/layout/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/lib/constants'

/* ─── Lazy page imports ──────────────────────────────────── */
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage       = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage      = lazy(() => import('@/pages/DashboardPage'))
const WorkoutListPage    = lazy(() => import('@/pages/workout/WorkoutListPage'))
const WorkoutDetailPage  = lazy(() => import('@/pages/workout/WorkoutDetailPage'))
const CreateWorkoutPage  = lazy(() => import('@/pages/workout/CreateWorkoutPage'))
const EditWorkoutPage    = lazy(() => import('@/pages/workout/EditWorkoutPage'))
const ExerciseListPage   = lazy(() => import('@/pages/exercise/ExerciseListPage'))
const ExerciseDetailPage = lazy(() => import('@/pages/exercise/ExerciseDetailPage'))
const CreateExercisePage = lazy(() => import('@/pages/exercise/CreateExercisePage'))
const EditExercisePage   = lazy(() => import('@/pages/exercise/EditExercisePage'))
const LogsPage           = lazy(() => import('@/pages/logs/LogsPage'))
const ProfilePage        = lazy(() => import('@/pages/ProfilePage'))
const AdminUserListPage  = lazy(() => import('@/pages/admin/users/AdminUserListPage'))
const AdminUserDetailPage = lazy(() => import('@/pages/admin/users/AdminUserDetailPage'))
const AdminUserCreatePage = lazy(() => import('@/pages/admin/users/AdminUserCreatePage'))
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'))
const ForbiddenPage      = lazy(() => import('@/pages/ForbiddenPage'))
const ServerErrorPage    = lazy(() => import('@/pages/ServerErrorPage'))

const Fallback = () => <FullPageSpinner />

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<Fallback />}>{element}</Suspense>
}

/* ─── Router ─────────────────────────────────────────────── */
export const router = createBrowserRouter([
  /* ── Auth (public) ─────────────────────────────────────── */
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: withSuspense(<LoginPage />),
        handle: { breadcrumb: 'Đăng nhập' },
      },
      {
        path: ROUTES.REGISTER,
        element: withSuspense(<RegisterPage />),
        handle: { breadcrumb: 'Đăng ký' },
      },
    ],
  },

  /* ── Error pages (standalone) ───────────────────────────── */
  { path: ROUTES.NOT_FOUND,    element: withSuspense(<NotFoundPage />) },
  { path: ROUTES.FORBIDDEN,    element: withSuspense(<ForbiddenPage />) },
  { path: ROUTES.SERVER_ERROR, element: withSuspense(<ServerErrorPage />) },

  /* ── Protected app ──────────────────────────────────────── */
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          /* Dashboard */
          {
            path: ROUTES.DASHBOARD,
            index: true,
            element: withSuspense(<DashboardPage />),
            handle: { breadcrumb: 'Tổng quan' },
          },

          /* Workouts */
          {
            path: ROUTES.WORKOUTS,
            handle: { breadcrumb: 'Buổi tập' },
            children: [
              { index: true, element: withSuspense(<WorkoutListPage />) },
              {
                path: 'new',
                element: withSuspense(<CreateWorkoutPage />),
                handle: { breadcrumb: 'Tạo buổi tập' },
              },
              {
                path: ':id',
                element: withSuspense(<WorkoutDetailPage />),
                handle: { breadcrumb: 'Chi tiết' },
              },
              {
                path: ':id/edit',
                element: withSuspense(<EditWorkoutPage />),
                handle: { breadcrumb: 'Chỉnh sửa' },
              },
            ],
          },

          /* Exercises */
          {
            path: ROUTES.EXERCISES,
            handle: { breadcrumb: 'Bài tập' },
            children: [
              { index: true, element: withSuspense(<ExerciseListPage />) },
              {
                path: 'new',
                element: withSuspense(<CreateExercisePage />),
                handle: { breadcrumb: 'Tạo bài tập' },
              },
              {
                path: ':id',
                element: withSuspense(<ExerciseDetailPage />),
                handle: { breadcrumb: 'Chi tiết' },
              },
              {
                path: ':id/edit',
                element: withSuspense(<EditExercisePage />),
                handle: { breadcrumb: 'Chỉnh sửa' },
              },
            ],
          },

          /* Logs */
          {
            path: ROUTES.LOGS,
            element: withSuspense(<LogsPage />),
            handle: { breadcrumb: 'Nhật ký' },
          },

          /* Profile */
          {
            path: ROUTES.PROFILE,
            element: withSuspense(<ProfilePage />),
            handle: { breadcrumb: 'Hồ sơ' },
          },
          
          /* Admin users */
          {
            element: <RoleGuard roles={['ADMIN']} />,
            children: [
              {
                path: ROUTES.ADMIN_USERS,
                element: withSuspense(<AdminUserListPage />),
                handle: { breadcrumb: 'Quản trị người dùng' },
              },
              {
                path: ROUTES.ADMIN_USER_NEW,
                element: withSuspense(<AdminUserCreatePage />),
                handle: { breadcrumb: 'Tạo người dùng' },
              },
              {
                path: ROUTES.ADMIN_USER_DETAIL_PATH,
                element: withSuspense(<AdminUserDetailPage />),
                handle: { breadcrumb: 'Chi tiết người dùng' },
              },
            ],
          },
        ],
      },
    ],
  },

  /* ── Catch-all ──────────────────────────────────────────── */
  { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
])
