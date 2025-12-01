import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/test")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <h1 className="text-3xl font-bold mb-4">
        Unified Traffic Violation & Demerit System
      </h1>
      <p className="text-gray-700">Backend says: {message}</p>
    </div>
  );
}

export default App;
