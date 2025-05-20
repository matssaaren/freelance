import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PublicProfile from './pages/PublicProfile';
import EditProfile from "./pages/EditProfile";
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import SinglePost from './pages/SinglePost';
import CreatePost from './pages/CreatePost';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="edit-profile" element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />
        <Route path="/profile/:username" element={<PublicProfile />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="/posts/:id" element={<SinglePost />} />
        <Route path="/create-post" element={<CreatePost />} />

      </Route>
    </Routes>
  );
}
