
const express=require("express")
var router =express.Router()
const {Authenticate} =require("./Authenticate")
const { Verify_Uploaded_Files, Filter_By_Size } = require("./Request_Filters")
const {Update_Write_Key} = require("../Write_Key/Write_Key_Base")
const {Upload_File,Update_File} = require("../Box/Write_File_To_Box")

router.post("/",[Authenticate,Verify_Uploaded_Files,Filter_By_Size],async function (request, response){
    let verifiedFiles=request.files
    let fileInformation=request.app.locals.fileInformation
    let writeKeyData=request.app.locals.writeKeyData
    let failedFiles=request.app.locals.failedFiles
    for (const [key,value] of Object.entries(verifiedFiles)){
        newFile=await Promise.all(value.map(File_To_Box,{fileInformation:fileInformation,failedFiles:failedFiles,writeKeyData:writeKeyData}))
    }
    writeKeyData["uploadState"]=fileInformation
    try{
    Update_Write_Key(`${request.app.locals.keys.templateKey}`,writeKeyData)
    response.setHeader('Access-Control-Allow-Origin', "*");
    response.setHeader('Content-Type', 'application/json');
    response.json({"failedFiles":failedFiles})
}
catch(e){
    response.json({"internal":"failed To completely update file"})
}
})
async function File_To_Box(file){
    // add writeKeyData ability to add file ids
    console.log(Object.keys(this.fileInformation[file.fieldname].files[file.originalname]))
    if (! Object.keys(this.fileInformation[file.fieldname].files[file.originalname]).includes("fileId")){
        let fileId=await Upload_File(file.buffer,this.fileInformation[file.fieldname].scope.boxFolderId,file.originalname)
        console.log(fileId)
        if (fileId){
            this.fileInformation[file.fieldname].files[file.originalname]["fileId"]=fileId
            return true
        }
        else{
            this.failedFiles[file.originalname]=`File ${file.originalname} failed to upload to box`
            return false
        }
    }
    else{
        return (await Update_File(file.buffer,this.fileInformation[file.fieldname].files[file.originalname]["fileId"]))
    }
}
module.exports = {File_Upload:router}


