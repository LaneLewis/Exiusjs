/**
 * @module Template_Key/Template_Key_Router
 */
const express=require("express")
const {
    Permission_To_Delete_Template_Key,
    Permission_To_Get_Template_Key,
    Permission_To_Modify_Template_Key,
    Permission_To_Make_Template_Key} = require("../Permissions/Permission_Functions")
const {
    Update_Template_Key,
    Add_Template_Key,
    Delete_Template_Key} = require("./Template_Key_Base")
var router = express.Router()
/**
 * @function
 * @memberof API
 * @name POST/template/getTemplateKey
 * @description
 * Checks to see if the request has the required authorization,
 * which should have the form "templateKey:x;githubKey:y".
 * If it passes, it checks whether or not the user's github key
 * has access to the repository associated with the template.
 * If both of these are true, it returns the template. Terminates
 * with 401 if authorization fails. 
 */
router.post("/getTemplateKey",async function (req, res){
    try{
        let authInfo=Basic_Authorization_Template_And_Github_Key(req,res)
        let templateKey=await Permission_To_Get_Template_Key(authInfo.templateKey,authInfo.githubKey)
        if (! templateKey){
            Terminate_Connection(res)
        }
        else{
            res.json(templateKey)
            res.end()
        }
    }
    catch(e){
        if (e.message === "Invalid templateKey"){
            Terminate_Connection(res," Template Key Doesn't exist")
        }
        else {Terminate_Connection(res)}
    }
})
/**
 * @function 
 * @memberof API
 * @name POST/template/deleteTemplateKey
 * @description
 * Checks to see if the request has the required authorization,
 * which should have the form "templateKey:x;githubKey:y".
 * If it passes, it checks whether or not the user's github key
 * has access to the repository associated with the template.
 * If both of these are true, it deletes the template from the template key
 * table as well as the table of write keys for that template. Terminates
 * with 401 if authorization fails. 
 */    
router.post("/deleteTemplateKey",async function (req, res){
    try{
        let authInfo=Basic_Authorization_Template_And_Github_Key(req,res)
        let approved=await Permission_To_Delete_Template_Key(authInfo.templateKey,authInfo.githubKey)
        if (approved){
            Delete_Template_Key(authInfo.templateKey,true)
            res.status(200).end()
        }
        else{
            res.status(401).end()
        }}
    catch(e){
        if (e.message === "Issue when deleting template key"){
            Terminate_Connection(res,"Failed to Delete Template")
        }
        Terminate_Connection(res)
    }
})
/**
 * @function
 * @memberof API
 * @name POST/template/modifyTemplateKey/
 * @description
 * Checks to see if the request has the required authorization,
 * which should have the form "templateKey:x;githubKey:y".
 * If it passes, it checks whether or not the user's github key
 * has access to the repository associated with the template.
 * If both of these are true, it modifies the fields of the template
 * with the key value pairs of the json body passed. Terminates
 * with 401 if authorization fails. Gives a 200 response if successful
 */    
router.post("/modifyTemplateKey",express.json(), async function (req,res){
    try{
        let authInfo = Basic_Authorization_Template_And_Github_Key(req,res)
        let approved = await Permission_To_Modify_Template_Key(authInfo.templateKey,authInfo.githubKey)
        let params = req.body
        params.templateKey=authInfo.templateKey
        if (approved){
            let updated=Update_Template_Key(params)
            console.log(updated)
            if (updated){
                res.status(200).end()
            }
            else{
                Terminate_Connection(res,"Failed to modify template")
            }
        }
        else{
            res.status(401).end()
        }
    }
    catch(e){
        if (e.message === "Invalid templateKey"){
            Terminate_Connection(res," Template Key Doesn't exist")
        }else{
            Terminate_Connection(res)
        }
    }

})
/**
 * @function
 * @name POST/template/createTemplateKey
 * @memberof API
 * @description
 * Checks to see if the request has the required authorization 
 * which should have the form "githubKey:x". If it passes it also 
 * checks if the github key has access to the organization. If both
 * of these are true, a new template is created using the parameters
 * passed in the json body. The json body needs the required fields
 * templateKey,repository, and writeEndPoints and optional fields 
 * baseFolder (default path:"./",rootid:"0"), password (default ""), 
 * maxKeyPulls (default 1), currentKeyPulls (default 0), and metaData
 * "". Teminates with a 401 error if authorization fails, returns true
 * if successful and false if not.
 */
router.post("/createTemplateKey",express.json(),async function (req, res){
    try{
        let authorization = req.headers.authorization.split(":")
        if (! authorization.length === 2){
            Terminate_Connection(res)
        }
        if (! authorization[0] === "githubKey"){
            Terminate_Connection(res)
        }
        let approved = await Permission_To_Make_Template_Key(authorization[1])
        let template = req.body
        if (approved){
            let keyAdded=await Add_Template_Key(template)
            if(keyAdded){
                res.json(keyAdded).end()
            }
            else{
                Terminate_Connection(res)
            }
        }
        else{
            Terminate_Connection(res)
        }
    }
    catch(e){
        if (e.message === "No Template Key Specified"){
            Terminate_Connection(res,"Template Key must be specified")
        }
        else if(e.message ==="No repository specified"){
            Terminate_Connection(res,"Repository must be specified")
        }
        else if(e.message === "Template key already exists"){
            Terminate_Connection(res,"Template key already exists")
        }
        else{
        Terminate_Connection(res)}
    }
})
/**
 * helper function that simply terminates a response with a 401
 * and a supplied message.
 * @param {Object} res - response object
 * @param {String} message - message string to send
 */
function Terminate_Connection(res,message=""){
    res.status(401).send(message);
}
/**
 * Checks if the request object has an authorization string
 * of the form of "templateKey:x;githubKey:y". If it does, 
 * the templateKey and github key are returned in an object.
 * Otherwise the connection is terminated with a 401.
 * @param {Object} req - web request object
 * @param {Object} res - web response object
 * @memberof module:Template_Key/Template_Key_Router
 */
function Basic_Authorization_Template_And_Github_Key(req,res){
    try{
        let authorization= req.headers.authorization.split(";")
        if (! authorization.length == 2){
            Terminate_Connection(res)
        }
        let templateKey = authorization[0].split(":")
        let githubKey = authorization[1].split(":")
        if (! authorization[0].split(":")[0] == "templateKey"){
            Terminate_Connection(res)
        }
        if (! authorization[0].split(":")[0] == "githubKey"){
            Terminate_Connection(res)
        }
        return {templateKey:templateKey[1],githubKey:githubKey[1]}
    }
    catch(e){
        Terminate_Connection(res)
    }
}
module.exports={
    Template_App:router
}