const express =require("express")
const {Permission_To_Delete_Write_Key,
Permission_To_Get_Write_Key,
Permission_To_Make_Write_Key,
Permission_To_Modify_Write_Key,
}= require("../Permissions/Permission_Functions")
const {    
    Add_Write_Key,
    Delete_Write_Key,
    Get_Write_Key,
    Update_Write_Key,
} =require("./Write_Key_Base")
var router = express.Router()

router.post("/getWriteKey",async function (req, res){
    // permissions needed: git key with access to repo
    try{
        let authInfo = Basic_Authorization_Write_Key_Template_And_Github_Key(req,res)
        console.log(authInfo)
        let writeKey = await Permission_To_Get_Write_Key(authInfo.templateKey,authInfo.writeKey,authInfo.githubKey)
        if (writeKey){
            res.json(writeKey)
            res.end()
        }
        else{
            Terminate_Connection(res)
        }
    }
    catch(e){
        console.log(e)
        Terminate_Connection(res)
    }
})
router.post("/deleteWriteKey",async function (req, res){
    // permissions needed: git key with access to repo
    try{
        let authInfo = Basic_Authorization_Write_Key_Template_And_Github_Key(req,res)
        let writeKey = await Permission_To_Delete_Write_Key(authInfo.templateKey,authInfo.githubKey)
        if (writeKey){
            Delete_Write_Key(authInfo.templateKey,authInfo.writeKey)
            res.json(writeKey)
            res.end()
        }
        else{
            Terminate_Connection(res)
        }
    }
    catch(e){
        console.log(e)
        Terminate_Connection(res)
    }
})
router.post("/modifyWriteKey",express.json(),async function (req,res){
    // permissions needed: git key with access to repo
    try{
        let authInfo=Basic_Authentication(req,res,["githubKey","templateKey"])
        let writeKeyParams=req.body
        if (! writeKeyParams.writeKey){
            throw Error ("No write key specified")
        }
        let modifyWriteKey=await Permission_To_Modify_Write_Key(authInfo.templateKey,writeKeyParams.writeKey,authInfo.githubKey)
        if (modifyWriteKey){
            Update_Write_Key(authInfo.templateKey,writeKeyParams)
            res.status(200).send()
        }
        else{
            throw Error ("No write key specified")
        }
    }
    catch(e){
        console.log(e)
        Terminate_Connection(res)
    }
})
router.post("/createWriteKey",express.json(),async function (req, res){
    // permissions needed: templateKey and password
    // could make this more efficient!! permission and 
    // addwriteKey overlap
    try{
        let authorization = req.headers.authorization.split(";")
        console.log(authorization)
        if (! authorization.length == 2){
            Terminate_Connection(res)
        }
        let templateKey = authorization[0].split(":")
        let password = authorization[1].split(":")
        console.log(templateKey)
        console.log(password)
        if (! templateKey[0] === "templateKey"){
            Terminate_Connection(res)
        }
        if (! password[0] === "password"){
            Terminate_Connection(res)
        }
        console.log("made it")
        let metaData= req.body.metaData
        let writeKey= await Permission_To_Make_Write_Key(templateKey[1],password[1])
        if (writeKey){
            writeKeyValue=await Add_Write_Key(templateKey[1],(metaData)?metaData:"")
            res.json({writeKey:writeKeyValue})
        }
    }
    catch(e){
        console.log(e)
        Terminate_Connection(res)
    }
})
function Basic_Authorization_Write_Key_Template_And_Github_Key(req,res){
    try{
        let authorization= req.headers.authorization.split(";")
        if (! authorization.length == 3){
            Terminate_Connection(res)
        }
        let writeKey = authorization[0].split(":")
        let templateKey = authorization[1].split(":")
        let githubKey = authorization[2].split(":")
        if (! templateKey[0] == "templateKey"){
            Terminate_Connection(res)
        }
        if (! githubKey[0] == "githubKey"){
            Terminate_Connection(res)
        }
        if (! writeKey[0] == "writeKey"){
            Terminate_Connection(res)
        }
        return {templateKey:templateKey[1],githubKey:githubKey[1],writeKey:writeKey[1]}
    }
    catch(e){
        throw Error("Error in basic authentication")
    }
}
function Basic_Authentication(req,res,keys=["templateKey","githubKey","writeKey"]){
    let authorization = req.headers.authorization.split(";")
    if (! authorization.length === keys.length){
        Terminate_Connection(res)
        throw Error("Basic Authentication Failed")
    }
    authObject={}
    authorization.map((auth)=>{
        let splitAuth = auth.split(":")
        if (!keys.includes(splitAuth[0])){
            if (splitAuth[0]==="writeKey"){
                if (! splitAuth[1].length ===7){
                    Terminate_Connection(res)
                    throw Error("Basic Authentication Failed")
                }
            }
            Terminate_Connection(res)
            throw Error("Basic Authentication Failed")
        }
        authObject[splitAuth[0]]=splitAuth[1]
    })
    return authObject
}
function Terminate_Connection(res,message=""){
    res.status(401).send(message);
}
module.exports={
    Write_Key_Router:router
}