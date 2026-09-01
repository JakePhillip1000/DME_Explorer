const express = require("express")
const app = express()

app.get("/api", (req, res) => {
    res.json({"users" : ["userOne", "userTwo", "userThree"]})
})

// server run on port 5000, client run on port 3000 (react js default port)
app.listen(5000, () =>{
    console.log("Server started on port 5000")
})