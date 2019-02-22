const fs = require('fs');
const multer = require('multer');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const express = require('express');
if (!fs.existsSync("./files")) {
  fs.mkdirSync("./files");
}

const uploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './files/')
    },
    filename: (req, file, cb) => {
      cb(null, `${file.originalname}.png`);
    }
  })
});

const uploaderForCapture = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './captures/')
    },
    filename: (req, file, cb) => {
      cb(null, `${file.originalname}.png`);
    }
  })
});

module.exports = app => {

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use("/files", express.static('files'));

  app.get("/images", (req, res) => {
    fs.readdir('./files', function(err, files){
      if (err) throw err;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json({
        files: files.filter(file => fs.statSync(`./files/${file}`).isFile() && file[0] !== ".")
      });
    });
  });

  app.post("/images", uploader.single('image'), (req, res) => {
    const file = req.file;
    const meta = req.body;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({msg: 'アップロード完了'});
  });

  app.post("/captures", uploaderForCapture.single('image'), (req, res) => {
    const file = req.file;
    const meta = req.body;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({msg: 'アップロード完了'});
  });

  app.post("/uv", (req, res) => {
      const { name } = req.body;
      fs.writeFile(`uv/${name}.json`, JSON.stringify(req.body), {encoding: "utf-8"});
      res.status(200).json({msg: "アップロード完了"});
  });

  app.get("/uv", (req, res) => {
    const json = fs.readFileSync(`./uv/${req.query.name}.json`, {encoding: "utf-8"});
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(JSON.parse(json));
  });

  app.get("/uv-list", (req, res) => {
    fs.readdir('./uv', function(err, files){
      if (err) throw err;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json({
        files: files.filter(file => fs.statSync(`./uv/${file}`).isFile() && file[0] !== ".")
      });
    });
  });

  app.listen(1234, () => console.log('Listening on port 1234'));
}
