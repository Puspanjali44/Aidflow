import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./ProjectDetails.css";

function ProjectDetails() {

const { id } = useParams();

const [project, setProject] = useState(null);
const [updates, setUpdates] = useState([]);

const [showForm, setShowForm] = useState(false);
const [editingUpdate, setEditingUpdate] = useState(null);
const [editingProject, setEditingProject] = useState(false);

// FORCE NGO MODE FOR TEST
const isNGO = true;

const [form, setForm] = useState({
title: "",
description: "",
expenseUsed: "",
expenseCategory: "",
photos: []
});

const [projectEdit, setProjectEdit] = useState({
title: "",
description: "",
goalAmount: ""
});



/* ============================
FETCH PROJECT
============================ */

const fetchProject = useCallback(async () => {

try {

const res = await fetch(`http://localhost:5000/api/projects/${id}`);
const data = await res.json();

setProject(data);

setProjectEdit({
title: data.title,
description: data.description,
goalAmount: data.goalAmount
});

} catch (error) {
console.error(error);
}

}, [id]);



/* ============================
FETCH UPDATES
============================ */

const fetchUpdates = useCallback(async () => {

try {

const res = await fetch(`http://localhost:5000/api/updates/${id}`);
const data = await res.json();

setUpdates(data);

} catch (error) {
console.error(error);
}

}, [id]);



useEffect(() => {

fetchProject();
fetchUpdates();

}, [fetchProject, fetchUpdates]);



/* ============================
ADD / EDIT UPDATE
============================ */

const handleSubmit = async () => {

try {

const token = localStorage.getItem("token");

const formData = new FormData();

formData.append("projectId", id);
formData.append("title", form.title);
formData.append("description", form.description);
formData.append("expenseUsed", form.expenseUsed);
formData.append("expenseCategory", form.expenseCategory);

for (let i = 0; i < form.photos.length; i++) {
formData.append("photos", form.photos[i]);
}

const url = editingUpdate
? `http://localhost:5000/api/updates/edit/${editingUpdate}`
: "http://localhost:5000/api/updates/add";

await fetch(url, {
method: editingUpdate ? "PUT" : "POST",
headers: {
Authorization: `Bearer ${token}`
},
body: formData
});

setForm({
title: "",
description: "",
expenseUsed: "",
expenseCategory: "",
photos: []
});

setShowForm(false);
setEditingUpdate(null);

fetchUpdates();

} catch (error) {
console.error(error);
}

};



/* ============================
DELETE UPDATE
============================ */

const deleteUpdate = async (updateId) => {

const token = localStorage.getItem("token");

await fetch(`http://localhost:5000/api/updates/delete/${updateId}`, {

method: "DELETE",

headers: {
Authorization: `Bearer ${token}`
}

});

fetchUpdates();

};



/* ============================
EDIT UPDATE
============================ */

const editUpdate = (u) => {

setShowForm(true);

setEditingUpdate(u._id);

setForm({
title: u.title,
description: u.description,
expenseUsed: u.expenseUsed,
expenseCategory: u.expenseCategory,
photos: []
});

};



/* ============================
EDIT PROJECT
============================ */

const saveProjectEdit = async () => {

const token = localStorage.getItem("token");

await fetch(`http://localhost:5000/api/projects/edit/${id}`, {

method: "PUT",

headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`
},

body: JSON.stringify(projectEdit)

});

setEditingProject(false);

fetchProject();

};



if (!project) return <div style={{ padding: 40 }}>Loading...</div>;

const progress =
(project.raisedAmount / project.goalAmount) * 100 || 0;



return (

<div className="project-page">

<img
className="project-hero"
src={
project.image ||
"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
}
alt=""
/>

{/* PROJECT TITLE */}

{editingProject ? (

<div>

<input
value={projectEdit.title}
onChange={(e)=>
setProjectEdit({...projectEdit,title:e.target.value})
}
/>

<textarea
value={projectEdit.description}
onChange={(e)=>
setProjectEdit({...projectEdit,description:e.target.value})
}
/>

<input
type="number"
value={projectEdit.goalAmount}
onChange={(e)=>
setProjectEdit({...projectEdit,goalAmount:e.target.value})
}
/>

<button onClick={saveProjectEdit}>Save Project</button>

</div>

) : (

<div>

<h1 className="project-title">{project.title}</h1>

<p>{project.description}</p>

{isNGO && (
<button
className="add-update"
onClick={()=>setEditingProject(true)}
>
Edit Project
</button>
)}

</div>

)}



<div className="project-grid">

{/* LEFT SIDE */}

<div>

{/* PROGRESS */}

<div className="progress-card">

<h3>Real-Time Fund Tracking</h3>

<p>

₹{project.raisedAmount?.toLocaleString() || 0} raised of
₹{project.goalAmount?.toLocaleString() || 0}

</p>

<div className="progress-bar">

<div
className="progress-fill"
style={{ width: `${progress}%` }}
/>

</div>

<p>{Math.round(progress)}% complete</p>

</div>



{/* =====================
PROJECT UPDATES
===================== */}

<div className="update-section">

<h2>Project Updates</h2>

{isNGO && !showForm && (

<button
className="add-update"
onClick={() => setShowForm(true)}
>
Add Update
</button>

)}



{/* UPDATE FORM */}

{showForm && (

<div className="update-form">

<input
placeholder="Update Title"
value={form.title}
onChange={(e)=>
setForm({...form,title:e.target.value})
}
/>

<textarea
placeholder="Update Description"
value={form.description}
onChange={(e)=>
setForm({...form,description:e.target.value})
}
/>

<input
type="number"
placeholder="Expense Used"
value={form.expenseUsed}
onChange={(e)=>
setForm({...form,expenseUsed:e.target.value})
}
/>

<select
value={form.expenseCategory}
onChange={(e)=>
setForm({...form,expenseCategory:e.target.value})
}
>

<option>Select Category</option>
<option>Materials</option>
<option>Labor</option>
<option>Transport</option>
<option>Equipment</option>

</select>

<input
type="file"
multiple
onChange={(e)=>
setForm({...form,photos:e.target.files})
}
/>

<button
className="add-update"
onClick={handleSubmit}
>
{editingUpdate ? "Update" : "Submit"}
</button>

</div>

)}



{/* UPDATE LIST */}

{updates.map((u)=>(
<div className="update-card" key={u._id}>

<h3>{u.title}</h3>

<p>{u.description}</p>

{u.expenseUsed && (

<p style={{color:"#2e7d32"}}>

₹{u.expenseUsed} used for {u.expenseCategory}

</p>

)}

<div className="update-images">

{u.photos?.map((p)=>(
<img
key={p}
src={`http://localhost:5000/uploads/${p}`}
alt=""
/>
))}

</div>

{isNGO && (

<div className="update-actions">

<button onClick={()=>editUpdate(u)}>
Edit
</button>

<button onClick={()=>deleteUpdate(u._id)}>
Delete
</button>

</div>

)}

</div>
))}

</div>

</div>



{/* RIGHT SIDEBAR */}

<div>

<div className="sidebar-card">

<h3>Support this project</h3>

<button className="donate-btn">

Donate Now

</button>


<div className="transparency">

<p>Transparency Score</p>

<div className="score-circle">
92
</div>

<p style={{fontSize:12,color:"#666"}}>
Based on updates & reporting
</p>

</div>

</div>

</div>

</div>

</div>

);

}

export default ProjectDetails;