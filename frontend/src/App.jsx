import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostItem from "./pages/PostItem";
import ItemDetail from "./pages/ItemDetail";
import EditItem from "./pages/EditItem";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import MyPosts from "./pages/MyPosts";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div>
      <Navbar />
      <div style={{ padding: "0 1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/post" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
          <Route path="/items/:id/edit" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
          <Route path="/my-posts" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
          {/* Inbox/Chat routes stay reachable even without a navbar link —
              "Message Poster" on an item page resumes the right conversation */}
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;