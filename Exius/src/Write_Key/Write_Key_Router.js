/**
 * @module Write_Key/Write_Key_Router
 */
const express =require("express")

const {Permission_To_Delete_Write_Key,
Permission_To_Get_Write_Key,
Permission_To_Make_Write_Key,
Permission_To_Modify_Write_Key} = require("../Permissions/Permission_Functions")

const {    
    Add_Write_Key,
    Delete_Write_Key,
    Update_Write_Key} =require("./Write_Key_Base")
var router = express.Router()

/**
 * @function
 * @memberof API
 * @name POST/WriteKey/getWriteKey
 * @description
 * Checks if the request has an authorization string of the form
 * "templateKey:x;githubKey:y;writeKey:z". If this passes,
 * it checks if the github key has access to the repository associated
 * with the templateKey, and if the templateKey and writeKey exist.
 * If all of these pass, the writeKey is returned as a json response. Otherwise
 * the connection is terminated with a 401.
 */
router.post("/getWriteKey",async function (req, res){
    try{
        let authInfo = Basic_Authentication(req,res)
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
        Terminate_Connection(res)
    }
})
/**
 * @function
 * @name POST/WriteKey/deleteWriteKey
 * @memberof API
 * @description
 * Checks if the request has an authorization string of the form
 * "templateKey:x;githubKey:y;writeKey:z". If this passes,
 * it checks if the github key has access to the repository associated
 * with the templateKey, and if the templateKey and writeKey exist.
 * If all of these pass, a json response is returned with true. Otherwise
 * the connection is terminated with a 401.
 */
router.post("/deleteWriteKey",async function (req, res){
    try{
        let authInfo = Basic_Authentication(req,res)
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
        Terminate_Connection(res)
    }
})
/**
 * @function
 * @name POST/WriteKey/modifyWriteKey
 * @memberof API
 * @description
 * Checks if the request has an authorization string of the form
 * "templateKey:x;githubKey:y;writeKey:z". If this passes,
 * it checks if the github key has access to the repository associated
 * with the templateKey, and if the templateKey and writeKey exist.
 * If all of these pass, the writeKey is changed with the key value pairs
 * of the json body of the request giving the new values for the writeKey. 
 * If successful, the response is a 200 otherwise the connection is terminated 
 * with a 401.
 */    
router.post("/modifyWriteKey",express.json(),async function (req,res){
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
        Terminate_Connection(res)
    }
})
/**
 * @function
 * @name POST/WriteKey/createWriteKey
 * @memberof API
 * @description
 * Checks if the request has an authorization string of the form 
 * "templateKey:x;password:y". If this passes, it checks if the password
 * matches the password in the templateKey. If so, the write key is
 * created with the metaData given in metaData field of the json body 
 * of the request. Upon successful creation, the writeKey is returned
 * in a json object. Otherwise the response is a 401.
 */
router.post("/createWriteKey",express.json(),async function (req, res){
    // could make this more efficient!! permission and 
    // addwriteKey overlap
    try{
        let authorization = req.headers.authorization.split(";")
        if (! authorization.length == 2){
            Terminate_Connection(res)
        }
        let templateKey = authorization[0].split(":")
        let password = authorization[1].split(":")
        if (! templateKey[0] === "templateKey"){
            Terminate_Connection(res)
        }
        if (! password[0] === "password"){
            Terminate_Connection(res)
        }
        let metaData= req.body.metaData
        let writeKey= await Permission_To_Make_Write_Key(templateKey[1],password[1])
        if (writeKey){
            writeKeyValue=await Add_Write_Key(templateKey[1],(metaData)?metaData:"")
            res.json({writeKey:writeKeyValue})
        }
    }
    catch(e){
        Terminate_Connection(res)
    }
})
/**
 * Checks if the authorization string has the keys given by keys mapping to 
 * values by a colon and seperated by semicolons. If successful, the keys
 * and mappings are returned in an object, otherwise a the response is 
 * terminated with a 401.
 * @param {Object} req - request object with authorization string
 * @param {Object} res - response object
 */
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
/**
 * Helper function that terminates a connection with a 
 * 401 and a message
 * @param {Object} res- response object
 * @param {String} message - message to send with termination
 */
function Terminate_Connection(res,message=""){
    res.status(401).send(message);
}
module.exports={
    Write_Key_Router:router
}