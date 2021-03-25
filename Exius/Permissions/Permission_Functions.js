let {Get_Template_Key} =require("../Template_Key/Template_Key_Base")
let {Get_Write_Key} = require("../Write_Key/Write_Key_Base")
let {Does_User_Have_Repository_Access, Is_User_In_Org} = require("../Github/Github_Authorization")
let getTemplateCredentials=process.env.TEMPLATE_CREDENTIALS_NEEDED


async function Permission_To_Get_Write_Key(templateKey,writeKey,githubKey){
    // required: templateKey and writeKey, githubKey
    let templateData=Get_Template_Key(templateKey)
    let writeData=Get_Write_Key(templateKey,writeKey)
    if (! writeData){
        throw Error("Invalid writeKey")
    }
    try{
        let accessGranted=await Does_User_Have_Repository_Access(githubKey,templateData.repository,[getTemplateCredentials])
        if (accessGranted){
            return writeData
        }
        else{
            return false
        }
        }
    catch(e){
        throw e
    }
}
async function Permission_To_Get_Template_Key(templateKey,githubKey){
    // required: access to templateKey repo
    console.log(githubKey)
    let template=Get_Template_Key(templateKey)
    console.log(template)
    if (! template){
        throw Error("Invalid templateKey")
    }
    try{
    let accessGranted=await Does_User_Have_Repository_Access(githubKey,template.repository,[getTemplateCredentials])
    if (accessGranted){
        return template
    }
    else{
        return false
    }
    }
    catch(e){
        throw e
    }
}

async function Permission_To_Modify_Write_Key(templateKey,writeKey, githubKey){
    try{
        if (await Permission_To_Get_Write_Key(templateKey,writeKey,githubKey)){
            return true
        }
        return false
        }
    catch(e){
        throw Error("Issue in Permissions to Modify Write Key")
    }
}
    async function Permission_To_Modify_Template_Key(templateKey,githubKey){
        try{
            let template=await Permission_To_Get_Template_Key(templateKey,githubKey)
            if (template){
                return true
            }
            return false
        }
        catch(e){
            throw e
        }
    }
async function Permission_To_Make_Template_Key(githubKey){
    try{
        return await Is_User_In_Org(githubKey,["admin","member"])
    }
    catch(e){
        throw e
    }
}
async function Permission_To_Make_Write_Key(templateKey,password){
    try{
        if (! templateKey.length==7){
            throw Error("Invalid templateKey Length")
        }
        let template=Get_Template_Key(templateKey)
        if (template){
            if (!(template.password === password)){
                throw Error("Invalid Password")
            }
            return true
        }
        throw Error("Invalid templateKey")
    }    
    catch(e){
        throw e
    }
}
async function Permission_To_Delete_Template_Key(templateKey,githubKey){
    try{
        let template=await Permission_To_Get_Template_Key(templateKey,githubKey)
        if (template){
            return true
        }
        return false
    }
    catch(e){
        throw e
    }
}
async function Permission_To_Delete_Write_Key(templateKey,githubKey){
    try{
        let writeData=await Permission_To_Get_Template_Key(templateKey,githubKey)
        if (writeData){
            return true
        }
        return false
    }
    catch(e){
        throw e
    }
}
async function tester(){
    try{console.log(await Permission_To_Get_Template_Key('43',"23"))}
catch(e){
    console.log(e)
}}
//tester()
module.exports={
    Permission_To_Delete_Template_Key,
    Permission_To_Delete_Write_Key,
    Permission_To_Get_Template_Key,
    Permission_To_Get_Write_Key,
    Permission_To_Make_Template_Key,
    Permission_To_Make_Write_Key,
    Permission_To_Modify_Template_Key,
    Permission_To_Modify_Write_Key
}