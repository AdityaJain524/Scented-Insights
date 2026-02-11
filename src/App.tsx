import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import UserProfile from "./pages/UserProfile";
import CreatePost from "./pages/CreatePost";
import AdminDashboard from "./pages/AdminDashboard";
import LearningPaths from "./pages/LearningPaths";
import LearningModule from "./pages/LearningModule";
import LearningProgress from "./pages/LearningProgress";
import SustainabilityHub from "./pages/SustainabilityHub";
import Recommendations from "./pages/Recommendations";
import Achievements from "./pages/Achievements";
import Collection from "./pages/Collection";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/learn" element={<LearningPaths />} />
            <Route path="/learn/progress" element={<LearningProgress />} />
            <Route path="/learn/:pathId" element={<LearningModule />} />
            <Route path="/sustainability" element={<SustainabilityHub />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/compare" element={<Compare />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
