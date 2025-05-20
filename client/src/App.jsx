// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PublicProfile from "./pages/PublicProfile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SinglePost from "./pages/SinglePost";
import CreatePost from "./pages/CreatePost";

// chat components
import ConversationsList from "./components/ConversationsList";
import NewChatForm       from "./components/NewChatForm";
import ChatPage          from "./components/ChatPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* public */}
        <Route index element={<Home />} />
        <Route path="login"    element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* public profile */}
        <Route path="profile/:username" element={<PublicProfile />} />

        {/* authenticated */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* posts */}
        <Route path="jobs" element={<Jobs />} />
        <Route path="posts/:id" element={<SinglePost />} />
        <Route path="create-post" element={<CreatePost />} />

        {/* chat */}
        <Route
          path="conversations"
          element={
            <ProtectedRoute>
              <ConversationsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="new-chat"
          element={
            <ProtectedRoute>
              <NewChatForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat/:conversationId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
