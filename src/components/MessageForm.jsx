import React, { useState } from "react";

function MessageForm() {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Your fetch request
    try {
      const response = await fetch("/api/trigger-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: inputValue }),
      });
      const data = await response.json();
      console.log("Response:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={inputValue} onChange={handleChange} />
      <br></br>
      <button type="submit">Trigger Workflow</button>
    </form>
  );
}

export default MessageForm;
