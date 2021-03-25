var Database = require('better-sqlite3')
var fs =require("fs")
const db = new Database(`${__dirname}/SQL_DB/ExiusPermissions.db`, { verbose: console.log });

function Update_Table_From_Obj(searchKey,updatedParams,tableName,atomicColumns=[]){
    // takes an object with a single key and value, and uses that to search the database and make changes
    // associated with updatedParams
    try{
        let newFields = ""
        for (const [key,value] of Object.entries(updatedParams)){
            if (typeof value =="string" && !atomicColumns.includes(key)){
                newFields+=`${key}='${value}',`
            }
            else{
                newFields+=`${key}=${value},`
            }
        }
        newFields=newFields.substring(0,newFields.length-1)
        console.log(newFields)
        console.log(`UPDATE ${tableName} SET ${newFields} WHERE ${Object.keys(searchKey)[0]} = ${searchKey[Object.keys(searchKey)[0]]}`)
        db.exec(`UPDATE ${tableName} SET ${newFields} WHERE ${Object.keys(searchKey)[0]} = '${searchKey[Object.keys(searchKey)[0]]}'`)
        return true
    }
    catch(e){
        console.log(e)
        throw Error("Issue in updating key")
    }
}
function Delete_Table_Entry(searchKey,tableName){
    try{
        if (!searchKey){
            throw Error("Issue in deleting table entry, no searchKey passed")
        }
        //console.log(`DELETE FROM ${tableName} WHERE ${Object.keys(searchKey)[0]}='${searchKey[Object.keys(searchKey)[0]]}';`)
        db.exec(`DELETE FROM ${tableName} WHERE ${Object.keys(searchKey)[0]}='${searchKey[Object.keys(searchKey)[0]]}';`)
        return true
    }
    catch(e){
        console.log(e)
        throw Error("Issue in deleting table entry")
    }
}
function Clear_Table(tableName){
    try{
        db.exec(`DELETE FROM ${tableName}`)
        return true
    }
    catch(e){
        return false
    }
}
function Delete_Table(tableName){
    try{
        try{
            console.log(parseInt(tableName[0]))
            //console.log(`DROP TABLE '${tableName}'`)
            db.exec(`DROP TABLE '${tableName}'`)
        }
        catch{
            console.log("hi")
            db.exec(`DROP TABLE ${tableName}`)
        }
        return true
    }
    catch(e){
        console.log(e)
        throw Error("Issue in deleting table")
    }
}
function Get_Table_Names(){
    //gets all table names in database ExiusPermissions
    return db.prepare("SELECT (name) FROM sqlite_master where type='table'").all()
}
function Does_Table_Exist(tableName){
    if (db.prepare(`SELECT (name) FROM sqlite_master where (type='table'AND name='${tableName}')`).get()){
        return true
    }
    return false
}
function Get_Table_Schema(tableName){
    //returns table schema in the form of an object, as well as the primary keys as an array
    let tableSchema={}
    let primaryKeys=[]
    var tableInformation = db.prepare(`SELECT (sql) FROM sqlite_master WHERE (type='table' AND name='${tableName}')`).get()
    let newInformation=tableInformation.split(/[/(/)]/)[1].split(",")
    newInformation.map((fieldInfo)=>{
        let newField=fieldInfo.trim()
        let keyParts=newField.split(" ")
        tableSchema[keyParts[0]]=keyParts[1]
        if(keyParts.length>2){
            primaryKeys.push(keyParts[0])
        }
    })
    return {schema:tableSchema,primaryKeys:primaryKeys}

}
function Create_Table(tableName,primaryKeys,Obj){
    // creates an sqlite3 table based at tableName with primaryKeys given by an array and
    // the Obj giving the schema for the table.
    let sqlString=""
    let primaryString=""
    for (const [key, value] of Object.entries(Obj)){
        sqlString+=`${key} ${value},`
    }

    for (var i=0;i<primaryKeys.length;i++){
        if (i==primaryKeys.length-1){
            primaryString+=`${primaryKeys[i]}`
        }
        else{
            primaryString+=`${primaryKeys[i]},`
        }
    }
    console.log(`CREATE TABLE IF NOT EXISTS ${tableName} (${sqlString} PRIMARY KEY (${primaryString}))`)
    db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (${sqlString} PRIMARY KEY (${primaryString}))`).run()
}
function Retrieve_All_From_Table(table, parseColumns=[]){
    // retrieves every entry from a table
    let retrieve = db.prepare(`SELECT * FROM ${table}`).all()
    if (parseColumns.length>0){
        retrieve=retrieve.map((item)=>{
            for (var i=0;i<parseColumns.length;i++){
                item[parseColumns[i]]=JSON.parse(item[parseColumns[i]])
            }
            return item
        })
    }
    return retrieve
}
function Insert_Object_Into_Table(Obj,tableName){
    // Inserts an object into the database where all entries are mapped to their respective keys.
    // if an object entry is not a string or a number, it gets JSON.stringify run on it before being
    // entered into the database.
    try{
        keyStringColumns=''
        keyStringValues=''
        for (var keys of Object.keys(Obj)){
            keyStringColumns += `${keys},`
            keyStringValues += `@${keys},`
        }
        keyStringColumns=keyStringColumns.substring(0,keyStringColumns.length-1)
        keyStringValues=keyStringValues.substring(0,keyStringValues.length-1)
        for (const[key,value] of Object.entries(Obj)){
            if (!(typeof value === "number") && !(typeof value === "string")){
                Obj[key]=JSON.stringify(value)
            }
        }
        console.log(`INSERT INTO ${tableName} (${keyStringColumns}) VALUES (${keyStringValues})`)
        db.prepare(`INSERT INTO ${tableName} (${keyStringColumns}) VALUES (${keyStringValues})`).run(Obj)
        return true
    }
    catch(e){
        console.log(e)
        throw Error("Issue in inserting object to table")
    }
}
function Get_By_Key(key,tableName,parseColumns=[]){
    // retrieves an entry in the form of an object from the tablename. parseColumns denotes which columns
    // get JSON parsed before being returned.
    let keyInfo = db.prepare(`SELECT * FROM ${tableName} WHERE ${Object.keys(key)[0]} = @${Object.keys(key)[0]}`).get(key)
    if (keyInfo){
        Object.keys(keyInfo).map((field)=>{
            if (parseColumns.includes(field)){
                keyInfo[field]=JSON.parse(keyInfo[field])
            }
        })
    }
    return keyInfo
}
function Backup_DB(){
    // makes a backup of the database with the current date
    db.backup(`./SQL_Store/ExiusPermissions-${Date.now()}.db`)
}
function Restore_From_Backup(backupFilePath){
    // restores the database from a backup file given at the path backupFilePath. If 
    // there is a current file there, it gets replaced with the backup. The old version is 
    // stored as ExiusPermissions-old.db
    try{
        if (fs.existsSync("./SQL_Store/ExiusPermissions.db")){
            fs.promises.copyFile("./SQL_Store/ExiusPermissions.db","./SQL_Store/ExiusPermissions-old.db")
        }
        fs.promises.copyFile(backupFilePath,"./SQL_Store/ExiusPermissions.db")
        return true
    }
    catch(e){
        throw Error("Error in restoring backup")
    }
}
function* To_Rows(stmt) {
    //helper iterator for Write_Table_To_CSV
  yield stmt.columns().map(column => column.name);
  yield* stmt.raw().iterate();
}

function Write_Table_To_CSV(filename,tableName) {
    // writes a table to a csv.
    let stmt = db.prepare(`SELECT * FROM ${tableName}`)
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filename);
    for (const row of To_Rows(stmt)) {
      stream.write(row.join(',') + '\n');
    }
    stream.on('error', reject);
    stream.end(resolve);
  });
}
function Delete_All(){
    let names = Get_Table_Names()
    for (var i=0;i<names.length;i++){
        names.map((info)=>{console.log(Get_Table_Names());
            Delete_Table(info.name)})
    }
}

module.exports={
Does_Table_Exist,
Clear_Table,
Delete_Table,
Get_Table_Names,
Get_Table_Schema,
Create_Table,
Delete_Table_Entry,
Update_Table_From_Obj,
Retrieve_All_From_Table,
Insert_Object_Into_Table,
Get_By_Key,
Backup_DB,
Restore_From_Backup,
Write_Table_To_CSV,
Delete_All
}