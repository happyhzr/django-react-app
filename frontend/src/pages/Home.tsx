import { useState, useEffect } from "react";
import api from "../api";

function Home() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  async function getNotes() {
    try {
      const res = await api.get("/api/notes/");
      setNotes(res.data);
      console.log(res.data);
    } catch (err) {
      alert(err);
    }
  }

  async function deleteNote(id: number) {
    try {
      const res = await api.delete(`/api/notes/delete/${id}/`);
      if (res.status === 204) {
        alert("Note deleted successfully");
      } else {
        alert("Failed to delete note");
      }
      await getNotes();
    } catch (err) {
      alert(err);
    }
  }

  async function createNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const res = await api.post("/api/notes/", { content, title });
      if (res.status === 201) {
        alert("Note created successfully");
      } else {
        alert("Failed to create note");
      }
      await getNotes();
    } catch (err) {
      alert(err);
    }
  }

  return (
    <div>
      <div>
        <h2>Notes</h2>
      </div>
      <h2>Create a Note</h2>
      <form onSubmit={createNote}>
        <label htmlFor="title">Title:</label>
        <br />
        <input
          type="text"
          id="title"
          name="title"
          required
          onChange={(e) => setTitle(e.target.value)}
          value={title}
        />
        <label htmlFor="content">Content:</label>
        <br />
        <textarea
          name="content"
          id="content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <br />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Home;
