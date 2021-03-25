let {Get_Write_Key}=require("../Write_Key/Write_Key_Base")
async function Authenticate(req,res,cb){
    authorization=req.headers.authorization
        if(!Basic_Authentication(authorization)){
            Terminate_Connection(res)
        }
        try{
            let templateKey=authorization.split(";")[0].split(":")[1]
            let writeKey=authorization.split(";")[1].split(":")[1]
            let writeKeyData=await Get_Write_Key(templateKey,writeKey)
            if (! writeKeyData){
                Terminate_Connection(res)
            }
            req.app.locals.keys={templateKey:templateKey,writeKey:writeKey}
            req.app.locals.fileInformation=writeKeyData.uploadState
            req.app.locals.failedFiles={}
            req.app.locals.writeKeyData=writeKeyData
            let uploadStateKeys=Object.keys(writeKeyData.uploadState)
            for (var i=0;i<uploadStateKeys.length;i++){
               let tempKeyLength= Object.keys(writeKeyData.uploadState[uploadStateKeys[i]].files).length
               req.app.locals.fileInformation[uploadStateKeys[i]].scope["fileCount"]=tempKeyLength
            }
            return cb()
        }
        catch(e){
            console.log(e)
            console.log("Authenticate Upload: checkpoint fail 3")
            Terminate_Connection(res)
            return false
        }
    }
function Basic_Authentication(authorization){
    try{
        if (authorization.split(";").length!=2){
            console.log("Authenticate Upload: checkpoint fail 1")
            return false
        }
        if (authorization.split(";")[0].split(":")[0]!="templateKey" || authorization.split(";")[1].split(":")[0]!="writeKey" ){
            console.log("Authenticate Upload: checkpoint fail 2")
            return false
        }
        return true
    }
    catch(e){
        return e
    }
}
function Terminate_Connection(res){
    res.sendStatus(401)
    res.end();
}
module.exports={
    Authenticate
}