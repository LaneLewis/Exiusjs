var express = require('express');
const cors = require('cors')
var app = express();
app.use(cors())
app.use(express.urlencoded({ extended: true}));
var {File_Upload} = require("./File_Upload/Upload_Files")
var {Template_App} = require("./Template_Key/Template_Key_Router")
var {Write_Key_Router} = require("./Write_Key/Write_Key_Router")
const port = 3050
app.use("/Upload",File_Upload)
app.use("/Template",Template_App)
app.use("/WriteKey",Write_Key_Router)
app.listen(port, () => console.log(`Upload Files listening on port ${port}!`));
