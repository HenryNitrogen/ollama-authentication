const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const API_KEYS = process.env.API_KEYS || "";
const app = express();
const port = 927;


app.use(express.json());

app.post("/", async (req, res) => {
  const authorization = req.headers.authorization || "";


  if (!API_KEYS || API_KEYS !== authorization) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const model = req.body?.model;
  const messages = req.body?.messages;
  const stream = req.body?.stream || false;

   const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream }),
    });
    const data = await response.json();
    return res.json(data);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
