const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const multer = require("multer");
const upload = multer({ dest: "uploads" });

const bcrypt = require("bcrypt");

const File = require("./models/File")

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI)

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    };
    if ((req.body.password != null) && (req.body.password !== "")) {
        fileData.password = await bcrypt.hash(req.body.password, 10);
    }

    const file = await File.create(fileData);

    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id);

    if (file.password != null) {
        if (req.body.password == null) {
            res.render("password");
            return;
        }

        if (!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("password", { error: true });
            return;
        }
    }


    ++file.downloadCount;
    await file.save();

    res.download(file.path, file.originalName);
}

app.route("/file/:id").get(handleDownload).post(handleDownload);

port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
