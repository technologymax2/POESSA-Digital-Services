// src/components/Report.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function Report() {
  const [pensioners, setPensioners] = useState([]);

  useEffect(() => {
    axios.get("https://poessa-digital-services-1.onrender.com/api/pensioners").then(res => setPensioners(res.data.data));
  }, []);

  return (
    <table border="1" style={{ width: "100%", marginTop: "20px" }}>
      <thead>
        <tr><th>ስም</th><th>ፋይዳ ቁጥር</th><th>ፐርሰንት</th><th>ሁኔታ</th></tr>
      </thead>
      <tbody>
        {pensioners.map(p => (
          <tr key={p._id}>
            <td>{p.name}</td>
            <td>{p.faydaNumber}</td>
            <td>{p.matchPercentage}%</td>
            <td>{p.verificationStatus}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default Report;
