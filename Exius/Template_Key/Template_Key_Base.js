let {
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
let {Make_Download_Link_To_Folder,
    Make_Data_Folders
}= require("../Box/Box_File_Mangement")

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
function Create_Custom_Path(path,writeKey,pullCount){

    if (! typeof path === "string"){
        throw Error("Custom paths only accept strings as arguments")
    }
    let splitWritePath=path.split(/[w][r][i][t][e][K][e][y]/)
    let rejoinedPath=splitWritePath.join(writeKey)
    let splitPullPath=rejoinedPath.split(/[p][u][l][l][C][o][u][n][t]/)
    let rejoinedFinal=splitPullPath.join(pullCount)
    return rejoinedFinal
    }
function Set_Base_Folder(baseFolder){
    if (! baseFolder){
        return {
            path:"/",
            rootId:"0"
        }
    }
    else{
        return {
            path:(template.baseFolder.path)? template.baseFolder.path :"/",
            rootId:(template.baseFolder.rootId)? template.baseFolder.rootId : "0"
        }
    }
}
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
        console.log(`base folder ${templateForDb.baseFolder.boxFolderId}`)
        if (! templateForDb.baseFolder.boxFolderId === "0"){
            templateForDb.baseFolder["boxFolderLink"]=await Make_Download_Link_To_Folder(templateForDb.baseFolder.boxFolderId)
        }
        else{
            templateForDb.baseFolder["boxFolderLink"]="unavailable"
        }
        console.log(templateForDb)
        for (const [key,value] of Object.entries(templateForDb.writeEndpoints)){
            console.log(`endpoint folder id: ${templateForDb.writeEndpoints[key]["boxFolderId"]}`)
            if (!(templateForDb.writeEndpoints[key]['boxFolderId'] === "0")){
                templateForDb.writeEndpoints[key]["boxFolderLink"]=await Make_Download_Link_To_Folder(value.boxFolderId)
            }
            else{
                templateForDb.writeEndpoints[key]["boxFolderLink"]="unavailable"            }
            //templateForDb.writeKeyData[key]["boxFolderLink"]=await Make_Download_Link_To_Folder(value.boxFolderId)
        }
        console.log(templateForDb)
        Insert_Object_Into_Table(templateForDb,"Templates")
        Create_Table(`'${template.templateKey}'`,["writeKey"],{writeKey:"TEXT",uploadState:"TEXT",keyNumber:"INTEGER",metaData:"TEXT"})
        return true
    }
    catch(e){
        console.log(e)
        throw Error("Issue when adding template key")
    }
}
function Update_Template_Key(template){
    try{
        console.log("check 1")
        if (! template.templateKey){
            throw Error("No templateKey specified")
        }
        let clonedTemplate=JSON.parse(JSON.stringify(template))
        delete clonedTemplate.templateKey
        console.log(clonedTemplate)
        Update_Table_From_Obj({templateKey:template.templateKey},clonedTemplate,`Templates`)
        return true
    }
    catch(e){
        console.log(e)
        throw Error("Issue while updating template")
    }
}
function Get_Template_Key(templateKey){
    try {
        let key = Get_By_Key({templateKey:templateKey},"Templates",parseColumns=["baseFolder","writeEndpoints"])
        return key
    }
    catch(e){
        return e
    }
}
function Iterate_Template_Key(templateKey){
    return  Update_Table_From_Obj({templateKey:templateKey},{currentKeyPulls:`currentKeyPulls+1`},"Templates",["currentKeyPulls"])
}

function Delete_Template_Key(templateKey,tableDelete=false){
    try{
        let entryDeleted = Delete_Table_Entry({templateKey:templateKey},"Templates")
        if (tableDelete){
            Delete_Table(`${templateKey}`)
            return true
        }
    }
    catch(e){
        throw Error("Issue when deleting template key")
    }
}
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
    let pathToEndpoint=Get_Paths_From_Endpoints(template.writeEndpoints)
    console.log(pathToEndpoint)
    console.log(template.baseFolder.rootId)
    console.log(template.baseFolder.path)
    let writePathIds=await Make_Data_Folders(template.baseFolder.rootId,template.baseFolder.path,Object.keys(pathToEndpoint))
    console.log(writePathIds)
    template.baseFolder["boxFolderId"]=writePathIds["basetree"][template.baseFolder.path]
    for (const [key,value] of Object.entries(writePathIds.subtrees)){
        for (var i=0;i<pathToEndpoint[key].length;i++){
            template.writeEndpoints[pathToEndpoint[key][i]]["boxFolderId"]=value
        }
    }
}
function Get_All_Templates(){
    return Retrieve_All_From_Table("Templates")
}
//console.log(Make_Template_Table())
//console.log(Delete_Template_Key('111171',true))
//console.log(Get_Table_Names())
//console.log(Retrieve_All_From_Table("Templates"))
async function tester(){key = await Add_Template_Key({templateKey:"43",repository:"NRD-Lab-test.github.io",password:"hello"})
console.log(key)}
//tester()
//console.log(Get_Template_Key("FakeTask",true))
//Verify_Custom_Path("/Subject_1writeKey","1234","1")
//Delete_Template_Key("FakeTask")
//console.log(Get_Template_Key('hello'))
//console.log(Get_Table_Names())
module.exports={
    Iterate_Template_Key,
    Add_Template_Key,
    Update_Template_Key,
    Get_Template_Key,
    Delete_Template_Key
}