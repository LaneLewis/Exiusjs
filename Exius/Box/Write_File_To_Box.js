const BoxSDK = require('box-node-sdk');
var jsonConfig = require('./box_config.json');
var sdk = BoxSDK.getPreconfiguredInstance(jsonConfig);
const client= sdk.getAppAuthClient('enterprise');

async function Upload_File(buffer, folderId,fileName){
	// Upload_File takes in a buffer or stream and uploads it to the box account
	// at the folder specified by folderId and with the name given by fileName. 
	// If successful, the id of the entry is returned. Otherwise null is returned
	try{
		let fileUploaded=await client.files.uploadFile(folderId,fileName,buffer)
		return fileUploaded.entries[0].id
	}
	catch(e){
		console.log(e)
		throw Error("File Failed to Upload")
	}
}
async function Update_File(buffer, fileId){
	// Update_File takes in a buffer and a fileId, it then updates the
	// file corresponding to the fileId. returns true if the file is updated
	// without issue. throws error otherwise.
	try{
		await client.files.uploadNewFileVersion(fileId,buffer)
		return true
	}
	catch(e){
		console.log(e)
		throw Error("File Failed to Update")
	}
}

module.exports={
	Upload_File,
	Update_File
}