import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import TestPage from "@/pages/TestPage";
import Contact from "@/pages/Contact";
import SuperAdmin from "@/pages/Super_Admin/SuperAdmin";
import Officer from "@/pages/Traffic_Officer/Officer";
import Auditor from "@/pages/System_Auditor/Auditor";
import LGUAdmin from "@/pages/LGU_Admin/LGUAdmin";
import LGUStaff from "@/pages/LGU_Staff/LGUStaff";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/officer" element={<Officer />} />
        <Route path="/auditor" element={<Auditor />} />
        <Route path="/lgu-admin" element={<LGUAdmin />} />
        <Route path="/lgu-staff" element={<LGUStaff />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default App;