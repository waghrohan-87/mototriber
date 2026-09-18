import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import RiderDashboardPage from "./pages/RiderDashboardPage";
import DiscoverPage from "./pages/DiscoverPage";
import PostPage from "./pages/PostPage";
import ClubsPage from "./pages/ClubsPage";
import RidersPage from "./pages/RidersPage";
import ProfilePage from "./pages/ProfilePage";
import RideDetailPage from "./pages/RideDetailPage";
import RideInvitePage from "./pages/RideInvitePage";
import RiderProfilePage from "./pages/RiderProfilePage";
import ClubRegistrationPage from "./pages/ClubRegistrationPage";
import ClubProfilePage from "./pages/ClubProfilePage";
import ClubMembersPage from "./pages/ClubMembersPage";
import ClubAdminPage from "./pages/ClubAdminPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import AttendanceConfirmPage from "./pages/AttendanceConfirmPage";
import FindOrganisersPage from "./pages/FindOrganisersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ChatListPage from "./pages/ChatListPage";
import ChatThreadPage from "./pages/ChatThreadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnAuthSuccessPage from "./pages/OnAuthSuccessPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import ErrorFallback from "./components/error-fallback";
import { CanonicalManager } from "./components/canonical-manager";
import { RidesProvider } from "./context/RidesContext";
import { RidersDirectoryProvider } from "./context/RidersDirectoryContext";
import { ClubsProvider } from "./context/ClubsContext";
import { NotificationsProvider } from "./context/NotificationsContext";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary 
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      console.error(`Error Boundary caught an error(pathname:${location.pathname + location.search}):`, error, errorInfo);
      setTimeout(() => {
        throw error;
      }, 0);
    }}
  >
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <RidesProvider>
            <RidersDirectoryProvider>
              <ClubsProvider>
                <NotificationsProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route element={<CanonicalManager />}>
                        <Route element={<AppShell />}>
                          <Route path="/" element={<RiderDashboardPage />} />
                          <Route path="/discover" element={<DiscoverPage />} />
                          <Route path="/post" element={<PostPage />} />
                          <Route path="/clubs" element={<ClubsPage />} />
                          <Route path="/riders" element={<RidersPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                        </Route>
                        <Route path="/ride/:id" element={<RideDetailPage />} />
                        <Route path="/ride/:id/invite" element={<RideInvitePage />} />
                        <Route path="/rider/:id" element={<RiderProfilePage />} />
                        <Route path="/register-club" element={<ClubRegistrationPage />} />
                        <Route path="/club/:id" element={<ClubProfilePage />} />
                        <Route path="/club/:id/members" element={<ClubMembersPage />} />
                        <Route path="/club/:id/admin" element={<ClubAdminPage />} />
                        <Route path="/club/:id/find-organisers" element={<FindOrganisersPage />} />
                        <Route path="/admin-panel" element={<AdminPanelPage />} />
                        <Route path="/ride/:id/confirm-attendance" element={<AttendanceConfirmPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/messages" element={<ChatListPage />} />
                        <Route path="/messages/:id" element={<ChatThreadPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/onauthsuccess" element={<OnAuthSuccessPage />} />
                        <Route path="/profile-setup" element={<ProfileSetupPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/resetpassword" element={<ResetPasswordPage />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </NotificationsProvider>
              </ClubsProvider>
            </RidersDirectoryProvider>
          </RidesProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
