// import React, { useEffect, useState } from "react";
// import axios from "axios";

// function MyDonations() {
//   const [donations, setDonations] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchDonations = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) {
//           setLoading(false);
//           return;
//         }

//         const res = await axios.get("http://localhost:5000/api/donations/my", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         console.log("DONATIONS DATA:", res.data);
//         setDonations(res.data || []);
//       } catch (error) {
//         console.error("Error fetching donations:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDonations();
//   }, []);

//   return (
//     <div
//       style={{
//         padding: "44px 48px",
//         background: "var(--bg-base)",
//         minHeight: "100vh",
//       }}
//     >
//       <h1
//         style={{
//           fontFamily: "var(--font-display)",
//           fontSize: 30,
//           fontWeight: 800,
//           color: "var(--text-primary)",
//           letterSpacing: -0.8,
//           marginBottom: 24,
//         }}
//       >
//         My Donations
//       </h1>

//       {loading ? (
//         <p>Loading donations...</p>
//       ) : donations.length === 0 ? (
//         <p>No donations found.</p>
//       ) : (
//         <div style={{ display: "grid", gap: "16px" }}>
//           {donations.map((donation) => (
//             <div
//               key={donation._id}
//               style={{
//                 background: "#fff",
//                 borderRadius: "14px",
//                 padding: "20px",
//                 boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
//               }}
//             >
//               <h3 style={{ margin: "0 0 10px 0" }}>
//                 {donation.project?.title || "Project"}
//               </h3>

//               <p style={{ margin: "6px 0" }}>
//                 <strong>Amount:</strong> NPR {donation.amount}
//               </p>

//               <p style={{ margin: "6px 0" }}>
//                 <strong>Status:</strong> {donation.paymentStatus}
//               </p>

//               <p style={{ margin: "6px 0" }}>
//                 <strong>Date:</strong>{" "}
//                 {donation.createdAt
//                   ? new Date(donation.createdAt).toLocaleString()
//                   : "N/A"}
//               </p>

//               <p style={{ margin: "6px 0", color: "#666" }}>
//                 <strong>Receipt:</strong> {donation.receiptUrl || "No receipt found"}
//               </p>

//               {donation.receiptUrl && (
//                 <div
//                   style={{
//                     marginTop: "12px",
//                     display: "flex",
//                     gap: "10px",
//                     flexWrap: "wrap",
//                   }}
//                 >
//                   <a
//                     href={`http://localhost:5000${donation.receiptUrl}`}
//                     target="_blank"
//                     rel="noreferrer"
//                     style={{
//                       display: "inline-block",
//                       padding: "10px 14px",
//                       background: "#2563eb",
//                       color: "#fff",
//                       textDecoration: "none",
//                       borderRadius: "8px",
//                       fontWeight: 600,
//                     }}
//                   >
//                     View Receipt
//                   </a>

//                   <a
//                     href={`http://localhost:5000${donation.receiptUrl}`}
//                     download
//                     style={{
//                       display: "inline-block",
//                       padding: "10px 14px",
//                       background: "#16a34a",
//                       color: "#fff",
//                       textDecoration: "none",
//                       borderRadius: "8px",
//                       fontWeight: 600,
//                     }}
//                   >
//                     Download Receipt
//                   </a>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default MyDonations;