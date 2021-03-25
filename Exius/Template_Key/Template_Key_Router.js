const express=require("express")
const {
    Permission_To_Delete_Template_Key,
    Permission_To_Get_Template_Key,
    Permission_To_Modify_Template_Key,
    Permission_To_Make_Template_Key} = require("../Permissions/Permission_Functions")
const {
Update_Template_Key,
Add_Template_Key,
Delete_Template_Key
} = require("./Template_Key_Base")
var router = express.Router()
router.post("/getTemplateKey",async function (req, res){
    // permissions needed: git key with access to repo
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
        //console.log(e)
        if (e.message === "Invalid templateKey"){
            Terminate_Connection(res," Template Key Doesn't exist")
        }
        else {Terminate_Connection(res)}
    }
})
router.post("/deleteTemplateKey",async function (req, res){
    // permissions needed: git key with access to repo
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
router.post("/modifyTemplateKey",express.json(), async function (req,res){
    // permissions needed: git key with access to repo
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
        console.log(e)
        if (e.message === "Invalid templateKey"){
            Terminate_Connection(res," Template Key Doesn't exist")
        }else{
            Terminate_Connection(res)
        }
    }

})
router.post("/createTemplateKey",express.json(),async function (req, res){
    // permissions needed: git key with access to org
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
            console.log("fail 4")
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

function Terminate_Connection(res,message=""){
    res.status(401).send(message);
}
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