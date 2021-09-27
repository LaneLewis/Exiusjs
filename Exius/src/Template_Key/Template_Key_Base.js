/**
 * @module Template_Key/Template_Key_Base
 */
let {
    Delete_Table_Entry,
    Delete_Table,
    Create_Table,
    Insert_Object_Into_Table,
    Get_By_Key,
    Update_Table_From_Obj}=require("../SQL/SQL_Functions")
let {Make_Download_Link_To_Folder,
    Make_Data_Folders
}= require("../Box/Box_File_Mangement")

/**
 * Takes in a nested object of upload endpoint names as well
 * as their parameters for each. Returnes a modified version 
 * of the endpoints with default values for a field if none is specified.
 * @param {Object} endpoints - nested object of endpoint parameter objects
 */
function Set_Write_Endpoints(endpoints){
    if (! endpoints){
        return {"data":{fileTypes:[".csv"],maxFileSize:"1mb",maxFiles:1,maxFileUpdates:1,boxRelativePath:"/data",customPath:""}}
    }
    for (const [key,value] of Object.entries(endpoints)){
        newValue = {
            boxRelativePath: (value.boxRelativePath)? value.boxRelativePath : "/data",
            fileTypes: (value.fileTypes)? value.fileTypes : [".csv"],
            maxFileSize: (value.maxFileSize) ? value.maxFileSize : "1mb",
            maxFiles: (value.maxFiles) ? value.maxFiles : 1,
            maxFileUpdates: (value.maxFileUpdates) ? value.maxFileUpdates :1,
            customPath: (value.customPath) ? value.customPath :""
        }
        endpoints[key]=newValue
    }
    return endpoints
}

/**
 * If no base folder is specified, the root path and id is returned in an object.
 * Otherwise, the base folder becomes the custom path and is returned.
 * @param {Object} baseFolder - mapping of optional path, rootid fields
 */
function Set_Base_Folder(baseFolder){
    if (! baseFolder){
        return {
            path:"/",
            rootId:"0"
        }
    }
    else{
        return {
            path:(baseFolder.path)? baseFolder.path :"/",
            rootId:(baseFolder.rootId)? baseFolder.rootId : "0"
        }
    }
}
/**
 * Adds the templateKey object with required fields templateKey,repository,
 * and writeEndPoints and optional fields baseFolder (default {path:"./",rootid:"0"}),
 * password (default ""), maxKeyPulls (default 1), currentKeyPulls (default 0), and metaData
 * "". Builds the correct folders in box, gets a download link to them, inserts the template key
 * into the templates database, and creates a table to host the write keys of the template in.
 * returns true if successful
 * @param {Object} template - template to add
 */
async function Add_Template_Key(template){
    if (! template.templateKey){
        throw Error("No Template Key Specified")
    }
    if (! template.repository){
        throw Error("No repository specified")
    }
    if (Get_Template_Key(template.templateKey)){
        throw Error("Template key already exists")
    }
    templateForDb={
        templateKey:template.templateKey,
        repository:template.repository,
        password:(template.password) ? template.password: "",
        writeEndpoints: Set_Write_Endpoints(template.writeEndpoints),
        baseFolder:Set_Base_Folder(template.baseFolder),
        maxKeyPulls:(template.maxKeyPulls)? template.maxKeyPulls : 1,
        currentKeyPulls:0,
        metaData:(template.metaData)?template.metaData:""
    }
    try{
        await Build_Box_Folders(templateForDb)
        if (! templateForDb.baseFolder.boxFolderId === "0"){
            templateForDb.baseFolder["boxFolderLink"]=await Make_Download_Link_To_Folder(templateForDb.baseFolder.boxFolderId)
        }
        else{
            templateForDb.baseFolder["boxFolderLink"]="unavailable"
        }
        for (const [key,value] of Object.entries(templateForDb.writeEndpoints)){
            if (!(templateForDb.writeEndpoints[key]['boxFolderId'] === "0")){
                templateForDb.writeEndpoints[key]["boxFolderLink"]=await Make_Download_Link_To_Folder(value.boxFolderId)
            }
            else{
                templateForDb.writeEndpoints[key]["boxFolderLink"]="unavailable"            }
        }
        Insert_Object_Into_Table(templateForDb,"Templates")
        Create_Table(`'${template.templateKey}'`,["writeKey"],{writeKey:"TEXT",uploadState:"TEXT",keyNumber:"INTEGER",metaData:"TEXT"})
        return true
    }
    catch(e){
        throw Error("Issue when adding template key")
    }
}
/**
 * Changes an old template with the same templateKey into 
 * the new version given by the template parameter. If 
 * successful, true is returned.
 * @param {Object} template - new version of template
 */
function Update_Template_Key(template){
    try{
        if (! template.templateKey){
            throw Error("No templateKey specified")
        }
        let clonedTemplate=JSON.parse(JSON.stringify(template))
        delete clonedTemplate.templateKey
        Update_Table_From_Obj({templateKey:template.templateKey},clonedTemplate,`Templates`)
        return true
    }
    catch(e){
        throw Error("Issue while updating template")
    }
}
/**
 * Returns the template given by the templateKey.
 * @param {string} templateKey - template key name to retrieve
 */
function Get_Template_Key(templateKey){
    try {
        let key = Get_By_Key({templateKey:templateKey},"Templates",parseColumns=["baseFolder","writeEndpoints"])
        return key
    }
    catch(e){
        throw e
    }
}
/**
 * Updates template key by changing the currentKeyPulls to one higher.
 * @param {String} templateKey - template key name to iterate
 */
function Iterate_Template_Key(templateKey){
    return  Update_Table_From_Obj({templateKey:templateKey},{currentKeyPulls:`currentKeyPulls+1`},"Templates",["currentKeyPulls"])
}
/**
 * Deletes the template associated with the templateKey. If 
 * tableDelete is true, the write key table for the template is 
 * also deleted.
 * @param {String} templateKey - template key name to delete
 * @param {Boolean} tableDelete - whether or not the write key table for the
 * template should also be deleted.
 */
function Delete_Template_Key(templateKey,tableDelete=false){
    try{
        Delete_Table_Entry({templateKey:templateKey},"Templates")
        if (tableDelete){
            Delete_Table(`${templateKey}`)
        }
        return true
    }
    catch(e){
        throw Error("Issue when deleting template key")
    }
}
/**
 * Initializes an empty template table. Returns true if 
 * successful. #not implemented yet 
 */
function Make_Template_Table(){
    return Create_Table("Templates",["templateKey"],
    {templateKey:"TEXT",
    repository:"TEXT", 
    writeEndpoints:"TEXT",
    password:"TEXT",
    baseFolder:"TEXT",
    maxKeyPulls:"INTEGER",
    currentKeyPulls:"INTEGER",
    customPath:"TEXT",
    metaData:"TEXT"})
}
function Get_Paths_From_Endpoints(writeFileEndpoints){
    /**
     * Takes in an object of endpoint objects. Returns an 
     * object mapping the box relative path to the endoint name.
     * @param {Object} writeFileEndpoints - endpoint name mapping to endpoint
     * objects.
     */
    let folderToEndpointMap={}
    let endpointKeys=Object.keys(writeFileEndpoints)
    for (var i=0; i<endpointKeys.length; i++){
        if (! folderToEndpointMap[writeFileEndpoints[endpointKeys[i]].boxRelativePath]){
            folderToEndpointMap[writeFileEndpoints[endpointKeys[i]].boxRelativePath]=[endpointKeys[i]]
        }
        else{
            folderToEndpointMap[writeFileEndpoints[endpointKeys[i]].boxRelativePath].push(endpointKeys[i])
        }
    }
    return folderToEndpointMap
}
async function Build_Box_Folders(template){
    /**
     * Makes folders in box according to the write endpoints
     * specified by the template. 
     * @param {Object} template - template object to build folders for
     */
    let pathToEndpoint=Get_Paths_From_Endpoints(template.writeEndpoints)
    let writePathIds=await Make_Data_Folders(template.baseFolder.rootId,template.baseFolder.path,Object.keys(pathToEndpoint))
    template.baseFolder["boxFolderId"]=writePathIds["basetree"][template.baseFolder.path]
    for (const [key,value] of Object.entries(writePathIds.subtrees)){
        for (var i=0;i<pathToEndpoint[key].length;i++){
            template.writeEndpoints[pathToEndpoint[key][i]]["boxFolderId"]=value
        }
    }
}

module.exports={
    Iterate_Template_Key,
    Add_Template_Key,
    Update_Template_Key,
    Get_Template_Key,
    Delete_Template_Key,
    Make_Template_Table
}