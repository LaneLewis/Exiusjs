/**
 * @module Write_Key/Write_Key_Base
 */
let {Does_Table_Exist,
    Delete_Table_Entry,
    Retrieve_All_From_Table,
    Insert_Object_Into_Table,
    Get_By_Key,
    Update_Table_From_Obj}=require("../SQL/SQL_Functions")

let {Iterate_Template_Key,
    Get_Template_Key} = require("../Template_Key/Template_Key_Base")

let { Make_Data_Folders }=require("../Box/Make_File_Management")

/**
 * Checks if template key exists, if it does the template
 * is pulled and attempted to be iterated. If the key pulls would go over the maxKeyPulls
 * of the key an error is thrown. A random number of length 7 is then 
 * checked to see if it exists in the writeKey db, this is attempted up
 * to a maximum of 5 times. If successful, a new write key is created 
 * from the templateKey with the fields uploadState (a mapping of endpoints to 
 * scope and an empty file objects), writeKey (the writeKey number),keyNumber 
 * (the key pull count when the key was created), metaData (any attached metaData
 * from the function call).
 * @param {String} templateKey - template key name
 * @param {String} metaData - metaData to attach to the writeKey
 */
async function Add_Write_Key(templateKey,metaData=""){
    if (! Does_Table_Exist(templateKey)){
        throw Error("templateKey table does not exist")
    }
    let template=Get_Template_Key(templateKey)
    if (! template){
        throw Error("templateKey entry does not exist in Templates")
    }
    if (template.currentKeyPulls+1>template.maxKeyPulls){
        throw Error("Access key out of uses")
    }
    for (var i =0; i<5; i++){
        var randomKey=Random_Number_N_Digits(7)
        if (! Get_By_Key({writeKey:randomKey},`'${templateKey}'`)){
            break
        }
        if (i == 4){
            throw Error("Collision retry limit exceeded")
        }
    }
    let uploadState={}
    try{
        for (var [key, value] of Object.entries(template.writeEndpoints)){
            await Create_Custom_Path(value,writeKey,template.currentKeyPulls)
            uploadState[key]={scope:value,files:{}}
        }
    }
    catch(e){
        throw Error("Error while building endpoints")
    }
        try{
            let addToTable={
                writeKey:randomKey,
                uploadState:uploadState,
                keyNumber:template.currentKeyPulls,
                metaData:metaData}
            let success = Insert_Object_Into_Table(addToTable,`'${templateKey}'`)
            if (success){
                Iterate_Template_Key(templateKey)
                return randomKey
            }
            return null
        }
        catch(e){
            console.log(e)
            throw Error("Issue in adding write key")
        }
}
/**
 * Deletes the write key from the templateKey table.
 * Returns true if successful, false otherwise.
 * @param {String} templateKey - template key
 * @param {String} writeKey - write key
 */
function Delete_Write_Key(templateKey,writeKey){
    return Delete_Table_Entry({writeKey:writeKey},`'${templateKey}'`)
}
/**
 * Retrieves the writeKey from the templateKey database and
 * parses the uploadState field into an object. Returns
 * the writeKey.
 * @param {String} templateKey - template key
 * @param {String} writeKey - write key
 */
function Get_Write_Key(templateKey,writeKey){
    return Get_By_Key({writeKey:writeKey},`'${templateKey}'`,["uploadState"])
}
/**
 * Takes in the object of fields and values associated with a writekey and updates 
 * the writeKey fields with the specified values. Returns true if successful, otherwise
 * an error is thrown.
 * @param {String} templateKey - template key
 * @param {Object} writeKeyObj - Object of field values to update in the writeKey
 */
function Update_Write_Key(templateKey,writeKeyObj){
    let cloneWriteKey = JSON.parse(JSON.stringify(writeKeyObj))
    if (cloneWriteKey.uploadState){
        cloneWriteKey.uploadState=JSON.stringify(cloneWriteKey.uploadState)
    }
    return Update_Table_From_Obj({writeKey:cloneWriteKey.writeKey},cloneWriteKey,`"${templateKey}"`)
}
/**
 * Makes and returns random number of length n.
 * @param {Number} n - length of random number to generate
 */
function Random_Number_N_Digits(n){
    let initial_string=""
    for (var i=0;i<n;i++){
        initial_string+=String(Math.floor(Math.random()*10))
    }
    return initial_string
}
/**
 * Modifies the file path on the value object, which is the set of endpoint params,
 * where the parameters writeKey and pull key give values to substitute in for any
 * path where "writeKey" or "pullCount" are found. This allows for unique pathing
 * on the upload of each writeKey to directory locations. 
 * @param {Object} value - value that endpoint maps to
 * @param {String} writeKey - write key
 * @param {String} keyPull - count associated with key
 */
async function Create_Custom_Path(value,writeKey,keyPull){
    try{
        if (! typeof value.customPath === "string"){
            throw Error("Custom paths only accept strings as arguments")
        }
        let splitWritePath=value.customPath.split(/[w][r][i][t][e][K][e][y]/)
        let rejoinedPath=splitWritePath.join(writeKey)
        let splitPullPath=rejoinedPath.split(/[p][u][l][l][C][o][u][n][t]/)
        let rejoinedFinal=splitPullPath.join(keyPull)
        if (! (value.customPath==rejoinedFinal)){
            let newBoxId=await Make_Data_Folders(value.boxFolderId,rejoinedFinal,[])
            value.boxFolderId = Object.values(newBoxId.basetree)[0]
        }
        delete value.customPath
        value.boxRelativePath=value.boxRelativePath+rejoinedFinal
    }
    catch(e){
        return e
    }
}

/**
 * Retrieves all the write keys associated with the templateKey.
 * @param {String} templateKey - template key
 */
function Get_All_Write_Keys(templateKey){
    try{
        return Retrieve_All_From_Table(templateKey,["uploadState"])
    }
    catch(e){
        throw e
    }
}

module.exports={
    Add_Write_Key,
    Delete_Write_Key,
    Get_Write_Key,
    Update_Write_Key,
    Get_All_Write_Keys
}
