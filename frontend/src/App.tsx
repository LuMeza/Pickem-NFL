import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/presentation/components/AppLayout'
import { ScrollToTop } from '@/presentation/components/ScrollToTop'
import { UpdateAvailableBanner } from '@/presentation/components/UpdateAvailableBanner/UpdateAvailableBanner'
import { ResultsUpdatedBanner } from '@/presentation/components/ResultsUpdatedBanner/ResultsUpdatedBanner'
import { RequireAuth } from '@/presentation/components/RequireAuth'
import { RequireActiveSession } from '@/presentation/components/RequireActiveSession'
import { RequireAdmin } from '@/presentation/components/RequireAdmin'
import { NotFoundRedirect } from '@/presentation/components/NotFoundRedirect'
import { LoginPage } from '@/presentation/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/presentation/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/presentation/features/auth/ResetPasswordPage'
import { ChangePasswordPage } from '@/presentation/features/auth/ChangePasswordPage'
import { ProfilePage } from '@/presentation/features/auth/ProfilePage'
import { HomePage } from '@/presentation/features/home/HomePage'
import { RequestModuleAccessPage } from '@/presentation/features/groups/RequestModuleAccessPage'
import { PickemHubPage } from '@/presentation/features/pickem/PickemHubPage'
import { PickemStandingsRedirect } from '@/presentation/features/pickem/PickemStandingsRedirect'
import { PickemStandingsPage } from '@/presentation/features/pickem/PickemStandingsPage'
import { SurvivorRedirect } from '@/presentation/features/survivor/SurvivorRedirect'
import { SurvivorPickPage } from '@/presentation/features/survivor/SurvivorPickPage'
import { SurvivorStandingsPage } from '@/presentation/features/survivor/SurvivorStandingsPage'
import { TeamsPage } from '@/presentation/features/catalog/TeamsPage'
import { TeamDetailPage } from '@/presentation/features/catalog/TeamDetailPage'
import { WeeksRedirect } from '@/presentation/features/catalog/WeeksRedirect'
import { GamesPage } from '@/presentation/features/catalog/GamesPage'
import { CalendarPage } from '@/presentation/features/catalog/CalendarPage'
import { AdminHomePage } from '@/presentation/features/admin/AdminHomePage'
import { AdminUsersPage } from '@/presentation/features/admin/AdminUsersPage'
import { GroupMembersPage } from '@/presentation/features/admin/GroupMembersPage'
import { ModuleAccessRequestsPage } from '@/presentation/features/admin/ModuleAccessRequestsPage'
import { AdminPickemSettingsPage } from '@/presentation/features/admin/AdminPickemSettingsPage'
import { AdminResultsPage } from '@/presentation/features/admin/AdminResultsPage'
import { AdminCreateGamePage } from '@/presentation/features/admin/AdminCreateGamePage'
import { AdminSyncPage } from '@/presentation/features/admin/AdminSyncPage'
import { AdminSurvivorPage } from '@/presentation/features/admin/AdminSurvivorPage'
import { AdminUserPicksPage } from '@/presentation/features/admin/AdminUserPicksPage'

/** Router de la app. Grupo único global — ver specs/grupos-privados actualizado. */
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <UpdateAvailableBanner />
      <ResultsUpdatedBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireActiveSession />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/request-access" element={<RequestModuleAccessPage />} />
            <Route path="/pickem" element={<PickemHubPage />} />
            <Route path="/pickem/tabla" element={<PickemStandingsRedirect />} />
            <Route path="/pickem/tabla/:weekId" element={<PickemStandingsPage />} />
            <Route path="/survivor" element={<SurvivorRedirect />} />
            <Route path="/survivor/semana/:weekId" element={<SurvivorPickPage />} />
            <Route path="/survivor/tabla" element={<SurvivorStandingsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/weeks" element={<WeeksRedirect />} />
            <Route path="/weeks/:weekId/games" element={<GamesPage />} />

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminHomePage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/members" element={<GroupMembersPage />} />
              <Route path="/admin/access-requests" element={<ModuleAccessRequestsPage />} />
              <Route path="/admin/pickem/settings" element={<AdminPickemSettingsPage />} />
              <Route path="/admin/games/new" element={<AdminCreateGamePage />} />
              <Route path="/admin/sync" element={<AdminSyncPage />} />
              <Route path="/admin/survivor" element={<AdminSurvivorPage />} />
              <Route path="/admin/results" element={<AdminResultsPage />} />
              <Route path="/admin/picks" element={<AdminUserPicksPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
