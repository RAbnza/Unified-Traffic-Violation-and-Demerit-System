import { Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Contact from "@/pages/Contact";
import Auditor from "@/pages/Auditor";
import SuperAdmin from "@/pages/SuperAdmin";
import Officer from "@/pages/Officer";
import LGUAdmin from "@/pages/LGUAdmin";
import LGUStaff from "@/pages/LGUStaff";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Role-Based Routes */}
      <Route path="/superadmin" element={<SuperAdmin />} />
      <Route path="/officer" element={<Officer />} />
      <Route path="/auditor" element={<Auditor />} />
      <Route path="/lgu-admin" element={<LGUAdmin />} />
      <Route path="/lgu-staff" element={<LGUStaff />} />
    </Routes>
  );
}

export default App;