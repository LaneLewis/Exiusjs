
const BoxSDK = require('box-node-sdk');
var jsonConfig = require('./box_config.json');
var sdk = BoxSDK.getPreconfiguredInstance(jsonConfig);
const client= sdk.getAppAuthClient('enterprise');

async function Get_Dowload_Access_To_Folder(folderId){
    // takes in a box folder Id (string) and returns a downscoped token that is scoped to 
    // that folder with only the ability to download. This is used to allow a client to directly 
    // access data in a folder for pulling without any other capabilities.
    try{
        let downToken=await client.exchangeToken("item_download",`https://api.box.com/2.0/folders/${folderId}`)
        return downToken.accessToken
    }
    catch(e){
        throw Error("Failed to downscope token")
    }
}
async function Make_Download_Link_To_Folder(folderId){
    // takes in a box folder ID (string) and returns a shared link to that folder with 
    // default permissions.
    try{
        let linkCreated = await client.folders.update(folderId, {
            shared_link: {}})
        return linkCreated.shared_link.url
        }
    catch(e){
        console.log(e)
        throw Error("Failed to make link")
    }
}
async function Get_Ids_In_Folder(baseFolderId,contentType){
    // gets all the items' names, types, and ids in a folder. It then filters the 
    // type by contentType if contentType is passed. baseFolderId and content type 
    // are both strings. Content type should be folder or file or null. All items
    // with the specified infomation are returned in an array of objects.
    let itemsInFolders=await client.folders.getItems(baseFolderId,{fields:"name,id,type"})
    let itemEntries=itemsInFolders.entries
    if (contentType){
        newEntries=itemEntries.filter(item=>{
                return item.type===contentType
        })
    return newEntries}
    return itemEntries
}

async function Get_Id_Of_Item_In_Folder(baseFolderId,fname,fileType){
    // takes a filename and the baseFolderId. If a file exists with the name fname, the 
    // id of the file is returned.
    let items=await Get_Ids_In_Folder(baseFolderId,fileType)
    for (var i=0;i<items.length;i++){
        if (items[i].name==fname){
            return items[i].id
        }
    }
    return null
}
async function Folder_Recursive_Build(baseFolderId,recursiveFolderStructure,i){
    // builds a box folder according to a file structure such as /data/experiment/subjects
    // if the folder doesn't exist it is created. This is called recursively until the new
    // folder location is created. Upon finishing the recursion, the last folderId is returned
    if (i<recursiveFolderStructure.length){
        console.log("new folder traversed")
        let itemId=await Get_Id_Of_Item_In_Folder(baseFolderId,recursiveFolderStructure[i],"folder")
        if (itemId){
            console.log("Exsiting Folder Found")
            return await Folder_Recursive_Build(itemId,recursiveFolderStructure,i+1)
        }
        else{
            console.log("New_Folder_Created")
            console.log(recursiveFolderStructure[i])
            let newFolderId=await Create_New_Folder(baseFolderId,recursiveFolderStructure[i])
            if (newFolderId){
                return await Folder_Recursive_Build(newFolderId,recursiveFolderStructure,i+1)
            }
        }
    }
    else{
        return baseFolderId
    }
}
function Get_Tree_From_Path(folderPath){
    // Takes in a new folder path, and turns it into an array that can be 
    // traversed. folderPath should be a string, an array of strings is 
    // returned
    const folderTreeSplit=folderPath.split("/")
    const folderTreePruned=folderTreeSplit.slice(1,folderTreeSplit.length)
    return folderTreePruned
}
async function Create_New_Folder(baseFolderId,name){
    let folderId=await client.folders.create(baseFolderId,name,{fields:"id"})
    return folderId.id
}
async function Make_Data_Folders(rootID,baseFolderLocation,subtreeLocations){
    // Makes a folder at baseFolderLocation from the rootID folder. The folder location
    // is given in the typical file system format. subtreeLocations is an array of 
    // different folder branches that stem out from the baseFolderLocation. Once finished,
    // the folder Ids of the subtreeLocations are returned in an object. rootID is a string of numbers,
    // baseFolderLocation is a string folder path, subtreeLocations is an array of string
    // folder paths. The returned object has keys mapping the subtreeLocations to their respective
    // ids as well as the base folder. 
    try{
    let outputLocations={subtrees:{},basetree:{}}
    let baseFolderTree=Get_Tree_From_Path(baseFolderLocation)
    console.log(baseFolderTree)
    if (! (baseFolderTree[0]==="")){
        console.log("base folder fine")
        var baseFolderId=await Folder_Recursive_Build(rootID,baseFolderTree,0)
    }
    else{
       var baseFolderId=rootID
    }
    outputLocations["basetree"][baseFolderLocation]=baseFolderId
    for (var i=0;i<subtreeLocations.length;i++){
        let subtreeTree=await Get_Tree_From_Path(subtreeLocations[i])
        if (!(subtreeTree[0]==="")){
            console.log("branch fine")
            console.log(subtreeTree)
            var subtreeId=await Folder_Recursive_Build(baseFolderId,subtreeTree,0)
        }
        else{
            var subtreeId=baseFolderId
        }
        outputLocations.subtrees[String(subtreeLocations[i])]=subtreeId
    }
    return outputLocations
    }
    catch(e){
        console.log(e)
        throw Error("issue when making box folder")
    }
}
module.exports={
    Make_Download_Link_To_Folder,
    Make_Data_Folders
}