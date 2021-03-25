let {
    Does_Table_Exist,
    Delete_Table_Entry,
    Delete_Table,
    Get_Table_Names, 
    Get_Table_Schema,
    Create_Table,
    Retrieve_All_From_Table,
    Insert_Object_Into_Table,
    Get_By_Key,
    Backup_DB,
    Restore_From_Backup,
    Update_Table_From_Obj}=require("../SQL/SQL_Functions")
let {
    Iterate_Template_Key,
    Add_Template_Key,
    Update_Template_Key,
    Get_Template_Key,
    Delete_Template_Key
} = require("../Template_Key/Template_Key_Base")
let {
Make_Data_Folders
}=require("../Box/Make_File_Management")
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
            await Create_Custom_Path(value,templateKey,template.currentKeyPulls)
            uploadState[key]={scope:value,files:{}}
        }
    }
    catch(e){
        console.log(e)
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
function Delete_Write_Key(templateKey,writeKey){
    return Delete_Table_Entry({writeKey:writeKey},`'${templateKey}'`)
}
function Get_Write_Key(templateKey,writeKey){
    return Get_By_Key({writeKey:writeKey},`'${templateKey}'`,["uploadState"])
}
function Update_Write_Key(templateKey,writeKeyObj){
    let cloneWriteKey = JSON.parse(JSON.stringify(writeKeyObj))
    if (cloneWriteKey.uploadState){
        cloneWriteKey.uploadState=JSON.stringify(cloneWriteKey.uploadState)
    }
    console.log(cloneWriteKey)
    return Update_Table_From_Obj({writeKey:cloneWriteKey.writeKey},cloneWriteKey,`"${templateKey}"`)
}
function Random_Number_N_Digits(n){
    let initial_string=""
    for (var i=0;i<n;i++){
        initial_string+=String(Math.floor(Math.random()*10))
    }
    return initial_string
}
async function Create_Custom_Path(value,templateKey,keyPull){
    try{
        if (! typeof value.customPath === "string"){
            throw Error("Custom paths only accept strings as arguments")
        }
        let splitWritePath=value.customPath.split(/[w][r][i][t][e][K][e][y]/)
        let rejoinedPath=splitWritePath.join(templateKey)
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

function Get_All_Write_Keys(templateKey){
    try{
        return Retrieve_All_From_Table(templateKey,["uploadState"])
    }
    catch(e){
        return e
    }
}

module.exports={
    Add_Write_Key,
    Delete_Write_Key,
    Get_Write_Key,
    Update_Write_Key,
    Get_All_Write_Keys
}
