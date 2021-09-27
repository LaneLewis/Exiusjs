/**
 * @module Permissions/Permission_Functions
 */
let {Get_Template_Key} =require("../Template_Key/Template_Key_Base")
let {Get_Write_Key} = require("../Write_Key/Write_Key_Base")
let {Does_User_Have_Repository_Access, Is_User_In_Org} = require("../Github/Github_Authorization")
let getTemplateCredentials=process.env.TEMPLATE_CREDENTIALS_NEEDED

/**
 * Checks if a user has access to grab view a write key. If both the
 * templateKey and writeKey are valid it checks if the user has 
 * access to the repository associated with the template key. 
 * Returns true if the user does have permission, false otherwise
 * @param {String} templateKey - template key
 * @param {String} writeKey - write key
 * @param {String} githubKey - github key
 */
async function Permission_To_Get_Write_Key(templateKey,writeKey,githubKey){
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
/**
 * Checks if user has permission to get a template key. If the 
 * templateKey is valid, it checks if the user has repository access to 
 * the repo tied to the templateKey. 
 * If the user does have the correct permissions, true is returned otherwise
 * false.
 * @param {String} templateKey - template key
 * @param {String} githubKey - github key
 */
async function Permission_To_Get_Template_Key(templateKey,githubKey){
    let template=Get_Template_Key(templateKey)
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
/**
 * Checks if user has permission to modify a write key. Has the same user permissions
 * as Permission_To_Get_Write_Key. If true, true is returned otherwise false. 
 * @param {String} templateKey - template key
 * @param {String} writeKey - write key
 * @param {String} githubKey - github key
 */
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
/**
 * Checks if user has permission to modify a template key. Has the same user permissions
 * as Permission_To_Get_Template_Key. If true, true is returned otherwise false. 
 * @param {String} templateKey - template key
 * @param {String} githubKey - github key
 */
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
/**
 * Checks if user has permission to make a new template key. If the user is
 * in the organization, permission is granted. If they have permission, true
 * is returned, false otherwise.
 * @param {String} githubKey - github key
 */
async function Permission_To_Make_Template_Key(githubKey){
    try{
        return await Is_User_In_Org(githubKey,["admin","member"])
    }
    catch(e){
        throw e
    }
}
/**
 * Checks if user has permission to make a new write key. If the user passes 
 * in a requested write key of the right length, the template key exists, and the
 * password matches, permission is granted. If they have permission, true
 * is returned, otherwise an error is thrown.
 * @param {String} templateKey - template key
 * @param {String} password - template key password
 */
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
/**
 * Checks if user has permission to delete a template key. 
 * Has the same permission requirements as Permission_To_Get_Template_Key.
 * Returns true if the user does have permission, false otherwise.
 * @param {String} templateKey - template key
 * @param {String} githubKey - github key
 */
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
/**
 * Checks if user has has permission to delete a write key. Has the same
 * permissoin requiements as Permission_To_Get_Template_Key.
 * Returns true if the user does have permission, false otherwise.
 * @param {String} templateKey - template key 
 * @param {String} githubKey - github key
 */
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