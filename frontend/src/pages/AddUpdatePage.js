import React, { useState } from "react";

function AddUpdatePage({ projectId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expenseUsed, setExpenseUsed] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [photos, setPhotos] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("expenseUsed", expenseUsed);
    formData.append("expenseCategory", expenseCategory);

    for (let i = 0; i < photos.length; i++) {
      formData.append("photos", photos[i]);
    }

    await fetch("http://localhost:5000/api/updates/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    alert("Update Added Successfully");
  };

  return (
    <div className="update-form">
      <h2>Add Project Update</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Update Title"
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Expense Used"
          onChange={(e) => setExpenseUsed(e.target.value)}
        />

        <select onChange={(e) => setExpenseCategory(e.target.value)}>
          <option value="">Select Category</option>
          <option value="Cement & Materials">Cement & Materials</option>
          <option value="Labor">Labor</option>
          <option value="Transport">Transport</option>
          <option value="Equipment Rental">Equipment Rental</option>
          <option value="Administrative">Administrative</option>
        </select>

        <input
          type="file"
          multiple
          onChange={(e) => setPhotos(e.target.files)}
        />

        <button type="submit">Submit Update</button>
      </form>
    </div>
  );
}

export default AddUpdatePage;