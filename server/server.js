const fs = require('fs');
const multer = require('multer');
const express = require('express');

module.exports = app => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './files/')
    },
    filename: (req, file, cb) => {
      cb(null, `${file.originalname}.png`);
    }
  });
  const uploader = multer({
    storage
  });

  app.use("/files", express.static('files'));

  app.get("/images", (req, res) => {
    fs.readdir('./files', function(err, files){
      if (err) throw err;
      console.log("req", files);
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

  app.listen(1234, () => console.log('Listening on port 1234'));
}
